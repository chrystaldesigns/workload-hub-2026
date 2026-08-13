import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { CourseDevelopment, LssProject, OutlookEvent, StandaloneTask } from "../types";

export type DashboardNavigationTarget = {
  sourceType: "standaloneTask" | "courseDevelopment" | "project" | "calendar";
  parentId?: string;
  itemId: string;
};

type AgendaCategory = "Home" | "UCF" | "Work" | "Uncategorized";

type DashboardAgendaItem = DashboardNavigationTarget & {
  key: string;
  title: string;
  date: string;
  time?: string;
  category: AgendaCategory;
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

const parseLocalDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`);

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

const getItemDate = (item: any) =>
  String(item?.dueDate || item?.date || item?.startDate || item?.plannedStartDate || "").slice(0, 10);

const getItemTime = (item: any) =>
  item?.scheduledTime || item?.dueTime || item?.meetingTime || item?.time || undefined;

const minutesFromTime = (value?: string) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const match = value.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
  if (!match) return Number.POSITIVE_INFINITY;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3]) {
    const period = match[3].toUpperCase();
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
  }
  return hour * 60 + minute;
};

const formatTime = (value?: string) => {
  if (!value) return "Anytime";
  const minutes = minutesFromTime(value);
  if (!Number.isFinite(minutes)) return value;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const categoryClass = (category: AgendaCategory) => {
  if (category === "Home") return "border-green-300 bg-green-100 text-green-800";
  if (category === "UCF") return "border-amber-300 bg-amber-100 text-amber-900";
  if (category === "Work") return "border-sky-300 bg-sky-100 text-sky-900";
  return "border-slate-300 bg-slate-100 text-slate-700";
};

export function Dashboard({
  courseDevelopments,
  lssProjects,
  standaloneTasks,
  outlookEvents = [],
  onNavigate,
}: DashboardProps) {
  const today = dateFromLocal(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const [filter, setFilter] = useState<"All" | "Work" | "Home" | "UCF">("All");

  const agendaItems = useMemo(() => {
    const items: DashboardAgendaItem[] = [];
    const add = (item: DashboardAgendaItem) => {
      if (item.itemId && item.date && !items.some((existing) => existing.key === item.key)) items.push(item);
    };

    (standaloneTasks || []).forEach((task) => {
      if (!task.id || task.archived || task.status === "Complete") return;
      const date = getItemDate(task);
      const category: AgendaCategory = task.category === "Home" || task.category === "UCF" ? task.category : "Uncategorized";
      add({ key: `standalone-${task.id}-${date}`, sourceType: "standaloneTask", itemId: task.id, title: task.title || "Task", date, time: getItemTime(task), category });
    });

    (courseDevelopments || []).filter((course) => !(course as any).archived).forEach((course) => {
      if (!course.id) return;
      (course.tasks || []).forEach((task) => {
        if (task.id === undefined || task.status === "Complete" || task.status === "Not Applicable") return;
        const date = getItemDate(task);
        add({ key: `course-${course.id}-${task.id}-${date}`, sourceType: "courseDevelopment", parentId: course.id, itemId: String(task.id), title: task.name || "Course Development Task", date, time: getItemTime(task), category: "Work", sourceLabel: `${course.courseNumber || course.courseTitle} • Course Development` });
      });
    });

    (lssProjects || []).filter((project) => !(project as any).archived).forEach((project) => {
      if (!project.id) return;
      (project.tasks || []).forEach((task: any) => {
        if (task.id === undefined || task.status === "Complete" || task.status === "Completed") return;
        const date = getItemDate(task);
        add({ key: `project-${project.id}-${task.id}-${date}`, sourceType: "project", parentId: project.id, itemId: String(task.id), title: task.name || task.title || "Project Task", date, time: getItemTime(task), category: "Work", sourceLabel: `${project.title} • Project` });
      });
    });

    outlookEvents.forEach((event) => {
      if (!event.id || !event.start?.dateTime) return;
      const dateTime = event.start.dateTime;
      add({ key: `calendar-${event.id}-${dateTime}`, sourceType: "calendar", itemId: event.id, title: event.subject || "Appointment", date: dateTime.slice(0, 10), time: event.isAllDay ? undefined : dateTime.slice(11, 16), category: "Work", sourceLabel: "Calendar appointment" });
    });

    return items.sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time) || a.title.localeCompare(b.title));
  }, [courseDevelopments, lssProjects, outlookEvents, standaloneTasks]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const selectedItems = agendaItems.filter((item) => item.date === selectedDate && (filter === "All" || item.category === filter));
  const counts = (category: "Work" | "Home" | "UCF") => agendaItems.filter((item) => item.date === selectedDate && item.category === category).length;
  const selectedDateValue = parseLocalDate(selectedDate);
  const anytime = selectedItems.filter((item) => !item.time);
  const earlier = selectedItems.filter((item) => item.time && minutesFromTime(item.time) < 450);
  const timed = selectedItems.filter((item) => item.time && minutesFromTime(item.time) >= 450 && minutesFromTime(item.time) <= 1260);
  const later = selectedItems.filter((item) => item.time && minutesFromTime(item.time) > 1260);

  const goToday = () => {
    setSelectedDate(today);
    setWeekStart(startOfWeek(today));
  };

  const AgendaRow = ({ item }: { item: DashboardAgendaItem; key?: React.Key }) => (
    <button type="button" onClick={() => onNavigate(item)} className="grid w-full grid-cols-1 gap-2 border-l-4 border-l-[#33B1C8] px-4 py-3 text-left hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#008BA3] sm:grid-cols-[8rem_8rem_1fr] sm:items-center">
      <span className="text-sm font-semibold text-slate-700">{formatTime(item.time)}</span>
      <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryClass(item.category)}`}>{item.category}</span>
      <span><span className="block font-semibold text-[#003E52]">{item.title}</span>{item.sourceLabel && <span className="block text-xs text-slate-500">{item.sourceLabel}</span>}</span>
    </button>
  );

  return (
    <section className="space-y-5 bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-[#008BA3]">Weekly Focus</p><h2 className="text-2xl font-semibold text-[#003E52]">Agenda</h2></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-label="Previous week" onClick={() => { const next = addDays(weekStart, -7); setWeekStart(next); setSelectedDate(next); }} className="rounded-lg border border-slate-300 bg-white p-2 focus:ring-2 focus:ring-[#33B1C8]"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={goToday} className="inline-flex items-center gap-2 rounded-lg border border-[#008BA3] bg-white px-3 py-2 text-sm font-semibold text-[#006282] focus:ring-2 focus:ring-[#33B1C8]"><CalendarDays className="h-4 w-4" />Today</button>
            <button type="button" aria-label="Next week" onClick={() => { const next = addDays(weekStart, 7); setWeekStart(next); setSelectedDate(next); }} className="rounded-lg border border-slate-300 bg-white p-2 focus:ring-2 focus:ring-[#33B1C8]"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-600">Week of {parseLocalDate(weekStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekDays.map((date) => { const value = parseLocalDate(date); const count = agendaItems.filter((item) => item.date === date).length; const active = date === selectedDate; return <button key={date} type="button" aria-pressed={active} onClick={() => setSelectedDate(date)} className={`rounded-xl border px-2 py-3 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8] ${active ? "border-[#003E52] bg-[#003E52] text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-sky-50"}`}><span className="block text-xs font-bold uppercase">{value.toLocaleDateString("en-US", { weekday: "short" })}</span><span className="block text-sm font-semibold uppercase">{value.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><span className={`block text-xs ${active ? "text-sky-100" : "text-slate-500"}`}>{count} {count === 1 ? "item" : "items"}</span></button>; })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-100 p-5"><h3 className="text-xl font-semibold text-[#003E52]">{selectedDateValue.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h3><div className="mt-3 flex flex-wrap gap-2">{(["All", "Work", "Home", "UCF"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8] ${filter === value ? value === "All" ? "border-[#003E52] bg-[#003E52] text-white" : categoryClass(value) : "border-slate-300 bg-white text-slate-700"}`}>{value}{value !== "All" ? ` (${counts(value)})` : ` (${agendaItems.filter((item) => item.date === selectedDate).length})`}</button>)}</div></div>
        {selectedItems.length === 0 ? <p className="p-8 text-center text-sm text-slate-600">{filter === "All" ? "No tasks or appointments scheduled for this day." : `No ${filter} items scheduled for this day.`}</p> : <div><div className="hidden grid-cols-[8rem_8rem_1fr] bg-[#003E52] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:grid"><span>Time</span><span>Category</span><span>Task or Appointment</span></div>{[["Anytime", anytime], ["Earlier", earlier], ["7:30 AM–9:00 PM", timed], ["Later", later]].map(([label, items]) => (items as DashboardAgendaItem[]).length > 0 && <div key={label as string}><p className="border-y border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">{label as string}</p><div className="divide-y divide-slate-100 bg-white">{(items as DashboardAgendaItem[]).map((item) => <AgendaRow key={item.key} item={item} />)}</div></div>)}</div>}
      </div>
    </section>
  );
}
