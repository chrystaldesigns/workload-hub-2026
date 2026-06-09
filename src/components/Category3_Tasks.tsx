import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Pencil,
  PlusCircle,
  Save,
  Trash2,
  X,
  Archive,
  RotateCcw,
} from "lucide-react";
import { StandaloneTask } from "../types";

type AlertStatus = "No Concerns" | "Potential Concerns" | "High Priority Concerns";

type ExtendedStandaloneTask = StandaloneTask & {
  id?: string;
  itemType?: "standaloneTask";
  completionDate?: string;
  manualDuration?: number | null;
  durationMinutes?: number;
  durationDays?: number;
  alertStatus?: AlertStatus;
  createdAt?: string;
  updatedAt?: string;
};

interface Category3TasksProps {
  standaloneTasks: StandaloneTask[];
  onAddTask: (task: StandaloneTask) => void;
  onUpdateTask: (task: StandaloneTask) => void;
  onDeleteTask: (id: string) => void;
}

const emptyTask: ExtendedStandaloneTask = {
  itemType: "standaloneTask",
  title: "",
  startDate: "",
  dueDate: "",
  completionDate: "",
  manualDuration: null,
  durationMinutes: undefined,
  durationDays: undefined,
  notes: "",
  status: "Not Started",
  progress: 0,
  priority: "Moderate",
  alertStatus: "No Concerns",
};

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTaskAlert(task: ExtendedStandaloneTask): AlertStatus {
  return task.alertStatus || "No Concerns";
}

function getTaskDuration(task: ExtendedStandaloneTask) {
  return task.manualDuration ?? task.durationDays ?? "";
}

function isOverdue(task: ExtendedStandaloneTask) {
  const today = getTodayDateString();
  return !!task.dueDate && task.dueDate < today && task.status !== "Complete";
}

function isDueSoon(task: ExtendedStandaloneTask) {
  if (!task.dueDate || task.status === "Complete") return false;

  const today = new Date(`${getTodayDateString()}T12:00:00`);
  const due = new Date(`${task.dueDate}T12:00:00`);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return diff >= 0 && diff <= 3;
}

function sortTasksByDueDate(tasks: ExtendedStandaloneTask[]) {
  return [...tasks].sort((a, b) => {
    const aDate = a.dueDate || a.startDate || "9999-12-31";
    const bDate = b.dueDate || b.startDate || "9999-12-31";

    if (aDate !== bDate) return aDate.localeCompare(bDate);

    return (a.title || "").localeCompare(b.title || "");
  });
}

