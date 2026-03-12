import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Connexion à PostgreSQL (Supabase) via la variable DATABASE_URL configurée sur Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Requis pour les connexions à Supabase
});

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- ROUTES API ---

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

// --- CORRECTION : METTRE À JOUR le Profil utilisateur ---
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, email, photo_url } = req.body;
  try {
    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, phone = $3, email = $4, photo_url = $5 WHERE id = $6",
      [first_name, last_name, phone, email, photo_url, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CORRECTION : CHANGER le Mot de passe ---
app.put("/api/users/:id/password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await pool.query("SELECT password FROM users WHERE id = $1", [
      id,
    ]);

    if (user.rows.length === 0 || user.rows[0].password !== currentPassword) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      newPassword,
      id,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CORRECTION : CHANGER le Mot de passe ---
app.put("/api/users/:id/password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await pool.query("SELECT password FROM users WHERE id = $1", [
      id,
    ]);

    if (user.rows.length === 0 || user.rows[0].password !== currentPassword) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      newPassword,
      id,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

// --- RÉCUPÉRER le compte rendu d'une réunion ---
app.get("/api/meetings/:id/report", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT report FROM meetings WHERE id = $1",
      [id]
    );
    if (result.rows.length > 0) {
      // On renvoie le compte rendu (ou une chaîne vide s'il n'y en a pas encore)
      res.json({ report: result.rows[0].report || "" });
    } else {
      res.status(404).json({ error: "Réunion non trouvée" });
    }
  } catch (err: any) {
    console.error("Erreur GET report:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- SAUVEGARDER/METTRE À JOUR le compte rendu ---
app.put("/api/meetings/:id/report", async (req, res) => {
  const { id } = req.params;
  const { report } = req.body; // Le texte du compte rendu envoyé par le Front-end
  try {
    await pool.query("UPDATE meetings SET report = $1 WHERE id = $2", [
      report,
      id,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Erreur PUT report:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    // 1. Total des membres (qui ont le rôle 'member')
    const membersResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'member'"
    );
    const totalMembers = parseInt(membersResult.rows[0].count);

    // 2. Membres en attente d'approbation
    const pendingResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE status = 'pending' AND role = 'member'"
    );
    const pendingMembers = parseInt(pendingResult.rows[0].count);

    // 3. Total des réunions
    const meetingsResult = await pool.query("SELECT COUNT(*) FROM meetings");
    const totalMeetings = parseInt(meetingsResult.rows[0].count);

    // 4. Pourcentage de présence global
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

    let attendancePercentage = 0;
    if (totalRecords > 0) {
      attendancePercentage = Math.round((totalPresent / totalRecords) * 100);
    }

    // On renvoie les données au format JSON attendu par le Front-end
    res.json({
      totalMembers,
      pendingMembers,
      totalMeetings,
      attendancePercentage,
    });
  } catch (err: any) {
    console.error("Erreur API Stats:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- MODIFIER une réunion (Update) ---
app.put("/api/meetings/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time } = req.body;
  try {
    await pool.query(
      "UPDATE meetings SET title = $1, description = $2, date = $3, time = $4 WHERE id = $5",
      [title, description, date, time, id]
    );
    res.json({ success: true, message: "Réunion mise à jour" });
  } catch (err: any) {
    console.error("Erreur PUT meeting:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- SUPPRIMER une réunion (Delete) ---
app.delete("/api/meetings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Magie de PostgreSQL : grâce au "ON DELETE CASCADE" qu'on a mis lors de la création
    // de la base de données, supprimer une réunion supprimera AUTOMATIQUEMENT
    // toutes les présences (attendance) liées à cette réunion !
    await pool.query("DELETE FROM meetings WHERE id = $1", [id]);
    res.json({ success: true, message: "Réunion supprimée avec succès" });
  } catch (err: any) {
    console.error("Erreur DELETE meeting:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- SUPPRIMER un membre (Delete User) ---
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Là aussi, grâce au "ON DELETE CASCADE", supprimer un membre
    // supprimera son historique de présence aux réunions.
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true, message: "Membre supprimé avec succès" });
  } catch (err: any) {
    console.error("Erreur DELETE user:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ EXPORT INDISPENSABLE POUR VERCEL (PAS DE app.listen)
export default app;
