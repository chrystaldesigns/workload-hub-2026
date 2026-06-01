import React, { useMemo, useState } from "react";
import {
  FolderGit,
  PlusCircle,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Save,
  X,
  ClipboardList,
} from "lucide-react";
import { LssProject, LssTask } from "../types";
import { stepWorkingDays } from "../utils/calendarEngine";

interface Category2Props {
  lssProjects: LssProject[];
  customBlocked: string[];
  onAddProject: (project: LssProject) => Promise<void>;
  onUpdateProject: (project: LssProject) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

const emptyProjectForm = {
  title: "",
  type: "Operational",
  priority: "Moderate" as const,
  alertStatus: "No Concerns" as const,
  startDate: "",
  targetCompletionDate: "",
  status: "Not Started" as const,
  projectLead: "Chrystal Wickline",
  processOwner: "",
  projectChampion: "",
  stakeholders: "",
  problemStatement: "",
  businessCaseAndBenefits: "",
  inScope: "",
  outOfScope: "",
  performanceMetrics: "",
  risks: "",
  voiceOfCustomer: "",
  customerComment: "",
  issue: "",
  customerRequirement: "",
  objectiveMeasure: "",
  operationalDefinition: "",
  timelineMethodology: "Six Sigma" as const,
  defineDuration: 4,
  measureDuration: 4,
  analyzeDuration: 4,
  improveDuration: 4,
  controlDuration: 4,
  timelineNotes: "",
  notes: "",
};

export function Category2LssProjects({
  lssProjects,
  customBlocked,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: Category2Props) {
  const safeProjects = Array.isArray(lssProjects) ? lssProjects : [];

  const [selectedId, setSelectedId] = useState<string>("");
  const [formData, setFormData] = useState(emptyProjectForm);
  const [editingProject, setEditingProject] = useState<LssProject | null>(null);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("Chrystal Wickline");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");

  const activeProject = useMemo(() => {
    if (!safeProjects.length) return null;
    return safeProjects.find((project) => project.id === selectedId) || safeProjects[0];
  }, [safeProjects, selectedId]);

  const calculatePhaseDates = (startDate: string) => {
    if (!startDate) {
      return {
        defineProjectedCompletion: "",
        measureProjectedCompletion: "",
        analyzeProjectedCompletion: "",
        improveProjectedCompletion: "",
        controlProjectedCompletion: "",
        targetCompletionDate: "",
      };
    }

    const defineDays = Number(formData.defineDuration || 0) * 5;
    const measureDays = Number(formData.measureDuration || 0) * 5;
    const analyzeDays = Number(formData.analyzeDuration || 0) * 5;
    const improveDays = Number(formData.improveDuration || 0) * 5;
    const controlDays = Number(formData.controlDuration || 0) * 5;

    try {
      const defineProjectedCompletion = stepWorkingDays(
        startDate,
        defineDays,
        1,
        customBlocked
      );
      const measureProjectedCompletion = stepWorkingDays(
        defineProjectedCompletion,
        measureDays,
        1,
        customBlocked
      );
      const analyzeProjectedCompletion = stepWorkingDays(
        measureProjectedCompletion,
        analyzeDays,
        1,
        customBlocked
      );
      const improveProjectedCompletion = stepWorkingDays(
        analyzeProjectedCompletion,
        improveDays,
        1,
        customBlocked
      );
      const controlProjectedCompletion = stepWorkingDays(
        improveProjectedCompletion,
        controlDays,
        1,
        customBlocked
      );

      return {
        defineProjectedCompletion,
        measureProjectedCompletion,
        analyzeProjectedCompletion,
        improveProjectedCompletion,
        controlProjectedCompletion,
        targetCompletionDate: controlProjectedCompletion,
      };
    } catch {
      return {
        defineProjectedCompletion: "",
        measureProjectedCompletion: "",
        analyzeProjectedCompletion: "",
        improveProjectedCompletion: "",
        controlProjectedCompletion: "",
        targetCompletionDate: "",
      };
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: [
        "defineDuration",
        "measureDuration",
        "analyzeDuration",
        "improveDuration",
        "controlDuration",
      ].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleEditingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!editingProject) return;

    const { name, value } = e.target;

    setEditingProject({
      ...editingProject,
      [name]: [
        "defineDuration",
        "measureDuration",
        "analyzeDuration",
        "improveDuration",
        "controlDuration",
      ].includes(name)
        ? Number(value)
        : value,
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Project Title is required.");
      return;
    }

    if (!formData.startDate) {
      alert("Project Start Date is required.");
      return;
    }

    const phaseDates = calculatePhaseDates(formData.startDate);

    const newProject: LssProject = {
      itemType: "project",
      title: formData.title,
      type: formData.type,
      priority: formData.priority,
      alertStatus: formData.alertStatus,
      startDate: formData.startDate,
      targetCompletionDate: formData.targetCompletionDate || phaseDates.targetCompletionDate,
      status: formData.status,
      projectLead: formData.projectLead,
      processOwner: formData.processOwner,
      projectChampion: formData.projectChampion,
      stakeholders: formData.stakeholders,
      problemStatement: formData.problemStatement,
      businessCaseAndBenefits: formData.businessCaseAndBenefits,
      inScope: formData.inScope,
      outOfScope: formData.outOfScope,
      performanceMetrics: formData.performanceMetrics,
      risks: formData.risks,
      voiceOfCustomer: formData.voiceOfCustomer,
      customerComment: formData.customerComment,
      issue: formData.issue,
      customerRequirement: formData.customerRequirement,
      objectiveMeasure: formData.objectiveMeasure,
      operationalDefinition: formData.operationalDefinition,
      timelineMethodology: formData.timelineMethodology,
      defineDuration: Number(formData.defineDuration),
      defineProjectedCompletion: phaseDates.defineProjectedCompletion,
      measureDuration: Number(formData.measureDuration),
      measureProjectedCompletion: phaseDates.measureProjectedCompletion,
      analyzeDuration: Number(formData.analyzeDuration),
      analyzeProjectedCompletion: phaseDates.analyzeProjectedCompletion,
      improveDuration: Number(formData.improveDuration),
      improveProjectedCompletion: phaseDates.improveProjectedCompletion,
      controlDuration: Number(formData.controlDuration),
      controlProjectedCompletion: phaseDates.controlProjectedCompletion,
      estimatedDuration:
        Number(formData.defineDuration) +
        Number(formData.measureDuration) +
        Number(formData.analyzeDuration) +
        Number(formData.improveDuration) +
        Number(formData.controlDuration),
      gateReviewDates: `Define: ${phaseDates.defineProjectedCompletion || "TBD"} | Measure: ${
        phaseDates.measureProjectedCompletion || "TBD"
      } | Analyze: ${phaseDates.analyzeProjectedCompletion || "TBD"}`,
      timelineNotes: formData.timelineNotes,
      notes: formData.notes,
      tasks: [],
    };

    await onAddProject(newProject);
    setFormData(emptyProjectForm);
  };

  const startEditingProject = (project: LssProject) => {
    setEditingProject({ ...project });
  };

  const cancelEditingProject = () => {
    setEditingProject(null);
  };

  const saveEditingProject = async () => {
    if (!editingProject) return;

    if (!editingProject.title.trim()) {
      alert("Project Title is required.");
      return;
    }

    const updatedProject: LssProject = {
      ...editingProject,
      itemType: "project",
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProject(updatedProject);
    setEditingProject(null);
  };

  const handleDeleteProject = async (project: LssProject) => {
    if (!project.id) {
      alert("This project is missing an ID and cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(`Delete project "${project.title}"?`);

    if (confirmed) {
      await onDeleteProject(project.id);
      if (selectedId === project.id) setSelectedId("");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeProject) return;

    if (!newTaskName.trim()) {
      alert("Task Title is required.");
      return;
    }

    if (!newTaskDueDate) {
      alert("Task Due Date is required.");
      return;
    }

    const newTask: LssTask = {
      id: `project-task-${Date.now()}`,
      itemType: "projectTask",
      name: newTaskName,
      assignedTo: newTaskOwner,
      startDate: newTaskStartDate,
      dueDate: newTaskDueDate,
      status: "Pending",
      notes: newTaskNotes,
    };

    const updatedProject: LssProject = {
      ...activeProject,
      tasks: [...(activeProject.tasks || []), newTask],
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProject(updatedProject);

    setNewTaskName("");
    setNewTaskOwner("Chrystal Wickline");
    setNewTaskStartDate("");
    setNewTaskDueDate("");
    setNewTaskNotes("");
  };

  const handleToggleTaskStatus = async (taskIndex: number) => {
    if (!activeProject) return;

    const updatedTasks = [...(activeProject.tasks || [])];
    const task = updatedTasks[taskIndex];

    updatedTasks[taskIndex] = {
      ...task,
      status: task.status === "Completed" ? "Pending" : "Completed",
      completionDate:
        task.status === "Completed" ? "" : new Date().toISOString().split("T")[0],
    };

    await onUpdateProject({
      ...activeProject,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = async (taskIndex: number) => {
    if (!activeProject) return;

    const updatedTasks = (activeProject.tasks || []).filter((_, index) => index !== taskIndex);

    await onUpdateProject({
      ...activeProject,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
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

  const renderProjectFields = (
    project: typeof formData | LssProject,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => void,
    prefix: string
  ) => {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor={`${prefix}-title`} className="mb-1 block text-sm font-medium text-slate-700">
            Project Title
          </label>
          <input
            id={`${prefix}-title`}
            name="title"
            type="text"
            value={project.title || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-type`} className="mb-1 block text-sm font-medium text-slate-700">
            Project Type
          </label>
          <select
            id={`${prefix}-type`}
            name="type"
            value={project.type || "Operational"}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>Ongoing</option>
            <option>One-Time</option>
            <option>Strategic</option>
            <option>Operational</option>
            <option>Compliance</option>
            <option>IT</option>
            <option>Event Management</option>
            <option>Educational</option>
            <option>Change Management</option>
            <option>Resource Development</option>
            <option>DMAIC</option>
            <option>Kaizen</option>
            <option>Lean Six Sigma</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${prefix}-priority`} className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            id={`${prefix}-priority`}
            name="priority"
            value={project.priority || "Moderate"}
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
            value={(project as LssProject).alertStatus || "No Concerns"}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>No Concerns</option>
            <option>Potential Concerns</option>
            <option>High Priority Concerns</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${prefix}-status`} className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id={`${prefix}-status`}
            name="status"
            value={project.status || "Not Started"}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>Not Started</option>
            <option>On Hold</option>
            <option>In Progress</option>
            <option>Complete</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${prefix}-startDate`} className="mb-1 block text-sm font-medium text-slate-700">
            Start Date
          </label>
          <input
            id={`${prefix}-startDate`}
            name="startDate"
            type="date"
            value={project.startDate || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-targetCompletionDate`} className="mb-1 block text-sm font-medium text-slate-700">
            Target Completion Date
          </label>
          <input
            id={`${prefix}-targetCompletionDate`}
            name="targetCompletionDate"
            type="date"
            value={(project as LssProject).targetCompletionDate || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-projectLead`} className="mb-1 block text-sm font-medium text-slate-700">
            Project Lead
          </label>
          <input
            id={`${prefix}-projectLead`}
            name="projectLead"
            type="text"
            value={project.projectLead || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-processOwner`} className="mb-1 block text-sm font-medium text-slate-700">
            Process Owner
          </label>
          <input
            id={`${prefix}-processOwner`}
            name="processOwner"
            type="text"
            value={project.processOwner || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-projectChampion`} className="mb-1 block text-sm font-medium text-slate-700">
            Champion / Sponsor
          </label>
          <input
            id={`${prefix}-projectChampion`}
            name="projectChampion"
            type="text"
            value={project.projectChampion || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor={`${prefix}-stakeholders`} className="mb-1 block text-sm font-medium text-slate-700">
            Stakeholders
          </label>
          <input
            id={`${prefix}-stakeholders`}
            name="stakeholders"
            type="text"
            value={project.stakeholders || ""}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`${prefix}-problemStatement`} className="mb-1 block text-sm font-medium text-slate-700">
            Problem Statement / Purpose
          </label>
          <textarea
            id={`${prefix}-problemStatement`}
            name="problemStatement"
            value={project.problemStatement || ""}
            onChange={onChange}
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`${prefix}-businessCaseAndBenefits`} className="mb-1 block text-sm font-medium text-slate-700">
            Business Case and Benefits
          </label>
          <textarea
            id={`${prefix}-businessCaseAndBenefits`}
            name="businessCaseAndBenefits"
            value={project.businessCaseAndBenefits || ""}
            onChange={onChange}
            rows={3}
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
            value={(project as LssProject).notes || ""}
            onChange={onChange}
            rows={3}
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
            <FolderGit className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
            <p className="text-sm text-slate-600">
              Add and manage manual projects that are not tied to the standard course development timeline.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateProject} className="space-y-4">
          {renderProjectFields(formData, handleFormChange, "new-project")}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            Create Project
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Project List</h3>

          {safeProjects.length === 0 ? (
            <p className="text-sm text-slate-600">No projects have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeProjects.map((project) => (
                <button
                  key={project.id || project.title}
                  type="button"
                  onClick={() => setSelectedId(project.id || "")}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    activeProject?.id === project.id
                      ? "border-[#003E52] bg-[#003E52]/5"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{project.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {project.type || "Project"} · {project.status}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Target: {project.targetCompletionDate || "Not set"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass(
                        project.alertStatus
                      )}`}
                    >
                      {project.alertStatus || "No Concerns"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {!activeProject ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Select a project to view details.
            </div>
          ) : editingProject ? (
            <div className="rounded-2xl border border-[#33B1C8] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Edit Project</h3>
                <button
                  type="button"
                  onClick={cancelEditingProject}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>

              <div className="space-y-4">
                {renderProjectFields(editingProject, handleEditingChange, "edit-project")}

                <button
                  type="button"
                  onClick={saveEditingProject}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
                >
                  <Save className="h-5 w-5" aria-hidden="true" />
                  Save Project
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{activeProject.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {activeProject.type} · {activeProject.status}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Start: {activeProject.startDate || "Not set"} · Target:{" "}
                    {activeProject.targetCompletionDate || "Not set"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#003E52] px-3 py-1 text-xs font-medium text-white">
                    {activeProject.priority}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getAlertBadgeClass(
                      activeProject.alertStatus
                    )}`}
                  >
                    {activeProject.alertStatus || "No Concerns"}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditingProject(activeProject)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(activeProject)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Project Lead
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {activeProject.projectLead || "Not entered"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Process Owner
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {activeProject.processOwner || "Not entered"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Purpose / Problem Statement
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                    {activeProject.problemStatement || "Not entered"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                    {activeProject.notes || "Not entered"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeProject && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-900">Project Tasks</h3>
              </div>

              <form onSubmit={handleAddTask} className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  <textarea
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
                  >
                    <PlusCircle className="h-5 w-5" aria-hidden="true" />
                    Add Project Task
                  </button>
                </div>
              </form>

              {!activeProject.tasks || activeProject.tasks.length === 0 ? (
                <p className="text-sm text-slate-600">No tasks have been added to this project.</p>
              ) : (
                <div className="space-y-3">
                  {activeProject.tasks.map((task, index) => (
                    <article
                      key={task.id || index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(index)}
                            aria-label={`Toggle task status for ${task.name}`}
                            className="mt-1"
                          >
                            {task.status === "Completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-700" aria-hidden="true" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-500" aria-hidden="true" />
                            )}
                          </button>
                          <div>
                            <h4 className="font-medium text-slate-900">{task.name}</h4>
                            <p className="text-sm text-slate-600">
                              Owner: {task.assignedTo || "Not entered"} · Due:{" "}
                              {task.dueDate || "Not set"}
                            </p>
                            {task.notes && (
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-white">
                            {task.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(index)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
