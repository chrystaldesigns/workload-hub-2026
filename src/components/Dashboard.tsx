import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { CourseDevelopment, LssProject, OutlookEvent, StandaloneTask } from "../types";

export type DashboardNavigationTarget = {
  sourceType: "standaloneTask" | "courseDevelopment" | "project" | "calendar";
  parentId?: string;
  itemId: string;
};

type WeeklyCategory = "Home" | "UCF" | "Work" | "Uncategorized";
type WeeklyFilter = "All" | "Work" | "Home" | "UCF";
type WeeklyTask = DashboardNavigationTarget & {
  key: string;
  title: string;
  startDate: string;
  dueDate: string;
  category: WeeklyCategory;
  sourceLabel?: string;
};

interface DashboardProps {
  courseDevelopments: CourseDevelopment[];
  lssProjects: LssProject[];
  standaloneTasks: StandaloneTask[];
  outlookEvents?: OutlookEvent[];
  onNavigate: (target: DashboardNavigationTarget) => void;
}

const dateFromLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Noon local time keeps calendar dates stable across DST changes and avoids UTC shifts.
const parseLocalDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`);
const normalizeDate = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return "";
  const normalized = value.slice(0, 10);
  return Number.isNaN(parseLocalDate(normalized).getTime()) ? "" : normalized;
};
const addDays = (value: string, days: number) => {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return dateFromLocal(date);
};
const startOfWeek = (value: string) => {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() - date.getDay());
  return dateFromLocal(date);
};
const formatDate = (value: string) => value
  ? parseLocalDate(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  : "—";

const categoryClass = (category: WeeklyCategory) => {
  if (category === "Home") return "border-green-300 bg-green-100 text-green-800";
  if (category === "UCF") return "border-amber-300 bg-amber-100 text-amber-900";
  if (category === "Work") return "border-sky-300 bg-sky-100 text-sky-900";
  return "border-slate-300 bg-slate-100 text-slate-700";
};

const overlapsWeek = (task: WeeklyTask, weekStart: string, weekEnd: string) => {
  if (task.startDate && task.dueDate) return task.startDate <= weekEnd && task.dueDate >= weekStart;
  const existingDate = task.startDate || task.dueDate;
  return Boolean(existingDate && existingDate >= weekStart && existingDate <= weekEnd);
};

export function Dashboard({ courseDevelopments, lssProjects, standaloneTasks, onNavigate }: DashboardProps) {
  const today = dateFromLocal(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const [filter, setFilter] = useState<WeeklyFilter>("All");
  const weekEnd = addDays(weekStart, 6);

  const allTasks = useMemo(() => {
    const items: WeeklyTask[] = [];
    const keys = new Set<string>();
    const add = (item: WeeklyTask) => {
      if (!item.itemId || keys.has(item.key)) return;
      keys.add(item.key);
      items.push(item);
    };

    (standaloneTasks || []).forEach((task) => {
      if (!task.id || task.archived || task.status === "Complete") return;
      const category: WeeklyCategory = task.category === "Home" || task.category === "UCF" ? task.category : "Uncategorized";
      add({ key: `standalone-${task.id}`, sourceType: "standaloneTask", itemId: task.id, title: task.title || "Task", startDate: normalizeDate(task.startDate), dueDate: normalizeDate(task.dueDate), category });
    });

    (courseDevelopments || []).filter((course) => !course.archived).forEach((course) => {
      if (!course.id) return;
      (course.tasks || []).forEach((task) => {
        if (task.id === undefined || task.status === "Complete" || task.status === "Not Applicable") return;
        add({ key: `course-${course.id}-${task.id}`, sourceType: "courseDevelopment", parentId: course.id, itemId: String(task.id), title: task.name || "Course Development Task", startDate: normalizeDate(task.startDate || task.effectiveStartDate), dueDate: normalizeDate(task.dueDate || task.effectiveDueDate), category: "Work", sourceLabel: `${course.courseNumber || course.courseTitle} • Course Development` });
      });
    });

    (lssProjects || []).filter((project) => !project.archived).forEach((project) => {
      if (!project.id) return;
      (project.tasks || []).forEach((task) => {
        if (task.id === undefined || task.status === "Complete" || task.status === "Completed") return;
        add({ key: `project-${project.id}-${task.id}`, sourceType: "project", parentId: project.id, itemId: String(task.id), title: task.name || "Project Task", startDate: normalizeDate(task.startDate), dueDate: normalizeDate(task.dueDate), category: "Work", sourceLabel: `${project.title} • Project` });
      });
    });
    return items;
  }, [courseDevelopments, lssProjects, standaloneTasks]);

  const weeklyTasks = useMemo(() => allTasks
    .filter((task) => overlapsWeek(task, weekStart, weekEnd))
    .sort((a, b) => {
      if (!a.startDate && b.startDate) return 1;
      if (a.startDate && !b.startDate) return -1;
      const startComparison = a.startDate.localeCompare(b.startDate);
      if (startComparison) return startComparison;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && !b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
    }), [allTasks, weekEnd, weekStart]);

  const visibleTasks = weeklyTasks.filter((task) => filter === "All" || task.category === filter);
  const countFor = (value: WeeklyFilter) => value === "All" ? weeklyTasks.length : weeklyTasks.filter((task) => task.category === value).length;

  return (
    <section className="space-y-5 bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#008BA3]">Weekly Focus</p>
            <h2 className="text-2xl font-semibold text-[#003E52]">You’ve got this—go rock your week!</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-label="Previous week" onClick={() => setWeekStart((value) => addDays(value, -7))} className="rounded-lg border border-slate-300 bg-white p-2 focus:ring-2 focus:ring-[#33B1C8]"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => setWeekStart(startOfWeek(dateFromLocal(new Date())))} className="inline-flex items-center gap-2 rounded-lg border border-[#008BA3] bg-white px-3 py-2 text-sm font-semibold text-[#006282] focus:ring-2 focus:ring-[#33B1C8]"><CalendarDays className="h-4 w-4" />This Week</button>
            <button type="button" aria-label="Next week" onClick={() => setWeekStart((value) => addDays(value, 7))} className="rounded-lg border border-slate-300 bg-white p-2 focus:ring-2 focus:ring-[#33B1C8]"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-600">Week of {parseLocalDate(weekStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-100 p-5">
          <div className="flex flex-wrap gap-2">
            {(["All", "Work", "Home", "UCF"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8] ${filter === value ? value === "All" ? "border-[#003E52] bg-[#003E52] text-white" : categoryClass(value) : "border-slate-300 bg-white text-slate-700"}`}>{value} ({countFor(value)})</button>)}
          </div>
        </div>

        {visibleTasks.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">{filter === "All" ? "No tasks are scheduled for this week." : `No ${filter} tasks are scheduled for this week.`}</p> : (
          <div role="table" aria-label="Weekly focus tasks" className="w-full">
            <div role="row" className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] bg-[#003E52] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:px-4">
              <span role="columnheader">Task</span><span role="columnheader">Start Date</span><span role="columnheader">Due Date</span>
            </div>
            <div role="rowgroup" className="divide-y divide-slate-200">
              {visibleTasks.map((task, index) => {
                const dueThisWeek = Boolean(task.dueDate && task.dueDate >= weekStart && task.dueDate <= weekEnd);
                return <button key={task.key} type="button" role="row" onClick={() => onNavigate(task)} className={`grid w-full grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-center gap-2 px-3 py-3 text-left text-sm transition-colors hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#008BA3] sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:gap-4 sm:px-4 ${index % 2 ? "bg-slate-50/80" : "bg-white"} ${dueThisWeek ? "font-semibold" : ""}`}>
                  <span role="cell" className="min-w-0">
                    <span className="block text-[#003E52]">{task.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${dueThisWeek ? "font-semibold" : "font-medium"} ${categoryClass(task.category)}`}>{task.category}</span>
                      {task.sourceLabel && <span className={`truncate text-xs text-slate-500 ${dueThisWeek ? "font-semibold" : "font-normal"}`}>{task.sourceLabel}</span>}
                    </span>
                  </span>
                  <span role="cell" className="tabular-nums text-slate-700">{formatDate(task.startDate)}</span>
                  <span role="cell" className="tabular-nums text-slate-700">{formatDate(task.dueDate)}</span>
                </button>;
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
