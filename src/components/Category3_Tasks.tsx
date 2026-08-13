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
import { StandaloneTask, StandaloneTaskCategory } from "../types";

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
  notes: "",
  status: "Not Started",
  progress: 0,
  category: undefined,
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
  const [categoryFilter, setCategoryFilter] = useState<"All" | StandaloneTaskCategory>("All");
  const [newTaskCategoryError, setNewTaskCategoryError] = useState("");
  const [editTaskCategoryError, setEditTaskCategoryError] = useState("");
  const visibleTasks = safeTasks.filter(
    (task) =>
      (showArchived || !task.archived) &&
      (categoryFilter === "All" || task.category === categoryFilter)
  );
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

    if (name === "category") setNewTaskCategoryError("");

    setNewTask((prev) => ({
      ...prev,
      [name]: name === "progress" ? Number(value) : name === "category" ? value || undefined : value,
    }));
  };

  const handleEditingTaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editingTask) return;

    const { name, value } = e.target;

    if (name === "category") setEditTaskCategoryError("");

    setEditingTask({
      ...editingTask,
      [name]: name === "progress" ? Number(value) : name === "category" ? value || undefined : value,
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      alert("Task Title is required.");
      return;
    }

    if (!newTask.category) {
      setNewTaskCategoryError("Select Home or UCF before saving this task.");
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
    setNewTaskCategoryError("");
  };

  const startEditing = (task: ExtendedStandaloneTask) => {
    if (!task.id) {
      alert("This task is missing an ID and cannot be edited.");
      return;
    }

    setEditingTask({ ...task });
    setEditTaskCategoryError("");
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditTaskCategoryError("");
  };

  const saveEditing = () => {
    if (!editingTask) return;

    if (!editingTask.title.trim()) {
      alert("Task Title is required.");
      return;
    }

    if (!editingTask.category) {
      setEditTaskCategoryError("Select Home or UCF before saving this task.");
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
      completionDate:
        nextStatus === "Complete"
          ? task.completionDate || getTodayDateString()
          : task.completionDate,
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

  const getCategoryBadgeClass = (category?: StandaloneTaskCategory) => {
    if (category === "Home") return "border-green-300 bg-green-100 text-green-800";
    if (category === "UCF") return "border-amber-300 bg-amber-100 text-amber-900";
    return "border-slate-300 bg-slate-100 text-slate-600";
  };

  const getCategoryAccentClass = (category?: StandaloneTaskCategory) => {
    if (category === "Home") return "border-l-green-500";
    if (category === "UCF") return "border-l-amber-400";
    return "border-l-slate-300";
  };

  const getCategorySelectClass = (category?: StandaloneTaskCategory) => {
    if (category === "Home") return "border-green-300 bg-green-100 text-green-800";
    if (category === "UCF") return "border-amber-300 bg-amber-100 text-amber-900";
    return "border-slate-300 bg-white text-slate-700";
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
          <label htmlFor={`${prefix}-category`} className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id={`${prefix}-category`}
            name="category"
            value={task.category || ""}
            onChange={onChange}
            aria-describedby={`${prefix}-category-error`}
            aria-invalid={prefix === "new-task" ? !!newTaskCategoryError : !!editTaskCategoryError}
            className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-[#33B1C8] ${getCategorySelectClass(task.category)}`}
          >
            <option value="" disabled>Select category</option>
            <option value="Home">Home</option>
            <option value="UCF">UCF</option>
          </select>
          {(prefix === "new-task" ? newTaskCategoryError : editTaskCategoryError) && (
            <p id={`${prefix}-category-error`} className="mt-1 text-sm font-medium text-red-700">
              {prefix === "new-task" ? newTaskCategoryError : editTaskCategoryError}
            </p>
          )}
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
    <section className="space-y-6 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#003E52] p-3 text-white">
              <CheckSquare className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#003E52]">Tasks</h2>
              <p className="text-sm text-slate-600">
                Add and manage standalone tasks that are not tied to Course Developments or Projects.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("add-standalone-task")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#008BA3] px-4 py-2 font-medium text-white shadow-sm hover:bg-[#00788d] focus:outline-none focus:ring-2 focus:ring-[#33B1C8] focus:ring-offset-2"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            Add Task
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Filter tasks by category">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Category</span>
          {(["All", "Home", "UCF"] as const).map((filter) => {
            const active = categoryFilter === filter;
            const activeClass = filter === "Home"
              ? "border-green-600 bg-green-700 text-white"
              : filter === "UCF"
                ? "border-amber-400 bg-amber-300 text-amber-950"
                : "border-[#003E52] bg-[#003E52] text-white";

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setCategoryFilter(filter)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#33B1C8] focus:ring-offset-2 ${
                  active ? activeClass : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="add-standalone-task"
        className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#003E52]">Add Task</h3>
          <p className="text-sm text-slate-600">Enter the task details and choose a category.</p>
        </div>
        <form onSubmit={handleCreateTask} className="space-y-4">
          {renderTaskFields(newTask, handleNewTaskChange, "new-task")}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C] focus:outline-none focus:ring-2 focus:ring-[#33B1C8] focus:ring-offset-2"
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
            <p className="text-sm text-slate-600">
              {categoryFilter !== "All"
                ? `No ${categoryFilter} tasks found.`
                : showArchived
                  ? "No archived tasks found."
                  : "No tasks have been added yet."}
            </p>
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
                    className={`w-full rounded-xl border border-l-4 p-4 text-left shadow-sm transition ${getCategoryAccentClass(task.category)} ${
                      task.status === "Complete" ? "bg-slate-50 text-slate-600" : "bg-white text-slate-900"
                    } ${
                      isSelected
                        ? "border-r-[#003E52] border-y-[#003E52] ring-2 ring-[#33B1C8]/30"
                        : overdue
                          ? "border-r-red-200 border-y-red-200 hover:bg-red-50"
                          : "border-r-slate-200 border-y-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getStatusIcon(task)}</div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`font-semibold text-[#003E52] ${task.status === "Complete" ? "line-through opacity-70" : ""}`}>
                          {task.title}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          Due: {task.dueDate || "Not set"}
                        </p>
                        {task.archived && (
                          <p className="mt-1 text-xs font-semibold uppercase text-[#B35C06]">
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

                          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getCategoryBadgeClass(task.category)}`}>
                            {task.category ? task.category.toUpperCase() : "SELECT CATEGORY"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
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
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(activeTask.category)}`}>
                    {activeTask.category ? activeTask.category.toUpperCase() : "SELECT CATEGORY"}
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

              <div className="grid gap-4 sm:grid-cols-2">
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
