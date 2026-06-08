import React, { useEffect, useState } from "react";
import {
  CourseDevelopment,
  LssProject,
  StandaloneTask,
  CalendarSettings,
  OutlookEvent,
} from "./types";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { Category1CourseDev } from "./components/Category1_CourseDev";
import { Category2LssProjects } from "./components/Category2_LssProjects";
import { Category3Tasks } from "./components/Category3_Tasks";
import { CalendarSettingsPanel } from "./components/CalendarSettingsPanel";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [courseDevelopments, setCourseDevelopments] = useState<CourseDevelopment[]>([]);
  const [lssProjects, setLssProjects] = useState<LssProject[]>([]);
  const [standaloneTasks, setStandaloneTasks] = useState<StandaloneTask[]>([]);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    customBlocked: [],
    timezone: "America/New_York" as any,
  });
  const [outlookEvents, setOutlookEvents] = useState<OutlookEvent[]>([]);
  const [alertCount, setAlertCount] = useState<number>(0);

  const countWorkingDaysBetweenDates = (
    startStr: string,
    endStr: string,
    blocked: string[] = []
  ) => {
    if (!startStr || !endStr || startStr > endStr) return 0;

    let current = new Date(`${startStr}T12:00:00`);
    const end = new Date(`${endStr}T12:00:00`);
    let count = 0;
    let guard = 0;

    while (current <= end) {
      const day = current.getDay();
      const dateStr = current.toISOString().split("T")[0];
      const isWeekend = day === 0 || day === 6;
      const isSummerFriday =
        day === 5 &&
        dateStr >= `${current.getFullYear()}-05-04` &&
        dateStr <= `${current.getFullYear()}-08-08`;

      if (!isWeekend && !isSummerFriday && !blocked.includes(dateStr)) {
        count++;
      }

      current.setDate(current.getDate() + 1);
      guard++;

      if (guard > 1000) {
        throw new Error("Working-day count exceeded safe limit.");
      }
    }

    return count;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [cdRes, lssRes, taskRes, calRes, outRes] = await Promise.all([
        fetch("/api/course-developments"),
        fetch("/api/lss-projects"),
        fetch("/api/standalone-tasks"),
        fetch("/api/calendar-settings"),
        fetch("/api/outlook/sync"),
      ]);

      if (!cdRes.ok || !lssRes.ok || !taskRes.ok || !calRes.ok || !outRes.ok) {
        throw new Error("Failure communicating with core full-stack API services.");
      }

      const cdData = await cdRes.json();
      const lssData = await lssRes.json();
      const taskData = await taskRes.json();
      const calData = await calRes.json();
      const outData = await outRes.json();

      const safeCourses = Array.isArray(cdData) ? cdData : [];
      const safeProjects = Array.isArray(lssData) ? lssData : [];
      const safeTasks = Array.isArray(taskData) ? taskData : [];
      const safeCalendar = {
        customBlocked: Array.isArray(calData?.customBlocked) ? calData.customBlocked : [],
        outlookConnected: !!calData?.outlookConnected,
        outlookEmail: calData?.outlookEmail || "",
        timezone: "America/New_York" as any,
      };

      setCourseDevelopments(safeCourses);
      setLssProjects(safeProjects);
      setStandaloneTasks(safeTasks);
      setCalendarSettings(safeCalendar);
      setOutlookEvents(Array.isArray(outData) ? outData : []);

      const todayStr = new Date().toISOString().split("T")[0];

      const overdueTasks = safeTasks.filter(
        (task: StandaloneTask) =>
          task.status !== "Complete" && !!task.dueDate && task.dueDate < todayStr
      ).length;

      let nonComplianceCount = 0;

      safeCourses.forEach((course: CourseDevelopment) => {
        if (!Array.isArray(course.tasks) || !course.termDeadline) return;

        const closeoutTask =
          course.tasks.find((task) => task.id === 62) ||
          course.tasks.find((task) =>
            task.name?.toLowerCase().includes("code check and archive")
          ) ||
          course.tasks.find((task) =>
            task.phase?.toLowerCase().includes("project closeout")
          );

        if (closeoutTask?.dueDate) {
          const daysAndGaps = countWorkingDaysBetweenDates(
            closeoutTask.dueDate,
            course.termDeadline,
            safeCalendar.customBlocked
          );

          if (daysAndGaps < 30) {
            nonComplianceCount++;
          }
        }
      });

      setAlertCount(overdueTasks + nonComplianceCount);
    } catch (err: any) {
      console.error("Dashboard load failed:", err);
      setErrorMsg(err.message || "System failed loading academic records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAddCourse = async (newCourse: CourseDevelopment) => {
    try {
      const payload: CourseDevelopment = {
        ...newCourse,
        itemType: "courseDevelopment" as any,
        tasks: Array.isArray(newCourse.tasks) ? newCourse.tasks : [],
      };

      const res = await fetch("/api/course-developments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Course Development could not be saved.");
      }

      await loadDashboardData();
      setActiveTab("category1");
    } catch (err) {
      console.error("Create Course Development failed:", err);
      alert("Course Development could not be saved.");
    }
  };

  const handleUpdateCourse = async (updatedCourse: CourseDevelopment) => {
    if (!updatedCourse.id) {
      alert("Course Development is missing an ID and cannot be updated.");
      return;
    }

    try {
      const payload: CourseDevelopment = {
        ...updatedCourse,
        itemType: "courseDevelopment" as any,
        tasks: Array.isArray(updatedCourse.tasks) ? updatedCourse.tasks : [],
      };

      const res = await fetch(`/api/course-developments/${updatedCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Course Development could not be updated.");
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Update Course Development failed:", err);
      alert("Course Development could not be updated.");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!id) return;

    try {
      const res = await fetch(`/api/course-developments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Course Development could not be deleted.");
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Delete Course Development failed:", err);
      alert("Course Development could not be deleted.");
    }
  };

  const handleAddProject = async (newProject: LssProject) => {
    try {
      const payload: LssProject = {
        ...newProject,
        itemType: "project" as any,
        tasks: Array.isArray(newProject.tasks) ? newProject.tasks : [],
      };

      const res = await fetch("/api/lss-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Project could not be saved.");
      }

      await loadDashboardData();
      setActiveTab("category2");
    } catch (err) {
      console.error("Create Project failed:", err);
      alert("Project could not be saved.");
    }
  };

  const handleUpdateProject = async (updatedProject: LssProject) => {
    if (!updatedProject.id) {
      alert("Project is missing an ID and cannot be updated.");
      return;
    }

    try {
      const payload: LssProject = {
        ...updatedProject,
        itemType: "project" as any,
        tasks: Array.isArray(updatedProject.tasks) ? updatedProject.tasks : [],
      };

      const res = await fetch(`/api/lss-projects/${updatedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Project could not be updated.");
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Update Project failed:", err);
      alert("Project could not be updated.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!id) return;

    try {
      const res = await fetch(`/api/lss-projects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Project could not be deleted.");
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Delete Project failed:", err);
      alert("Project could not be deleted.");
    }
  };

  const handleAddTask = async (newTask: StandaloneTask) => {
    try {
      if (!newTask.title?.trim()) {
        alert("Task Title is required.");
        return;
      }

      const payload: StandaloneTask = {
        ...newTask,
        itemType: "standaloneTask" as any,
        status: newTask.status || "Not Started",
        priority: newTask.priority || "Moderate",
        progress: Number(newTask.progress || 0),
      };

      const res = await fetch("/api/standalone-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Standalone Task could not be saved.");
      }

      await loadDashboardData();
      setActiveTab("category3");
    } catch (err) {
      console.error("Create Standalone Task failed:", err);
      alert("Standalone Task could not be saved.");
    }
  };

  const handleUpdateTask = async (updatedTask: StandaloneTask) => {
    if (!updatedTask.id) {
      alert("Task is missing an ID and cannot be updated.");
      return;
    }

    try {
      const payload: StandaloneTask = {
        ...updatedTask,
        itemType: "standaloneTask" as any,
        progress: Number(updatedTask.progress || 0),
      };

      const res = await fetch(`/api/standalone-tasks/${updatedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Standalone Task could not be updated.");
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Update Standalone Task failed:", err);
      alert("Standalone Task could not be updated.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!id) return;

    try {
      const res = await fetch(`/api/standalone-tasks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Standalone Task could not be deleted.");
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Delete Standalone Task failed:", err);
      alert("Standalone Task could not be deleted.");
    }
  };

  const handleUpdateBlockedDates = async (dates: string[]) => {
    try {
      const payload: CalendarSettings = {
        ...calendarSettings,
        customBlocked: Array.isArray(dates) ? dates : [],
        timezone: "America/New_York" as any,
      };

      const res = await fetch("/api/calendar-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Calendar Settings could not be saved.");
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Update Calendar Settings failed:", err);
      alert("Calendar Settings could not be saved.");
    }
  };

  const handleConnectOutlook = (clientId: string, tenantId: string) => {
    const popupWidth = 600;
    const popupHeight = 650;
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;

    const popupUrl = `/api/outlook/auth-url?clientId=${encodeURIComponent(
      clientId
    )}&tenantId=${encodeURIComponent(tenantId)}`;

    window.open(
      popupUrl,
      "Authorize Outlook Calendar",
      `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`
    );
  };

  const handleDisconnectOutlook = async () => {
    try {
      const res = await fetch("/api/outlook/disconnect", {
        method: "POST",
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error("Disconnect Outlook failed:", err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            courseDevelopments={courseDevelopments}
            lssProjects={lssProjects}
            standaloneTasks={standaloneTasks}
            onOpenCourseDevelopments={() => setActiveTab("category1")}
            onOpenProjects={() => setActiveTab("category2")}
            onOpenTasks={() => setActiveTab("category3")}
          />
        );

      case "category1":
        return (
          <Category1CourseDev
            courseDevelopments={courseDevelopments}
            customBlocked={calendarSettings.customBlocked || []}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        );

      case "category2":
        return (
          <Category2LssProjects
            lssProjects={lssProjects}
            customBlocked={calendarSettings.customBlocked || []}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        );

      case "category3":
        return (
          <Category3Tasks
            standaloneTasks={standaloneTasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        );

      case "calendar":
        return (
          <CalendarSettingsPanel
            settings={calendarSettings}
            outlookEvents={outlookEvents}
            onUpdateBlockedDates={handleUpdateBlockedDates}
            onConnectOutlook={handleConnectOutlook}
            onDisconnectOutlook={handleDisconnectOutlook}
            onTriggerSync={loadDashboardData}
          />
        );

      default:
        return (
          <Dashboard
            courseDevelopments={courseDevelopments}
            lssProjects={lssProjects}
            standaloneTasks={standaloneTasks}
            onOpenCourseDevelopments={() => setActiveTab("category1")}
            onOpenProjects={() => setActiveTab("category2")}
            onOpenTasks={() => setActiveTab("category3")}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-800">
          <RefreshCw className="h-10 w-10 animate-spin text-indigo-600" />
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider">
            Synchronizing Workload Hub Data...
          </h2>
          <p className="text-xs text-slate-500">
            Loading your course, project, and task records.
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="rounded-full bg-rose-50 p-3">
            <AlertCircle className="h-10 w-10 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Workload Hub Could Not Load
          </h2>
          <p className="px-2 text-sm text-slate-600">{errorMsg}</p>
          <button
            type="button"
            onClick={loadDashboardData}
            className="mt-2 w-full rounded-lg bg-[#003E52] px-4 py-2 text-sm font-medium tracking-wide text-white hover:bg-[#073C5C]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header
        outlookConnected={!!calendarSettings.outlookConnected}
        alertCount={alertCount}
      />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alertCount}
      />

      <main className="flex-1 pb-16 print:pb-0">{renderTabContent()}</main>

      <footer className="border-t border-slate-100 bg-white px-6 py-10 text-center text-xs text-slate-500 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-800">
            Florida State College at Jacksonville &bull; Workload Hub
          </p>
          <p className="text-xs text-slate-500">
            Developed for course development, project tracking, and workload planning.
          </p>
          <p className="mx-auto mt-2 max-w-max rounded-lg border border-slate-100/60 bg-slate-50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            WCAG 2.1 AA / Section 508 Support-Oriented Interface
          </p>
        </div>
      </footer>
    </div>
  );
}
