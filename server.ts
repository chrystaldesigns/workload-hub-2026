import express from "express";
import path from "path";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";

const app = express();

const PORT = process.env.PORT || 8080;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "workload-hub-2026";

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

let db: admin.firestore.Firestore | null = null;
let isFirestoreConnected = false;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
  }

  db = admin.firestore();
  isFirestoreConnected = true;
  console.log(`[Firebase] Connected to project "${FIREBASE_PROJECT_ID}"`);
} catch (error: any) {
  console.warn(`[Firebase Warning] Running in memory-only mode. Reason: ${error.message}`);
}

/**
 * IMPORTANT:
 * These in-memory arrays intentionally start EMPTY.
 * Do not seed demo/sample records.
 */
let inMemoryCourseDevelopments: any[] = [];
let inMemoryLssProjects: any[] = [];
let inMemoryStandaloneTasks: any[] = [];

let inMemoryCalendarSettings = {
  customBlocked: [] as string[],
  outlookConnected: false,
  outlookEmail: "",
};

async function getCollectionData(collectionName: string, fallbackData: any[]) {
  if (!isFirestoreConnected || !db) {
    return fallbackData;
  }

  try {
    const snap = await db.collection(collectionName).get();

    if (snap.empty) {
      return [];
    }

    const result: any[] = [];
    snap.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });

    return result;
  } catch (err) {
    console.warn(`[Firestore] Failed reading ${collectionName}. Using memory fallback.`, err);
    return fallbackData;
  }
}

async function createDocument(collectionName: string, payload: any, memoryArray: any[], memoryPrefix: string) {
  if (isFirestoreConnected && db) {
    const docRef = await db.collection(collectionName).add(payload);
    return { id: docRef.id, ...payload };
  }

  const id = `${memoryPrefix}-${Date.now()}`;
  const record = { id, ...payload };
  memoryArray.push(record);
  return record;
}

async function updateDocument(collectionName: string, id: string, payload: any, memoryArray: any[]) {
  if (isFirestoreConnected && db) {
    await db.collection(collectionName).doc(id).set(payload, { merge: true });
    return { id, ...payload };
  }

  const idx = memoryArray.findIndex((item) => item.id === id);

  if (idx === -1) {
    return null;
  }

  memoryArray[idx] = { ...memoryArray[idx], ...payload, id };
  return memoryArray[idx];
}

async function deleteDocument(collectionName: string, id: string, memoryArray: any[]) {
  if (isFirestoreConnected && db) {
    await db.collection(collectionName).doc(id).delete();
    return true;
  }

  const originalLength = memoryArray.length;
  const filtered = memoryArray.filter((item) => item.id !== id);

  if (collectionName === "course-developments") {
    inMemoryCourseDevelopments = filtered;
  }

  if (collectionName === "lss-projects") {
    inMemoryLssProjects = filtered;
  }

  if (collectionName === "standalone-tasks") {
    inMemoryStandaloneTasks = filtered;
  }

  return filtered.length !== originalLength;
}

// -------------------------------------------------------------
// HEALTH CHECK
// -------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    firestoreConnected: isFirestoreConnected,
    projectId: FIREBASE_PROJECT_ID,
    message: "Workload Hub API is running.",
  });
});

// -------------------------------------------------------------
// COURSE DEVELOPMENTS
// -------------------------------------------------------------
app.get("/api/course-developments", async (_req, res) => {
  const data = await getCollectionData("course-developments", inMemoryCourseDevelopments);
  res.json(data);
});

app.post("/api/course-developments", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid course development payload." });
    }

    if (!payload.program || !payload.courseNumber || !payload.courseTitle) {
      return res.status(400).json({
        error: "Course Development requires Program, Course Number, and Course Title.",
      });
    }

    const record = await createDocument(
      "course-developments",
      {
        ...payload,
        itemType: "courseDevelopment",
        tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
      },
      inMemoryCourseDevelopments,
      "cd"
    );

    res.json(record);
  } catch (err: any) {
    console.error("[POST /api/course-developments]", err);
    res.status(500).json({ error: err.message || "Failed to create course development." });
  }
});

