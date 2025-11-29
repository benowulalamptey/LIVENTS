import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sqlite3 from "sqlite3";

dotenv.config();

const SERVICE_NAME = process.env.SERVICE_NAME || "Livents Server v17.2";
const DB_FILE = process.env.DB_FILE || "./events.db";

const app = express();
app.use(cors());
app.use(express.json());

// --- SQLite setup ---
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("Failed to open SQLite DB:", err);
  } else {
    console.log("SQLite DB opened:", DB_FILE);
  }
});

// Create tables if not exist
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      date TEXT,
      time TEXT,
      sp1_enabled INTEGER DEFAULT 0,
      sp1_description TEXT,
      sp2_enabled INTEGER DEFAULT 0,
      sp2_description TEXT,
      admin_role TEXT DEFAULT 'superadmin',
      auto_record INTEGER DEFAULT 1
    )`,
    (err) => {
      if (err) {
        console.error("Failed to create events table:", err);
      } else {
        console.log("Events table ready");
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      playback_url TEXT,
      thumbnail_url TEXT,
      created_at TEXT,
      duration_seconds INTEGER,
      FOREIGN KEY(event_id) REFERENCES events(id)
    )`,
    (err) => {
      if (err) {
        console.error("Failed to create recordings table:", err);
      } else {
        console.log("Recordings table ready");
      }
    }
  );
});

// Simple ID generator
function generateId() {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

// --- Basic routes ---

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

// Placeholder token endpoints (to be wired later to LiveKit / Mux)
app.get("/getViewerToken", (req, res) => {
  res.json({ token: "viewer-token-placeholder" });
});

app.get("/getProducerToken", (req, res) => {
  res.json({ token: "producer-token-placeholder" });
});

// --- Events API ---

// Create event (Super Admin)
app.post("/events", (req, res) => {
  const {
    name,
    description,
    date,
    time,
    sp1Enabled,
    sp1Description,
    sp2Enabled,
    sp2Description
  } = req.body || {};

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const id = generateId();
  const adminRole = "superadmin";
  const autoRecord = 1; // automatic recording flag for all events

  const stmt = db.prepare(
    `INSERT INTO events (
      id, name, description, date, time,
      sp1_enabled, sp1_description,
      sp2_enabled, sp2_description,
      admin_role, auto_record
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    id,
    name,
    description || "",
    date || "",
    time || "",
    sp1Enabled ? 1 : 0,
    sp1Description || "",
    sp2Enabled ? 1 : 0,
    sp2Description || "",
    adminRole,
    autoRecord,
    (err) => {
      if (err) {
        console.error("Error inserting event:", err);
        return res.status(500).json({ error: "failed to create event" });
      }

      // Optionally, create a placeholder recording row (auto-record intent)
      const recId = generateId();
      const createdAt = new Date().toISOString();
      db.run(
        `INSERT INTO recordings (
          id, event_id, playback_url, thumbnail_url, created_at, duration_seconds
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [recId, id, "", "", createdAt, null],
        (recErr) => {
          if (recErr) {
            console.error("Error inserting placeholder recording:", recErr);
          }
          // We still return success for the event creation
          return res.json({
            id,
            name,
            description,
            date,
            time,
            sp1Enabled: !!sp1Enabled,
            sp1Description,
            sp2Enabled: !!sp2Enabled,
            sp2Description,
            adminRole,
            autoRecord: !!autoRecord
          });
        }
      );
    }
  );
});

// List all events (newest first)
app.get("/events", (req, res) => {
  db.all(
    `SELECT * FROM events ORDER BY rowid DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error listing events:", err);
        return res.status(500).json({ error: "failed to list events" });
      }
      res.json(rows);
    }
  );
});

// Get single event
app.get("/events/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT * FROM events WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error("Error reading event:", err);
        return res.status(500).json({ error: "failed to read event" });
      }
      if (!row) {
        return res.status(404).json({ error: "event not found" });
      }
      res.json(row);
    }
  );
});

// Update admin for an event
app.post("/events/:id/admin", (req, res) => {
  const { id } = req.params;
  const { adminRole } = req.body || {};

  const allowed = ["superadmin", "p2", "p3"];
  if (!allowed.includes(adminRole)) {
    return res.status(400).json({ error: "invalid adminRole" });
  }

  db.run(
    `UPDATE events SET admin_role = ? WHERE id = ?`,
    [adminRole, id],
    function (err) {
      if (err) {
        console.error("Error updating admin role:", err);
        return res.status(500).json({ error: "failed to update admin role" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "event not found" });
      }
      res.json({ id, adminRole });
    }
  );
});

// --- Recordings API ---

// List all recordings
app.get("/recordings", (req, res) => {
  db.all(
    `SELECT * FROM recordings ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error listing recordings:", err);
        return res.status(500).json({ error: "failed to list recordings" });
      }
      res.json(rows);
    }
  );
});

// Get single recording
app.get("/recordings/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT * FROM recordings WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error("Error reading recording:", err);
        return res.status(500).json({ error: "failed to read recording" });
      }
      if (!row) {
        return res.status(404).json({ error: "recording not found" });
      }
      res.json(row);
    }
  );
});

// Create or update a recording (for future integration with Mux/LiveKit)
app.post("/recordings", (req, res) => {
  const {
    eventId,
    playbackUrl,
    thumbnailUrl,
    durationSeconds
  } = req.body || {};

  if (!eventId) {
    return res.status(400).json({ error: "eventId is required" });
  }

  const createdAt = new Date().toISOString();
  const recId = generateId();

  db.run(
    `INSERT INTO recordings (
      id, event_id, playback_url, thumbnail_url, created_at, duration_seconds
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      recId,
      eventId,
      playbackUrl || "",
      thumbnailUrl || "",
      createdAt,
      durationSeconds || null
    ],
    (err) => {
      if (err) {
        console.error("Error inserting recording:", err);
        return res.status(500).json({ error: "failed to create recording" });
      }
      res.json({
        id: recId,
        eventId,
        playbackUrl,
        thumbnailUrl,
        createdAt,
        durationSeconds
      });
    }
  );
});

// --- Start server on Render's PORT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} listening on port ${PORT}`);
});
