import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  "workload-hub-2026";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

let db: admin.firestore.Firestore | null = null;
let firestoreReady = false;
let firestoreError = "";

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }

  db = admin.firestore();
  firestoreReady = true;
  console.log(`[Firestore] Connected to project: ${PROJECT_ID}`);
} catch (error: any) {
  firestoreReady = false;
  firestoreError = error?.message || String(error);
  console.error("[Firestore] Connection failed:", firestoreError);
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

function requireFirestoreInProduction(res: express.Response) {
  if (IS_PRODUCTION && (!firestoreReady || !db)) {
    res.status(503).json({
      error:
        "Firestore is not connected. Data was not saved. Check Cloud Run service account permissions and Firestore setup.",
      projectId: PROJECT_ID,
      firestoreReady,
      firestoreError,
    });
    return false;
  }

  return true;
}

async function getCollection(collectionName: string, fallback: any[], res: express.Response) {
  if (!firestoreReady || !db) {
    if (!requireFirestoreInProduction(res)) return null;
    return fallback;
  }

  const snapshot = await db.collection(collectionName).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function createRecord(
  collectionName: string,
  payload: any,
  fallback: any[],
  prefix: string,
  res: express.Response
) {
  const record = {
    ...payload,
    id: payload.id || makeId(prefix),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!firestoreReady || !db) {
    if (!requireFirestoreInProduction(res)) return null;
    fallback.push(record);
    return record;
  }

  await db.collection(collectionName).doc(record.id).set(record, { merge: true });
  return record;
}

async function updateRecord(
  collectionName: string,
  id: string,
  payload: any,
  fallback: any[],
  res: express.Response
) {
  const record = {
    ...payload,
    id,
    updatedAt: new Date().toISOString(),
  };

  if (!firestoreReady || !db) {
    if (!requireFirestoreInProduction(res)) return null;

    const index = fallback.findIndex((item) => item.id === id);
    if (index === -1) return null;

    fallback[index] = {
      ...fallback[index],
      ...record,
    };

    return fallback[index];
  }

  await db.collection(collectionName).doc(id).set(record, { merge: true });
  return record;
}

async function deleteRecord(
  collectionName: string,
  id: string,
  fallbackName: string,
  res: express.Response
) {
  if (!firestoreReady || !db) {
    if (!requireFirestoreInProduction(res)) return null;

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

  await db.collection(collectionName).doc(id).delete();
  return true;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 8080);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      projectId: PROJECT_ID,
      nodeEnv: process.env.NODE_ENV || "",
      firestoreReady,
      firestoreError,
      storageMode: firestoreReady ? "firestore" : IS_PRODUCTION ? "not-connected" : "in-memory-dev",
    });
  });

  app.get("/api/course-developments", async (_req, res) => {
    try {
      const records = await getCollection("course-developments", inMemoryCourseDevelopments, res);
      if (records === null) return;
      res.json(records);
    } catch (error: any) {
      console.error("[GET /api/course-developments]", error);
      res.status(500).json({ error: error?.message || "Could not load Course Developments." });
    }
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
        "course",
        res
      );

      if (record === null) return;
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
        inMemoryCourseDevelopments,
        res
      );

      if (record === null) return;
      if (!record) return res.status(404).json({ error: "Course Development not found." });

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
        "courseDevelopments",
        res
      );

      if (deleted === null) return;
      if (!deleted) return res.status(404).json({ error: "Course Development not found." });

      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE /api/course-developments/:id]", error);
      res.status(500).json({ error: error?.message || "Could not delete Course Development." });
    }
  });

  app.get("/api/lss-projects", async (_req, res) => {
    try {
      const records = await getCollection("lss-projects", inMemoryProjects, res);
      if (records === null) return;
      res.json(records);
    } catch (error: any) {
      console.error("[GET /api/lss-projects]", error);
      res.status(500).json({ error: error?.message || "Could not load Projects." });
    }
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
        "project",
        res
      );

      if (record === null) return;
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
        inMemoryProjects,
        res
      );

      if (record === null) return;
      if (!record) return res.status(404).json({ error: "Project not found." });

      res.json(record);
    } catch (error: any) {
      console.error("[PUT /api/lss-projects/:id]", error);
      res.status(500).json({ error: error?.message || "Could not update Project." });
    }
  });

  app.delete("/api/lss-projects/:id", async (req, res) => {
    try {
      const deleted = await deleteRecord("lss-projects", req.params.id, "projects", res);

      if (deleted === null) return;
      if (!deleted) return res.status(404).json({ error: "Project not found." });

      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE /api/lss-projects/:id]", error);
      res.status(500).json({ error: error?.message || "Could not delete Project." });
    }
  });

  app.get("/api/standalone-tasks", async (_req, res) => {
    try {
      const records = await getCollection("standalone-tasks", inMemoryStandaloneTasks, res);
      if (records === null) return;
      res.json(records);
    } catch (error: any) {
      console.error("[GET /api/standalone-tasks]", error);
      res.status(500).json({ error: error?.message || "Could not load Standalone Tasks." });
    }
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
        "task",
        res
      );

      if (record === null) return;
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
        inMemoryStandaloneTasks,
        res
      );

      if (record === null) return;
      if (!record) return res.status(404).json({ error: "Standalone Task not found." });

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
        "standaloneTasks",
        res
      );

      if (deleted === null) return;
      if (!deleted) return res.status(404).json({ error: "Standalone Task not found." });

      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE /api/standalone-tasks/:id]", error);
      res.status(500).json({ error: error?.message || "Could not delete Standalone Task." });
    }
  });

  app.get("/api/calendar-settings", async (_req, res) => {
    try {
      if (!firestoreReady || !db) {
        if (!requireFirestoreInProduction(res)) return;
        return res.json(inMemoryCalendarSettings);
      }

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

      return res.json(inMemoryCalendarSettings);
    } catch (error: any) {
      console.error("[GET /api/calendar-settings]", error);
      res.status(500).json({ error: error?.message || "Could not load Calendar Settings." });
    }
  });

  app.post("/api/calendar-settings", async (req, res) => {
    try {
      const payload = {
        customBlocked: Array.isArray(req.body.customBlocked) ? req.body.customBlocked : [],
        outlookConnected: !!req.body.outlookConnected,
        outlookEmail: req.body.outlookEmail || "",
        timezone: "America/New_York",
      };

      if (!firestoreReady || !db) {
        if (!requireFirestoreInProduction(res)) return;
        inMemoryCalendarSettings = payload;
        return res.json(payload);
      }

      await db.collection("calendar-settings").doc("settings").set(payload, { merge: true });
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
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 2rem;">
          <h1>Outlook Authorization Placeholder</h1>
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
    console.log(`Storage mode: ${firestoreReady ? "Firestore" : IS_PRODUCTION ? "NOT CONNECTED" : "In-memory dev"}`);
  });
}

startServer();
