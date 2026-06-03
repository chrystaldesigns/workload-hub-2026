import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  FolderGit,
  TrendingUp,
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
  startDate?: string;
  dueDate?: string;
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

  const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isComplete(status?: string) {
  return status === "Complete" || status === "Completed" || status === "100% complete";
}

function isActiveStatus(status?: string) {
  return (
    status === "In Progress" ||
    status === "Developing (Content)" ||
    status === "Developing (Canvas)" ||
    status === "Scheduled"
  );
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

function getCapacityLabel(total: number) {
  if (total >= 30) return { label: "Very heavy workload", className: "text-red-700" };
  if (total >= 15) return { label: "Heavy workload", className: "text-orange-700" };
  if (total >= 6) return { label: "Moderate workload", className: "text-[#003E52]" };
  return { label: "Light workload", className: "text-green-700" };
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
    (course as any).completionDate ||
    (closeoutTask as any)?.completionDate ||
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

  const openCourseItem = (courseId: string) => {
    localStorage.setItem("workloadHubSelectedCourseId", courseId);
    onOpenCourseDevelopments();
  };

  const openProjectItem = (projectId: string) => {
    localStorage.setItem("workloadHubSelectedProjectId", projectId);
    onOpenProjects();
  };

  const openTaskItem = (taskId: string) => {
    localStorage.setItem("workloadHubSelectedTaskId", taskId);
    onOpenTasks();
  };

  const activeCourses = safeCourses.filter((course) =>
    course.tasks?.some((task) => task.status !== "Complete" && task.status !== "Not Applicable")
  );

  const activeProjects = safeProjects.filter((project) => project.status !== "Complete");
  const activeTasks = safeTasks.filter((task) => !isComplete(task.status));

  const courseItems: UnifiedItem[] = safeCourses
    .map((course) => {
      const courseId = String(course.id || course.courseNumber);
      const courseDate =
        course.termDeadline ||
        (course as any).calculatedDeadline ||
        getCourseCompletionDate(course);

      return {
        id: courseId,
        title: `${course.courseNumber}: ${course.courseTitle}`,
        category: "Course Development" as const,
        startDate: (course as any).startDate || "",
        dueDate: courseDate,
        date: courseDate,
        status: `${getCourseProgress(course)}% complete`,
        alertStatus: course.alertStatus,
        onOpen: () => openCourseItem(courseId),
      };
    })
    .filter((item) => !!item.date);

  const projectItems: UnifiedItem[] = safeProjects
    .map((project) => {
      const projectId = String(project.id || project.title);

      return {
        id: projectId,
        title: project.title,
        category: "Project" as const,
        startDate: project.startDate || "",
        dueDate: project.targetCompletionDate || "",
        date: project.targetCompletionDate || project.startDate || "",
        status: project.status,
        alertStatus: (project as any).alertStatus,
        priority: project.priority,
        onOpen: () => openProjectItem(projectId),
      };
    })
    .filter((item) => !!item.date);

  const taskItems: UnifiedItem[] = safeTasks
    .map((task) => {
      const taskId = String(task.id || task.title);

      return {
        id: taskId,
        title: task.title,
        category: "Task" as const,
        startDate: task.startDate || "",
        dueDate: task.dueDate || "",
        date: task.dueDate || task.startDate || "",
        status: task.status,
        alertStatus: (task as any).alertStatus,
        priority: task.priority,
        onOpen: () => openTaskItem(taskId),
      };
    })
    .filter((item) => !!item.date);

  const unifiedItems = [...courseItems, ...projectItems, ...taskItems].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const overdueItems = unifiedItems.filter(
    (item) => item.date < today && !isComplete(item.status)
  );

  const dueThisWeekItems = unifiedItems.filter(
    (item) => item.date >= today && item.date <= weekEnd && !isComplete(item.status)
  );

  const upcomingThirtyDays = unifiedItems.filter(
    (item) => item.date >= today && item.date <= thirtyDayEnd && !isComplete(item.status)
  );

  const highConcernItems = unifiedItems.filter(
    (item) => item.alertStatus === "High Priority Concerns"
  );

  const todaysFocusItems = unifiedItems
    .filter((item) => {
      const startsToday = item.startDate === today;
      const dueToday = item.dueDate === today || item.date === today;
      const active = isActiveStatus(item.status);
      return !isComplete(item.status) && (startsToday || dueToday || active);
    })
    .sort((a, b) => {
      const aOverdueActive = a.date < today && isActiveStatus(a.status) ? 0 : 1;
      const bOverdueActive = b.date < today && isActiveStatus(b.status) ? 0 : 1;
      if (aOverdueActive !== bOverdueActive) return aOverdueActive - bOverdueActive;

      const aDueToday = a.dueDate === today || a.date === today ? 0 : 1;
      const bDueToday = b.dueDate === today || b.date === today ? 0 : 1;
      if (aDueToday !== bDueToday) return aDueToday - bDueToday;

      const aStartsToday = a.startDate === today ? 0 : 1;
      const bStartsToday = b.startDate === today ? 0 : 1;
      if (aStartsToday !== bStartsToday) return aStartsToday - bStartsToday;

      return a.date.localeCompare(b.date);
    });

  const next7CourseCount = courseItems.filter(
    (item) => item.date >= today && item.date <= weekEnd && !isComplete(item.status)
  ).length;

  const next7ProjectCount = projectItems.filter(
    (item) => item.date >= today && item.date <= weekEnd && !isComplete(item.status)
  ).length;

  const next7TaskCount = taskItems.filter(
    (item) => item.date >= today && item.date <= weekEnd && !isComplete(item.status)
  ).length;

  const next30CourseCount = courseItems.filter(
    (item) => item.date >= today && item.date <= thirtyDayEnd && !isComplete(item.status)
  ).length;

  const next30ProjectCount = projectItems.filter(
    (item) => item.date >= today && item.date <= thirtyDayEnd && !isComplete(item.status)
  ).length;

  const next30TaskCount = taskItems.filter(
    (item) => item.date >= today && item.date <= thirtyDayEnd && !isComplete(item.status)
  ).length;

  const next7Total = next7CourseCount + next7ProjectCount + next7TaskCount;
  const next30Total = next30CourseCount + next30ProjectCount + next30TaskCount;

  const next7Capacity = getCapacityLabel(next7Total);
  const next30Capacity = getCapacityLabel(next30Total);

  const summaryItems = [
    {
      label: "Courses",
      count: activeCourses.length,
      icon: BookOpen,
      className: "text-[#003E52]",
    },
    {
      label: "Projects",
      count: activeProjects.length,
      icon: FolderGit,
      className: "text-[#003E52]",
    },
    {
      label: "Tasks",
      count: activeTasks.length,
      icon: CheckSquare,
      className: "text-[#003E52]",
    },
    {
      label: "Overdue",
      count: overdueItems.length,
      icon: AlertTriangle,
      className: "text-red-700",
    },
    {
      label: "Due This Week",
      count: dueThisWeekItems.length,
      icon: CalendarDays,
      className: "text-orange-700",
    },
    {
      label: "High Concerns",
      count: highConcernItems.length,
      icon: AlertTriangle,
      className: "text-red-700",
    },
  ];

  const renderUnifiedItem = (item: UnifiedItem) => (
    <button
      key={`${item.category}-${item.id}-${item.date}`}
      type="button"
      onClick={item.onOpen}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
    >
      <div className="flex flex-col gap-2">
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

  const renderForecastCard = (
    title: string,
    total: number,
    courseCount: number,
    projectCount: number,
    taskCount: number,
    capacity: { label: string; className: string }
  ) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total Upcoming Work
        </p>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{total}</p>
        <p className={`mt-1 text-sm font-semibold ${capacity.className}`}>
          {capacity.label}
        </p>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">Course Developments</span>
          </div>
          <span className="text-lg font-semibold text-slate-900">{courseCount}</span>
        </div>

        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <FolderGit className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">Projects</span>
          </div>
          <span className="text-lg font-semibold text-slate-900">{projectCount}</span>
        </div>

        <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">Tasks</span>
          </div>
          <span className="text-lg font-semibold text-slate-900">{taskCount}</span>
        </div>
      </div>
    </div>
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

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Workload Summary</h3>

          <div className="divide-y divide-slate-100">
            {summaryItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${item.className}`} aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-slate-900">Today&apos;s Focus</h3>
            </div>

            {todaysFocusItems.length === 0 ? (
              <p className="text-sm text-slate-600">No active focus items for today.</p>
            ) : (
              <div className="space-y-3">{todaysFocusItems.slice(0, 8).map(renderUnifiedItem)}</div>
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
                  .slice(0, 8)
                  .map(renderUnifiedItem)}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-900">Upcoming 30 Days</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {upcomingThirtyDays.length}
              </span>
            </div>

            {upcomingThirtyDays.length === 0 ? (
              <p className="text-sm text-slate-600">No upcoming workload items in the next 30 days.</p>
            ) : (
              <div className="space-y-3">{upcomingThirtyDays.slice(0, 8).map(renderUnifiedItem)}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {renderForecastCard(
          "Capacity Forecast: Next 7 Days",
          next7Total,
          next7CourseCount,
          next7ProjectCount,
          next7TaskCount,
          next7Capacity
        )}

        {renderForecastCard(
          "Capacity Forecast: Next 30 Days",
          next30Total,
          next30CourseCount,
          next30ProjectCount,
          next30TaskCount,
          next30Capacity
        )}
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
              {safeCourses.slice(0, 6).map((course) => {
                const progress = getCourseProgress(course);
                const courseId = String(course.id || course.courseNumber);

                return (
                  <button
                    key={courseId}
                    type="button"
                    onClick={() => openCourseItem(courseId)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
                  >
                    <h4 className="font-medium text-slate-900">
                      {course.courseNumber}: {course.courseTitle}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Deadline: {formatDisplayDate((course as any).calculatedDeadline || course.termDeadline)}
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
              {safeProjects.slice(0, 6).map((project) => {
                const progress = getProjectProgress(project);
                const projectId = String(project.id || project.title);

                return (
                  <button
                    key={projectId}
                    type="button"
                    onClick={() => openProjectItem(projectId)}
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
              {safeTasks.slice(0, 6).map((task) => {
                const taskId = String(task.id || task.title);

                return (
                  <button
                    key={taskId}
                    type="button"
                    onClick={() => openTaskItem(taskId)}
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
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass((task as any).alertStatus)}`}>
                        {(task as any).alertStatus || "No Concerns"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
