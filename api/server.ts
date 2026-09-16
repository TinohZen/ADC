import express, { Request, Response, NextFunction } from "express";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import fs from "fs";

// 🚀 Nouveaux imports modulaires Firebase
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

dotenv.config();

// 🚀 INITIALISATION FIREBASE ADMIN (LOCAL + VERCEL CLOUD)
let firebaseActive = false;
try {
  let serviceAccount: any = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync('./firebase-service-account.json')) {
    serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));
  }

  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
    firebaseActive = true;
    console.log("🔥 Firebase Admin (Push Notifications) ACTIVÉ");
  } else {
    console.warn("⚠️ Configuration Firebase introuvable. Push désactivé.");
  }
} catch (e) {
  console.error("Erreur Firebase:", e);
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_KEY || "");
const app = express();
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

interface AuthRequest extends Request { user?: any; }

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  jwt.verify(token, process.env.JWT_SECRET || "fallback_secret", (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Session invalide" });
    req.user = user;
    next();
  });
};

const requireAdminOrChef = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin" && req.user?.role !== "chef") return res.status(403).json({ error: "Droits insuffisants" });
  next();
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Action réservée à l'admin" });
  next();
};

// 🚀 2. FONCTIONS D'ENVOI PUSH (SMARTPHONE)
async function sendPushToUser(userId: number, title: string, body: string) {
  if (!firebaseActive) return;
  try {
    const res = await pool.query("SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL", [userId]);
    const token = res.rows[0]?.fcm_token;
    if (token) await getMessaging().send({ token, notification: { title, body }, android: { priority: "high" } });
  } catch (err) { console.error("Erreur Push:", err); }
}

async function sendPushToRole(roles: string[], title: string, body: string) {
  if (!firebaseActive) return;
  try {
    const res = await pool.query("SELECT fcm_token FROM users WHERE role = ANY($1) AND fcm_token IS NOT NULL", [roles]);
    const tokens = res.rows.map(r => r.fcm_token);
    if (tokens.length > 0) await getMessaging().sendEachForMulticast({ tokens, notification: { title, body }, android: { priority: "high" } });
  } catch (err) { console.error("Erreur Push Roles:", err); }
}

async function sendPushToAllApproved(title: string, body: string) {
  if (!firebaseActive) return;
  try {
    const res = await pool.query("SELECT fcm_token FROM users WHERE status = 'approved' AND fcm_token IS NOT NULL");
    const tokens = res.rows.map(r => r.fcm_token);
    if (tokens.length > 0) await getMessaging().sendEachForMulticast({ tokens, notification: { title, body }, android: { priority: "high" } });
  } catch (err) { console.error("Erreur Push Tous:", err); }
}

