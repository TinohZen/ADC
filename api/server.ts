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

// Initialisation du client Supabase pour le Storage
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- TYPES & MIDDLEWARES DE SÉCURITÉ ---

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

  if (!token)
    return res.status(401).json({ error: "Accès refusé. Token manquant." });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err, user) => {
      if (err)
        return res.status(403).json({ error: "Token invalide ou expiré." });
      req.user = user;
      next();
    }
  );
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Action non autorisée. Droits administrateur requis." });
  }
  next();
};

async function uploadPhoto(
  base64Str: string,
  userId: string | number
): Promise<string> {
  if (!base64Str.startsWith("data:image")) return base64Str;

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

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// --- ROUTES PUBLIQUES ---

app.post("/api/register", async (req, res) => {
  // AJOUT DE LA REGION ICI
  const { first_name, last_name, phone, email, photo_url, password, region } =
    req.body;
  try {
    const existing = await pool.query("SELECT * FROM users WHERE phone = $1", [
      phone,
    ]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Ce numéro est déjà utilisé" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // AJOUT DE LA REGION ($6) DANS L'INSERTION
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, phone, email, password, status, role, region) VALUES ($1, $2, $3, $4, $5, 'pending', 'member', $6) RETURNING *",
      [first_name, last_name, phone, email, hashedPassword, region]
    );
    let user = result.rows[0];

    if (photo_url && photo_url.startsWith("data:image")) {
      const publicUrl = await uploadPhoto(photo_url, user.id);
      const updateRes = await pool.query(
        "UPDATE users SET photo_url = $1 WHERE id = $2 RETURNING *",
        [publicUrl, user.id]
      );
      user = updateRes.rows[0];
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
    } else {
      if (password === user.password) {
        validPassword = true;
        const hashedNewPassword = await bcrypt.hash(password, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          hashedNewPassword,
          user.id,
        ]);
      }
    }

    if (!validPassword)
      return res.status(401).json({ error: "Identifiants incorrects" });
    if (user.status === "pending")
      return res
        .status(403)
        .json({ error: "Compte en attente de validation." });
    if (user.status === "rejected")
      return res.status(403).json({ error: "Compte refusé." });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback",
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
    // AJOUT DE LA REGION AU SELECT
    const users = await pool.query(
      "SELECT id, first_name, last_name, phone, email, photo_url, status, role, region, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  "/api/users/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    // AJOUT DE LA REGION
    const { first_name, last_name, phone, email, photo_url, region } = req.body;

    if (req.user.role !== "admin" && req.user.id !== parseInt(id))
      return res.status(403).json({ error: "Non autorisé" });

    try {
      let finalPhotoUrl = photo_url;
      if (photo_url && photo_url.startsWith("data:image")) {
        finalPhotoUrl = await uploadPhoto(photo_url, id);
      }

      // AJOUT DE LA REGION ($6) DANS L'UPDATE
      await pool.query(
        "UPDATE users SET first_name = $1, last_name = $2, phone = $3, email = $4, photo_url = $5, region = $6 WHERE id = $7",
        [first_name, last_name, phone, email, finalPhotoUrl, region, id]
      );
      res.json({ success: true, photo_url: finalPhotoUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.put(
  "/api/users/:id/password",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    if (req.user.role !== "admin" && req.user.id !== parseInt(id))
      return res.status(403).json({ error: "Non autorisé" });

    try {
      const userRes = await pool.query(
        "SELECT password FROM users WHERE id = $1",
        [id]
      );
      if (userRes.rows.length === 0)
        return res.status(404).json({ error: "Utilisateur non trouvé" });

      const validPassword = await bcrypt.compare(
        currentPassword,
        userRes.rows[0].password
      );
      if (!validPassword)
        return res.status(400).json({ error: "Mot de passe actuel incorrect" });

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedNewPassword,
        id,
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

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

app.get("/api/meetings/:id/attendance", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // REQUÊTE DYNAMIQUE POUR AFFICHER TOUS LES MEMBRES APPROUVÉS !
    const attendance = await pool.query(
      `SELECT u.id as user_id, u.first_name, u.last_name, u.phone, u.photo_url, u.region, COALESCE(a.status, 'absent') as status 
       FROM users u 
       LEFT JOIN attendance a ON u.id = a.user_id AND a.meeting_id = $1 
       WHERE u.status = 'approved' AND u.role = 'member'
       ORDER BY u.first_name, u.last_name`,
      [id]
    );
    res.json(attendance.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/meetings/:id/report", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT report FROM meetings WHERE id = $1",
      [id]
    );
    res.json({
      report: result.rows.length > 0 ? result.rows[0].report || "" : "",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const membersResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'member'"
    );
    const totalMembers = parseInt(membersResult.rows[0].count);

    const pendingResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE status = 'pending' AND role = 'member'"
    );
    const pendingMembers = parseInt(pendingResult.rows[0].count);

    const meetingsResult = await pool.query("SELECT COUNT(*) FROM meetings");
    const totalMeetings = parseInt(meetingsResult.rows[0].count);

    const attendanceResult = await pool.query(
      `SELECT COUNT(*) as total_records, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present FROM attendance`
    );
    const totalRecords = parseInt(attendanceResult.rows[0].total_records);
    const totalPresent = parseInt(
      attendanceResult.rows[0].total_present || "0"
    );

    // CORRECTION DU NOM DE LA VARIABLE POUR LE POURCENTAGE !
    let averageAttendance = 0;
    if (totalRecords > 0)
      averageAttendance = Math.round((totalPresent / totalRecords) * 100);

    res.json({
      totalMembers,
      pendingMembers,
      totalMeetings,
      averageAttendance,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTES ADMINS ---

app.put(
  "/api/users/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
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
  }
);

app.post("/api/meetings", authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO meetings (title, description, date, time) VALUES ($1, $2, $3, $4) RETURNING id",
      [title, description, date, time]
    );
    const meetingId = result.rows[0].id;

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

app.put(
  "/api/meetings/:id/attendance",
  authenticateToken,
  requireAdmin,
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

app.put(
  "/api/meetings/:id/report",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { report } = req.body;
    try {
      await pool.query("UPDATE meetings SET report = $1 WHERE id = $2", [
        report,
        id,
      ]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.put(
  "/api/meetings/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { title, description, date, time } = req.body;
    try {
      await pool.query(
        "UPDATE meetings SET title = $1, description = $2, date = $3, time = $4 WHERE id = $5",
        [title, description, date, time, id]
      );
      res.json({ success: true, message: "Réunion mise à jour" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.delete(
  "/api/meetings/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM meetings WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.delete(
  "/api/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM users WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default app;
