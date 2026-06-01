import React, { useState } from "react";
import {
  PlusCircle,
  CheckCircle2,
  Circle,
  PauseCircle,
  AlertTriangle,
  Trash2,
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

  const safeTasks = Array.isArray(standaloneTasks) ? standaloneTasks : [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setNewTask((prev) => ({
      ...prev,
      [name]: name === "progress" ? Number(value) : value,
    }));
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
            : newTask.progress || 0,
      createdAt: newTask.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTask(taskToSave);
    setNewTask(emptyTask);
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

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Standalone Tasks</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add random tasks that are not tied to Course Development or Projects.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="standalone-title" className="mb-1 block text-sm font-medium text-slate-700">
              Task Title
            </label>
            <input
              id="standalone-title"
              name="title"
              type="text"
              value={newTask.title}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="standalone-startDate" className="mb-1 block text-sm font-medium text-slate-700">
              Start Date
            </label>
            <input
              id="standalone-startDate"
              name="startDate"
              type="date"
              value={newTask.startDate || ""}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="standalone-dueDate" className="mb-1 block text-sm font-medium text-slate-700">
              Due Date
            </label>
            <input
              id="standalone-dueDate"
              name="dueDate"
              type="date"
              value={newTask.dueDate || ""}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="standalone-status" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="standalone-status"
              name="status"
              value={newTask.status}
              onChange={handleChange}
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
            <label htmlFor="standalone-priority" className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
              id="standalone-priority"
              name="priority"
              value={newTask.priority}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="standalone-alertStatus" className="mb-1 block text-sm font-medium text-slate-700">
              ALERTS
            </label>
            <select
              id="standalone-alertStatus"
              name="alertStatus"
              value={newTask.alertStatus || "No Concerns"}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option>No Concerns</option>
              <option>Potential Concerns</option>
              <option>High Priority Concerns</option>
            </select>
          </div>

          <div>
            <label htmlFor="standalone-progress" className="mb-1 block text-sm font-medium text-slate-700">
              Progress %
            </label>
            <input
              id="standalone-progress"
              name="progress"
              type="number"
              min={0}
              max={100}
              value={newTask.progress}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="standalone-notes" className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="standalone-notes"
              name="notes"
              value={newTask.notes || ""}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
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
            {safeTasks.map((task, index) => (
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
                        {task.dueDate ? `Due: ${task.dueDate}` : "Due: Not set"}
                      </p>
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
