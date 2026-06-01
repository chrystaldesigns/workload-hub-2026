import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "";

let db: admin.firestore.Firestore | null = null;
let firestoreReady = false;

try {
  if (FIREBASE_PROJECT_ID && !admin.apps.length) {
    admin.initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
    db = admin.firestore();
    firestoreReady = true;
    console.log(`[Firebase] Firestore connected: ${FIREBASE_PROJECT_ID}`);
  } else {
    console.log("[Firebase] Firestore not configured. Using in-memory storage.");
  }
} catch (error: any) {
  console.warn("[Firebase] Firestore connection failed. Using in-memory storage.");
  console.warn(error?.message || error);
}

let inMemoryCourseDevelopments: any[] = [];
let inMemoryProjects: any[] = [];
let inMemoryStandaloneTasks: any[] = [];
let inMemoryCalendarSettings: any = {
  customBlocked: [],
  outlookConnected: false,
  outlookEmail: "",
  timezone: "America/New_York",
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getCollection(collectionName: string, fallback: any[]) {
  if (!firestoreReady || !db) return fallback;

  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.warn(`[Firestore] Could not read ${collectionName}. Using memory fallback.`);
    return fallback;
  }
}

async function createRecord(
  collectionName: string,
  payload: any,
  fallback: any[],
  prefix: string
) {
  const record = {
    ...payload,
    id: payload.id || makeId(prefix),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (firestoreReady && db) {
    await db.collection(collectionName).doc(record.id).set(record, { merge: true });
    return record;
  }

  fallback.push(record);
  return record;
}

async function updateRecord(collectionName: string, id: string, payload: any, fallback: any[]) {
  const record = {
    ...payload,
    id,
    updatedAt: new Date().toISOString(),
  };

  if (firestoreReady && db) {
    await db.collection(collectionName).doc(id).set(record, { merge: true });
    return record;
  }

  const index = fallback.findIndex((item) => item.id === id);
  if (index === -1) return null;

  fallback[index] = {
    ...fallback[index],
    ...record,
  };

  return fallback[index];
}

async function deleteRecord(collectionName: string, id: string, fallbackName: string) {
  if (firestoreReady && db) {
    await db.collection(collectionName).doc(id).delete();
    return true;
  }

  if (fallbackName === "courseDevelopments") {
    const before = inMemoryCourseDevelopments.length;
    inMemoryCourseDevelopments = inMemoryCourseDevelopments.filter((item) => item.id !== id);
    return inMemoryCourseDevelopments.length !== before;
  }

  if (fallbackName === "projects") {
    const before = inMemoryProjects.length;
    inMemoryProjects = inMemoryProjects.filter((item) => item.id !== id);
    return inMemoryProjects.length !== before;
  }

  if (fallbackName === "standaloneTasks") {
    const before = inMemoryStandaloneTasks.length;
    inMemoryStandaloneTasks = inMemoryStandaloneTasks.filter((item) => item.id !== id);
    return inMemoryStandaloneTasks.length !== before;
  }

  return false;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 8080);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      firestoreReady,
      storageMode: firestoreReady ? "firestore" : "in-memory",
    });
  });

  app.get("/api/course-developments", async (_req, res) => {
    const records = await getCollection("course-developments", inMemoryCourseDevelopments);
    res.json(records);
  });

  app.post("/api/course-developments", async (req, res) => {
    try {
      const payload = req.body;

      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid Course Development payload." });
      }

      if (!payload.courseNumber || !payload.courseTitle) {
        return res.status(400).json({
          error: "Course Number and Course Title are required for Course Development.",
        });
      }

      const record = await createRecord(
        "course-developments",
        {
          ...payload,
          itemType: "courseDevelopment",
          tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
        },
        inMemoryCourseDevelopments,
        "course"
      );

      res.json(record);
    } catch (error: any) {
      console.error("[POST /api/course-developments]", error);
      res.status(500).json({ error: error?.message || "Could not save Course Development." });
    }
  });

  app.put("/api/course-developments/:id", async (req, res) => {
    try {
      const record = await updateRecord(
        "course-developments",
        req.params.id,
        {
          ...req.body,
          itemType: "courseDevelopment",
          tasks: Array.isArray(req.body.tasks) ? req.body.tasks : [],
        },
        inMemoryCourseDevelopments
      );

      if (!record) {
        return res.status(404).json({ error: "Course Development not found." });
      }

      res.json(record);
    } catch (error: any) {
      console.error("[PUT /api/course-developments/:id]", error);
      res.status(500).json({ error: error?.message || "Could not update Course Development." });
    }
  });

  app.delete("/api/course-developments/:id", async (req, res) => {
    try {
      const deleted = await deleteRecord(
        "course-developments",
        req.params.id,
        "courseDevelopments"
      );

      if (!deleted) {
        return res.status(404).json({ error: "Course Development not found." });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE /api/course-developments/:id]", error);
      res.status(500).json({ error: error?.message || "Could not delete Course Development." });
    }
  });

  app.get("/api/lss-projects", async (_req, res) => {
    const records = await getCollection("lss-projects", inMemoryProjects);
    res.json(records);
  });

  app.post("/api/lss-projects", async (req, res) => {
    try {
      const payload = req.body;

      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid Project payload." });
      }

      if (!payload.title) {
        return res.status(400).json({ error: "Project Title is required." });
      }

      const record = await createRecord(
        "lss-projects",
        {
          ...payload,
          itemType: "project",
          tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
        },
        inMemoryProjects,
        "project"
      );

      res.json(record);
    } catch (error: any) {
      console.error("[POST /api/lss-projects]", error);
      res.status(500).json({ error: error?.message || "Could not save Project." });
    }
  });

  app.put("/api/lss-projects/:id", async (req, res) => {
    try {
      const record = await updateRecord(
        "lss-projects",
        req.params.id,
        {
          ...req.body,
          itemType: "project",
          tasks: Array.isArray(req.body.tasks) ? req.body.tasks : [],
        },
        inMemoryProjects
      );

      if (!record) {
        return res.status(404).json({ error: "Project not found." });
      }

      res.json(record);
    } catch (error: any) {
      console.error("[PUT /api/lss-projects/:id]", error);
      res.status(500).json({ error: error?.message || "Could not update Project." });
    }
  });

  app.delete("/api/lss-projects/:id", async (req, res) => {
    try {
      const deleted = await deleteRecord("lss-projects", req.params.id, "projects");

      if (!deleted) {
        return res.status(404).json({ error: "Project not found." });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE /api/lss-projects/:id]", error);
      res.status(500).json({ error: error?.message || "Could not delete Project." });
    }
  });

  app.get("/api/standalone-tasks", async (_req, res) => {
    const records = await getCollection("standalone-tasks", inMemoryStandaloneTasks);
    res.json(records);
  });

  app.post("/api/standalone-tasks", async (req, res) => {
    try {
      const payload = req.body;

      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid Standalone Task payload." });
      }

      if (!payload.title) {
        return res.status(400).json({ error: "Task Title is required." });
      }

      const record = await createRecord(
        "standalone-tasks",
        {
          ...payload,
          itemType: "standaloneTask",
          status: payload.status || "Not Started",
          priority: payload.priority || "Moderate",
          progress: Number(payload.progress || 0),
        },
        inMemoryStandaloneTasks,
        "task"
      );

      res.json(record);
    } catch (error: any) {
      console.error("[POST /api/standalone-tasks]", error);
      res.status(500).json({ error: error?.message || "Could not save Standalone Task." });
    }
  });

  app.put("/api/standalone-tasks/:id", async (req, res) => {
    try {
      const record = await updateRecord(
        "standalone-tasks",
        req.params.id,
        {
          ...req.body,
          itemType: "standaloneTask",
          progress: Number(req.body.progress || 0),
        },
        inMemoryStandaloneTasks
      );

      if (!record) {
        return res.status(404).json({ error: "Standalone Task not found." });
      }

      res.json(record);
    } catch (error: any) {
      console.error("[PUT /api/standalone-tasks/:id]", error);
      res.status(500).json({ error: error?.message || "Could not update Standalone Task." });
    }
  });

  app.delete("/api/standalone-tasks/:id", async (req, res) => {
    try {
      const deleted = await deleteRecord(
        "standalone-tasks",
        req.params.id,
        "standaloneTasks"
      );

      if (!deleted) {
        return res.status(404).json({ error: "Standalone Task not found." });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE /api/standalone-tasks/:id]", error);
      res.status(500).json({ error: error?.message || "Could not delete Standalone Task." });
    }
  });

  app.get("/api/calendar-settings", async (_req, res) => {
    if (firestoreReady && db) {
      try {
        const doc = await db.collection("calendar-settings").doc("settings").get();

        if (doc.exists) {
          return res.json({
            customBlocked: [],
            outlookConnected: false,
            outlookEmail: "",
            timezone: "America/New_York",
            ...doc.data(),
          });
        }
      } catch {
        console.warn("[Firestore] Could not read calendar settings. Using memory fallback.");
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
        timezone: "America/New_York",
      };

      if (firestoreReady && db) {
        await db.collection("calendar-settings").doc("settings").set(payload, { merge: true });
      } else {
        inMemoryCalendarSettings = payload;
      }

      res.json(payload);
    } catch (error: any) {
      console.error("[POST /api/calendar-settings]", error);
      res.status(500).json({ error: error?.message || "Could not save Calendar Settings." });
    }
  });

  app.get("/api/outlook/sync", (_req, res) => {
    res.json([]);
  });

  app.get("/api/outlook/auth-url", (req, res) => {
    const clientId = String(req.query.clientId || "").trim();
    const tenantId = String(req.query.tenantId || "common").trim();

    if (!clientId) {
      return res.status(400).json({
        error: "Outlook connection requires a Microsoft Azure client ID.",
      });
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/outlook/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: "openid profile email Calendars.Read User.Read offline_access",
      prompt: "consent",
    });

    res.json({
      url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`,
    });
  });

  app.get("/api/outlook/callback", (_req, res) => {
    inMemoryCalendarSettings = {
      ...inMemoryCalendarSettings,
      outlookConnected: true,
      outlookEmail: "Connected",
    };

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 2rem;">
          <h1>Outlook Authorization Complete</h1>
          <p>You may close this window and return to Workload Hub.</p>
          <script>
            if (window.opener) {
              window.opener.location.reload();
            }
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
      </html>
    `);
  });

  app.post("/api/outlook/disconnect", (_req, res) => {
    inMemoryCalendarSettings = {
      ...inMemoryCalendarSettings,
      outlookConnected: false,
      outlookEmail: "",
    };

    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
