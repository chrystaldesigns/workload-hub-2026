import React, { useState } from "react";
import {
  PlusCircle,
  CheckCircle2,
  Circle,
  PauseCircle,
  AlertTriangle,
  Trash2,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { StandaloneTask } from "../types";

interface Category3TasksProps {
  standaloneTasks: StandaloneTask[];
  onAddTask: (task: StandaloneTask) => void;
  onUpdateTask: (task: StandaloneTask) => void;
  onDeleteTask: (id: string) => void;
}

const emptyTask: StandaloneTask = {
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

export function Category3Tasks({
  standaloneTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: Category3TasksProps) {
  const [newTask, setNewTask] = useState<StandaloneTask>(emptyTask);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<StandaloneTask | null>(null);

  const safeTasks = Array.isArray(standaloneTasks) ? standaloneTasks : [];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      alert("Task Title is required.");
      return;
    }

    const taskToSave: StandaloneTask = {
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

    onAddTask(taskToSave);
    setNewTask(emptyTask);
  };

  const startEditing = (task: StandaloneTask) => {
    if (!task.id) {
      alert("This task is missing an ID and cannot be edited.");
      return;
    }

    setEditingTaskId(task.id);
    setEditingTask({ ...task });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTask(null);
  };

  const saveEditing = () => {
    if (!editingTask) return;

    if (!editingTask.title.trim()) {
      alert("Task Title is required.");
      return;
    }

    const updatedTask: StandaloneTask = {
      ...editingTask,
      itemType: "standaloneTask",
      progress:
        editingTask.status === "Complete"
          ? 100
          : editingTask.status === "Not Started"
            ? 0
            : Number(editingTask.progress || 0),
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask);
    cancelEditing();
  };

  const handleStatusToggle = (task: StandaloneTask) => {
    const nextStatus =
      task.status === "Complete"
        ? "Not Started"
        : task.status === "Not Started"
          ? "In Progress"
          : "Complete";

    const updatedTask: StandaloneTask = {
      ...task,
      itemType: "standaloneTask",
      status: nextStatus,
      completionDate:
        nextStatus === "Complete"
          ? task.completionDate || new Date().toISOString().split("T")[0]
          : "",
      progress:
        nextStatus === "Complete"
          ? 100
          : nextStatus === "Not Started"
            ? 0
            : task.progress || 50,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask);
  };

  const handleDelete = (task: StandaloneTask) => {
    if (!task.id) {
      alert("This task is missing an ID and cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(`Delete standalone task "${task.title}"?`);

    if (confirmed) {
      onDeleteTask(task.id);
    }
  };

  const getStatusIcon = (status: StandaloneTask["status"]) => {
    switch (status) {
      case "Complete":
        return <CheckCircle2 className="h-5 w-5 text-green-700" aria-hidden="true" />;
      case "In Progress":
        return <Circle className="h-5 w-5 text-blue-700" aria-hidden="true" />;
      case "On Hold":
        return <PauseCircle className="h-5 w-5 text-orange-700" aria-hidden="true" />;
      case "Overdue":
        return <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />;
      default:
        return <Circle className="h-5 w-5 text-slate-500" aria-hidden="true" />;
    }
  };

  const getAlertBadgeClass = (alertStatus?: StandaloneTask["alertStatus"]) => {
    switch (alertStatus) {
      case "High Priority Concerns":
        return "bg-red-700 text-white";
      case "Potential Concerns":
        return "bg-orange-700 text-white";
      default:
        return "bg-slate-600 text-white";
    }
  };

  const renderTaskFormFields = (
    task: StandaloneTask,
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
            value={task.manualDuration ?? task.durationDays ?? ""}
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
            <option>Overdue</option>
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
            value={task.alertStatus || "No Concerns"}
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
        <h2 className="text-xl font-semibold text-slate-900">Standalone Tasks</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add random tasks that are not tied to Course Development or Projects.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {renderTaskFormFields(newTask, handleNewTaskChange, "standalone-new")}

          <div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
            >
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
              Create Task
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Task List</h3>

        {safeTasks.length === 0 ? (
          <p className="text-sm text-slate-600">No standalone tasks have been added yet.</p>
        ) : (
          <div className="space-y-3">
            {safeTasks.map((task, index) => {
              const isEditing = editingTaskId === task.id && editingTask;

              if (isEditing) {
                return (
                  <article
                    key={task.id || index}
                    className="rounded-xl border border-[#33B1C8] bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-slate-900">Edit Task</h4>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-4">
                      {renderTaskFormFields(editingTask, handleEditingTaskChange, `standalone-edit-${task.id}`)}

                      <button
                        type="button"
                        onClick={saveEditing}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
                      >
                        <Save className="h-5 w-5" aria-hidden="true" />
                        Save Changes
                      </button>
                    </div>
                  </article>
                );
              }

              return (
                <article
                  key={task.id || index}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(task)}
                        className="mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-[#33B1C8]"
                        aria-label={`Update status for ${task.title}`}
                      >
                        {getStatusIcon(task.status)}
                      </button>

                      <div>
                        <h4 className="font-medium text-slate-900">{task.title}</h4>
                        <p className="text-sm text-slate-600">
                          {task.startDate ? `Start: ${task.startDate}` : "Start: Not set"} ·{" "}
                          {task.dueDate ? `Due: ${task.dueDate}` : "Due: Not set"} ·{" "}
                          {task.manualDuration || task.durationDays
                            ? `Duration: ${task.manualDuration || task.durationDays} workday(s)`
                            : "Duration: Not set"}
                        </p>
                        {task.completionDate && (
                          <p className="mt-1 text-sm text-slate-600">
                            Completed: {task.completionDate}
                          </p>
                        )}
                        {task.notes && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-white">
                        {task.status}
                      </span>
                      <span className="rounded-full bg-[#003E52] px-3 py-1 text-xs font-medium text-white">
                        {task.priority}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getAlertBadgeClass(
                          task.alertStatus
                        )}`}
                      >
                        {task.alertStatus || "No Concerns"}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditing(task)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>Progress</span>
                      <span>{task.progress || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-[#087834]"
                        style={{ width: `${Math.min(task.progress || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
