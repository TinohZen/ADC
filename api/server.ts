import express, { Request, Response, NextFunction } from "express";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Client Supabase pour le stockage des images
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- TYPES & MIDDLEWARES ---

interface AuthRequest extends Request {
  user?: any;
}

// Vérifier si l'utilisateur est connecté
const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err: any, user: any) => {
      if (err)
        return res.status(403).json({ error: "Session expirée ou invalide" });
      req.user = user;
      next();
    }
  );
};

// Vérifier si l'utilisateur est Admin OU Chef de fil
const requireAdminOrChef = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin" && req.user?.role !== "chef") {
    return res.status(403).json({ error: "Droits insuffisants" });
  }
  next();
};

// Vérifier si l'utilisateur est STRICTEMENT Admin (Pour les suppressions)
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Action réservée à l'administrateur principal" });
  }
  next();
};

// Fonction pour uploader une photo vers Supabase Storage
async function uploadPhoto(
  base64Str: string,
  userId: string | number
): Promise<string> {
  if (!base64Str || !base64Str.startsWith("data:image")) return base64Str;

  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3)
    throw new Error("Format d'image invalide");

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const ext = contentType.split("/")[1];
  const fileName = `user_${userId}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, buffer, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return data.publicUrl;
}

// ==========================================
// --- ROUTES D'AUTHENTIFICATION (PUBLIQUES)
// ==========================================

app.post("/api/register", async (req, res) => {
  const {
    first_name,
    last_name,
    phone,
    email,
    photo_url,
    password,
    province,
    region,
    district,
    commune,
    fokontany,
  } = req.body;

  try {
    const existing = await pool.query("SELECT * FROM users WHERE phone = $1", [
      phone,
    ]);
    if (existing.rows.length > 0)
      return res
        .status(400)
        .json({ error: "Ce numéro de téléphone est déjà utilisé" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, phone, email, password, status, role, province, region, district, commune, fokontany) 
       VALUES ($1, $2, $3, $4, $5, 'pending', 'member', $6, $7, $8, $9, $10) RETURNING *`,
      [
        first_name,
        last_name,
        phone,
        email,
        hashedPassword,
        province,
        region,
        district,
        commune,
        fokontany,
      ]
    );

    let user = result.rows[0];

    if (photo_url && photo_url.startsWith("data:image")) {
      const publicUrl = await uploadPhoto(photo_url, user.id);
      await pool.query("UPDATE users SET photo_url = $1 WHERE id = $2", [
        publicUrl,
        user.id,
      ]);
      user.photo_url = publicUrl;
    }

    delete user.password;
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1", [
      phone,
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Identifiants incorrects" });

    const user = result.rows[0];
    let validPassword = false;

    // Gestion de la migration des mots de passe (Lazy Migration)
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      if (password === user.password) {
        validPassword = true;
        const hashed = await bcrypt.hash(password, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          hashed,
          user.id,
        ]);
      }
    }

    if (!validPassword)
      return res.status(401).json({ error: "Identifiants incorrects" });
    if (user.status === "pending")
      return res
        .status(403)
        .json({ error: "Votre compte est en attente de validation." });
    if (user.status === "rejected")
      return res.status(403).json({ error: "Votre compte a été refusé." });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    delete user.password;
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// --- ROUTES UTILISATEURS (PROTÉGÉES)
// ==========================================

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json(users.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const {
    first_name,
    last_name,
    phone,
    email,
    photo_url,
    province,
    region,
    district,
    commune,
    fokontany,
  } = req.body;

  if (req.user.role !== "admin" && String(req.user.id) !== String(id))
    return res.status(403).json({ error: "Interdit" });

  try {
    let url = photo_url;
    if (photo_url?.startsWith("data:image")) {
      url = await uploadPhoto(photo_url, id);
    }
    await pool.query(
      "UPDATE users SET first_name=$1, last_name=$2, phone=$3, email=$4, photo_url=$5, province=$6, region=$7, district=$8, commune=$9, fokontany=$10 WHERE id=$11",
      [
        first_name,
        last_name,
        phone,
        email,
        url,
        province,
        region,
        district,
        commune,
        fokontany,
        id,
      ]
    );
    res.json({ success: true, photo_url: url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  "/api/users/:id/password",
  authenticateToken,
  async (req: AuthRequest, res: any) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.role !== "admin" && String(req.user.id) !== String(id)) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    try {
      const userRes = await pool.query(
        "SELECT password FROM users WHERE id = $1",
        [id]
      );
      const storedPassword = userRes.rows[0].password;

      // FIX : GESTION DES ANCIENS MOTS DE PASSE NON CRYPTÉS POUR LE CHANGEMENT
      let valid = false;
      if (
        storedPassword.startsWith("$2b$") ||
        storedPassword.startsWith("$2a$")
      ) {
        valid = await bcrypt.compare(currentPassword, storedPassword);
      } else {
        valid = currentPassword === storedPassword;
      }

      if (!valid)
        return res.status(400).json({ error: "Mot de passe actuel incorrect" });

      const hashed = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashed,
        id,
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const members = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'member'"
    );
    const pending = await pool.query(
      "SELECT COUNT(*) FROM users WHERE status = 'pending'"
    );
    const meetings = await pool.query("SELECT COUNT(*) FROM meetings");
    const att = await pool.query(
      "SELECT COUNT(*) as tot, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as pres FROM attendance"
    );

    const totalRecords = parseInt(att.rows[0].tot);
    const totalPresent = parseInt(att.rows[0].pres || "0");
    const averageAttendance =
      totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    res.json({
      totalMembers: parseInt(members.rows[0].count),
      pendingMembers: parseInt(pending.rows[0].count),
      totalMeetings: parseInt(meetings.rows[0].count),
      averageAttendance,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// --- ROUTES RÉUNIONS & PRÉSENCES
// ==========================================

app.get("/api/meetings", authenticateToken, async (req, res) => {
  try {
    const meetings = await pool.query(
      "SELECT * FROM meetings ORDER BY date DESC, time DESC"
    );
    res.json(meetings.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Créer une réunion : Admin ET Chef
app.post(
  "/api/meetings",
  authenticateToken,
  requireAdminOrChef,
  async (req, res) => {
    const { title, description, date, time } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO meetings (title, description, date, time) VALUES ($1, $2, $3, $4) RETURNING id",
        [title, description, date, time]
      );
      res.json({ id: result.rows[0].id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// NOUVEAU : Modifier une réunion : Admin ET Chef
app.put(
  "/api/meetings/:id",
  authenticateToken,
  requireAdminOrChef,
  async (req, res) => {
    const { id } = req.params;
    const { title, description, date, time } = req.body;
    try {
      await pool.query(
        "UPDATE meetings SET title = $1, description = $2, date = $3, time = $4 WHERE id = $5",
        [title, description, date, time, id]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get("/api/meetings/:id/attendance", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const attendance = await pool.query(
      `SELECT u.*, COALESCE(a.status, 'absent') as status 
       FROM users u LEFT JOIN attendance a ON u.id = a.user_id AND a.meeting_id = $1 
       WHERE u.status = 'approved' AND u.role = 'member' ORDER BY u.first_name ASC`,
      [id]
    );
    res.json(attendance.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Faire l'appel (Présences) : Admin ET Chef
app.put(
  "/api/meetings/:id/attendance",
  authenticateToken,
  requireAdminOrChef,
  async (req, res) => {
    const { id } = req.params;
    const { user_id, status } = req.body;
    try {
      await pool.query(
        `INSERT INTO attendance (meeting_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT (meeting_id, user_id) DO UPDATE SET status = EXCLUDED.status`,
        [id, user_id, status]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get("/api/meetings/:id/report", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT report FROM meetings WHERE id = $1",
      [req.params.id]
    );
    res.json({ report: result.rows[0]?.report || "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rédiger le rapport : Admin ET Chef
app.put(
  "/api/meetings/:id/report",
  authenticateToken,
  requireAdminOrChef,
  async (req, res) => {
    try {
      await pool.query("UPDATE meetings SET report = $1 WHERE id = $2", [
        req.body.report,
        req.params.id,
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ==========================================
// --- ROUTES D'ADMINISTRATION (ADMIN SEUL)
// ==========================================

// Approuver/Refuser un membre : Admin ET Chef
app.put(
  "/api/users/:id/status",
  authenticateToken,
  requireAdminOrChef,
  async (req, res) => {
    try {
      await pool.query("UPDATE users SET status = $1 WHERE id = $2", [
        req.body.status,
        req.params.id,
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 🚨 SUPPRIMER UN MEMBRE : STRICTEMENT ADMIN !
app.delete(
  "/api/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 🚨 SUPPRIMER UNE RÉUNION : STRICTEMENT ADMIN !
app.delete(
  "/api/meetings/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      await pool.query("DELETE FROM meetings WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default app;
