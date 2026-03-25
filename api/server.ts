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

// Vérifie si l'utilisateur est connecté (Token JWT valide)
const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token)
    return res.status(401).json({ error: "Accès refusé. Token manquant." });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err, user) => {
      if (err)
        return res.status(403).json({
          error: "Token invalide ou expiré. Veuillez vous reconnecter.",
        });
      req.user = user;
      next();
    }
  );
};

// Vérifie si l'utilisateur est un Admin
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Action non autorisée. Droits administrateur requis." });
  }
  next();
};

// --- FONCTION UTILITAIRE : UPLOAD IMAGE SUPABASE ---
async function uploadPhoto(
  base64Str: string,
  userId: string | number
): Promise<string> {
  // Si ce n'est pas du base64 (ex: c'est déjà une URL existante), on retourne tel quel
  if (!base64Str.startsWith("data:image")) return base64Str;

  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3)
    throw new Error("Format d'image invalide");

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const ext = contentType.split("/")[1];
  const fileName = `user_${userId}_${Date.now()}.${ext}`; // Ex: user_1_16789.png

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, buffer, { contentType, upsert: true });

  if (error) throw error;

  // Récupérer l'URL publique de l'image
  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// ==========================================
// --- ROUTES PUBLIQUES (Pas besoin de token)
// ==========================================

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

    // 1. CRYPTAGE DU MOT DE PASSE
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Création de l'utilisateur (sans la photo pour l'instant pour obtenir son ID)
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, phone, email, password, status, role) VALUES ($1, $2, $3, $4, $5, 'pending', 'member') RETURNING *",
      [first_name, last_name, phone, email, hashedPassword]
    );
    let user = result.rows[0];

    // 3. Upload de la photo sur Supabase Storage avec l'ID du user
    if (photo_url && photo_url.startsWith("data:image")) {
      const publicUrl = await uploadPhoto(photo_url, user.id);
      const updateRes = await pool.query(
        "UPDATE users SET photo_url = $1 WHERE id = $2 RETURNING *",
        [publicUrl, user.id]
      );
      user = updateRes.rows[0];
    }

    delete user.password; // On ne renvoie pas le mot de passe crypté
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

    // --- MIGRATION DOUCE DES MOTS DE PASSE ---
    // Les mots de passe bcrypt commencent toujours par "$2b$" ou "$2a$"
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      // Cas 1 : Utilisateur récent (mot de passe déjà crypté)
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      // Cas 2 : Ancien utilisateur (mot de passe en clair)
      if (password === user.password) {
        validPassword = true;
        // On profite de sa connexion pour sécuriser son compte !
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
        .json({ error: "Votre compte est en attente de validation." });
    if (user.status === "rejected")
      return res.status(403).json({ error: "Votre compte a été refusé." });

    // CRÉATION DU TOKEN JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" } // Expiration dans 7 jours
    );

    delete user.password;
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// --- ROUTES PROTÉGÉES (Connecté requis)
// ==========================================
// Note: On ajoute 'authenticateToken' comme 2ème paramètre partout

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, first_name, last_name, phone, email, photo_url, status, role, created_at FROM users ORDER BY created_at DESC"
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
    const { first_name, last_name, phone, email, photo_url } = req.body;

    // Sécurité: Seul l'admin ou le propriétaire du compte peut modifier
    if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    try {
      let finalPhotoUrl = photo_url;
      // Si l'utilisateur a changé de photo (base64 détecté), on upload sur Supabase
      if (photo_url && photo_url.startsWith("data:image")) {
        finalPhotoUrl = await uploadPhoto(photo_url, id);
      }

      await pool.query(
        "UPDATE users SET first_name = $1, last_name = $2, phone = $3, email = $4, photo_url = $5 WHERE id = $6",
        [first_name, last_name, phone, email, finalPhotoUrl, id]
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

    if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    try {
      const userRes = await pool.query(
        "SELECT password FROM users WHERE id = $1",
        [id]
      );
      if (userRes.rows.length === 0)
        return res.status(404).json({ error: "Utilisateur non trouvé" });

      // Vérifier l'ancien mot de passe
      const validPassword = await bcrypt.compare(
        currentPassword,
        userRes.rows[0].password
      );
      if (!validPassword)
        return res.status(400).json({ error: "Mot de passe actuel incorrect" });

      // Hasher le nouveau mot de passe
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

app.get("/api/meetings/:id/report", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT report FROM meetings WHERE id = $1",
      [id]
    );
    if (result.rows.length > 0) {
      res.json({ report: result.rows[0].report || "" });
    } else {
      res.status(404).json({ error: "Réunion non trouvée" });
    }
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

    const attendanceResult = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present
      FROM attendance
    `);
    const totalRecords = parseInt(attendanceResult.rows[0].total_records);
    const totalPresent = parseInt(
      attendanceResult.rows[0].total_present || "0"
    );

    // CORRECTION : On renomme la variable pour qu'elle corresponde au Front-end !
    let averageAttendance = 0;
    if (totalRecords > 0) {
      averageAttendance = Math.round((totalPresent / totalRecords) * 100);
    }

    res.json({
      totalMembers,
      pendingMembers,
      totalMeetings,
      averageAttendance, // C'était attendancePercentage avant !
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// --- ROUTES ADMINS (Token + Admin requis)
// ==========================================

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