export function Category3Tasks({
  standaloneTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: Category3TasksProps) {
  const safeTasks = Array.isArray(standaloneTasks)
    ? (standaloneTasks as ExtendedStandaloneTask[])
    : [];
  const [showArchived, setShowArchived] = useState(false);
  const visibleTasks = safeTasks.filter((task) => showArchived || !task.archived);
  const archivedTasks = safeTasks.filter((task) => task.archived);

  const [selectedId, setSelectedId] = useState<string>("");
  const [newTask, setNewTask] = useState<ExtendedStandaloneTask>(emptyTask);
  const [editingTask, setEditingTask] = useState<ExtendedStandaloneTask | null>(null);

  const sortedTasks = useMemo(() => sortTasksByDueDate(visibleTasks), [visibleTasks]);

  const activeTask = useMemo(() => {
    if (!sortedTasks.length) return null;
    return sortedTasks.find((task) => task.id === selectedId) || sortedTasks[0];
  }, [sortedTasks, selectedId]);

  const handleNewTaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setNewTask((prev) => ({
      ...prev,
      [name]:
        name === "progress"
          ? Number(value)
          : name === "manualDuration" || name === "durationMinutes" || name === "durationDays"
            ? value === ""
              ? undefined
              : Number(value)
            : value,
    }));
  };

  const handleEditingTaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editingTask) return;

    const { name, value } = e.target;

    setEditingTask({
      ...editingTask,
      [name]:
        name === "progress"
          ? Number(value)
          : name === "manualDuration" || name === "durationMinutes" || name === "durationDays"
            ? value === ""
              ? undefined
              : Number(value)
            : value,
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      alert("Task Title is required.");
      return;
    }

    const taskToSave: ExtendedStandaloneTask = {
      ...newTask,
      id: newTask.id || `standalone-${Date.now()}`,
      itemType: "standaloneTask",
      progress:
        newTask.status === "Complete"
          ? 100
          : newTask.status === "Not Started"
            ? 0
            : Number(newTask.progress || 0),
      createdAt: newTask.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTask(taskToSave as StandaloneTask);
    setNewTask(emptyTask);
  };

  const startEditing = (task: ExtendedStandaloneTask) => {
    if (!task.id) {
      alert("This task is missing an ID and cannot be edited.");
      return;
    }

    setEditingTask({ ...task });
  };

  const cancelEditing = () => {
    setEditingTask(null);
  };

  const saveEditing = () => {
    if (!editingTask) return;

    if (!editingTask.title.trim()) {
      alert("Task Title is required.");
      return;
    }

    const updatedTask: ExtendedStandaloneTask = {
      ...editingTask,
      itemType: "standaloneTask",
      progress:
        editingTask.status === "Complete"
          ? 100
          : editingTask.status === "Not Started"
            ? 0
            : Number(editingTask.progress || 0),
      completionDate:
        editingTask.status === "Complete"
          ? editingTask.completionDate || getTodayDateString()
          : editingTask.completionDate || "",
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask as StandaloneTask);
    setEditingTask(null);
  };

  const handleStatusToggle = (task: ExtendedStandaloneTask) => {
    const nextStatus =
      task.status === "Complete"
        ? "Not Started"
        : task.status === "Not Started"
          ? "In Progress"
          : "Complete";

    const updatedTask: ExtendedStandaloneTask = {
      ...task,
      itemType: "standaloneTask",
      status: nextStatus,
      completionDate: nextStatus === "Complete" ? task.completionDate || getTodayDateString() : "",
      progress: nextStatus === "Complete" ? 100 : nextStatus === "Not Started" ? 0 : 50,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask as StandaloneTask);
  };

  const handleArchive = (task: ExtendedStandaloneTask) => {
    if (!task.id) {
      alert("This task is missing an ID and cannot be archived.");
      return;
    }

    const confirmed = window.confirm(`Archive task "${task.title}"?`);

    if (!confirmed) return;

    const updatedTask: ExtendedStandaloneTask = {
      ...task,
      itemType: "standaloneTask",
      archived: true,
      archivedDate: getTodayDateString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask as StandaloneTask);
    if (selectedId === task.id) setSelectedId("");
  };

  const handleRestore = (task: ExtendedStandaloneTask) => {
    if (!task.id) {
      alert("This task is missing an ID and cannot be restored.");
      return;
    }

    const updatedTask: ExtendedStandaloneTask = {
      ...task,
      itemType: "standaloneTask",
      archived: false,
      archivedDate: "",
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask as StandaloneTask);
    setSelectedId(task.id);
  };

  const handleDelete = (task: ExtendedStandaloneTask) => {
    if (!task.id) {
      alert("This task is missing an ID and cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(`Delete task "${task.title}"?`);

    if (confirmed) {
      onDeleteTask(task.id);
      if (selectedId === task.id) setSelectedId("");
    }
  };

  const getStatusIcon = (task: ExtendedStandaloneTask) => {
    if (task.status === "Complete") {
      return <CheckCircle2 className="h-5 w-5 text-green-700" aria-hidden="true" />;
    }

    if (isOverdue(task)) {
      return <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />;
    }

    if (task.status === "In Progress") {
      return <Circle className="h-5 w-5 text-blue-700" aria-hidden="true" />;
    }

    if (task.status === "On Hold") {
      return <Clock className="h-5 w-5 text-orange-700" aria-hidden="true" />;
    }

    return <Circle className="h-5 w-5 text-slate-500" aria-hidden="true" />;
  };

  const getAlertBadgeClass = (alertStatus?: AlertStatus) => {
    switch (alertStatus) {
      case "High Priority Concerns":
        return "bg-red-700 text-white";
      case "Potential Concerns":
        return "bg-orange-700 text-white";
      default:
        return "bg-slate-600 text-white";
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
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
  };

  const renderTaskFields = (
    task: ExtendedStandaloneTask,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void,
    prefix: string
  ) => {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor={`${prefix}-title`} className="mb-1 block text-sm font-medium text-slate-700">
            Task Title
          </label>
          <input
            id={`${prefix}-title`}
            name="title"
            type="text"
            value={task.title}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-startDate`} className="mb-1 block text-sm font-medium text-slate-700">
            Start Date
          </label>
          <input
            id={`${prefix}-startDate`}
            name="startDate"
            type="date"
            value={task.startDate || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-dueDate`} className="mb-1 block text-sm font-medium text-slate-700">
            Due Date
          </label>
          <input
            id={`${prefix}-dueDate`}
            name="dueDate"
            type="date"
            value={task.dueDate || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-completionDate`} className="mb-1 block text-sm font-medium text-slate-700">
            Completion Date
          </label>
          <input
            id={`${prefix}-completionDate`}
            name="completionDate"
            type="date"
            value={task.completionDate || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-manualDuration`} className="mb-1 block text-sm font-medium text-slate-700">
            Duration
          </label>
          <input
            id={`${prefix}-manualDuration`}
            name="manualDuration"
            type="number"
            min={0}
            step={0.25}
            value={getTaskDuration(task)}
            onChange={onChange}
            placeholder="Example: 1, 2.5, 4"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">Enter duration in workdays.</p>
        </div>

        <div>
          <label htmlFor={`${prefix}-status`} className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id={`${prefix}-status`}
            name="status"
            value={task.status}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Complete</option>
            <option>On Hold</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${prefix}-priority`} className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            id={`${prefix}-priority`}
            name="priority"
            value={task.priority}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${prefix}-alertStatus`} className="mb-1 block text-sm font-medium text-slate-700">
            ALERTS
          </label>
          <select
            id={`${prefix}-alertStatus`}
            name="alertStatus"
            value={getTaskAlert(task)}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>No Concerns</option>
            <option>Potential Concerns</option>
            <option>High Priority Concerns</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${prefix}-progress`} className="mb-1 block text-sm font-medium text-slate-700">
            Progress %
          </label>
          <input
            id={`${prefix}-progress`}
            name="progress"
            type="number"
            min={0}
            max={100}
            value={task.progress}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`${prefix}-notes`} className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id={`${prefix}-notes`}
            name="notes"
            value={task.notes || ""}
            onChange={onChange}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-[#003E52] p-3 text-white">
            <CheckSquare className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Tasks</h2>
            <p className="text-sm text-slate-600">
              Add and manage standalone tasks that are not tied to Course Developments or Projects.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="space-y-4">
          {renderTaskFields(newTask, handleNewTaskChange, "new-task")}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            Create Task
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Task List</h3>
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium ${
                showArchived
                  ? "border-[#B35C06] bg-[#B35C06] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Archive className="h-4 w-4" aria-hidden="true" />
              {showArchived ? "Hide Archived" : `Show Archived (${archivedTasks.length})`}
            </button>
          </div>

          {sortedTasks.length === 0 ? (
            <p className="text-sm text-slate-600">{showArchived ? "No archived tasks found." : "No tasks have been added yet."}</p>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task) => {
                const isSelected = activeTask?.id === task.id;
                const overdue = isOverdue(task);
                const dueSoon = isDueSoon(task);

                return (
                  <button
                    key={task.id || task.title}
                    type="button"
                    onClick={() => setSelectedId(task.id || "")}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#003E52] bg-[#003E52] text-white shadow-sm"
                        : overdue
                          ? "border-red-200 bg-red-50 text-slate-900 hover:bg-red-100"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getStatusIcon(task)}</div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {task.title}
                        </h4>
                        <p className={`mt-1 text-sm ${isSelected ? "text-slate-100" : "text-slate-600"}`}>
                          Due: {task.dueDate || "Not set"}
                        </p>
                        {task.archived && (
                          <p className={`mt-1 text-xs font-semibold uppercase ${isSelected ? "text-orange-100" : "text-[#B35C06]"}`}>
                            Archived{task.archivedDate ? ` • ${task.archivedDate}` : ""}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-2">
                          {overdue && (
                            <span className="rounded-full bg-red-700 px-2 py-1 text-xs font-medium text-white">
                              Overdue
                            </span>
                          )}

                          {!overdue && dueSoon && (
                            <span className="rounded-full bg-orange-700 px-2 py-1 text-xs font-medium text-white">
                              Due Soon
                            </span>
                          )}

                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className={`mb-1 flex justify-between text-xs ${isSelected ? "text-slate-100" : "text-slate-600"}`}>
                        <span>Progress</span>
                        <span>{task.progress || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#33B1C8]"
                          style={{ width: `${Math.min(task.progress || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {!activeTask ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Select a task to view details.
            </div>
          ) : editingTask ? (
            <div className="rounded-2xl border border-[#33B1C8] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Edit Task</h3>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>

              <div className="space-y-4">
                {renderTaskFields(editingTask, handleEditingTaskChange, "edit-task")}

                <button
                  type="button"
                  onClick={saveEditing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
                >
                  <Save className="h-5 w-5" aria-hidden="true" />
                  Save Task
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{activeTask.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Start: {activeTask.startDate || "Not set"} · Due: {activeTask.dueDate || "Not set"}
                  </p>
                  {activeTask.completionDate && (
                    <p className="mt-1 text-sm text-slate-600">
                      Completed: {activeTask.completionDate}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityBadgeClass(activeTask.priority)}`}>
                    {activeTask.priority}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getAlertBadgeClass(getTaskAlert(activeTask))}`}>
                    {getTaskAlert(activeTask)}
                  </span>
                  {activeTask.archived ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRestore(activeTask)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#003E52] bg-white px-3 py-1 text-xs font-medium text-[#003E52] hover:bg-slate-50"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(activeTask)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete Permanently
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(activeTask)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(activeTask)}
                        className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-[#B35C06] hover:bg-orange-50"
                      >
                        <Archive className="h-4 w-4" aria-hidden="true" />
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(activeTask)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {activeTask.status}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {getTaskDuration(activeTask) || "Not set"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progress
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {activeTask.progress || 0}%
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>Progress</span>
                  <span>{activeTask.progress || 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-[#087834]"
                    style={{ width: `${Math.min(activeTask.progress || 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                  {activeTask.notes || "No notes entered"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStatusToggle(activeTask)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
              >
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Toggle Status
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
