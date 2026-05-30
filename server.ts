import express from "express";
import path from "path";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const app = express();

// Modernized: Prioritize dynamic environment variables provided by Cloud Run, falling back to 8080 or 3000 locally.
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
// FIRESTORE CONNECTION SETUP (LAZY ENVIRONMENT AUTO RECOVERY)
// -------------------------------------------------------------
const FIREBASE_PROJECT_ID = 'workload-hub-2026';
let db: admin.firestore.Firestore | null = null;
let isFirestoreConnected = false;

try {
  // If running in Cloud Run/Compute Engine, it auto-detects metadata credentials,
  // or checks for standard service account env variables.
  admin.initializeApp({
    projectId: FIREBASE_PROJECT_ID
  });
  db = admin.firestore();
  isFirestoreConnected = true;
  console.log(`[Firebase] Successfully connected to GCP Project "${FIREBASE_PROJECT_ID}"`);
} catch (error: any) {
  console.warn(`[Firebase Warning] Falling back to high-fidelity server memory state. Reason: ${error.message}`);
}

// -------------------------------------------------------------
// LOCAL STATE DATABASE FALLBACK (FOR OFFLINE / ISOLATED CONTAINER MODE)
// -------------------------------------------------------------
let inMemoryCourseDevelopments: any[] = [
  {
    id: "dev-seed-1",
    program: "Information Technology",
    courseNumber: "DIG3115",
    courseTitle: "Cloud Run Container Systems Development",
    canvasVersion: "cel-DIG3115-v1",
    workshopCourse: "wickline-wrkshp-cel-DIG3115-v1",
    devType: "Original",
    versionNumber: 1,
    termRelease: "Fall B",
    termDeadline: "2026-12-15",
    devStagger: 14,
    onboarding: true,
    celTeam: { golf: "Golf.K@fscj.edu", chrystal: "wickline@fscj.edu", admin: "cel@fscj.edu" },
    deptTeam: {
      smeName: "Dr. Linda Jones",
      smeEmail: "linda.jones@fscj.edu",
      deanName: "Dr. Susan M. Harris",
      deanEmail: "s.harris@fscj.edu",
      managerName: "George Vance",
      managerEmail: "g.vance@fscj.edu"
    },
    alertStatus: "Potential Concerns",
    courseNotes: "Reviewing accreditation credentials for virtual labs.",
    hideCompletedTasks: false,
    tasks: [] // Dynamically calculated below if fetched
  }
];

let inMemoryLssProjects: any[] = [
  {
    id: "lss-seed-1",
    title: "Scheduling Pipeline Processing Simplification",
    type: "DMAIC",
    priority: "Critical",
    startDate: "2026-05-15",
    targetCompletionDate: "2026-09-30",
    status: "Measure",
    projectLead: "Chrystal Wickline",
    processOwner: "Dr. Linda Jones",
    projectChampion: "VP of Academic Support",
    stakeholders: "Registrar Coordinators, Division Deans, Admissions Staff",
    problemStatement: "The course scheduling timeline currently averages 42 days from draft submission to live registration, costing high administrative overhead and 22% delay adjustments.",
    businessCaseAndBenefits: "Shortening processing loops to <= 14 business days via DMAIC optimization saves an estimated $45,000 annually.",
    inScope: "Undergraduate course schedules, standard term blocks, and automated portal listings.",
    outOfScope: "Temporary seminars, special military group adjustments, and dual alignment schools.",
    performanceMetrics: "As-is processing median: 38 Days, Sigma: 1.8. Target processing: 14 Days, Sigma: 3.5.",
    risks: "SME unavailability, peak calendar constraints, and legacy portal imports bottleneck.",
    voiceOfCustomer: "Academic Deans report visibility lag. Registrar clerks request simplified data formats.",
    customerComment: "We spend hours confirming room availability on outdated rosters.",
    issue: "Inefficient manual verification loop across divisions.",
    customerRequirement: "Instant room status overview or auto-exclusions checklist.",
    objectiveMeasure: "Cycle days per scheduler verification.",
    operationalDefinition: "Start Time is email transmission to SME; End Time is signed roster return.",
    timelineMethodology: "Six Sigma",
    defineDuration: 4,
    defineProjectedCompletion: "2026-06-15",
    measureDuration: 6,
    measureProjectedCompletion: "2026-07-30",
    analyzeDuration: 4,
    analyzeProjectedCompletion: "2026-08-30",
    improveDuration: 6,
    improveProjectedCompletion: "2026-10-15",
    controlDuration: 4,
    controlProjectedCompletion: "2026-11-15",
    gateReviewDates: "Define Gate: 06-15-26 | Measure Gate: 07-30-26 | Analyze Gate: 08-30-26",
    estimatedDuration: 24,
    timelineNotes: "Estimates mapped to US Eastern Academic Calendar restrictions.",
    tasks: [
      { id: "t1", name: "Build initial Value Stream Map (VSM) of drafts", assignedTo: "Chrystal Wickline", dueDate: "2026-06-10", status: "Completed" },
      { id: "t2", name: "Perform RTO bottleneck survey for scheduler sub-phases", assignedTo: "Dr. Linda Jones", dueDate: "2026-06-25", status: "Pending" }
    ]
  }
];

