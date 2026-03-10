import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg"; // On remplace sqlite par pg
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connexion à PostgreSQL (utilise la variable d'environnement sur Render/Vercel)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Requis pour Neon/Supabase/Render
});

// Initialisation des tables (Syntaxe Postgres)
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      photo_url TEXT,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'absent',
      PRIMARY KEY (meeting_id, user_id)
    );
  `);

  // Créer l'admin par défaut si inexistant
  const res = await pool.query(
    "SELECT COUNT(*) FROM users WHERE role = 'admin'"
  );
  if (parseInt(res.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO users (first_name, last_name, phone, email, role, status, password)
      VALUES ('Admin', 'ADC', '0000000000', 'admin@adc.org', 'admin', 'approved', 'admin123')
    `);
  }
};

initDb().catch(console.error);

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- MODIFICATION DES ROUTES API (Exemple Login) ---
app.post("/api/login", async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE phone = $1 AND password = $2",
      [phone, password]
    );
    if (result.rows.length > 0) {
      res.json({ user: result.rows[0] });
    } else {
      res.status(401).json({ error: "Identifiants incorrects" });
    }
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- Répéter le changement (await pool.query) pour les autres routes ---
// Note : Remplace les "?" par "$1", "$2", etc. pour PostgreSQL

async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res) => {
      const url = req.originalUrl;
      let template = fs.readFileSync(
        path.resolve(__dirname, "index.html"),
        "utf-8"
      );
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}

startServer();
