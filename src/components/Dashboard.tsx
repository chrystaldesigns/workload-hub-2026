import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  FolderGit,
  RefreshCw,
} from "lucide-react";
import { CourseDevelopment, LssProject, StandaloneTask } from "../types";

interface DashboardProps {
  courseDevelopments: CourseDevelopment[];
  lssProjects: LssProject[];
  standaloneTasks: StandaloneTask[];
  onOpenCourseDevelopments: () => void;
  onOpenProjects: () => void;
  onOpenTasks: () => void;
}

type UnifiedItem = {
  id: string;
  title: string;
  category: "Course Development" | "Project" | "Task";
  date: string;
  status?: string;
  alertStatus?: string;
  priority?: string;
  onOpen: () => void;
};

function todayLocal() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addCalendarDays(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "Not set";

  const date = new Date(`${dateStr}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isIncomplete(status?: string) {
  return status !== "Complete" && status !== "Completed";
}

function getAlertBadgeClass(alertStatus?: string) {
  switch (alertStatus) {
    case "High Priority Concerns":
      return "bg-red-700 text-white";
    case "Potential Concerns":
      return "bg-orange-700 text-white";
    default:
      return "bg-slate-600 text-white";
  }
}

function getPriorityBadgeClass(priority?: string) {
  switch (priority) {
    case "Critical":
      return "bg-red-700 text-white";
    case "High":
      return "bg-orange-700 text-white";
    case "Moderate":
      return "bg-[#003E52] text-white";
    default:
      return "bg-slate-600 text-white";
  }
}

function getCourseCompletionDate(course: CourseDevelopment) {
  const closeoutTask =
    course.tasks?.find((task) =>
      task.name?.toLowerCase().includes("project completion")
    ) ||
    course.tasks?.find((task) =>
      task.phase?.toLowerCase().includes("project closeout")
    ) ||
    course.tasks?.find((task) =>
      task.name?.toLowerCase().includes("course completion")
    );

  return (
    course.completionDate ||
    closeoutTask?.completionDate ||
    closeoutTask?.dueDate ||
    course.termDeadline ||
    ""
  );
}

function getCourseProgress(course: CourseDevelopment) {
  const tasks = Array.isArray(course.tasks) ? course.tasks : [];
  const applicable = tasks.filter((task) => task.status !== "Not Applicable");

  if (!applicable.length) return 0;

  const complete = applicable.filter((task) => task.status === "Complete").length;
  return Math.round((complete / applicable.length) * 100);
}

function getProjectProgress(project: LssProject) {
  const tasks = Array.isArray(project.tasks) ? project.tasks : [];

  if (!tasks.length) {
    return project.status === "Complete" ? 100 : project.status === "In Progress" ? 50 : 0;
  }

  const complete = tasks.filter((task) => task.status === "Completed").length;
  return Math.round((complete / tasks.length) * 100);
}

function getUpdatedDate(item: any) {
  return item.updatedAt || item.createdAt || "";
}

export function Dashboard({
  courseDevelopments,
  lssProjects,
  standaloneTasks,
  onOpenCourseDevelopments,
  onOpenProjects,
  onOpenTasks,
}: DashboardProps) {
  const safeCourses = Array.isArray(courseDevelopments) ? courseDevelopments : [];
  const safeProjects = Array.isArray(lssProjects) ? lssProjects : [];
  const safeTasks = Array.isArray(standaloneTasks) ? standaloneTasks : [];

  const today = todayLocal();
  const weekEnd = addCalendarDays(today, 7);
  const thirtyDayEnd = addCalendarDays(today, 30);

  const activeCourses = safeCourses.filter((course) =>
    course.tasks?.some((task) => task.status !== "Complete" && task.status !== "Not Applicable")
  );

  const activeProjects = safeProjects.filter((project) => project.status !== "Complete");
  const activeTasks = safeTasks.filter((task) => isIncomplete(task.status));

  const courseItems: UnifiedItem[] = safeCourses
    .map((course) => ({
      id: String(course.id || course.courseNumber),
      title: `${course.courseNumber}: ${course.courseTitle}`,
      category: "Course Development" as const,
      date: course.termDeadline || course.calculatedDeadline || getCourseCompletionDate(course),
      status: `${getCourseProgress(course)}% complete`,
      alertStatus: course.alertStatus,
      onOpen: onOpenCourseDevelopments,
    }))
    .filter((item) => !!item.date);

  const projectItems: UnifiedItem[] = safeProjects
    .map((project) => ({
      id: String(project.id || project.title),
      title: project.title,
      category: "Project" as const,
      date: project.targetCompletionDate || project.startDate || "",
      status: project.status,
      alertStatus: project.alertStatus,
      priority: project.priority,
      onOpen: onOpenProjects,
    }))
    .filter((item) => !!item.date);

  const taskItems: UnifiedItem[] = safeTasks
    .map((task) => ({
      id: String(task.id || task.title),
      title: task.title,
      category: "Task" as const,
      date: task.dueDate || task.startDate || "",
      status: task.status,
      alertStatus: task.alertStatus,
      priority: task.priority,
      onOpen: onOpenTasks,
    }))
    .filter((item) => !!item.date);

  const unifiedItems = [...courseItems, ...projectItems, ...taskItems].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const overdueItems = unifiedItems.filter(
    (item) =>
      item.date < today &&
      item.status !== "Complete" &&
      item.status !== "Completed" &&
      item.status !== "100% complete"
  );

  const dueTodayItems = unifiedItems.filter(
    (item) =>
      item.date === today &&
      item.status !== "Complete" &&
      item.status !== "Completed" &&
      item.status !== "100% complete"
  );

  const dueThisWeekItems = unifiedItems.filter(
    (item) =>
      item.date >= today &&
      item.date <= weekEnd &&
      item.status !== "Complete" &&
      item.status !== "Completed" &&
      item.status !== "100% complete"
  );

  const upcomingThirtyDays = unifiedItems.filter(
    (item) =>
      item.date >= today &&
      item.date <= thirtyDayEnd &&
      item.status !== "Complete" &&
      item.status !== "Completed" &&
      item.status !== "100% complete"
  );

  const highConcernItems = unifiedItems.filter(
    (item) => item.alertStatus === "High Priority Concerns"
  );

  const recentlyUpdated = [
    ...safeCourses.map((course) => ({
      id: String(course.id || course.courseNumber),
      title: `${course.courseNumber}: ${course.courseTitle}`,
      category: "Course Development" as const,
      date: getUpdatedDate(course),
      onOpen: onOpenCourseDevelopments,
    })),
    ...safeProjects.map((project) => ({
      id: String(project.id || project.title),
      title: project.title,
      category: "Project" as const,
      date: getUpdatedDate(project),
      onOpen: onOpenProjects,
    })),
    ...safeTasks.map((task) => ({
      id: String(task.id || task.title),
      title: task.title,
      category: "Task" as const,
      date: getUpdatedDate(task),
      onOpen: onOpenTasks,
    })),
  ]
    .filter((item) => !!item.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const renderUnifiedItem = (item: UnifiedItem) => (
    <button
      key={`${item.category}-${item.id}-${item.date}`}
      type="button"
      onClick={item.onOpen}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {item.category}
          </p>
          <h4 className="mt-1 font-medium text-slate-900">{item.title}</h4>
          <p className="mt-1 text-sm text-slate-600">
            {formatDisplayDate(item.date)} · {item.status || "Status not set"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.priority && (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityBadgeClass(item.priority)}`}>
              {item.priority}
            </span>
          )}
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass(item.alertStatus)}`}>
            {item.alertStatus || "No Concerns"}
          </span>
        </div>
      </div>
    </button>
  );

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              Unified workload summary for Course Developments, Projects, and Tasks.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Today: {formatDisplayDate(today)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <BookOpen className="mb-3 h-5 w-5 text-[#003E52]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Courses
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{activeCourses.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FolderGit className="mb-3 h-5 w-5 text-[#003E52]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Projects
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{activeProjects.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CheckSquare className="mb-3 h-5 w-5 text-[#003E52]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tasks
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{activeTasks.length}</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <AlertTriangle className="mb-3 h-5 w-5 text-red-700" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
            Overdue
          </p>
          <p className="mt-1 text-3xl font-semibold text-red-900">{overdueItems.length}</p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <CalendarDays className="mb-3 h-5 w-5 text-orange-700" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">
            Due This Week
          </p>
          <p className="mt-1 text-3xl font-semibold text-orange-900">{dueThisWeekItems.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <AlertTriangle className="mb-3 h-5 w-5 text-[#003E52]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            High Concerns
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{highConcernItems.length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Due Today</h3>
          </div>

          {dueTodayItems.length === 0 ? (
            <p className="text-sm text-slate-600">Nothing is due today.</p>
          ) : (
            <div className="space-y-3">{dueTodayItems.map(renderUnifiedItem)}</div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Needs Attention</h3>
          </div>

          {overdueItems.length === 0 && highConcernItems.length === 0 ? (
            <p className="text-sm text-slate-600">No overdue items or high-priority concerns.</p>
          ) : (
            <div className="space-y-3">
              {[...overdueItems, ...highConcernItems]
                .filter(
                  (item, index, array) =>
                    array.findIndex(
                      (candidate) =>
                        candidate.id === item.id && candidate.category === item.category
                    ) === index
                )
                .slice(0, 10)
                .map(renderUnifiedItem)}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-slate-900">Upcoming 30 Days</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {upcomingThirtyDays.length} item(s)
            </span>
          </div>

          {upcomingThirtyDays.length === 0 ? (
            <p className="text-sm text-slate-600">No upcoming workload items in the next 30 days.</p>
          ) : (
            <div className="space-y-3">
              {upcomingThirtyDays.slice(0, 15).map(renderUnifiedItem)}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Recently Updated</h3>
          </div>

          {recentlyUpdated.length === 0 ? (
            <p className="text-sm text-slate-600">No recent updates are available yet.</p>
          ) : (
            <div className="space-y-3">
              {recentlyUpdated.map((item) => (
                <button
                  key={`${item.category}-${item.id}`}
                  type="button"
                  onClick={item.onOpen}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.category}
                  </p>
                  <h4 className="mt-1 font-medium text-slate-900">{item.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Updated: {formatDisplayDate(item.date.slice(0, 10))}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Course Developments</h3>
            <button
              type="button"
              onClick={onOpenCourseDevelopments}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#003E52] hover:underline"
            >
              Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {safeCourses.length === 0 ? (
            <p className="text-sm text-slate-600">No course developments have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeCourses.slice(0, 8).map((course) => {
                const progress = getCourseProgress(course);

                return (
                  <button
                    key={course.id || course.courseNumber}
                    type="button"
                    onClick={onOpenCourseDevelopments}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
                  >
                    <h4 className="font-medium text-slate-900">
                      {course.courseNumber}: {course.courseTitle}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Deadline: {formatDisplayDate(course.calculatedDeadline || course.termDeadline)}
                    </p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#33B1C8]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
            <button
              type="button"
              onClick={onOpenProjects}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#003E52] hover:underline"
            >
              Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {safeProjects.length === 0 ? (
            <p className="text-sm text-slate-600">No projects have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeProjects.slice(0, 8).map((project) => {
                const progress = getProjectProgress(project);

                return (
                  <button
                    key={project.id || project.title}
                    type="button"
                    onClick={onOpenProjects}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
                  >
                    <h4 className="font-medium text-slate-900">{project.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Target: {formatDisplayDate(project.targetCompletionDate)} · {project.status}
                    </p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#33B1C8]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Tasks</h3>
            <button
              type="button"
              onClick={onOpenTasks}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#003E52] hover:underline"
            >
              Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {safeTasks.length === 0 ? (
            <p className="text-sm text-slate-600">No standalone tasks have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeTasks.slice(0, 8).map((task) => (
                <button
                  key={task.id || task.title}
                  type="button"
                  onClick={onOpenTasks}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
                >
                  <h4 className="font-medium text-slate-900">{task.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Due: {formatDisplayDate(task.dueDate)} · {task.status}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority || "Priority not set"}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass(task.alertStatus)}`}>
                      {task.alertStatus || "No Concerns"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