async function uploadPhoto(base64Str: string, userId: string | number): Promise<string> {
  if (!base64Str || !base64Str.startsWith("data:image")) return base64Str;
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) throw new Error("Format d'image invalide");
  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const ext = contentType.split("/")[1];
  const fileName = `user_${userId}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(fileName, buffer, { contentType, upsert: true });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(fileName).data.publicUrl;
}

// ---------------------------------------------------------
// AUTHENTIFICATION & MOT DE PASSE OUBLIÉ
// ---------------------------------------------------------
app.post("/api/forgot-password", async (req, res) => {
  const { phone, email } = req.body;
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE phone = $1 AND LOWER(TRIM(email)) = LOWER(TRIM($2))", [phone.trim(), email.trim()]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "Aucun compte ne correspond" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query("UPDATE users SET reset_code = $1, reset_expires_at = $2 WHERE id = $3", [code, expires, userRes.rows[0].id]);
    const hasSmtp = Boolean(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);
    if (hasSmtp) {
      try {
        const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }});
        await transporter.sendMail({ from: `"ADC" <${process.env.SMTP_EMAIL}>`, to: email.trim(), subject: "Code de vérification ADC", text: `Code : ${code}` });
        return res.json({ success: true, message: "Code envoyé par email !" });
      } catch (mailError) {}
    }
    res.json({ success: true, message: `Code généré : ${code}`, code: code });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/reset-password", async (req, res) => {
  const { phone, code, newPassword } = req.body;
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE phone = $1 AND reset_code = $2 AND (reset_expires_at > NOW() OR reset_expires_at IS NULL)", [phone.trim(), code.trim()]);
    if (userRes.rows.length === 0) return res.status(400).json({ error: "Code invalide ou expiré" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1, reset_code = NULL, reset_expires_at = NULL WHERE id = $2", [hashedPassword, userRes.rows[0].id]);
    res.json({ success: true, message: "Mot de passe mis à jour" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/register", async (req, res) => {
  const { first_name, last_name, phone, email, photo_url, password, province, region, district, commune, fokontany } = req.body;
  try {
    const existing = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "Numéro de téléphone déjà utilisé" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, phone, email, password, status, role, province, region, district, commune, fokontany) 
       VALUES ($1, $2, $3, $4, $5, 'pending', 'member', $6, $7, $8, $9, $10) RETURNING *`,
      [first_name, last_name, phone, email, hashedPassword, province, region, district, commune, fokontany]
    );
    let user = result.rows[0];
    if (photo_url && photo_url.startsWith("data:image")) {
      const publicUrl = await uploadPhoto(photo_url, user.id);
      await pool.query("UPDATE users SET photo_url = $1 WHERE id = $2", [publicUrl, user.id]);
      user.photo_url = publicUrl;
    }
    
    const msg = `${first_name} ${last_name} (${district || region}) souhaite rejoindre l'ADC.`;
    await pool.query(`INSERT INTO notifications (user_id, title, message, link) SELECT id, 'Nouvelle Demande', $1, '/dashboard' FROM users WHERE role IN ('admin', 'chef')`, [msg]);
    
    // 🚀 PUSH NOTIFICATION ADMIN & CHEF
    await sendPushToRole(['admin', 'chef'], "Nouvelle Inscription ADC", msg);

    delete user.password;
    res.json({ user });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/login", async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Identifiants incorrects" });
    const user = result.rows[0];
    let validPassword = false;
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      if (password === user.password) {
        validPassword = true;
        const hashed = await bcrypt.hash(password, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, user.id]);
      }
    }
    if (!validPassword) return res.status(401).json({ error: "Identifiants incorrects" });
    if (user.status === "pending") return res.status(403).json({ error: "Votre compte est en attente de validation." });
    if (user.status === "rejected") return res.status(403).json({ error: "Votre compte a été refusé." });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
    delete user.password;
    res.json({ user, token });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ROUTE : SAUVEGARDER LE TOKEN DU TÉLÉPHONE
