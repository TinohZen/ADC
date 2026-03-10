import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connexion à PostgreSQL via la variable DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Initialisation des tables au démarrage
const initDb = async () => {
  try {
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

    // Admin par défaut
    const res = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'admin'"
    );
    if (parseInt(res.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (first_name, last_name, phone, email, role, status, password)
        VALUES ('Admin', 'ADC', '0000000000', 'admin@adc.org', 'admin', 'approved', 'admin123')
      `);
    }
    console.log("✅ Base de données initialisée");
  } catch (err) {
    console.error("❌ Erreur DB init:", err);
  }
};

initDb();

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- ROUTES API ---

// Auth & Login
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/register", async (req, res) => {
  const { first_name, last_name, phone, email, photo_url, password } = req.body;
  try {
    const existing = await pool.query("SELECT * FROM users WHERE phone = $1", [
      phone,
    ]);
    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ce numéro de téléphone est déjà utilisé" });
    }
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, phone, email, photo_url, password, status, role) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'member') RETURNING *",
      [first_name, last_name, phone, email, photo_url, password]
    );
    res.json({ user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users Management
app.get("/api/users", async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json(users.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Meetings Management
app.get("/api/meetings", async (req, res) => {
  try {
    const meetings = await pool.query(
      "SELECT * FROM meetings ORDER BY date DESC, time DESC"
    );
    res.json(meetings.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/meetings", async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO meetings (title, description, date, time) VALUES ($1, $2, $3, $4) RETURNING id",
      [title, description, date, time]
    );
    const meetingId = result.rows[0].id;

    // Initialiser les présences pour tous les membres approuvés
    const members = await pool.query(
      "SELECT id FROM users WHERE status = 'approved'"
    );
    for (const member of members.rows) {
      await pool.query(
        "INSERT INTO attendance (meeting_id, user_id, status) VALUES ($1, $2, 'absent')",
        [meetingId, member.id]
      );
    }
    res.json({ id: meetingId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance Management
app.get("/api/meetings/:id/attendance", async (req, res) => {
  const { id } = req.params;
  try {
    const attendance = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, u.phone, u.photo_url 
       FROM attendance a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.meeting_id = $1 
       ORDER BY u.last_name, u.first_name`,
      [id]
    );
    res.json(attendance.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/meetings/:id/attendance", async (req, res) => {
  const { id } = req.params;
  const { user_id, status } = req.body;
  try {
    await pool.query(
      `INSERT INTO attendance (meeting_id, user_id, status) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (meeting_id, user_id) 
       DO UPDATE SET status = EXCLUDED.status`,
      [id, user_id, status]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serveur Frontend
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
    console.log(`Serveur actif sur le port ${PORT}`);
  });
}

// Pour le développement local
if (process.env.NODE_ENV !== "production") {
  startServer();
}

// Export pour Vercel (indispensable)
export default app;