app.put("/api/course-developments/:id", async (req, res) => {
  try {
    const record = await updateDocument(
      "course-developments",
      req.params.id,
      req.body,
      inMemoryCourseDevelopments
    );

    if (!record) {
      return res.status(404).json({ error: "Course development not found." });
    }

    res.json(record);
  } catch (err: any) {
    console.error("[PUT /api/course-developments/:id]", err);
    res.status(500).json({ error: err.message || "Failed to update course development." });
  }
});

app.delete("/api/course-developments/:id", async (req, res) => {
  try {
    const deleted = await deleteDocument(
      "course-developments",
      req.params.id,
      inMemoryCourseDevelopments
    );

    if (!deleted) {
      return res.status(404).json({ error: "Course development not found." });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/course-developments/:id]", err);
    res.status(500).json({ error: err.message || "Failed to delete course development." });
  }
});

// -------------------------------------------------------------
// LSS PROJECTS
// -------------------------------------------------------------
app.get("/api/lss-projects", async (_req, res) => {
  const data = await getCollectionData("lss-projects", inMemoryLssProjects);
  res.json(data);
});

app.post("/api/lss-projects", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid project payload." });
    }

    if (!payload.title) {
      return res.status(400).json({ error: "Project requires a title." });
    }

    const record = await createDocument(
      "lss-projects",
      {
        ...payload,
        itemType: "project",
        tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
      },
      inMemoryLssProjects,
      "lss"
    );

    res.json(record);
  } catch (err: any) {
    console.error("[POST /api/lss-projects]", err);
    res.status(500).json({ error: err.message || "Failed to create project." });
  }
});

app.put("/api/lss-projects/:id", async (req, res) => {
  try {
    const record = await updateDocument(
      "lss-projects",
      req.params.id,
      req.body,
      inMemoryLssProjects
    );

    if (!record) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json(record);
  } catch (err: any) {
    console.error("[PUT /api/lss-projects/:id]", err);
    res.status(500).json({ error: err.message || "Failed to update project." });
  }
});

app.delete("/api/lss-projects/:id", async (req, res) => {
  try {
    const deleted = await deleteDocument("lss-projects", req.params.id, inMemoryLssProjects);

    if (!deleted) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/lss-projects/:id]", err);
    res.status(500).json({ error: err.message || "Failed to delete project." });
  }
});

// -------------------------------------------------------------
// STANDALONE TASKS
// -------------------------------------------------------------
app.get("/api/standalone-tasks", async (_req, res) => {
  const data = await getCollectionData("standalone-tasks", inMemoryStandaloneTasks);
  res.json(data);
});

app.post("/api/standalone-tasks", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid standalone task payload." });
    }

    if (!payload.title) {
      return res.status(400).json({ error: "Standalone task requires a title." });
    }

    const record = await createDocument(
      "standalone-tasks",
      {
        ...payload,
        itemType: "standaloneTask",
      },
      inMemoryStandaloneTasks,
      "task"
    );

    res.json(record);
  } catch (err: any) {
    console.error("[POST /api/standalone-tasks]", err);
    res.status(500).json({ error: err.message || "Failed to create standalone task." });
  }
});

app.put("/api/standalone-tasks/:id", async (req, res) => {
  try {
    const record = await updateDocument(
      "standalone-tasks",
      req.params.id,
      req.body,
      inMemoryStandaloneTasks
    );

    if (!record) {
      return res.status(404).json({ error: "Standalone task not found." });
    }

    res.json(record);
  } catch (err: any) {
    console.error("[PUT /api/standalone-tasks/:id]", err);
    res.status(500).json({ error: err.message || "Failed to update standalone task." });
  }
});

app.delete("/api/standalone-tasks/:id", async (req, res) => {
  try {
    const deleted = await deleteDocument(
      "standalone-tasks",
      req.params.id,
      inMemoryStandaloneTasks
    );

    if (!deleted) {
      return res.status(404).json({ error: "Standalone task not found." });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/standalone-tasks/:id]", err);
    res.status(500).json({ error: err.message || "Failed to delete standalone task." });
  }
});

// -------------------------------------------------------------
// CALENDAR SETTINGS
// -------------------------------------------------------------
app.get("/api/calendar-settings", async (_req, res) => {
  if (isFirestoreConnected && db) {
    try {
      const doc = await db.collection("calendar-settings").doc("exclusions").get();

      if (doc.exists) {
        return res.json({
          customBlocked: [],
          outlookConnected: false,
          outlookEmail: "",
          ...doc.data(),
        });
      }

      return res.json(inMemoryCalendarSettings);
    } catch (err) {
      console.warn("[GET /api/calendar-settings]", err);
      return res.json(inMemoryCalendarSettings);
    }
  }

  res.json(inMemoryCalendarSettings);
});

