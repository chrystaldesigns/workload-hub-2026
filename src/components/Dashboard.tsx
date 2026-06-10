import React from "react";
import {
  CalendarDays,
  ListChecks,
  BookOpen,
  FolderGit,
  CheckSquare,
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

  const isActiveStatus = (status?: string) => {
    return status !== "Complete" && status !== "Not Applicable";
  };

  const ownerMatchesInstructionalDesigner = (item: any) => {
    const ownerText = [
      item?.assignedTo,
      item?.owner,
      item?.ownerName,
      item?.lead,
      item?.leadName,
      item?.responsibleParty,
      item?.divisionId,
      item?.instructionalDesigner,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      ownerText.includes("instructional designer") ||
      ownerText.includes("chrystal") ||
      ownerText.includes("wickline")
    );
  };

  const getStartDate = (item: any) => {
    return (
      item?.startDate ||
      item?.date ||
      item?.plannedStartDate ||
      item?.projectStartDate ||
      item?.targetStartDate ||
      ""
    );
  };

  const getDueDate = (item: any) => {
    return (
      item?.dueDate ||
      item?.targetCompletionDate ||
      item?.deadline ||
      item?.calculatedDeadline ||
      ""
    );
  };

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";

    const parsed = new Date(`${dateStr.slice(0, 10)}T12:00:00`);

    if (Number.isNaN(parsed.getTime())) return dateStr;

    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const year = String(parsed.getFullYear()).slice(-2);

    return `${month}-${day}-${year}`;
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
      course.tasks?.find((task) =>
        task.name?.toLowerCase().includes("project completion")
      ) ||
      course.tasks?.find((task) =>
        task.phase?.toLowerCase().includes("project closeout")
      );

    return (
      (course as any).completionDate ||
      closeoutTask?.completionDate ||
      closeoutTask?.dueDate ||
      course.termDeadline ||
      ""
    );
  };

  const getCourseDeadline = (course: CourseDevelopment) => {
    return (course as any).calculatedDeadline || course.termDeadline || "";
  };

  const getFocusItems = (): FocusItem[] => {
    const items: FocusItem[] = [];

    safeCourses.forEach((course) => {
      (course.tasks || []).forEach((task) => {
        const startDate = getStartDate(task);

        if (
          startDate &&
          startDate <= today &&
          isActiveStatus(task.status) &&
          ownerMatchesInstructionalDesigner(task)
        ) {
          items.push({
            id: `course-${course.id || course.courseNumber}-${task.id}`,
            title: task.name || "Course Development Task",
            context: `${course.courseNumber}: ${course.courseTitle}`,
            date: startDate,
            type: "Course Development",
            onOpen: onOpenCourseDevelopments,
          });
        }
      });
    });

    safeProjects.forEach((project) => {
      const startDate = getStartDate(project);

      if (
        startDate &&
        startDate <= today &&
        isActiveStatus(project.status) &&
        ownerMatchesInstructionalDesigner(project)
      ) {
        items.push({
          id: `project-${project.id || project.title}`,
          title: project.title || "Project",
          context: "Project",
          date: startDate,
          type: "Project",
          onOpen: onOpenProjects,
        });
      }

      const projectTasks = Array.isArray((project as any).tasks)
        ? (project as any).tasks
        : [];

      projectTasks.forEach((task: any) => {
        const startDate = getStartDate(task);

        if (
          startDate &&
          startDate <= today &&
          isActiveStatus(task.status) &&
          ownerMatchesInstructionalDesigner(task)
        ) {
          items.push({
            id: `project-task-${project.id || project.title}-${task.id || task.name}`,
            title: task.name || task.title || "Project Task",
            context: project.title || "Project",
            date: startDate,
            type: "Project",
            onOpen: onOpenProjects,
          });
        }
      });
    });

    safeTasks.forEach((task) => {
      const startDate = getStartDate(task);

      if (
        startDate &&
        startDate <= today &&
        isActiveStatus(task.status) &&
        ownerMatchesInstructionalDesigner(task)
      ) {
        items.push({
          id: `task-${task.id || task.title}`,
          title: task.title || "Task",
          context: "Standalone Task",
          date: startDate,
          type: "Task",
          onOpen: onOpenTasks,
        });
      }
    });

    return items.sort((a, b) => {
      const dateCompare = (a.date || "").localeCompare(b.date || "");
      if (dateCompare !== 0) return dateCompare;
      return a.title.localeCompare(b.title);
    });
  };

  const getDueTodayItems = (): FocusItem[] => {
    const items: FocusItem[] = [];

    safeCourses.forEach((course) => {
      (course.tasks || []).forEach((task) => {
        const dueDate = getDueDate(task);

        if (dueDate === today && isActiveStatus(task.status)) {
          items.push({
            id: `due-course-${course.id || course.courseNumber}-${task.id}`,
            title: task.name || "Course Development Task",
            context: `${course.courseNumber}: ${course.courseTitle}`,
            date: dueDate,
            type: "Course Development",
            onOpen: onOpenCourseDevelopments,
          });
        }
      });
    });

    safeProjects.forEach((project) => {
      const dueDate = getDueDate(project);

      if (dueDate === today && isActiveStatus(project.status)) {
        items.push({
          id: `due-project-${project.id || project.title}`,
          title: project.title || "Project",
          context: "Project Target",
          date: dueDate,
          type: "Project",
          onOpen: onOpenProjects,
        });
      }

      const projectTasks = Array.isArray((project as any).tasks)
        ? (project as any).tasks
        : [];

      projectTasks.forEach((task: any) => {
        const dueDate = getDueDate(task);

        if (dueDate === today && isActiveStatus(task.status)) {
          items.push({
            id: `due-project-task-${project.id || project.title}-${task.id || task.name}`,
            title: task.name || task.title || "Project Task",
            context: project.title || "Project",
            date: dueDate,
            type: "Project",
            onOpen: onOpenProjects,
          });
        }
      });
    });

    safeTasks.forEach((task) => {
      const dueDate = getDueDate(task);

      if (dueDate === today && isActiveStatus(task.status)) {
        items.push({
          id: `due-task-${task.id || task.title}`,
          title: task.title || "Task",
          context: "Standalone Task",
          date: dueDate,
          type: "Task",
          onOpen: onOpenTasks,
        });
      }
    });

    return items.sort((a, b) => a.title.localeCompare(b.title));
  };

  const todayFocusItems = getFocusItems();
  const dueTodayItems = getDueTodayItems();

  const WorkItemRow = ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-b border-slate-100 px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
    >
      {children}
    </button>
  );

  const StatusBadge = ({ value }: { value?: string }) => (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getAlertBadgeClass(
        value
      )}`}
    >
      {value || "No Concerns"}
    </span>
  );

  return (
    <section className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Today's Focus</h3>
          </div>

          {todayFocusItems.length === 0 ? (
            <p className="text-sm text-slate-600">
              No instructional design tasks have started or carried forward today.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayFocusItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onOpen}
                  className="w-full px-2 py-2 text-left hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {item.type} • {item.context}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      Start: {formatShortDate(item.date)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-900">Due Today</h3>
          </div>

          {dueTodayItems.length === 0 ? (
            <p className="text-sm text-slate-600">No active work items are due today.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {dueTodayItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onOpen}
                  className="w-full px-2 py-2 text-left hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {item.type} • {item.context}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      Due: {formatShortDate(item.date)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Course Developments
          </h3>
        </div>

        {safeCourses.length === 0 ? (
          <p className="text-sm text-slate-600">No active course developments.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {safeCourses.map((course) => (
              <WorkItemRow
                key={course.id || course.courseNumber}
                onClick={onOpenCourseDevelopments}
              >
                <div className="flex flex-col gap-1 xl:flex-row xl:items-center xl:justify-between">
                  <p className="font-semibold text-slate-900">
                    {course.courseNumber}: {course.courseTitle}
                  </p>
                  <p className="text-xs text-slate-600">
                    Deadline: {formatShortDate(getCourseDeadline(course))}{" "}
                    <span className="text-slate-300">|</span> Start of Term:{" "}
                    {formatShortDate(getCourseStartOfTerm(course))}{" "}
                    <span className="text-slate-300">|</span> Term:{" "}
                    {course.termRelease || "Not set"}{" "}
                    <span className="text-slate-300">|</span>{" "}
                    <StatusBadge value={course.alertStatus} />
                  </p>
                </div>
              </WorkItemRow>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FolderGit className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Projects
          </h3>
        </div>

        {safeProjects.length === 0 ? (
          <p className="text-sm text-slate-600">No active projects.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {safeProjects.map((project) => (
              <WorkItemRow
                key={project.id || project.title}
                onClick={onOpenProjects}
              >
                <div className="flex flex-col gap-1 xl:flex-row xl:items-center xl:justify-between">
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <p className="text-xs text-slate-600">
                    Status: {project.status || "Not set"}{" "}
                    <span className="text-slate-300">|</span> Target:{" "}
                    {formatShortDate(project.targetCompletionDate)}{" "}
                    <span className="text-slate-300">|</span>{" "}
                    <StatusBadge value={project.alertStatus} />
                  </p>
                </div>
              </WorkItemRow>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Tasks
          </h3>
        </div>

        {safeTasks.length === 0 ? (
          <p className="text-sm text-slate-600">No active standalone tasks.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {safeTasks.map((task) => (
              <WorkItemRow key={task.id || task.title} onClick={onOpenTasks}>
                <div className="flex flex-col gap-1 xl:flex-row xl:items-center xl:justify-between">
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-600">
                    Status: {task.status || "Not set"}{" "}
                    <span className="text-slate-300">|</span> Due:{" "}
                    {formatShortDate(task.dueDate)}{" "}
                    <span className="text-slate-300">|</span>{" "}
                    <StatusBadge value={task.alertStatus} />
                  </p>
                </div>
              </WorkItemRow>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
