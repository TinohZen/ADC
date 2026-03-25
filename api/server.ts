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

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- MIDDLEWARES ---

interface AuthRequest extends Request {
  user?: any;
}

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
    (err, user) => {
      if (err) return res.status(403).json({ error: "Session expirée" });
      req.user = user;
      next();
    }
  );
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin requis" });
  next();
};

async function uploadPhoto(
  base64Str: string,
  userId: string | number
): Promise<string> {
  if (!base64Str.startsWith("data:image")) return base64Str;
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) throw new Error("Image invalide");
  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const ext = contentType.split("/")[1];
  const fileName = `user_${userId}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, buffer, { contentType, upsert: true });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(fileName).data.publicUrl;
}

// --- ROUTES PUBLIQUES ---

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
      return res.status(400).json({ error: "Numéro déjà utilisé" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, phone, email, password, status, role, province, region, district, commune, fokontany) VALUES ($1, $2, $3, $4, $5, 'pending', 'member', $6, $7, $8, $9, $10) RETURNING *",
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

    if (photo_url?.startsWith("data:image")) {
      const url = await uploadPhoto(photo_url, user.id);
      await pool.query("UPDATE users SET photo_url = $1 WHERE id = $2", [
        url,
        user.id,
      ]);
      user.photo_url = url;
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
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      validPassword = await bcrypt.compare(password, user.password);
    } else if (password === user.password) {
      validPassword = true;
      const hashed = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashed,
        user.id,
      ]);
    }

    if (!validPassword)
      return res.status(401).json({ error: "Identifiants incorrects" });
    if (user.status === "pending")
      return res.status(403).json({ error: "Compte en attente." });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fb",
      { expiresIn: "7d" }
    );
    delete user.password;
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTES PROTÉGÉES ---

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

app.put("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
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
  if (req.user.role !== "admin" && req.user.id !== parseInt(id))
    return res.status(403).json({ error: "Interdit" });
  try {
    let url = photo_url;
    if (photo_url?.startsWith("data:image"))
      url = await uploadPhoto(photo_url, id);
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
      "SELECT COUNT(*) as tot, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as pres FROM attendance"
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

app.get("/api/meetings", authenticateToken, async (req, res) => {
  const meetings = await pool.query(
    "SELECT * FROM meetings ORDER BY date DESC, time DESC"
  );
  res.json(meetings.rows);
});

app.post("/api/meetings", authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, date, time } = req.body;
  const result = await pool.query(
    "INSERT INTO meetings (title, description, date, time) VALUES ($1, $2, $3, $4) RETURNING id",
    [title, description, date, time]
  );
  res.json({ id: result.rows[0].id });
});

app.get("/api/meetings/:id/attendance", authenticateToken, async (req, res) => {
  const attendance = await pool.query(
    `SELECT u.*, COALESCE(a.status, 'absent') as status 
     FROM users u LEFT JOIN attendance a ON u.id = a.user_id AND a.meeting_id = $1 
     WHERE u.status = 'approved' AND u.role = 'member' ORDER BY u.first_name`,
    [req.params.id]
  );
  res.json(attendance.rows);
});

app.put(
  "/api/meetings/:id/attendance",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { user_id, status } = req.body;
    await pool.query(
      "INSERT INTO attendance (meeting_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT (meeting_id, user_id) DO UPDATE SET status = EXCLUDED.status",
      [req.params.id, user_id, status]
    );
    res.json({ success: true });
  }
);

app.delete(
  "/api/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  }
);

app.put(
  "/api/users/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [
      req.body.status,
      req.params.id,
    ]);
    res.json({ success: true });
  }
);

export default app;
