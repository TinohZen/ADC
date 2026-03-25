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
  jwt.verify(token, process.env.JWT_SECRET || "fallback", (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalide" });
    req.user = user;
    next();
  });
};

async function uploadPhoto(
  base64Str: string,
  userId: string | number
): Promise<string> {
  if (!base64Str.startsWith("data:image")) return base64Str;
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) throw new Error("Image invalide");
  const buffer = Buffer.from(matches[2], "base64");
  const fileName = `user_${userId}_${Date.now()}.png`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, buffer, { contentType: "image/png" });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(fileName).data.publicUrl;
}

// --- ROUTES ---

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
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, phone, email, password, status, role, province, region, district, commune, fokontany) VALUES ($1, $2, $3, $4, $5, 'pending', 'member', $6, $7, $8, $9, $10) RETURNING *",
      [
        first_name,
        last_name,
        phone,
        email,
        hashed,
        province,
        region,
        district,
        commune,
        fokontany,
      ]
    );
    let user = result.rows[0];
    if (photo_url && photo_url.startsWith("data:image")) {
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
  const result = await pool.query("SELECT * FROM users WHERE phone = $1", [
    phone,
  ]);
  if (result.rows.length === 0)
    return res.status(401).json({ error: "Inconnu" });
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Inconnu" });
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "fb"
  );
  delete user.password;
  res.json({ user, token });
});

app.get("/api/users", authenticateToken, async (req, res) => {
  const users = await pool.query(
    "SELECT * FROM users ORDER BY created_at DESC"
  );
  res.json(users.rows);
});

app.put(
  "/api/users/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
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
  }
);

app.get("/api/meetings/:id/attendance", authenticateToken, async (req, res) => {
  const attendance = await pool.query(
    `SELECT u.*, COALESCE(a.status, 'absent') as status 
       FROM users u LEFT JOIN attendance a ON u.id = a.user_id AND a.meeting_id = $1 
       WHERE u.status = 'approved' AND u.role = 'member' ORDER BY u.first_name`,
    [req.params.id]
  );
  res.json(attendance.rows);
});

// Garder les autres routes (meetings, stats, etc.) identiques à avant...
// ... (Copier ici les routes meetings, stats, delete du code précédent)

export default app;
