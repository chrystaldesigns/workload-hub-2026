import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Pencil,
  PlusCircle,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { StandaloneTask } from "../types";
import { DashboardNavigationTarget } from "./Dashboard";

type AlertStatus = "No Concerns" | "Potential Concerns" | "High Priority Concerns";
type ExtendedStandaloneTask = StandaloneTask & { alertStatus?: AlertStatus };

interface Category3TasksProps {
  standaloneTasks: StandaloneTask[];
  onAddTask: (task: StandaloneTask) => void | Promise<void>;
  onUpdateTask: (task: StandaloneTask) => void | Promise<void>;
  onDeleteTask: (id: string) => void | Promise<void>;
  navigationTarget?: DashboardNavigationTarget | null;
  onNavigationComplete?: () => void;
}

const emptyTask: ExtendedStandaloneTask = {
  itemType: "standaloneTask",
  title: "",
  startDate: "",
  dueDate: "",
  notes: "",
  status: "Not Started",
  progress: 0,
  alertStatus: "No Concerns",
};

const todayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isArchivedTask = (task: ExtendedStandaloneTask) => Boolean(task.archived || task.status === "Complete");
const isOverdue = (task: ExtendedStandaloneTask) => Boolean(task.dueDate && task.dueDate < todayString() && task.status !== "Complete");
const isDueSoon = (task: ExtendedStandaloneTask) => {
  if (!task.dueDate || task.status === "Complete") return false;
  const today = new Date(`${todayString()}T12:00:00`);
  const due = new Date(`${task.dueDate}T12:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  return days >= 0 && days <= 3;
};
const sortTasks = (tasks: ExtendedStandaloneTask[]) => [...tasks].sort((a, b) => {
  const dateCompare = (a.dueDate || a.startDate || "9999-12-31").localeCompare(b.dueDate || b.startDate || "9999-12-31");
  return dateCompare || (a.title || "").localeCompare(b.title || "");
});

const actionClass = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#006282] bg-sky-50 px-3 text-xs font-semibold uppercase tracking-wide text-[#003E52] transition hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8] focus-visible:ring-offset-2";
const fieldClass = "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-[#008BA3] focus:bg-white focus:ring-2 focus:ring-[#33B1C8]/50";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600";

export function Category3Tasks({ standaloneTasks, onAddTask, onUpdateTask, onDeleteTask, navigationTarget, onNavigationComplete }: Category3TasksProps) {
  const safeTasks = Array.isArray(standaloneTasks) ? standaloneTasks as ExtendedStandaloneTask[] : [];
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [newTask, setNewTask] = useState<ExtendedStandaloneTask>(emptyTask);
  const [editingTask, setEditingTask] = useState<ExtendedStandaloneTask | null>(null);
  const [highlightedId, setHighlightedId] = useState("");

  const activeTasks = useMemo(() => sortTasks(safeTasks.filter((task) => !isArchivedTask(task))), [safeTasks]);
  const archivedTasks = useMemo(() => sortTasks(safeTasks.filter(isArchivedTask)), [safeTasks]);
  const visibleTasks = showArchived ? archivedTasks : activeTasks;
  const activeTask = visibleTasks.find((task) => task.id === selectedId) || visibleTasks[0] || null;

  useEffect(() => {
    if (!navigationTarget?.itemId) return;
    setShowArchived(false);
    setSelectedId(navigationTarget.itemId);
    setHighlightedId(navigationTarget.itemId);
    const frame = window.setTimeout(() => document.querySelector(`[data-standalone-task-id="${CSS.escape(navigationTarget.itemId)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    const clear = window.setTimeout(() => { setHighlightedId(""); onNavigationComplete?.(); }, 2500);
    return () => { window.clearTimeout(frame); window.clearTimeout(clear); };
  }, [navigationTarget, onNavigationComplete]);

  const changeNewTask = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setNewTask((task) => ({ ...task, [name]: name === "progress" ? Number(value) : value }));
  };
  const changeEditingTask = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingTask) return;
    const { name, value } = event.target;
    setEditingTask({ ...editingTask, [name]: name === "progress" ? Number(value) : value });
  };

  const withCompletionState = (task: ExtendedStandaloneTask): ExtendedStandaloneTask => {
    const complete = task.status === "Complete";
    return {
      ...task,
      itemType: "standaloneTask",
      progress: complete ? 100 : task.status === "Not Started" ? 0 : Number(task.progress || 0),
      completionDate: complete ? task.completionDate || todayString() : "",
      archived: complete ? true : task.archived,
      archivedDate: complete ? task.archivedDate || todayString() : task.archivedDate,
      updatedAt: new Date().toISOString(),
    };
  };

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTask.title.trim()) { alert("Task Title is required."); return; }
    const task = withCompletionState({ ...newTask, id: newTask.id || `standalone-${Date.now()}`, createdAt: newTask.createdAt || new Date().toISOString() });
    await onAddTask(task);
    setNewTask(emptyTask);
  };

  const saveEditing = async () => {
    if (!editingTask) return;
    if (!editingTask.title.trim()) { alert("Task Title is required."); return; }
    await onUpdateTask(withCompletionState(editingTask));
    setEditingTask(null);
  };

  const toggleStatus = async (task: ExtendedStandaloneTask) => {
    const reopening = task.status === "Complete";
    const nextStatus = reopening ? "Not Started" : task.status === "Not Started" ? "In Progress" : "Complete";
    await onUpdateTask(withCompletionState({
      ...task,
      status: nextStatus,
      archived: reopening ? false : task.archived,
      archivedDate: reopening ? "" : task.archivedDate,
      completionDate: reopening ? "" : task.completionDate,
      progress: nextStatus === "In Progress" ? 50 : task.progress,
    }));
  };

  const archiveTask = async (task: ExtendedStandaloneTask) => {
    if (!task.id) { alert("This task is missing an ID and cannot be archived."); return; }
    if (!window.confirm(`Archive task "${task.title}"?`)) return;
    await onUpdateTask({ ...task, archived: true, archivedDate: todayString(), updatedAt: new Date().toISOString() });
  };

  const restoreTask = async (task: ExtendedStandaloneTask) => {
    if (!task.id) { alert("This task is missing an ID and cannot be restored."); return; }
    const wasComplete = task.status === "Complete";
    await onUpdateTask({ ...task, status: wasComplete ? "Not Started" : task.status, progress: wasComplete ? 0 : task.progress, completionDate: wasComplete ? "" : task.completionDate, archived: false, archivedDate: "", updatedAt: new Date().toISOString() });
    setShowArchived(false);
    setSelectedId(task.id);
  };

  const deleteTask = async (task: ExtendedStandaloneTask) => {
    if (!task.id) { alert("This task is missing an ID and cannot be deleted."); return; }
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await onDeleteTask(task.id);
  };

  const statusIcon = (task: ExtendedStandaloneTask) => {
    if (task.status === "Complete") return <CheckCircle2 className="h-5 w-5 text-[#008BA3]" aria-hidden="true" />;
    if (isOverdue(task)) return <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />;
    if (task.status === "On Hold") return <Clock className="h-5 w-5 text-orange-700" aria-hidden="true" />;
    return <Circle className={`h-5 w-5 ${task.status === "In Progress" ? "text-[#008BA3]" : "text-slate-400"}`} aria-hidden="true" />;
  };

  const alertClass = (status?: AlertStatus) => status === "High Priority Concerns" ? "bg-red-700 text-white" : status === "Potential Concerns" ? "bg-orange-700 text-white" : "bg-slate-600 text-white";

  const taskFields = (task: ExtendedStandaloneTask, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void, prefix: string) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2"><label htmlFor={`${prefix}-title`} className={labelClass}>Task Title</label><input id={`${prefix}-title`} name="title" value={task.title} onChange={onChange} className={fieldClass} required /></div>
      <div><label htmlFor={`${prefix}-start`} className={labelClass}>Start Date</label><input id={`${prefix}-start`} name="startDate" type="date" value={task.startDate || ""} onChange={onChange} className={fieldClass} /></div>
      <div><label htmlFor={`${prefix}-due`} className={labelClass}>Due Date</label><input id={`${prefix}-due`} name="dueDate" type="date" value={task.dueDate || ""} onChange={onChange} className={fieldClass} /></div>
      <div><label htmlFor={`${prefix}-status`} className={labelClass}>Status</label><select id={`${prefix}-status`} name="status" value={task.status} onChange={onChange} className={fieldClass}><option>Not Started</option><option>In Progress</option><option>Complete</option><option>On Hold</option></select></div>
      <div><label htmlFor={`${prefix}-alerts`} className={labelClass}>Alerts</label><select id={`${prefix}-alerts`} name="alertStatus" value={task.alertStatus || "No Concerns"} onChange={onChange} className={fieldClass}><option>No Concerns</option><option>Potential Concerns</option><option>High Priority Concerns</option></select></div>
      <div><label htmlFor={`${prefix}-progress`} className={labelClass}>Progress %</label><input id={`${prefix}-progress`} name="progress" type="number" min={0} max={100} value={task.progress} onChange={onChange} className={fieldClass} /></div>
      <div className="md:col-span-2"><label htmlFor={`${prefix}-notes`} className={labelClass}>Notes</label><textarea id={`${prefix}-notes`} name="notes" value={task.notes || ""} onChange={onChange} rows={4} className={fieldClass} /></div>
    </div>
  );

  return (
    <section className="space-y-5 bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-[#003E52] p-3 text-white"><CheckSquare className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-[#008BA3]">Work Management</p><h2 className="text-2xl font-semibold text-[#003E52]">Standalone Tasks</h2><p className="text-sm text-slate-600">Manage work tasks outside of course developments and projects.</p></div></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => document.getElementById("add-standalone-task")?.scrollIntoView({ behavior: "smooth" })} className={actionClass}><PlusCircle className="h-4 w-4" />Add Task</button>
            <button type="button" aria-pressed={showArchived} onClick={() => { setShowArchived((value) => !value); setSelectedId(""); setEditingTask(null); }} className={`${actionClass} ${showArchived ? "bg-[#003E52] text-white hover:bg-[#003E52]" : ""}`}><Archive className="h-4 w-4" />{showArchived ? "Hide Archived" : `Show Archived (${archivedTasks.length})`}</button>
          </div>
        </div>
      </header>

      <section id="add-standalone-task" className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-100 px-5 py-3"><h3 className="font-semibold text-[#003E52]">Add Task</h3><p className="text-sm text-slate-600">Enter the details for a standalone work task.</p></div>
        <form onSubmit={createTask} className="space-y-4 p-5">{taskFields(newTask, changeNewTask, "new-task")}<button type="submit" className={actionClass}><PlusCircle className="h-4 w-4" />Create Task</button></form>
      </section>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-3"><h3 className="text-sm font-semibold uppercase tracking-wide text-[#003E52]">{showArchived ? `Archived Tasks (${archivedTasks.length})` : `Active Tasks (${activeTasks.length})`}</h3></div>
          {visibleTasks.length === 0 ? <p className="p-6 text-sm text-slate-600">{showArchived ? "No archived standalone tasks." : "No active standalone tasks."}</p> : <div className="divide-y divide-slate-200">{visibleTasks.map((task) => {
            const selected = activeTask?.id === task.id;
            const archived = isArchivedTask(task);
            return <button key={task.id || task.title} data-standalone-task-id={task.id} type="button" onClick={() => setSelectedId(task.id || "")} className={`w-full border-l-4 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#33B1C8] ${highlightedId === task.id ? "ring-4 ring-[#33B1C8]" : ""} ${selected ? "border-l-[#008BA3] bg-sky-50" : "border-l-transparent bg-white hover:bg-slate-50"} ${archived ? "text-slate-600" : ""}`}><div className="flex items-start gap-3">{statusIcon(task)}<span className="min-w-0 flex-1"><span className="block font-semibold text-[#003E52]">{task.title}</span><span className="mt-1 block text-xs text-slate-500">{task.startDate ? `Start: ${task.startDate} • ` : ""}Due: {task.dueDate || "Not set"}</span>{archived && <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-[#006282]">{task.status === "Complete" ? "Completed" : "Archived"}</span>}{!archived && isOverdue(task) && <span className="mt-1 block text-xs font-semibold uppercase text-red-700">Overdue</span>}{!archived && !isOverdue(task) && isDueSoon(task) && <span className="mt-1 block text-xs font-semibold uppercase text-orange-700">Due Soon</span>}</span></div></button>;
          })}</div>}
        </section>

        {!activeTask ? <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Select a task to view details.</section> : editingTask ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-5 py-3"><h3 className="font-semibold text-[#003E52]">Edit Task</h3><button type="button" onClick={() => setEditingTask(null)} className={actionClass}><X className="h-4 w-4" />Cancel</button></div><div className="space-y-4 p-5">{taskFields(editingTask, changeEditingTask, "edit-task")}<button type="button" onClick={saveEditing} className={actionClass}><Save className="h-4 w-4" />Save Task</button></div></section> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-l-4 border-l-[#008BA3] border-slate-200 bg-slate-100 p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold text-[#003E52]">{activeTask.title}</h3>{isArchivedTask(activeTask) && <span className="rounded-full border border-slate-400 bg-white px-2 py-0.5 text-xs font-bold uppercase text-slate-700">{activeTask.status === "Complete" ? "Completed" : "Archived"}</span>}</div><p className="mt-1 text-sm text-slate-600">Start: {activeTask.startDate || "Not set"} · Due: {activeTask.dueDate || "Not set"}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-medium ${alertClass(activeTask.alertStatus)}`}>{activeTask.alertStatus || "No Concerns"}</span>{isArchivedTask(activeTask) ? <><button type="button" onClick={() => restoreTask(activeTask)} className={actionClass}><RotateCcw className="h-4 w-4" />Restore</button><button type="button" onClick={() => deleteTask(activeTask)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 text-xs font-semibold uppercase text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Trash2 className="h-4 w-4" />Delete Permanently</button></> : <><button type="button" onClick={() => setEditingTask({ ...activeTask })} className={actionClass}><Pencil className="h-4 w-4" />Edit</button><button type="button" onClick={() => archiveTask(activeTask)} className={actionClass}><Archive className="h-4 w-4" />Archive</button><button type="button" onClick={() => deleteTask(activeTask)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 text-xs font-semibold uppercase text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Trash2 className="h-4 w-4" />Delete</button></>}</div></div></div>
          <div className="p-5"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className={labelClass}>Status</p><p className="font-semibold text-[#003E52]">{activeTask.status}</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className={labelClass}>Progress</p><p className="font-semibold text-[#003E52]">{activeTask.progress || 0}%</p></div></div><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className={labelClass}>Notes</p><p className="whitespace-pre-wrap text-sm text-slate-800">{activeTask.notes || "No notes entered"}</p></div><button type="button" onClick={() => toggleStatus(activeTask)} className={`${actionClass} mt-5`}><CheckCircle2 className="h-4 w-4" />{activeTask.status === "Complete" ? "Reopen Task" : "Advance Status"}</button></div>
        </section>}
      </div>
    </section>
  );
}
