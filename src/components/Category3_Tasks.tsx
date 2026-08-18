import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Archive, CheckCircle2, CheckSquare, Circle, Clock, Pencil, PlusCircle, RotateCcw, Save, Trash2, X } from "lucide-react";
import { StandaloneTask } from "../types";
import { DashboardNavigationTarget } from "./Dashboard";

type AlertStatus = "No Concerns" | "Potential Concerns" | "High Priority Concerns";
type Task = StandaloneTask & { alertStatus?: AlertStatus };
type SaveResult = void | boolean | Promise<void | boolean>;

interface Props {
  standaloneTasks: StandaloneTask[];
  onAddTask: (task: StandaloneTask) => SaveResult;
  onUpdateTask: (task: StandaloneTask) => SaveResult;
  onDeleteTask: (id: string) => SaveResult;
  navigationTarget?: DashboardNavigationTarget | null;
  onNavigationComplete?: () => void;
}

const blankTask: Task = { itemType: "standaloneTask", title: "", startDate: "", dueDate: "", notes: "", status: "Not Started", progress: 0, alertStatus: "No Concerns" };
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const archived = (task: Task) => Boolean(task.archived || task.status === "Complete");
const overdue = (task: Task) => Boolean(task.dueDate && task.dueDate < today() && task.status !== "Complete");
const dueSoon = (task: Task) => {
  if (!task.dueDate || task.status === "Complete") return false;
  const days = Math.ceil((new Date(`${task.dueDate}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86400000);
  return days >= 0 && days <= 3;
};
const sortTasks = (tasks: Task[]) => [...tasks].sort((a, b) =>
  (a.dueDate || a.startDate || "9999-12-31").localeCompare(b.dueDate || b.startDate || "9999-12-31") ||
  (a.title || "").localeCompare(b.title || ""));
const displayDate = (value?: string) => value
  ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  : "—";

const action = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#006282] bg-white px-3 text-xs font-bold uppercase tracking-wide text-[#003E52] transition hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8] focus-visible:ring-offset-2";
const danger = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-400 bg-white px-3 text-xs font-bold uppercase text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400";
const field = "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-[#008BA3] focus:bg-white focus:ring-2 focus:ring-[#33B1C8]/50";
const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

function Modal({ title, description, onClose, initialFocusRef, restoreFocusRef, children }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useRef(`task-modal-${Math.random().toString(36).slice(2)}`);
  const descriptionId = useRef(`task-modal-description-${Math.random().toString(36).slice(2)}`);
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    const appRoot = document.getElementById("root");
    document.body.style.overflow = "hidden";
    appRoot?.setAttribute("inert", "");
    const timer = window.setTimeout(() => (initialFocusRef?.current || dialog.current)?.focus(), 0);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !dialog.current) return;
      const items = Array.from(dialog.current.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')) as HTMLElement[];
      if (!items.length) { event.preventDefault(); dialog.current.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = oldOverflow;
      appRoot?.removeAttribute("inert");
      document.removeEventListener("keydown", handleKey);
      window.setTimeout(() => restoreFocusRef?.current?.focus(), 0);
    };
  }, [initialFocusRef, onClose, restoreFocusRef]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId.current} aria-describedby={description ? descriptionId.current : undefined} tabIndex={-1} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-100 px-5 py-4">
          <div><h3 id={titleId.current} className="text-lg font-semibold text-[#003E52]">{title}</h3>{description && <p id={descriptionId.current} className="text-sm text-slate-600">{description}</p>}</div>
          <button type="button" onClick={onClose} className={action} aria-label={`Close ${title}`}><X className="h-4 w-4" />Close</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Category3Tasks({ standaloneTasks, onAddTask, onUpdateTask, onDeleteTask, navigationTarget, onNavigationComplete }: Props) {
  const tasks = Array.isArray(standaloneTasks) ? standaloneTasks as Task[] : [];
  const [showArchived, setShowArchived] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [newTask, setNewTask] = useState<Task>(blankTask);
  const [editing, setEditing] = useState<Task | null>(null);
  const [highlightedId, setHighlightedId] = useState("");
  const addButton = useRef<HTMLButtonElement>(null);
  const addTitle = useRef<HTMLInputElement>(null);
  const taskTrigger = useRef<HTMLElement | null>(null);

  const activeTasks = useMemo(() => sortTasks(tasks.filter((task) => !archived(task))), [tasks]);
  const archivedTasks = useMemo(() => sortTasks(tasks.filter(archived)), [tasks]);
  const selected = tasks.find((task) => task.id === selectedId) || null;
  const closeDetail = () => { setDetailOpen(false); setEditing(null); };
  const openDetail = (task: Task, trigger?: HTMLElement | null) => {
    taskTrigger.current = trigger || null;
    setSelectedId(task.id || "");
    setEditing(null);
    setDetailOpen(true);
  };

  useEffect(() => {
    if (!navigationTarget?.itemId) return;
    const target = tasks.find((task) => task.id === navigationTarget.itemId);
    if (!target) return;
    setShowArchived(archived(target));
    setSelectedId(target.id || "");
    setEditing(null);
    setDetailOpen(true);
    setHighlightedId(target.id || "");
    const frame = window.setTimeout(() => document.querySelector(`[data-standalone-task-id="${CSS.escape(navigationTarget.itemId)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    const clear = window.setTimeout(() => { setHighlightedId(""); onNavigationComplete?.(); }, 2500);
    return () => { window.clearTimeout(frame); window.clearTimeout(clear); };
  }, [navigationTarget, onNavigationComplete, tasks]);

  const change = (setter: React.Dispatch<React.SetStateAction<Task>>, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setter((task) => ({ ...task, [name]: name === "progress" ? Number(value) : value }));
  };
  const completionState = (task: Task): Task => {
    const complete = task.status === "Complete";
    return { ...task, itemType: "standaloneTask", progress: complete ? 100 : task.status === "Not Started" ? 0 : Number(task.progress || 0), completionDate: complete ? task.completionDate || today() : "", archived: complete ? true : task.archived, archivedDate: complete ? task.archivedDate || today() : task.archivedDate, updatedAt: new Date().toISOString() };
  };
  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTask.title.trim()) return alert("Task Title is required.");
    const result = await onAddTask(completionState({ ...newTask, id: newTask.id || `standalone-${Date.now()}`, createdAt: newTask.createdAt || new Date().toISOString() }));
    if (result !== false) { setNewTask(blankTask); setAddOpen(false); }
  };
  const saveEdit = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return alert("Task Title is required.");
    const result = await onUpdateTask(completionState(editing));
    if (result !== false) setEditing(null);
  };
  const advance = async (task: Task) => {
    const reopening = task.status === "Complete";
    const status = reopening ? "Not Started" : task.status === "Not Started" ? "In Progress" : "Complete";
    const result = await onUpdateTask(completionState({ ...task, status, archived: reopening ? false : task.archived, archivedDate: reopening ? "" : task.archivedDate, completionDate: reopening ? "" : task.completionDate, progress: status === "In Progress" ? 50 : task.progress }));
    if (result !== false && status === "Complete") closeDetail();
  };
  const archiveTask = async (task: Task) => {
    if (!task.id) return alert("This task is missing an ID and cannot be archived.");
    if (!window.confirm(`Archive task "${task.title}"?`)) return;
    const result = await onUpdateTask({ ...task, archived: true, archivedDate: today(), updatedAt: new Date().toISOString() });
    if (result !== false) closeDetail();
  };
  const restoreTask = async (task: Task) => {
    if (!task.id) return alert("This task is missing an ID and cannot be restored.");
    const wasComplete = task.status === "Complete";
    const result = await onUpdateTask({ ...task, status: wasComplete ? "Not Started" : task.status, progress: wasComplete ? 0 : task.progress, completionDate: wasComplete ? "" : task.completionDate, archived: false, archivedDate: "", updatedAt: new Date().toISOString() });
    if (result !== false) { setShowArchived(false); closeDetail(); }
  };
  const deleteTask = async (task: Task) => {
    if (!task.id) return alert("This task is missing an ID and cannot be deleted.");
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    const result = await onDeleteTask(task.id);
    if (result !== false) closeDetail();
  };
  const statusIcon = (task: Task) => task.status === "Complete"
    ? <CheckCircle2 className="h-5 w-5 text-[#008BA3]" aria-hidden="true" />
    : overdue(task) ? <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />
    : task.status === "On Hold" ? <Clock className="h-5 w-5 text-orange-700" aria-hidden="true" />
    : <Circle className={`h-5 w-5 ${task.status === "In Progress" ? "text-[#008BA3]" : "text-slate-400"}`} aria-hidden="true" />;
  const alertStyle = (status?: AlertStatus) => status === "High Priority Concerns" ? "bg-red-700 text-white" : status === "Potential Concerns" ? "bg-orange-700 text-white" : "bg-slate-600 text-white";

  const fields = (task: Task, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void, prefix: string, titleRef?: React.RefObject<HTMLInputElement | null>) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2"><label htmlFor={`${prefix}-title`} className={label}>Task Title</label><input ref={titleRef} id={`${prefix}-title`} name="title" value={task.title} onChange={onChange} className={field} required /></div>
      <div><label htmlFor={`${prefix}-start`} className={label}>Start Date</label><input id={`${prefix}-start`} name="startDate" type="date" value={task.startDate || ""} onChange={onChange} className={field} /></div>
      <div><label htmlFor={`${prefix}-due`} className={label}>Due Date</label><input id={`${prefix}-due`} name="dueDate" type="date" value={task.dueDate || ""} onChange={onChange} className={field} /></div>
      <div><label htmlFor={`${prefix}-status`} className={label}>Status</label><select id={`${prefix}-status`} name="status" value={task.status} onChange={onChange} className={field}><option>Not Started</option><option>In Progress</option><option>Complete</option><option>On Hold</option></select></div>
      <div><label htmlFor={`${prefix}-alerts`} className={label}>Alerts</label><select id={`${prefix}-alerts`} name="alertStatus" value={task.alertStatus || "No Concerns"} onChange={onChange} className={field}><option>No Concerns</option><option>Potential Concerns</option><option>High Priority Concerns</option></select></div>
      <div><label htmlFor={`${prefix}-progress`} className={label}>Progress %</label><input id={`${prefix}-progress`} name="progress" type="number" min={0} max={100} value={task.progress} onChange={onChange} className={field} /></div>
      <div className="md:col-span-2"><label htmlFor={`${prefix}-notes`} className={label}>Notes</label><textarea id={`${prefix}-notes`} name="notes" value={task.notes || ""} onChange={onChange} rows={4} className={field} /></div>
    </div>
  );

  const TaskTable = ({ title, rows, isArchive }: { title: string; rows: Task[]; isArchive: boolean }) => (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-100 px-5 py-3"><h3 className="text-sm font-semibold uppercase tracking-wide text-[#003E52]">{title} ({rows.length})</h3></div>
      {rows.length === 0 ? <div className="space-y-3 p-6"><p className="text-sm text-slate-600">{isArchive ? "No archived standalone tasks." : "No active standalone tasks."}</p>{!isArchive && <button type="button" onClick={() => setAddOpen(true)} className={action}><PlusCircle className="h-4 w-4" />Add Task</button>}</div> : (
        <div role="table" aria-label={title}>
          <div role="row" className="hidden grid-cols-[minmax(0,1fr)_11rem_11rem] gap-4 border-b border-slate-200 bg-[#003E52] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white sm:grid"><div role="columnheader">Task</div><div role="columnheader">Start Date</div><div role="columnheader">Due Date</div></div>
          <div role="rowgroup" className="divide-y divide-slate-200">{rows.map((task) => (
            <button key={task.id || task.title} data-standalone-task-id={task.id} role="row" type="button" onClick={(event) => openDetail(task, event.currentTarget)} className={`grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition sm:grid-cols-[minmax(0,1fr)_11rem_11rem] sm:items-center sm:gap-4 ${highlightedId === task.id ? "ring-4 ring-inset ring-[#33B1C8]" : ""} hover:bg-sky-50 focus:outline-none focus-visible:bg-sky-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#33B1C8]`}>
              <span role="cell" className="flex min-w-0 items-start gap-3">{statusIcon(task)}<span className="min-w-0"><span className="block font-semibold text-[#003E52]">{task.title}</span><span className="mt-1 flex flex-wrap gap-2 text-xs font-semibold uppercase"><span className="text-slate-500">{task.status}</span>{isArchive && <span className="text-[#006282]">{task.status === "Complete" ? "Completed" : "Archived"}</span>}{!isArchive && overdue(task) && <span className="text-red-700">Overdue</span>}{!isArchive && !overdue(task) && dueSoon(task) && <span className="text-orange-700">Due Soon</span>}</span></span></span>
              <span role="cell" className="text-sm text-slate-700"><span className="mr-1 font-semibold sm:hidden">Start Date:</span>{displayDate(task.startDate)}</span>
              <span role="cell" className="text-sm text-slate-700"><span className="mr-1 font-semibold sm:hidden">Due Date:</span>{displayDate(task.dueDate)}</span>
            </button>
          ))}</div>
        </div>
      )}
    </section>
  );

  return (
    <section className="min-w-0 space-y-5 overflow-x-hidden bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-[#003E52] p-3 text-white"><CheckSquare className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-[#008BA3]">Work Management</p><h2 className="text-2xl font-semibold text-[#003E52]">Standalone Tasks</h2><p className="text-sm text-slate-600">Manage work tasks outside of course developments and projects.</p></div></div>
          <div className="flex flex-wrap gap-2"><button ref={addButton} type="button" onClick={() => setAddOpen(true)} className={action}><PlusCircle className="h-4 w-4" />Add Task</button><button type="button" aria-pressed={showArchived} onClick={() => setShowArchived((value) => !value)} className={`${action} ${showArchived ? "border-[#003E52] bg-[#003E52] text-white hover:bg-[#003E52]" : ""}`}><Archive className="h-4 w-4" />{showArchived ? "Hide Archived" : `Show Archived (${archivedTasks.length})`}</button></div>
        </div>
      </header>
      <TaskTable title="Active Tasks" rows={activeTasks} isArchive={false} />
      {showArchived && <TaskTable title="Archived Tasks" rows={archivedTasks} isArchive />}

      {addOpen && <Modal title="Add Task" description="Enter the details for a standalone work task." onClose={() => setAddOpen(false)} initialFocusRef={addTitle} restoreFocusRef={addButton}><form onSubmit={createTask} className="space-y-5 p-5">{fields(newTask, (event) => change(setNewTask, event), "new-task", addTitle)}<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setAddOpen(false)} className={action}>Cancel</button><button type="submit" className={action}><PlusCircle className="h-4 w-4" />Create Task</button></div></form></Modal>}
      {detailOpen && selected && <Modal title={editing ? "Edit Task" : "Task Details"} onClose={closeDetail} restoreFocusRef={taskTrigger}>
        {editing ? <div className="space-y-5 p-5">{fields(editing, (event) => change(setEditing as React.Dispatch<React.SetStateAction<Task>>, event), "edit-task")}<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className={action}><X className="h-4 w-4" />Cancel</button><button type="button" onClick={saveEdit} className={action}><Save className="h-4 w-4" />Save Task</button></div></div> : (
          <div><div className="border-l-4 border-l-[#008BA3] bg-slate-50 p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-xl font-semibold text-[#003E52]">{selected.title}</h4>{archived(selected) && <span className="rounded-full border border-slate-400 bg-white px-2 py-0.5 text-xs font-bold uppercase text-slate-700">{selected.status === "Complete" ? "Completed" : "Archived"}</span>}</div><p className="mt-1 text-sm text-slate-600">Start: {displayDate(selected.startDate)} · Due: {displayDate(selected.dueDate)}</p></div><span className={`self-start rounded-full px-3 py-1 text-xs font-medium ${alertStyle(selected.alertStatus)}`}>{selected.alertStatus || "No Concerns"}</span></div></div>
            <div className="p-5"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className={label}>Status</p><p className="font-semibold text-[#003E52]">{selected.status}</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className={label}>Progress</p><p className="font-semibold text-[#003E52]">{selected.progress || 0}%</p></div></div><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className={label}>Notes</p><p className="whitespace-pre-wrap text-sm text-slate-800">{selected.notes || "No notes entered"}</p></div>
              <div className="mt-5 flex flex-wrap gap-2">{archived(selected) ? <><button type="button" onClick={() => restoreTask(selected)} className={action}><RotateCcw className="h-4 w-4" />Restore</button><button type="button" onClick={() => deleteTask(selected)} className={danger}><Trash2 className="h-4 w-4" />Delete Permanently</button></> : <><button type="button" onClick={() => setEditing({ ...selected })} className={action}><Pencil className="h-4 w-4" />Edit</button><button type="button" onClick={() => advance(selected)} className={action}><CheckCircle2 className="h-4 w-4" />Advance Status</button><button type="button" onClick={() => archiveTask(selected)} className={action}><Archive className="h-4 w-4" />Archive</button><button type="button" onClick={() => deleteTask(selected)} className={danger}><Trash2 className="h-4 w-4" />Delete</button></>}</div>
            </div>
          </div>
        )}
      </Modal>}
    </section>
  );
}
