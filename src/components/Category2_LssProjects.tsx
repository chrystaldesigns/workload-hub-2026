import React, { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardList,
  FolderGit,
  Pencil,
  PlusCircle,
  Save,
  Trash2,
  X,
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

type AlertStatus = "No Concerns" | "Potential Concerns" | "High Priority Concerns";

type ProjectFormData = {
  title: string;
  type: string;
  priority: "Low" | "Moderate" | "High" | "Critical";
  alertStatus: AlertStatus;
  startDate: string;
  targetCompletionDate: string;
  status: "Not Started" | "On Hold" | "In Progress" | "Complete";
  projectLead: string;
  processOwner: string;
  projectChampion: string;
  stakeholders: string;
  problemStatement: string;
  businessCaseAndBenefits: string;
  inScope: string;
  outOfScope: string;
  performanceMetrics: string;
  risks: string;
  voiceOfCustomer: string;
  customerComment: string;
  issue: string;
  customerRequirement: string;
  objectiveMeasure: string;
  operationalDefinition: string;
  timelineMethodology: "Kaizen" | "Lean" | "Six Sigma";
  defineDuration: number;
  measureDuration: number;
  analyzeDuration: number;
  improveDuration: number;
  controlDuration: number;
  timelineNotes: string;
  notes: string;
};

const emptyProjectForm: ProjectFormData = {
  title: "",
  type: "Lean Six Sigma",
  priority: "Moderate",
  alertStatus: "No Concerns",
  startDate: "",
  targetCompletionDate: "",
  status: "Not Started",
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
  timelineMethodology: "Six Sigma",
  defineDuration: 4,
  measureDuration: 4,
  analyzeDuration: 4,
  improveDuration: 4,
  controlDuration: 4,
  timelineNotes: "",
  notes: "",
};

function getProjectAlert(project: LssProject | ProjectFormData): AlertStatus {
  return ((project as any).alertStatus || "No Concerns") as AlertStatus;
}

function getProjectNotes(project: LssProject | ProjectFormData): string {
  return ((project as any).notes || "") as string;
}

function calculateProgress(project: LssProject) {
  const tasks = Array.isArray(project.tasks) ? project.tasks : [];

  if (!tasks.length) {
    return project.status === "Complete" ? 100 : project.status === "In Progress" ? 50 : 0;
  }

  const completed = tasks.filter((task) => task.status === "Completed").length;
  return Math.round((completed / tasks.length) * 100);
}

function sortProjectTasks(tasks: LssTask[]) {
  return [...tasks].sort((a, b) => {
    const aDate = ((a as any).startDate || a.dueDate || "9999-12-31") as string;
    const bDate = ((b as any).startDate || b.dueDate || "9999-12-31") as string;
    return aDate.localeCompare(bDate);
  });
}

export function Category2LssProjects({
  lssProjects,
  customBlocked,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: Category2Props) {
  const safeProjects = Array.isArray(lssProjects) ? lssProjects : [];

  const [selectedId, setSelectedId] = useState<string>(() => {
    return localStorage.getItem("workloadHubSelectedProjectId") || "";
  });
  const [formData, setFormData] = useState<ProjectFormData>(emptyProjectForm);
  const [editingProject, setEditingProject] = useState<ProjectFormData | null>(null);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("Chrystal Wickline");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");

  const activeProject = useMemo(() => {
    if (!safeProjects.length) return null;
    return safeProjects.find((project) => project.id === selectedId) || safeProjects[0];
  }, [safeProjects, selectedId]);

  const calculatePhaseDates = (projectData: ProjectFormData) => {
    if (!projectData.startDate) {
      return {
        defineProjectedCompletion: "",
        measureProjectedCompletion: "",
        analyzeProjectedCompletion: "",
        improveProjectedCompletion: "",
        controlProjectedCompletion: "",
        targetCompletionDate: "",
      };
    }

    try {
      const defineProjectedCompletion = stepWorkingDays(
        projectData.startDate,
        Number(projectData.defineDuration || 0) * 5,
        1,
        customBlocked
      );

      const measureProjectedCompletion = stepWorkingDays(
        defineProjectedCompletion,
        Number(projectData.measureDuration || 0) * 5,
        1,
        customBlocked
      );

      const analyzeProjectedCompletion = stepWorkingDays(
        measureProjectedCompletion,
        Number(projectData.analyzeDuration || 0) * 5,
        1,
        customBlocked
      );

      const improveProjectedCompletion = stepWorkingDays(
        analyzeProjectedCompletion,
        Number(projectData.improveDuration || 0) * 5,
        1,
        customBlocked
      );

      const controlProjectedCompletion = stepWorkingDays(
        improveProjectedCompletion,
        Number(projectData.controlDuration || 0) * 5,
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

    const phaseDates = calculatePhaseDates(formData);

    const newProject = {
      itemType: "project",
      title: formData.title.trim(),
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
      } | Analyze: ${phaseDates.analyzeProjectedCompletion || "TBD"} | Improve: ${
        phaseDates.improveProjectedCompletion || "TBD"
      } | Control: ${phaseDates.controlProjectedCompletion || "TBD"}`,
      timelineNotes: formData.timelineNotes,
      notes: formData.notes,
      tasks: [],
    } as unknown as LssProject;

    await onAddProject(newProject);
    setFormData(emptyProjectForm);
  };

  const startEditingProject = (project: LssProject) => {
    setEditingProject({
      title: project.title || "",
      type: project.type || "Lean Six Sigma",
      priority: project.priority || "Moderate",
      alertStatus: getProjectAlert(project),
      startDate: project.startDate || "",
      targetCompletionDate: project.targetCompletionDate || "",
      status: project.status || "Not Started",
      projectLead: project.projectLead || "Chrystal Wickline",
      processOwner: project.processOwner || "",
      projectChampion: project.projectChampion || "",
      stakeholders: project.stakeholders || "",
      problemStatement: project.problemStatement || "",
      businessCaseAndBenefits: project.businessCaseAndBenefits || "",
      inScope: project.inScope || "",
      outOfScope: project.outOfScope || "",
      performanceMetrics: project.performanceMetrics || "",
      risks: project.risks || "",
      voiceOfCustomer: project.voiceOfCustomer || "",
      customerComment: project.customerComment || "",
      issue: project.issue || "",
      customerRequirement: project.customerRequirement || "",
      objectiveMeasure: project.objectiveMeasure || "",
      operationalDefinition: project.operationalDefinition || "",
      timelineMethodology: project.timelineMethodology || "Six Sigma",
      defineDuration: Number(project.defineDuration || 4),
      measureDuration: Number(project.measureDuration || 4),
      analyzeDuration: Number(project.analyzeDuration || 4),
      improveDuration: Number(project.improveDuration || 4),
      controlDuration: Number(project.controlDuration || 4),
      timelineNotes: project.timelineNotes || "",
      notes: getProjectNotes(project),
    });
  };

  const cancelEditingProject = () => {
    setEditingProject(null);
  };

  const saveEditingProject = async () => {
    if (!activeProject || !editingProject) return;

    if (!editingProject.title.trim()) {
      alert("Project Title is required.");
      return;
    }

    if (!editingProject.startDate) {
      alert("Project Start Date is required.");
      return;
    }

    const phaseDates = calculatePhaseDates(editingProject);

    const updatedProject = {
      ...activeProject,
      title: editingProject.title.trim(),
      type: editingProject.type,
      priority: editingProject.priority,
      alertStatus: editingProject.alertStatus,
      startDate: editingProject.startDate,
      targetCompletionDate: editingProject.targetCompletionDate || phaseDates.targetCompletionDate,
      status: editingProject.status,
      projectLead: editingProject.projectLead,
      processOwner: editingProject.processOwner,
      projectChampion: editingProject.projectChampion,
      stakeholders: editingProject.stakeholders,
      problemStatement: editingProject.problemStatement,
      businessCaseAndBenefits: editingProject.businessCaseAndBenefits,
      inScope: editingProject.inScope,
      outOfScope: editingProject.outOfScope,
      performanceMetrics: editingProject.performanceMetrics,
      risks: editingProject.risks,
      voiceOfCustomer: editingProject.voiceOfCustomer,
      customerComment: editingProject.customerComment,
      issue: editingProject.issue,
      customerRequirement: editingProject.customerRequirement,
      objectiveMeasure: editingProject.objectiveMeasure,
      operationalDefinition: editingProject.operationalDefinition,
      timelineMethodology: editingProject.timelineMethodology,
      defineDuration: Number(editingProject.defineDuration),
      defineProjectedCompletion: phaseDates.defineProjectedCompletion,
      measureDuration: Number(editingProject.measureDuration),
      measureProjectedCompletion: phaseDates.measureProjectedCompletion,
      analyzeDuration: Number(editingProject.analyzeDuration),
      analyzeProjectedCompletion: phaseDates.analyzeProjectedCompletion,
      improveDuration: Number(editingProject.improveDuration),
      improveProjectedCompletion: phaseDates.improveProjectedCompletion,
      controlDuration: Number(editingProject.controlDuration),
      controlProjectedCompletion: phaseDates.controlProjectedCompletion,
      estimatedDuration:
        Number(editingProject.defineDuration) +
        Number(editingProject.measureDuration) +
        Number(editingProject.analyzeDuration) +
        Number(editingProject.improveDuration) +
        Number(editingProject.controlDuration),
      gateReviewDates: `Define: ${phaseDates.defineProjectedCompletion || "TBD"} | Measure: ${
        phaseDates.measureProjectedCompletion || "TBD"
      } | Analyze: ${phaseDates.analyzeProjectedCompletion || "TBD"} | Improve: ${
        phaseDates.improveProjectedCompletion || "TBD"
      } | Control: ${phaseDates.controlProjectedCompletion || "TBD"}`,
      timelineNotes: editingProject.timelineNotes,
      notes: editingProject.notes,
      updatedAt: new Date().toISOString(),
    } as unknown as LssProject;

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
      if (selectedId === project.id) {
        setSelectedId("");
        localStorage.removeItem("workloadHubSelectedProjectId");
      }
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

    const newTask = {
      id: `project-task-${Date.now()}`,
      itemType: "projectTask",
      name: newTaskName.trim(),
      assignedTo: newTaskOwner.trim() || "Chrystal Wickline",
      startDate: newTaskStartDate,
      dueDate: newTaskDueDate,
      status: "Pending",
      notes: newTaskNotes,
    } as unknown as LssTask;

    await onUpdateProject({
      ...activeProject,
      tasks: [...(activeProject.tasks || []), newTask],
    } as LssProject);

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
    } as unknown as LssTask;

    await onUpdateProject({
      ...activeProject,
      tasks: updatedTasks,
    } as LssProject);
  };

  const handleDeleteTask = async (taskIndex: number) => {
    if (!activeProject) return;

    const updatedTasks = (activeProject.tasks || []).filter((_, index) => index !== taskIndex);

    await onUpdateProject({
      ...activeProject,
      tasks: updatedTasks,
    } as LssProject);
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

  const renderTextArea = (
    label: string,
    name: keyof ProjectFormData,
    value: string,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => void,
    prefix: string,
    rows = 3
  ) => (
    <div className="md:col-span-2">
      <label htmlFor={`${prefix}-${String(name)}`} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={`${prefix}-${String(name)}`}
        name={String(name)}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
      />
    </div>
  );

  const renderProjectFields = (
    project: ProjectFormData,
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
            value={project.title}
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
  value={project.type}
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
  <option>Lean</option>
  <option>Lean Six Sigma</option>
</select>

<div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
  {{
    "Ongoing":
      "Continuous work that remains active over time and may require periodic updates, maintenance, or enhancements.",
    "One-Time":
      "A project with a defined beginning and end date that is completed once and then closed.",
    "Strategic":
      "Supports long-term organizational goals, initiatives, planning, growth, or transformation efforts.",
    "Operational":
      "Improves or supports day-to-day business processes, workflows, and operational efficiency.",
    "Compliance":
      "Required to meet regulatory, accreditation, accessibility, security, policy, or legal requirements.",
    "IT":
      "Technology-focused projects involving software, systems, infrastructure, integrations, automation, or data.",
    "Event Management":
      "Planning, coordination, and execution of conferences, meetings, workshops, training, or special events.",
    "Educational":
      "Course development, curriculum design, instructional materials, training programs, or learning initiatives.",
    "Change Management":
      "Projects focused on organizational change, adoption, communication, stakeholder engagement, and transition planning.",
    "Resource Development":
      "Creation of templates, guides, SOPs, documentation, toolkits, repositories, or reusable resources.",
    "DMAIC":
      "Formal Six Sigma improvement project following Define, Measure, Analyze, Improve, and Control phases.",
    "Kaizen":
      "Short-duration continuous improvement effort focused on rapid process improvements and team collaboration.",
    "Lean":
      "Process improvement project focused on reducing waste, improving flow, and increasing efficiency.",
    "Lean Six Sigma":
      "Combines Lean waste reduction with Six Sigma data-driven analysis to improve quality and efficiency."
  }[project.type] || "Select a project type to view its description."}
</div>
        </div>

        <div>
          <label htmlFor={`${prefix}-timelineMethodology`} className="mb-1 block text-sm font-medium text-slate-700">
            Timeline Methodology
          </label>
          <select
            id={`${prefix}-timelineMethodology`}
            name="timelineMethodology"
            value={project.timelineMethodology}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>Six Sigma</option>
            <option>Lean</option>
            <option>Kaizen</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${prefix}-priority`} className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            id={`${prefix}-priority`}
            name="priority"
            value={project.priority}
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
            value={project.alertStatus}
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
            value={project.status}
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
            value={project.startDate}
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
            value={project.targetCompletionDate}
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
            value={project.projectLead}
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
            value={project.processOwner}
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
            value={project.projectChampion}
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
            value={project.stakeholders}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        {renderTextArea("Problem Statement / Purpose", "problemStatement", project.problemStatement, onChange, prefix)}
        {renderTextArea("Business Case and Benefits", "businessCaseAndBenefits", project.businessCaseAndBenefits, onChange, prefix)}
        {renderTextArea("In Scope", "inScope", project.inScope, onChange, prefix)}
        {renderTextArea("Out of Scope", "outOfScope", project.outOfScope, onChange, prefix)}
        {renderTextArea("Performance Metrics", "performanceMetrics", project.performanceMetrics, onChange, prefix)}
        {renderTextArea("Risks", "risks", project.risks, onChange, prefix)}
        {renderTextArea("Voice of Customer", "voiceOfCustomer", project.voiceOfCustomer, onChange, prefix)}
        {renderTextArea("Customer Comment", "customerComment", project.customerComment, onChange, prefix)}
        {renderTextArea("Issue", "issue", project.issue, onChange, prefix)}
        {renderTextArea("Customer Requirement", "customerRequirement", project.customerRequirement, onChange, prefix)}
        {renderTextArea("Objective Measure", "objectiveMeasure", project.objectiveMeasure, onChange, prefix)}
        {renderTextArea("Operational Definition", "operationalDefinition", project.operationalDefinition, onChange, prefix)}

        <div>
          <label htmlFor={`${prefix}-defineDuration`} className="mb-1 block text-sm font-medium text-slate-700">
            Define Duration
          </label>
          <input
            id={`${prefix}-defineDuration`}
            name="defineDuration"
            type="number"
            min={0}
            value={project.defineDuration}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">Weeks</p>
        </div>

        <div>
          <label htmlFor={`${prefix}-measureDuration`} className="mb-1 block text-sm font-medium text-slate-700">
            Measure Duration
          </label>
          <input
            id={`${prefix}-measureDuration`}
            name="measureDuration"
            type="number"
            min={0}
            value={project.measureDuration}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">Weeks</p>
        </div>

        <div>
          <label htmlFor={`${prefix}-analyzeDuration`} className="mb-1 block text-sm font-medium text-slate-700">
            Analyze Duration
          </label>
          <input
            id={`${prefix}-analyzeDuration`}
            name="analyzeDuration"
            type="number"
            min={0}
            value={project.analyzeDuration}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">Weeks</p>
        </div>

        <div>
          <label htmlFor={`${prefix}-improveDuration`} className="mb-1 block text-sm font-medium text-slate-700">
            Improve Duration
          </label>
          <input
            id={`${prefix}-improveDuration`}
            name="improveDuration"
            type="number"
            min={0}
            value={project.improveDuration}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">Weeks</p>
        </div>

        <div>
          <label htmlFor={`${prefix}-controlDuration`} className="mb-1 block text-sm font-medium text-slate-700">
            Control Duration
          </label>
          <input
            id={`${prefix}-controlDuration`}
            name="controlDuration"
            type="number"
            min={0}
            value={project.controlDuration}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">Weeks</p>
        </div>

        {renderTextArea("Timeline Notes", "timelineNotes", project.timelineNotes, onChange, prefix)}
        {renderTextArea("General Notes", "notes", project.notes, onChange, prefix)}
      </div>
    );
  };

  const selectedProgress = activeProject ? calculateProgress(activeProject) : 0;
  const selectedTasks = activeProject ? sortProjectTasks(activeProject.tasks || []) : [];

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
              Add and manage manual projects, including full Lean Six Sigma charter details.
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
              {safeProjects.map((project) => {
                const isSelected = activeProject?.id === project.id;
                const progress = calculateProgress(project);

                return (
                  <button
                    key={project.id || project.title}
                    type="button"
                    onClick={() => {
                      const nextId = project.id || "";
                      setSelectedId(nextId);
                      localStorage.setItem("workloadHubSelectedProjectId", nextId);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#003E52] bg-[#003E52] text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className={`font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {project.title}
                        </h4>
                        <p className={`mt-1 text-sm ${isSelected ? "text-slate-100" : "text-slate-600"}`}>
                          {project.type || "Project"} · {project.status}
                        </p>
                        <p className={`mt-1 text-xs ${isSelected ? "text-slate-100" : "text-slate-500"}`}>
                          Target: {project.targetCompletionDate || "Not set"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getAlertBadgeClass(
                          getProjectAlert(project)
                        )}`}
                      >
                        {getProjectAlert(project)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className={`mb-1 flex justify-between text-xs ${isSelected ? "text-slate-100" : "text-slate-600"}`}>
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#33B1C8]"
                          style={{ width: `${progress}%` }}
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
            <>
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
                        getProjectAlert(activeProject)
                      )}`}
                    >
                      {getProjectAlert(activeProject)}
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

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Progress
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{selectedProgress}%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estimated Duration
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {activeProject.estimatedDuration || 0} weeks
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Methodology
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {activeProject.timelineMethodology || "Six Sigma"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#003E52]" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-slate-900">DMAIC Timeline</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                  {[
                    ["Define", activeProject.defineProjectedCompletion],
                    ["Measure", activeProject.measureProjectedCompletion],
                    ["Analyze", activeProject.analyzeProjectedCompletion],
                    ["Improve", activeProject.improveProjectedCompletion],
                    ["Control", activeProject.controlProjectedCompletion],
                  ].map(([label, date]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {date || "TBD"}
                      </p>
                    </div>
                  ))}
                </div>

                {activeProject.timelineNotes && (
                  <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    {activeProject.timelineNotes}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Project Charter</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["Project Lead", activeProject.projectLead],
                    ["Process Owner", activeProject.processOwner],
                    ["Champion / Sponsor", activeProject.projectChampion],
                    ["Stakeholders", activeProject.stakeholders],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                        {value || "Not entered"}
                      </p>
                    </div>
                  ))}

                  {[
                    ["Problem Statement / Purpose", activeProject.problemStatement],
                    ["Business Case and Benefits", activeProject.businessCaseAndBenefits],
                    ["In Scope", activeProject.inScope],
                    ["Out of Scope", activeProject.outOfScope],
                    ["Performance Metrics", activeProject.performanceMetrics],
                    ["Risks", activeProject.risks],
                    ["Voice of Customer", activeProject.voiceOfCustomer],
                    ["Customer Comment", activeProject.customerComment],
                    ["Issue", activeProject.issue],
                    ["Customer Requirement", activeProject.customerRequirement],
                    ["Objective Measure", activeProject.objectiveMeasure],
                    ["Operational Definition", activeProject.operationalDefinition],
                    ["General Notes", getProjectNotes(activeProject)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                        {value || "Not entered"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
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

              {selectedTasks.length === 0 ? (
                <p className="text-sm text-slate-600">No tasks have been added to this project.</p>
              ) : (
                <div className="space-y-3">
                  {selectedTasks.map((task, index) => (
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
                              Owner: {task.assignedTo || "Not entered"} · Start:{" "}
                              {((task as any).startDate as string) || "Not set"} · Due:{" "}
                              {task.dueDate || "Not set"}
                            </p>
                            {(task as any).notes && (
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                {(task as any).notes}
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
