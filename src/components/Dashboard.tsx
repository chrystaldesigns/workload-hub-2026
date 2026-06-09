import React from "react";
import { CalendarDays, ListChecks } from "lucide-react";
import { CourseDevelopment, LssProject, StandaloneTask } from "../types";

interface DashboardProps {
  courseDevelopments: CourseDevelopment[];
  lssProjects: LssProject[];
  standaloneTasks: StandaloneTask[];
  onOpenCourseDevelopments: () => void;
  onOpenProjects: () => void;
  onOpenTasks: () => void;
}

type FocusItem = {
  id: string;
  title: string;
  context: string;
  date?: string;
  type: "Course Development" | "Project" | "Task";
  onOpen: () => void;
};

export function Dashboard({
  courseDevelopments,
  lssProjects,
  standaloneTasks,
  onOpenCourseDevelopments,
  onOpenProjects,
  onOpenTasks,
}: DashboardProps) {
  const safeCourses = Array.isArray(courseDevelopments)
    ? courseDevelopments.filter((course) => !(course as any).archived)
    : [];
  const safeProjects = Array.isArray(lssProjects)
    ? lssProjects.filter((project) => !(project as any).archived)
    : [];
  const safeTasks = Array.isArray(standaloneTasks)
    ? standaloneTasks.filter((task) => !(task as any).archived)
    : [];

  const today = new Date().toISOString().split("T")[0];

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}-${day}-${year}`;
  };

  const isActiveStatus = (status?: string) => {
    const normalized = (status || "").toLowerCase();
    return normalized !== "complete" && normalized !== "completed" && normalized !== "not applicable";
  };

  const getAlertBadgeClass = (alertStatus?: string) => {
    switch (alertStatus) {
      case "High Priority Concerns":
        return "bg-red-700 text-white";
      case "Potential Concerns":
        return "bg-orange-700 text-white";
      default:
        return "bg-slate-600 text-white";
    }
  };

  const getCourseStartOfTerm = (course: CourseDevelopment) => {
    const closeoutTask =
      course.tasks?.find((task) => task.name?.toLowerCase().includes("project completion")) ||
      course.tasks?.find((task) => task.phase?.toLowerCase().includes("project closeout"));

    return (
      course.completionDate ||
      closeoutTask?.completionDate ||
      closeoutTask?.dueDate ||
      course.termDeadline ||
      ""
    );
  };

  const todayFocusItems: FocusItem[] = [
    ...safeCourses.flatMap((course) =>
      (course.tasks || [])
        .filter((task) => task.startDate && task.startDate <= today && isActiveStatus(task.status))
        .map((task) => ({
          id: `course-${course.id || course.courseNumber}-${task.id}`,
          title: task.name || "Untitled course task",
          context: `${course.courseNumber}: ${course.courseTitle}`,
          date: task.startDate,
          type: "Course Development" as const,
          onOpen: onOpenCourseDevelopments,
        }))
    ),
    ...safeProjects
      .filter((project) => project.startDate && project.startDate <= today && isActiveStatus(project.status))
      .map((project) => ({
        id: `project-${project.id || project.title}`,
        title: project.title,
        context: `Project • ${project.status}`,
        date: project.startDate,
        type: "Project" as const,
        onOpen: onOpenProjects,
      })),
    ...safeTasks
      .filter((task) => task.startDate && task.startDate <= today && isActiveStatus(task.status))
      .map((task) => ({
        id: `task-${task.id || task.title}`,
        title: task.title,
        context: `Task • ${task.status}`,
        date: task.startDate,
        type: "Task" as const,
        onOpen: onOpenTasks,
      })),
  ].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const dueTodayItems: FocusItem[] = [
    ...safeCourses.flatMap((course) =>
      (course.tasks || [])
        .filter((task) => task.dueDate === today && isActiveStatus(task.status))
        .map((task) => ({
          id: `due-course-${course.id || course.courseNumber}-${task.id}`,
          title: task.name || "Untitled course task",
          context: `${course.courseNumber}: ${course.courseTitle}`,
          date: task.dueDate,
          type: "Course Development" as const,
          onOpen: onOpenCourseDevelopments,
        }))
    ),
    ...safeProjects
      .filter((project) => project.targetCompletionDate === today && isActiveStatus(project.status))
      .map((project) => ({
        id: `due-project-${project.id || project.title}`,
        title: project.title,
        context: `Project • ${project.status}`,
        date: project.targetCompletionDate,
        type: "Project" as const,
        onOpen: onOpenProjects,
      })),
    ...safeTasks
      .filter((task) => task.dueDate === today && isActiveStatus(task.status))
      .map((task) => ({
        id: `due-task-${task.id || task.title}`,
        title: task.title,
        context: `Task • ${task.status}`,
        date: task.dueDate,
        type: "Task" as const,
        onOpen: onOpenTasks,
      })),
  ];

  const renderFocusList = (items: FocusItem[], emptyText: string) => {
    if (items.length === 0) {
      return <p className="text-sm text-slate-600">{emptyText}</p>;
    }

    return (
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onOpen}
            className="flex w-full flex-col gap-0.5 py-2 text-left hover:bg-slate-50"
          >
            <span className="text-sm font-semibold text-slate-900">{item.title}</span>
            <span className="text-xs text-slate-500">
              {item.context} {item.date ? `• ${formatShortDate(item.date)}` : ""}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              {safeCourses.length} Course Developments • {safeProjects.length} Projects • {safeTasks.length} Tasks
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Today: {formatShortDate(today)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Today's Focus</h3>
          </div>
          {renderFocusList(
            todayFocusItems,
            "No active items have a start date of today or earlier."
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Due Today</h3>
          </div>
          {renderFocusList(dueTodayItems, "No active items are due today.")}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Active Workload</h3>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Compact list view
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Course Developments
              </h4>
              <button
                type="button"
                onClick={onOpenCourseDevelopments}
                className="text-xs font-semibold text-[#003E52] hover:underline"
              >
                Open
              </button>
            </div>

            {safeCourses.length === 0 ? (
              <p className="text-sm text-slate-600">No active course developments.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {safeCourses.map((course) => (
                  <button
                    key={course.id || course.courseNumber}
                    type="button"
                    onClick={onOpenCourseDevelopments}
                    className="flex w-full flex-col gap-1 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">
                      {course.courseNumber}: {course.courseTitle}
                    </span>
                    <span className="text-xs text-slate-600">
                      Deadline: {formatShortDate(course.calculatedDeadline || course.termDeadline)} | Start of Term: {formatShortDate(getCourseStartOfTerm(course))} | Term: {course.termRelease || "Not set"} | Alerts:{" "}
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getAlertBadgeClass(course.alertStatus)}`}>
                        {course.alertStatus || "No Concerns"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Projects
              </h4>
              <button
                type="button"
                onClick={onOpenProjects}
                className="text-xs font-semibold text-[#003E52] hover:underline"
              >
                Open
              </button>
            </div>

            {safeProjects.length === 0 ? (
              <p className="text-sm text-slate-600">No active projects.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {safeProjects.map((project) => (
                  <button
                    key={project.id || project.title}
                    type="button"
                    onClick={onOpenProjects}
                    className="flex w-full flex-col gap-1 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">{project.title}</span>
                    <span className="text-xs text-slate-600">
                      Status: {project.status || "Not set"} | Target: {formatShortDate(project.targetCompletionDate)} | Alerts:{" "}
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getAlertBadgeClass(project.alertStatus)}`}>
                        {project.alertStatus || "No Concerns"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Tasks
              </h4>
              <button
                type="button"
                onClick={onOpenTasks}
                className="text-xs font-semibold text-[#003E52] hover:underline"
              >
                Open
              </button>
            </div>

            {safeTasks.length === 0 ? (
              <p className="text-sm text-slate-600">No active standalone tasks.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {safeTasks.map((task) => (
                  <button
                    key={task.id || task.title}
                    type="button"
                    onClick={onOpenTasks}
                    className="flex w-full flex-col gap-1 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">{task.title}</span>
                    <span className="text-xs text-slate-600">
                      Status: {task.status || "Not set"} | Target: {formatShortDate(task.dueDate)} | Alerts:{" "}
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getAlertBadgeClass(task.alertStatus)}`}>
                        {task.alertStatus || "No Concerns"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