let inMemoryStandaloneTasks: any[] = [
  {
    id: "task-seed-1",
    title: "Submit FSCJ Curriculum Data Summit Proposal",
    startDate: "2026-05-30",
    dueDate: "2026-06-10",
    notes: "Requires abstract regarding backward timeline scheduling.",
    status: "In Progress",
    progress: 50,
    priority: "High"
  },
  {
    id: "task-seed-2",
    title: "Complete FSCJ Annual Self-Evaluation Report",
    startDate: "2026-05-15",
    dueDate: "2026-05-25",
    notes: "Review with eLearning Dean Dr. Golf.",
    status: "In Progress",
    progress: 50,
    priority: "Critical"
  }
];

let inMemoryCalendarExclusions = {
  customBlocked: ["2026-06-11", "2026-06-12", "2026-07-10"] as string[],
  outlookConnected: false,
  outlookEmail: ""
};

// -------------------------------------------------------------
// HELPER TO INTERACT WITH FIRESTORE OR MEMORY
// -------------------------------------------------------------
async function getCollectionData(collectionName: string, fallbackData: any[]) {
  if (!isFirestoreConnected || !db) {
    return fallbackData;
  }
  try {
    const snap = await db.collection(collectionName).get();
    if (snap.empty) {
      for (const item of fallbackData) {
        const { id, ...payload } = item;
        await db.collection(collectionName).add(payload);
      }
      return fallbackData;
    }
    const result: any[] = [];
    snap.forEach(doc => {
      result.push({ id: doc.id, ...doc.data() });
    });
    return result;
  } catch (err) {
    console.warn(`Firestore read fail, fallback used: ${err}`);
    return fallbackData;
  }
}

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// Course Developments (Category 1)
app.get("/api/course-developments", async (req, res) => {
  const data = await getCollectionData("course-developments", inMemoryCourseDevelopments);
  res.json(data);
});

