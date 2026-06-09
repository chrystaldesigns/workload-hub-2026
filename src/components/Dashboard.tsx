import React from "react";
import {
  BookOpen,
  FolderGit,
  CheckSquare,
  AlertTriangle,
  CalendarDays,
  ArrowRight,
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

export function Dashboard({
  courseDevelopments,
  lssProjects,
  standaloneTasks,
  onOpenCourseDevelopments,
  onOpenProjects,
  onOpenTasks,
}: DashboardProps) {
  const safeCourses = Array.isArray(courseDevelopments)
    ? courseDevelopments.filter((course) => !course.archived)
    : [];
  const safeProjects = Array.isArray(lssProjects)
    ? lssProjects.filter((project) => !project.archived)
    : [];
  const safeTasks = Array.isArray(standaloneTasks)
    ? standaloneTasks.filter((task) => !task.archived)
    : [];

  const today = new Date().toISOString().split("T")[0];

  const activeCourses = safeCourses.filter((course) => {
    return course.tasks?.some((task) => task.status !== "Complete");
  });

  const activeProjects = safeProjects.filter((project) => project.status !== "Complete");

  const activeTasks = safeTasks.filter((task) => task.status !== "Complete");

  const dueTodayTasks = safeTasks.filter((task) => {
    return task.dueDate === today && task.status !== "Complete";
  });

  const overdueTasks = safeTasks.filter((task) => {
    return !!task.dueDate && task.dueDate < today && task.status !== "Complete";
  });

  const highConcernCourses = safeCourses.filter(
    (course) => course.alertStatus === "High Priority Concerns"
  );

  const highConcernProjects = safeProjects.filter(
    (project) => project.alertStatus === "High Priority Concerns"
  );

  const highConcernTasks = safeTasks.filter(
    (task) => task.alertStatus === "High Priority Concerns"
  );

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

  const getCourseCompletionDate = (course: CourseDevelopment) => {
    const closeoutTask =
      course.tasks?.find((task) =>
        task.name?.toLowerCase().includes("project completion")
      ) ||
      course.tasks?.find((task) =>
        task.phase?.toLowerCase().includes("project closeout")
      );

    return (
      course.completionDate ||
      closeoutTask?.completionDate ||
      closeoutTask?.dueDate ||
      course.termDeadline ||
      "Not set"
    );
  };

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              View all Course Developments, Projects, and Tasks in one place.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Today: {today}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-[#003E52] p-3 text-white">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Course Developments</p>
              <p className="text-xs text-slate-500">Active course workload</p>
            </div>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{activeCourses.length}</p>
          <button
            type="button"
            onClick={onOpenCourseDevelopments}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#003E52] hover:underline"
          >
            View Course Developments
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-[#073C5C] p-3 text-white">
              <FolderGit className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Projects</p>
              <p className="text-xs text-slate-500">Manual project work</p>
            </div>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{activeProjects.length}</p>
          <button
            type="button"
            onClick={onOpenProjects}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#003E52] hover:underline"
          >
            View Projects
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-[#087898] p-3 text-white">
              <CheckSquare className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Tasks</p>
              <p className="text-xs text-slate-500">Standalone action items</p>
            </div>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{activeTasks.length}</p>
          <button
            type="button"
            onClick={onOpenTasks}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#003E52] hover:underline"
          >
            View Tasks
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Due Today</h3>
          </div>

          {dueTodayTasks.length === 0 ? (
            <p className="text-sm text-slate-600">No standalone tasks are due today.</p>
          ) : (
            <div className="space-y-3">
              {dueTodayTasks.map((task) => (
                <article
                  key={task.id || task.title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h4 className="font-medium text-slate-900">{task.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Status: {task.status} · Priority: {task.priority}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Needs Attention</h3>
          </div>

          {overdueTasks.length === 0 &&
          highConcernCourses.length === 0 &&
          highConcernProjects.length === 0 &&
          highConcernTasks.length === 0 ? (
            <p className="text-sm text-slate-600">No high-priority concerns are currently flagged.</p>
          ) : (
            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <article
                  key={task.id || task.title}
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <h4 className="font-medium text-red-900">{task.title}</h4>
                  <p className="mt-1 text-sm text-red-800">Overdue since {task.dueDate}</p>
                </article>
              ))}

              {highConcernCourses.map((course) => (
                <article
                  key={course.id || course.courseNumber}
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <h4 className="font-medium text-red-900">
                    {course.courseNumber}: {course.courseTitle}
                  </h4>
                  <p className="mt-1 text-sm text-red-800">High Priority Concern</p>
                </article>
              ))}

              {highConcernProjects.map((project) => (
                <article
                  key={project.id || project.title}
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <h4 className="font-medium text-red-900">{project.title}</h4>
                  <p className="mt-1 text-sm text-red-800">High Priority Concern</p>
                </article>
              ))}

              {highConcernTasks.map((task) => (
                <article
                  key={task.id || task.title}
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <h4 className="font-medium text-red-900">{task.title}</h4>
                  <p className="mt-1 text-sm text-red-800">High Priority Concern</p>
                </article>
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
              className="text-sm font-medium text-[#003E52] hover:underline"
            >
              Open
            </button>
          </div>

          {safeCourses.length === 0 ? (
            <p className="text-sm text-slate-600">No course developments have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeCourses.map((course) => (
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
                    Deadline: {course.calculatedDeadline || course.termDeadline || "Not set"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Completion: {getCourseCompletionDate(course)}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass(
                      course.alertStatus
                    )}`}
                  >
                    {course.alertStatus || "No Concerns"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
            <button
              type="button"
              onClick={onOpenProjects}
              className="text-sm font-medium text-[#003E52] hover:underline"
            >
              Open
            </button>
          </div>

          {safeProjects.length === 0 ? (
            <p className="text-sm text-slate-600">No projects have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeProjects.map((project) => (
                <button
                  key={project.id || project.title}
                  type="button"
                  onClick={onOpenProjects}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
                >
                  <h4 className="font-medium text-slate-900">{project.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Status: {project.status} · Target: {project.targetCompletionDate || "Not set"}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass(
                      project.alertStatus
                    )}`}
                  >
                    {project.alertStatus || "No Concerns"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Tasks</h3>
            <button
              type="button"
              onClick={onOpenTasks}
              className="text-sm font-medium text-[#003E52] hover:underline"
            >
              Open
            </button>
          </div>

          {safeTasks.length === 0 ? (
            <p className="text-sm text-slate-600">No standalone tasks have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeTasks.map((task) => (
                <button
                  key={task.id || task.title}
                  type="button"
                  onClick={onOpenTasks}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
                >
                  <h4 className="font-medium text-slate-900">{task.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Status: {task.status} · Due: {task.dueDate || "Not set"}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass(
                      task.alertStatus
                    )}`}
                  >
                    {task.alertStatus || "No Concerns"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
