import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const SERVICE_NAME = process.env.SERVICE_NAME || "Livents Server v17.2";

const app = express();
app.use(cors());
app.use(express.json());

// --- In-Memory Storage (works on Render free tier) ---
let events = [];
let recordings = [];

// Simple ID generator
function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// --- Basic routes ---

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

// Placeholder token endpoints
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

  const event = {
    id: generateId(),
    name,
    description: description || "",
    date: date || "",
    time: time || "",
    sp1_enabled: sp1Enabled ? 1 : 0,
    sp1_description: sp1Description || "",
    sp2_enabled: sp2Enabled ? 1 : 0,
    sp2_description: sp2Description || "",
    admin_role: "superadmin",
    auto_record: 1,
    created_at: new Date().toISOString()
  };

  events.unshift(event); // Add to beginning (newest first)
  
  console.log("Event created:", event);
  
  res.json(event);
});

// List all events (newest first)
app.get("/events", (req, res) => {
  res.json(events);
});

// Get single event
app.get("/events/:id", (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }
  res.json(event);
});

// Update admin for an event
app.post("/events/:id/admin", (req, res) => {
  const { id } = req.params;
  const { adminRole } = req.body || {};

  const allowed = ["superadmin", "p2", "p3"];
  if (!allowed.includes(adminRole)) {
    return res.status(400).json({ error: "invalid adminRole" });
  }

  const event = events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }

  event.admin_role = adminRole;
  res.json({ id, adminRole });
});

// --- Recordings API ---

// List all recordings
app.get("/recordings", (req, res) => {
  res.json(recordings);
});

// Get single recording
app.get("/recordings/:id", (req, res) => {
  const recording = recordings.find(r => r.id === req.params.id);
  if (!recording) {
    return res.status(404).json({ error: "recording not found" });
  }
  res.json(recording);
});

// Create or update a recording
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

  const recording = {
    id: generateId(),
    event_id: eventId,
    playback_url: playbackUrl || "",
    thumbnail_url: thumbnailUrl || "",
    created_at: new Date().toISOString(),
    duration_seconds: durationSeconds || null
  };

  recordings.unshift(recording);
  res.json(recording);
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} listening on port ${PORT}`);
  console.log("Using in-memory storage (compatible with Render free tier)");
});