app.put("/api/users/:id/fcm-token", authenticateToken, async (req: AuthRequest, res: any) => {
  if (req.user.id !== Number(req.params.id)) return res.status(403).json({ error: "Interdit" });
  try {
    await pool.query("UPDATE users SET fcm_token = $1 WHERE id = $2", [req.body.token, req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res: any) => {
  try {
    const notifs = await pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30", [req.user.id]);
    res.json(notifs.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = true WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    res.json(users.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/users/:id/role", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['member', 'chef', 'admin'].includes(role)) return res.status(400).json({ error: "Rôle invalide" });
  try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    res.json({ success: true, role });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/users/:id/status", authenticateToken, requireAdminOrChef, async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [req.body.status, req.params.id]);
    
    if (req.body.status === 'approved') {
      const msg = "Bienvenue dans l'ADC. Votre compte est actif, vous pouvez accéder à votre carte membre.";
      await pool.query(`INSERT INTO notifications (user_id, title, message, link) VALUES ($1, 'Compte Validé !', $2, '/profile')`, [req.params.id, msg]);
      
      // 🚀 PUSH NOTIFICATION ADHÉRENT
      await sendPushToUser(Number(req.params.id), "Compte ADC Validé ✅", msg);
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/users/:id", authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { first_name, last_name, phone, email, photo_url, province, region, district, commune, fokontany } = req.body;
  if (req.user.role !== "admin" && String(req.user.id) !== String(id)) return res.status(403).json({ error: "Interdit" });
  try {
    let url = photo_url;
    if (photo_url?.startsWith("data:image")) url = await uploadPhoto(photo_url, id);
    await pool.query(
      "UPDATE users SET first_name=$1, last_name=$2, phone=$3, email=$4, photo_url=$5, province=$6, region=$7, district=$8, commune=$9, fokontany=$10 WHERE id=$11",
      [first_name, last_name, phone, email, url, province, region, district, commune, fokontany, id]
    );
    res.json({ success: true, photo_url: url });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/users/:id/password", authenticateToken, async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  if (req.user.role !== "admin" && String(req.user.id) !== String(id)) return res.status(403).json({ error: "Action non autorisée" });
  try {
    const userRes = await pool.query("SELECT password FROM users WHERE id = $1", [id]);
    const storedPassword = userRes.rows[0].password;
    let valid = false;
    if (storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2a$")) valid = await bcrypt.compare(currentPassword, storedPassword);
    else valid = currentPassword === storedPassword;
    if (!valid) return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const members = await pool.query("SELECT COUNT(*) FROM users");
    const pending = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'pending'");
    const meetings = await pool.query("SELECT COUNT(*) FROM meetings");
    const att = await pool.query("SELECT COUNT(*) as tot, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as pres FROM attendance");
    const totalRecords = parseInt(att.rows[0].tot);
    const totalPresent = parseInt(att.rows[0].pres || "0");
    const averageAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    res.json({ totalMembers: parseInt(members.rows[0].count), pendingMembers: parseInt(pending.rows[0].count), totalMeetings: parseInt(meetings.rows[0].count), averageAttendance });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/meetings", authenticateToken, async (req, res) => {
  try {
    const meetings = await pool.query("SELECT * FROM meetings ORDER BY date DESC, time DESC");
    res.json(meetings.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/meetings", authenticateToken, requireAdminOrChef, async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    const result = await pool.query("INSERT INTO meetings (title, description, date, time) VALUES ($1, $2, $3, $4) RETURNING id", [title, description, date, time]);
    const meetingId = result.rows[0].id;
    const msg = `${title} - Prévue le ${date} à ${time}.`;
    await pool.query(`INSERT INTO notifications (user_id, title, message, link) SELECT id, 'Nouvelle Réunion Programmée', $1, $2 FROM users WHERE status = 'approved'`, [msg, `/meetings/${meetingId}`]);
    
    // 🚀 PUSH NOTIFICATION À TOUS LES MEMBRES ACTIFS
    await sendPushToAllApproved("📅 Nouvelle Réunion ADC", msg);

    res.json({ id: meetingId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/meetings/:id", authenticateToken, requireAdminOrChef, async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time } = req.body;
  try {
    await pool.query("UPDATE meetings SET title = $1, description = $2, date = $3, time = $4 WHERE id = $5", [title, description, date, time, id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/meetings/:id/attendance", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const attendance = await pool.query(`SELECT u.*, COALESCE(a.status, 'absent') as status FROM users u LEFT JOIN attendance a ON u.id = a.user_id AND a.meeting_id = $1 WHERE u.status = 'approved' ORDER BY u.first_name ASC`, [id]);
    res.json(attendance.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/meetings/:id/attendance", authenticateToken, requireAdminOrChef, async (req, res) => {
  const { id } = req.params;
  const { user_id, status } = req.body;
  try {
    await pool.query(`INSERT INTO attendance (meeting_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT (meeting_id, user_id) DO UPDATE SET status = EXCLUDED.status`, [id, user_id, status]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/meetings/:id/report", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT report FROM meetings WHERE id = $1", [req.params.id]);
    res.json({ report: result.rows[0]?.report || "" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/meetings/:id/report", authenticateToken, requireAdminOrChef, async (req, res) => {
  try {
    await pool.query("UPDATE meetings SET report = $1 WHERE id = $2", [req.body.report, req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/meetings/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM meetings WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ROUTE : CHECK VERSION OTA
app.get("/api/version", (req, res) => {
  res.json({
    version: "1.0.0",
    url: "https://adc-reunion.vercel.app/ADC-Presence.apk",
    releaseNotes: "Ajout des Notifications Push et correction des erreurs Android.",
    forceUpdate: true
  });
});

export default app;