app.post("/api/calendar-settings", async (req, res) => {
  try {
    const payload = {
      customBlocked: Array.isArray(req.body.customBlocked) ? req.body.customBlocked : [],
      outlookConnected: !!req.body.outlookConnected,
      outlookEmail: req.body.outlookEmail || "",
    };

    if (isFirestoreConnected && db) {
      await db.collection("calendar-settings").doc("exclusions").set(payload, { merge: true });
    } else {
      inMemoryCalendarSettings = { ...inMemoryCalendarSettings, ...payload };
    }

    res.json(payload);
  } catch (err: any) {
    console.error("[POST /api/calendar-settings]", err);
    res.status(500).json({ error: err.message || "Failed to save calendar settings." });
  }
});

// -------------------------------------------------------------
// OUTLOOK PLACEHOLDERS
// -------------------------------------------------------------
app.get("/api/outlook/auth-url", (req, res) => {
  const clientId = String(req.query.clientId || "").trim();
  const tenantId = String(req.query.tenantId || "common").trim();

  if (!clientId) {
    return res.status(400).json({
      error:
        "Microsoft Outlook connection requires a real Azure App Registration clientId. No mock clientId will be used.",
    });
  }

  const redirectUri = `${req.protocol}://${req.get("host")}/api/outlook/callback`;
  const authUrl =
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_mode=query` +
    `&scope=${encodeURIComponent("Calendars.Read offline_access")}`;

  res.json({ url: authUrl });
});

app.get("/api/outlook/callback", async (_req, res) => {
  const config = {
    ...inMemoryCalendarSettings,
    outlookConnected: true,
    outlookEmail: "wickline@fscj.edu",
  };

  if (isFirestoreConnected && db) {
    try {
      await db.collection("calendar-settings").doc("exclusions").set(config, { merge: true });
    } catch (err) {
      console.error("[Outlook callback save]", err);
    }
  } else {
    inMemoryCalendarSettings = config;
  }

  res.send(`
    <html>
      <head>
        <title>Outlook Authorization Completed</title>
        <style>
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
            color: #0f172a;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .card {
            width: min(420px, calc(100vw - 2rem));
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
            text-align: center;
          }
          h1 {
            margin: 0 0 0.75rem;
            font-size: 1.25rem;
          }
          p {
            margin: 0 0 1.5rem;
            color: #475569;
            line-height: 1.5;
          }
          button {
            width: 100%;
            background: #003E52;
            color: white;
            border: none;
            border-radius: 0.75rem;
            padding: 0.75rem 1rem;
            font-weight: 600;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <main class="card">
          <h1>Outlook authorization completed</h1>
          <p>You can close this window and return to Workload Hub.</p>
          <button onclick="window.close()">Close window</button>
        </main>
        <script>
          setTimeout(() => {
            if (window.opener) {
              window.opener.location.reload();
            }
            window.close();
          }, 1500);
        </script>
      </body>
    </html>
  `);
});

/**
 * Do not return mock calendar events.
 * Until real Microsoft Graph token handling is implemented, return an empty list.
 */
app.get("/api/outlook/sync", (_req, res) => {
  res.json([]);
});

app.post("/api/outlook/disconnect", async (_req, res) => {
  try {
    const config = {
      ...inMemoryCalendarSettings,
      outlookConnected: false,
      outlookEmail: "",
    };

    if (isFirestoreConnected && db) {
      await db.collection("calendar-settings").doc("exclusions").set(config, { merge: true });
    } else {
      inMemoryCalendarSettings = config;
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/outlook/disconnect]", err);
    res.status(500).json({ error: err.message || "Failed to disconnect Outlook." });
  }
});

// -------------------------------------------------------------
// VITE DEV SERVER AND PRODUCTION SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
    console.log("[Vite] Development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    console.log(`[Production] Serving static assets from ${distPath}`);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log("================================================================");
    console.log(" FSCJ Workload Hub API Running");
    console.log(` URL: http://0.0.0.0:${PORT}`);
    console.log("================================================================");
  });
}

startServer();
