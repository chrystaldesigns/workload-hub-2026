import React, { useState } from "react";
import { PlusCircle, CheckCircle2, Circle, PauseCircle, AlertTriangle } from "lucide-react";
import { StandaloneTask } from "../types";

interface Category3TasksProps {
  tasks: StandaloneTask[];
  onAddTask: (task: StandaloneTask) => void;
  onUpdateTask: (index: number, task: StandaloneTask) => void;
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
  tasks,
  onAddTask,
  onUpdateTask,
}: Category3TasksProps) {
  const [newTask, setNewTask] = useState<StandaloneTask>(emptyTask);

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
      id: `standalone-${Date.now()}`,
      itemType: "standaloneTask",
      progress:
        newTask.status === "Complete"
          ? 100
          : newTask.status === "Not Started"
            ? 0
            : newTask.progress || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTask(taskToSave);
    setNewTask(emptyTask);
  };

  const handleStatusToggle = (index: number, task: StandaloneTask) => {
    const nextStatus =
      task.status === "Complete"
        ? "Not Started"
        : task.status === "Not Started"
          ? "In Progress"
          : "Complete";

    const updatedTask: StandaloneTask = {
      ...task,
      status: nextStatus,
      progress:
        nextStatus === "Complete"
          ? 100
          : nextStatus === "Not Started"
            ? 0
            : task.progress || 50,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(index, updatedTask);
  };

  const getStatusIcon = (status: StandaloneTask["status"]) => {
    switch (status) {
      case "Complete":
        return <CheckCircle2 className="h-5 w-5 text-green-700" />;
      case "In Progress":
        return <Circle className="h-5 w-5 text-blue-700" />;
      case "On Hold":
        return <PauseCircle className="h-5 w-5 text-orange-700" />;
      case "Overdue":
        return <AlertTriangle className="h-5 w-5 text-red-700" />;
      default:
        return <Circle className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Standalone Tasks</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add random tasks that are not tied to Course Development or Projects.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Task Title
            </label>
            <input
              name="title"
              type="text"
              value={newTask.title}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Start Date
            </label>
            <input
              name="startDate"
              type="date"
              value={newTask.startDate || ""}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Due Date
            </label>
            <input
              name="dueDate"
              type="date"
              value={newTask.dueDate || ""}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
              ALERTS
            </label>
            <select
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Progress %
            </label>
            <input
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
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
              <PlusCircle className="h-5 w-5" />
              Create Task
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Task List</h3>

        {tasks.length === 0 ? (
          <p className="text-sm text-slate-600">No standalone tasks have been added yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <article
                key={task.id || index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(index, task)}
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
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