app.post("/api/course-developments", async (req, res) => {
  const payload = req.body;
  if (!payload.program || !payload.courseNumber) {
    return res.status(400).json({ error: "Missing required program details" });
  }
  
  if (isFirestoreConnected && db) {
    try {
      const docRef = await db.collection("course-developments").add(payload);
      res.json({ id: docRef.id, ...payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const id = `cd-mem-${Date.now()}`;
    const newRecord = { id, ...payload };
    inMemoryCourseDevelopments.push(newRecord);
    res.json(newRecord);
  }
});

app.put("/api/course-developments/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  
  if (isFirestoreConnected && db) {
    try {
      await db.collection("course-developments").doc(id).set(payload, { merge: true });
      res.json({ id, ...payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const idx = inMemoryCourseDevelopments.findIndex(cd => cd.id === id);
    if (idx !== -1) {
      inMemoryCourseDevelopments[idx] = { ...inMemoryCourseDevelopments[idx], ...payload };
      res.json(inMemoryCourseDevelopments[idx]);
    } else {
      res.status(404).json({ error: "Record not found" });
    }
  }
});

app.delete("/api/course-developments/:id", async (req, res) => {
  const { id } = req.params;
  if (isFirestoreConnected && db) {
    try {
      await db.collection("course-developments").doc(id).delete();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    inMemoryCourseDevelopments = inMemoryCourseDevelopments.filter(cd => cd.id !== id);
    res.json({ success: true });
  }
});

// LSS Projects (Category 2)
app.get("/api/lss-projects", async (req, res) => {
  const data = await getCollectionData("lss-projects", inMemoryLssProjects);
  res.json(data);
});

app.post("/api/lss-projects", async (req, res) => {
  const payload = req.body;
  
  if (isFirestoreConnected && db) {
    try {
      const docRef = await db.collection("lss-projects").add(payload);
      res.json({ id: docRef.id, ...payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const id = `lss-mem-${Date.now()}`;
    const newRecord = { id, ...payload };
    inMemoryLssProjects.push(newRecord);
    res.json(newRecord);
  }
});

app.put("/api/lss-projects/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  
  if (isFirestoreConnected && db) {
    try {
      await db.collection("lss-projects").doc(id).set(payload, { merge: true });
      res.json({ id, ...payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const idx = inMemoryLssProjects.findIndex(lss => lss.id === id);
    if (idx !== -1) {
      inMemoryLssProjects[idx] = { ...inMemoryLssProjects[idx], ...payload };
      res.json(inMemoryLssProjects[idx]);
    } else {
      res.status(404).json({ error: "Record not found" });
    }
  }
});

app.delete("/api/lss-projects/:id", async (req, res) => {
  const { id } = req.params;
  if (isFirestoreConnected && db) {
    try {
      await db.collection("lss-projects").doc(id).delete();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    inMemoryLssProjects = inMemoryLssProjects.filter(p => p.id !== id);
    res.json({ success: true });
  }
});

// Standalone Tasks (Category 3)
app.get("/api/standalone-tasks", async (req, res) => {
  const data = await getCollectionData("standalone-tasks", inMemoryStandaloneTasks);
  res.json(data);
});

app.post("/api/standalone-tasks", async (req, res) => {
  const payload = req.body;
  if (isFirestoreConnected && db) {
    try {
      const docRef = await db.collection("standalone-tasks").add(payload);
      res.json({ id: docRef.id, ...payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const id = `task-mem-${Date.now()}`;
    const newRecord = { id, ...payload };
    inMemoryStandaloneTasks.push(newRecord);
    res.json(newRecord);
  }
});

app.put("/api/standalone-tasks/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  if (isFirestoreConnected && db) {
    try {
      await db.collection("standalone-tasks").doc(id).set(payload, { merge: true });
      res.json({ id, ...payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const idx = inMemoryStandaloneTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      inMemoryStandaloneTasks[idx] = { ...inMemoryStandaloneTasks[idx], ...payload };
      res.json(inMemoryStandaloneTasks[idx]);
    } else {
      res.status(444).json({ error: "No task" });
    }
  }
});

app.delete("/api/standalone-tasks/:id", async (req, res) => {
  const { id } = req.params;
  if (isFirestoreConnected && db) {
    try {
      await db.collection("standalone-tasks").doc(id).delete();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    inMemoryStandaloneTasks = inMemoryStandaloneTasks.filter(t => t.id !== id);
    res.json({ success: true });
  }
});

// Calendar Settings & Exclusions
app.get("/api/calendar-settings", async (req, res) => {
  if (isFirestoreConnected && db) {
    try {
      const doc = await db.collection("calendar-settings").doc("exclusions").get();
      if (doc.exists) {
        res.json(doc.data());
      } else {
        await db.collection("calendar-settings").doc("exclusions").set(inMemoryCalendarExclusions);
        res.json(inMemoryCalendarExclusions);
      }
    } catch (err) {
      res.json(inMemoryCalendarExclusions);
    }
  } else {
    res.json(inMemoryCalendarExclusions);
  }
});

app.post("/api/calendar-settings", async (req, res) => {
  const payload = req.body;
  if (isFirestoreConnected && db) {
    try {
      await db.collection("calendar-settings").doc("exclusions").set(payload, { merge: true });
      res.json(payload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    inMemoryCalendarExclusions = { ...inMemoryCalendarExclusions, ...payload };
    res.json(inMemoryCalendarExclusions);
  }
});

// -------------------------------------------------------------
// MICROSOFT OUTLOOK OAUTH FLOW & SIMULATION PROXIES
// -------------------------------------------------------------
app.get("/api/outlook/auth-url", (req, res) => {
  const clientId = req.query.clientId || "mock-client-id";
  const redirectUri = `${req.protocol}://${req.get("host")}/api/outlook/callback`;
  const tenant = req.query.tenantId || "common";
  
  const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=Calendars.Read%20offline_access`;
  res.json({ url: authUrl });
});

app.get("/api/outlook/callback", async (req, res) => {
  const { code } = req.query;
  const config = {
    customBlocked: inMemoryCalendarExclusions.customBlocked,
    outlookConnected: true,
    outlookEmail: "wickline@fscj.edu"
  };

  if (isFirestoreConnected && db) {
    try {
      await db.collection("calendar-settings").doc("exclusions").set(config, { merge: true });
    } catch (err) {
      console.error(err);
    }
  } else {
    inMemoryCalendarExclusions = { ...inMemoryCalendarExclusions, ...config };
  }

  // Modernized Inline DOM Payload: Styled to match the new clean, double-rounded visual architecture
  res.send(`
    <html>
      <head>
        <title>Outlook Authorization Completed</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f8fafc;
            margin: 0;
            font-family: 'Inter', sans-serif;
            text-align: center;
          }
          .card {
            background-color: #ffffff;
            border: 1px solid rgba(226, 232, 240, 0.6);
            border-radius: 1rem;
            padding: 2.5rem;
            max-width: 400px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02);
          }
          .icon-badge {
            background-color: #e0e7ff;
            color: #4f46e5;
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.25rem auto;
          }
          h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 0.5rem 0;
            tracking: -0.025em;
          }
          p {
            font-size: 0.875rem;
            color: #475569;
            margin: 0 0 1.5rem 0;
            line-height: 1.4;
          }
          button {
            width: 100%;
            background-color: #4f46e5;
            border: none;
            color: #ffffff;
            padding: 0.625rem 1.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0.75rem;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
          }
          button:hover {
            background-color: #4338ca;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-badge">
            <svg style="width:24px; height:24px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2>Outlook Authenticated!</h2>
          <p>Microsoft Graph calendar retrieval linked successfully for wickline@fscj.edu.</p>
          <button onclick="window.close()">Close Window</button>
        </div>
        <script>
          setTimeout(() => {
            if (window.opener) {
              window.opener.location.reload();
            }
            window.close();
          }, 3000);
        </script>
      </body>
    </html>
  `);
});

// Retrieve outlook calendar busy states to deduct available working capacity
app.get("/api/outlook/sync", (req, res) => {
  const mockBusySlices = [
    {
      id: "evt-1",
      subject: "FSCJ Academic Accreditation Committee Meeting",
      start: { dateTime: "2026-06-08T09:00:00", timeZone: "Eastern Standard Time" },
      end: { dateTime: "2026-06-08T11:00:00", timeZone: "Eastern Standard Time" },
      showAs: "busy"
    },
    {
      id: "evt-2",
      subject: "CeL Division Weekly Synergies Sync",
      start: { dateTime: "2026-06-15T14:30:00", timeZone: "Eastern Standard Time" },
      end: { dateTime: "2026-06-15T15:30:00", timeZone: "Eastern Standard Time" },
      showAs: "busy"
    },
    {
      id: "evt-3",
      subject: "SME Onboarding Sync - Legal Systems course",
      start: { dateTime: "2026-06-25T10:00:00", timeZone: "Eastern Standard Time" },
      end: { dateTime: "2026-06-25T11:30:00", timeZone: "Eastern Standard Time" },
      showAs: "busy"
    },
    {
      id: "evt-4",
      subject: "Curriculum Focus Work block",
      start: { dateTime: "2026-06-29T08:00:00", timeZone: "Eastern Standard Time" },
      end: { dateTime: "2026-06-29T12:00:00", timeZone: "Eastern Standard Time" },
      showAs: "busy"
    }
  ];
  res.json(mockBusySlices);
});

// Disconnect Outlook
app.post("/api/outlook/disconnect", async (req, res) => {
  const config = {
    customBlocked: inMemoryCalendarExclusions.customBlocked,
    outlookConnected: false,
    outlookEmail: ""
  };

  if (isFirestoreConnected && db) {
    try {
      await db.collection("calendar-settings").doc("exclusions").set(config, { merge: true });
    } catch (err) {
      console.error(err);
    }
  } else {
    inMemoryCalendarExclusions = { ...inMemoryCalendarExclusions, ...config };
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// VITE DEV SERVER AND PRODUCTION SERVING LAYER
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(`[Vite] Development middleware mounted successfully.`);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`[Production] Static asset server mounted on routing dist. @ ${distPath}`);
  }

  // Set up listener to bind transparently on 0.0.0.0 with the environment-passed port allocation
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`================================================================`);
    console.log(` FSCJ Workload Hub Full-Stack Engine Running`);
    console.log(` Active Context Dynamic Port Link: http://0.0.0.0:${PORT}`);
    console.log(`================================================================`);
  });
}

startServer();
