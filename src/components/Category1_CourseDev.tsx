import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  Pencil,
  PlusCircle,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { CourseDevelopment, CourseDevelopmentTask } from "../types";
import {
  calculateTimelineTasks,
  countWorkingDaysBetween,
  stepWorkingDays,
} from "../utils/calendarEngine";

interface Category1Props {
  courseDevelopments: CourseDevelopment[];
  customBlocked: string[];
  onAddCourse: (course: CourseDevelopment) => Promise<void>;
  onUpdateCourse: (course: CourseDevelopment) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
}

type CourseFormData = {
  program: string;
  courseNumber: string;
  courseTitle: string;
  canvasVersionSuffix: string;
  canvasVersion: string;
  workshopCourse: string;
  devType: CourseDevelopment["devType"];
  versionNumber: number;
  termRelease: CourseDevelopment["termRelease"];
  termStartDate: string;
  termDeadline: string;
  devStagger: number;
  onboarding: boolean;
  smeName: string;
  smeEmail: string;
  deanName: string;
  deanEmail: string;
  managerName: string;
  managerEmail: string;
  courseNotes: string;
  alertStatus: CourseDevelopment["alertStatus"];
};

type ExtendedCourseDevelopmentTask = CourseDevelopmentTask & {
  notes?: string;
  autoStartDate?: string;
  autoDueDate?: string;
  effectiveStartDate?: string;
  effectiveDueDate?: string;
};

type TaskDraft = {
  startDate?: string;
  dueDate?: string;
  status?: CourseDevelopmentTask["status"];
  notes?: string;
};

const emptyCourseForm: CourseFormData = {
  program: "",
  courseNumber: "",
  courseTitle: "",
  canvasVersionSuffix: "",
  canvasVersion: "",
  workshopCourse: "",
  devType: "Original",
  versionNumber: 1,
  termRelease: "Fall B",
  termStartDate: "",
  termDeadline: "",
  devStagger: 14,
  onboarding: true,
  smeName: "",
  smeEmail: "",
  deanName: "",
  deanEmail: "",
  managerName: "",
  managerEmail: "",
  courseNotes: "",
  alertStatus: "No Concerns",
};

const roleColors: Record<string, string> = {
  "Instructional Designer": "bg-green-700 text-white",
  "Subject Matter Expert": "bg-blue-700 text-white",
  Operations: "bg-orange-700 text-white",
  "Quality Assurance": "bg-red-700 text-white",
  Multimedia: "bg-purple-700 text-white",
  "Learning Experience Architect": "bg-slate-700 text-white",
};

const devTypeColors: Record<string, string> = {
  Original: "#396431",
  "New Release": "#14425C",
  "Tier 1 & 2 Revision": "#B35C06",
  Modification: "#95226E",
};

function sortTasksByStartDate(tasks: CourseDevelopmentTask[]) {
  return [...tasks].sort((a, b) => {
    const aDate = a.startDate || a.dueDate || "9999-12-31";
    const bDate = b.startDate || b.dueDate || "9999-12-31";

    if (aDate !== bDate) return aDate.localeCompare(bDate);

    const aId = Number(a.id || 0);
    const bId = Number(b.id || 0);

    return aId - bId;
  });
}

function normalizeGeneratedTasks(tasks: CourseDevelopmentTask[], fallbackDate: string) {
  return tasks.map((task) => {
    const extendedTask = task as ExtendedCourseDevelopmentTask;
    const isStartCompensation =
      String(task.name || "").toLowerCase().includes("start compensation") ||
      Number(task.id) === 1;

    if (isStartCompensation && !task.startDate && !task.dueDate) {
      return {
        ...task,
        startDate: fallbackDate,
        dueDate: fallbackDate,
        autoStartDate: fallbackDate,
        autoDueDate: fallbackDate,
        effectiveStartDate: fallbackDate,
        effectiveDueDate: fallbackDate,
        status: task.status === "Not Applicable" ? "Not Started" : task.status,
        notes: extendedTask.notes || "",
      };
    }

    return {
      ...task,
      autoStartDate: extendedTask.autoStartDate || task.startDate || "",
      autoDueDate: extendedTask.autoDueDate || task.dueDate || "",
      effectiveStartDate: extendedTask.effectiveStartDate || task.startDate || "",
      effectiveDueDate: extendedTask.effectiveDueDate || task.dueDate || "",
      notes: extendedTask.notes || "",
    };
  });
}

export function Category1CourseDev({
  courseDevelopments,
  customBlocked,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
}: Category1Props) {
  const safeCourses = Array.isArray(courseDevelopments) ? courseDevelopments : [];

  const [selectedId, setSelectedId] = useState<string>(() => {   return localStorage.getItem("workloadHubSelectedCourseId") || ""; });
  const [formData, setFormData] = useState<CourseFormData>(emptyCourseForm);
  const [editingCourse, setEditingCourse] = useState<CourseFormData | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, TaskDraft>>({});

  const activeCourse = useMemo(() => {
    if (!safeCourses.length) return null;
    return safeCourses.find((course) => course.id === selectedId) || safeCourses[0];
  }, [safeCourses, selectedId]);

  const calculatedCourseDeadline = useMemo(() => {
    if (!formData.termStartDate) return "";

    try {
      return stepWorkingDays(formData.termStartDate, 30, -1, customBlocked);
    } catch {
      return "";
    }
  }, [formData.termStartDate, customBlocked]);

  const normalizedCourseNumber = formData.courseNumber.trim().toLowerCase();
  const generatedCanvasVersion = normalizedCourseNumber
    ? `cel-${normalizedCourseNumber}-${formData.canvasVersionSuffix.trim()}`
    : "";

  const generatedWorkshopCourse = normalizedCourseNumber
    ? `cel-${normalizedCourseNumber}-workshop`
    : "";

  const preserveScrollAfter = async (callback: () => Promise<void>) => {
    const currentScrollY = window.scrollY;

    await callback();

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: currentScrollY,
        behavior: "auto",
      });
    });
  };

  const getTaskKey = (task: CourseDevelopmentTask) => String(task.id);

  const getTaskDraft = (task: CourseDevelopmentTask): TaskDraft => {
    const key = getTaskKey(task);
    const extendedTask = task as ExtendedCourseDevelopmentTask;

    return {
      startDate: taskDrafts[key]?.startDate ?? task.startDate ?? "",
      dueDate: taskDrafts[key]?.dueDate ?? task.dueDate ?? "",
      status: taskDrafts[key]?.status ?? task.status,
      notes: taskDrafts[key]?.notes ?? extendedTask.notes ?? "",
    };
  };

  const updateTaskDraft = (
    task: CourseDevelopmentTask,
    field: keyof TaskDraft,
    value: string
  ) => {
    const key = getTaskKey(task);

    setTaskDrafts((prev) => ({
      ...prev,
      [key]: {
        ...getTaskDraft(task),
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const hasTaskDraftChanges = (task: CourseDevelopmentTask) => {
    const key = getTaskKey(task);
    return !!taskDrafts[key];
  };

  const clearTaskDraft = (task: CourseDevelopmentTask) => {
    const key = getTaskKey(task);

    setTaskDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getWorkingDayDelta = (oldDate: string, newDate: string) => {
    if (!oldDate || !newDate || oldDate === newDate) return 0;

    try {
      if (newDate > oldDate) {
        return Math.max(0, countWorkingDaysBetween(oldDate, newDate, customBlocked) - 1);
      }

      return -Math.max(0, countWorkingDaysBetween(newDate, oldDate, customBlocked) - 1);
    } catch {
      return 0;
    }
  };

  const shiftDateByWorkingDelta = (date: string, delta: number) => {
    if (!date || delta === 0) return date;

    try {
      return stepWorkingDays(date, Math.abs(delta), delta > 0 ? 1 : -1, customBlocked);
    } catch {
      return date;
    }
  };

  const saveTaskChanges = async (course: CourseDevelopment, task: CourseDevelopmentTask) => {
    const draft = getTaskDraft(task);

    const updatedTasks = (course.tasks || []).map((item) => {
      if (item.id !== task.id) return item;

      return {
        ...item,
        startDate: draft.startDate || "",
        dueDate: draft.dueDate || "",
        effectiveStartDate: draft.startDate || "",
        effectiveDueDate: draft.dueDate || "",
        status: draft.status || item.status,
        notes: draft.notes || "",
      };
    });

    await preserveScrollAfter(async () => {
      await onUpdateCourse({
        ...course,
        tasks: updatedTasks,
      });
    });

    clearTaskDraft(task);
  };

  const recalculateRemainingTimeline = async (
    course: CourseDevelopment,
    anchorTask: CourseDevelopmentTask
  ) => {
    const confirmed = window.confirm(
      "Recalculate remaining timeline from this task? Tasks before this task will stay unchanged. This task will keep its current edited dates. Later incomplete tasks will shift based on this task."
    );

    if (!confirmed) return;

    const anchor = anchorTask as ExtendedCourseDevelopmentTask;
    const anchorBaselineDate =
      anchor.autoDueDate ||
      anchor.effectiveDueDate ||
      anchor.dueDate ||
      anchor.autoStartDate ||
      anchor.effectiveStartDate ||
      anchor.startDate ||
      "";

    const anchorCurrentDate =
      anchor.dueDate ||
      anchor.effectiveDueDate ||
      anchor.startDate ||
      anchor.effectiveStartDate ||
      "";

    const delta = getWorkingDayDelta(anchorBaselineDate, anchorCurrentDate);

    if (delta === 0) {
      alert("No timeline shift was detected for this task.");
      return;
    }

    const anchorId = Number(anchorTask.id || 0);
    const anchorStart = anchorTask.startDate || anchorTask.dueDate || "";

    const updatedTasks = (course.tasks || []).map((item) => {
      const extendedItem = item as ExtendedCourseDevelopmentTask;
      const itemId = Number(item.id || 0);
      const itemStart = item.startDate || item.dueDate || "";

      const isAnchor = item.id === anchorTask.id;
      const isBeforeAnchor =
        !isAnchor &&
        ((itemId > 0 && itemId < anchorId) ||
          (!!anchorStart && !!itemStart && itemStart < anchorStart));

      const isCompletedHistorical =
        item.status === "Complete" || item.status === "Not Applicable";

      if (isAnchor || isBeforeAnchor || isCompletedHistorical) {
        return item;
      }

      const baseStart =
        extendedItem.autoStartDate ||
        extendedItem.effectiveStartDate ||
        item.startDate ||
        "";
      const baseDue =
        extendedItem.autoDueDate ||
        extendedItem.effectiveDueDate ||
        item.dueDate ||
        "";

      const shiftedStart = shiftDateByWorkingDelta(baseStart, delta);
      const shiftedDue = shiftDateByWorkingDelta(baseDue, delta);

      return {
        ...item,
        startDate: shiftedStart,
        dueDate: shiftedDue,
        effectiveStartDate: shiftedStart,
        effectiveDueDate: shiftedDue,
      };
    });

    await preserveScrollAfter(async () => {
      await onUpdateCourse({
        ...course,
        tasks: updatedTasks,
      });
    });

    alert("Remaining timeline recalculated.");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "versionNumber" || name === "devStagger"
          ? Number(value)
          : name === "onboarding"
            ? value === "true"
            : value,
    }));
  };

  const handleEditingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!editingCourse) return;

    const { name, value } = e.target;

    setEditingCourse({
      ...editingCourse,
      [name]:
        name === "versionNumber" || name === "devStagger"
          ? Number(value)
          : name === "onboarding"
            ? value === "true"
            : value,
    });
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.program.trim()) {
      alert("Program is required.");
      return;
    }

    if (!formData.courseNumber.trim()) {
      alert("Course Number is required.");
      return;
    }

    if (!formData.courseTitle.trim()) {
      alert("Course Title is required.");
      return;
    }

    if (!formData.termStartDate) {
      alert("Term Start Date is required.");
      return;
    }

    if (!calculatedCourseDeadline) {
      alert("The course deadline could not be calculated. Check the term start date.");
      return;
    }

    const generatedTasks = calculateTimelineTasks(
      calculatedCourseDeadline,
      formData.onboarding,
      customBlocked
    );

    const tasks = normalizeGeneratedTasks(generatedTasks, calculatedCourseDeadline);

    const newCourse: CourseDevelopment = {
      program: formData.program.trim(),
      courseNumber: formData.courseNumber.trim().toUpperCase(),
      courseTitle: formData.courseTitle.trim(),
      canvasVersion: generatedCanvasVersion || formData.canvasVersion || "",
      workshopCourse: formData.workshopCourse.trim() || generatedWorkshopCourse,
      devType: formData.devType,
      versionNumber: Number(formData.versionNumber || 1),
      termRelease: formData.termRelease,
      termDeadline: calculatedCourseDeadline,
      calculatedDeadline: calculatedCourseDeadline,
      devStagger: Number(formData.devStagger || 14),
      onboarding: formData.onboarding,
      celTeam: {
        golf: "Dr. Golf Kanjanapongpaisal",
        chrystal: "Chrystal Wickline",
        admin: "CeL",
      },
      deptTeam: {
        smeName: formData.smeName.trim(),
        smeEmail: formData.smeEmail.trim(),
        deanName: formData.deanName.trim(),
        deanEmail: formData.deanEmail.trim(),
        managerName: formData.managerName.trim(),
        managerEmail: formData.managerEmail.trim(),
      },
      alertStatus: formData.alertStatus,
      courseNotes: formData.courseNotes.trim(),
      hideCompletedTasks: true,
      tasks,
    };

    await onAddCourse(newCourse);
    setFormData(emptyCourseForm);
    setShowCreateForm(false);
  };

  const startEditingCourse = (course: CourseDevelopment) => {
    setEditingCourse({
      program: course.program || "",
      courseNumber: course.courseNumber || "",
      courseTitle: course.courseTitle || "",
      canvasVersionSuffix: "",
      canvasVersion: course.canvasVersion || "",
      workshopCourse: course.workshopCourse || "",
      devType: course.devType || "Original",
      versionNumber: Number(course.versionNumber || 1),
      termRelease: course.termRelease || "Fall B",
      termStartDate: "",
      termDeadline: course.termDeadline || "",
      devStagger: Number(course.devStagger || 14),
      onboarding: !!course.onboarding,
      smeName: course.deptTeam?.smeName || "",
      smeEmail: course.deptTeam?.smeEmail || "",
      deanName: course.deptTeam?.deanName || "",
      deanEmail: course.deptTeam?.deanEmail || "",
      managerName: course.deptTeam?.managerName || "",
      managerEmail: course.deptTeam?.managerEmail || "",
      courseNotes: course.courseNotes || "",
      alertStatus: course.alertStatus || "No Concerns",
    });
  };

  const cancelEditingCourse = () => {
    setEditingCourse(null);
  };

  const saveEditingCourse = async () => {
    if (!activeCourse || !editingCourse) return;

    if (!editingCourse.program.trim()) {
      alert("Program is required.");
      return;
    }

    if (!editingCourse.courseNumber.trim()) {
      alert("Course Number is required.");
      return;
    }

    if (!editingCourse.courseTitle.trim()) {
      alert("Course Title is required.");
      return;
    }

    const updatedCourse: CourseDevelopment = {
      ...activeCourse,
      program: editingCourse.program.trim(),
      courseNumber: editingCourse.courseNumber.trim().toUpperCase(),
      courseTitle: editingCourse.courseTitle.trim(),
      canvasVersion: editingCourse.canvasVersion.trim(),
      workshopCourse: editingCourse.workshopCourse.trim(),
      devType: editingCourse.devType,
      versionNumber: Number(editingCourse.versionNumber || 1),
      termRelease: editingCourse.termRelease,
      termDeadline: editingCourse.termDeadline || activeCourse.termDeadline,
      calculatedDeadline: editingCourse.termDeadline || activeCourse.calculatedDeadline,
      devStagger: Number(editingCourse.devStagger || 14),
      onboarding: editingCourse.onboarding,
      deptTeam: {
        smeName: editingCourse.smeName.trim(),
        smeEmail: editingCourse.smeEmail.trim(),
        deanName: editingCourse.deanName.trim(),
        deanEmail: editingCourse.deanEmail.trim(),
        managerName: editingCourse.managerName.trim(),
        managerEmail: editingCourse.managerEmail.trim(),
      },
      alertStatus: editingCourse.alertStatus,
      courseNotes: editingCourse.courseNotes.trim(),
    };

    await preserveScrollAfter(async () => {
      await onUpdateCourse(updatedCourse);
    });

    setEditingCourse(null);
  };

  const regenerateTimeline = async (course: CourseDevelopment) => {
    const confirmed = window.confirm(
      "Regenerate this course timeline? This will replace the generated task dates."
    );

    if (!confirmed) return;

    const generatedTasks = calculateTimelineTasks(
      course.termDeadline,
      course.onboarding,
      customBlocked
    );

    const tasks = normalizeGeneratedTasks(generatedTasks, course.termDeadline);

    await preserveScrollAfter(async () => {
      await onUpdateCourse({
        ...course,
        tasks,
      });
    });
  };

  const quickToggleTaskStatus = async (
    course: CourseDevelopment,
    task: CourseDevelopmentTask
  ) => {
    const nextStatus = task.status === "Complete" ? "Not Started" : "Complete";

    const updatedTasks = (course.tasks || []).map((item) =>
      item.id === task.id ? { ...item, status: nextStatus } : item
    );

    await preserveScrollAfter(async () => {
      await onUpdateCourse({
        ...course,
        tasks: updatedTasks,
      });
    });
  };

  const deleteCourse = async (course: CourseDevelopment) => {
    if (!course.id) {
      alert("This course is missing an ID and cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${course.courseNumber}: ${course.courseTitle}?`
    );

    if (confirmed) {
      await onDeleteCourse(course.id);
      if (selectedId === course.id) setSelectedId("");
    }
  };

  const calculateProgress = (course: CourseDevelopment) => {
    const applicableTasks = (course.tasks || []).filter(
      (task) => task.status !== "Not Applicable"
    );

    if (!applicableTasks.length) return 0;

    const completedTasks = applicableTasks.filter(
      (task) => task.status === "Complete"
    );

    return Math.round((completedTasks.length / applicableTasks.length) * 100);
  };

  const getCompletionDate = (course: CourseDevelopment) => {
    const projectCloseoutTask =
      course.tasks?.find((task) =>
        task.name?.toLowerCase().includes("project completion")
      ) ||
      course.tasks?.find((task) =>
        task.phase?.toLowerCase().includes("project closeout")
      ) ||
      course.tasks?.find((task) =>
        task.name?.toLowerCase().includes("course completion")
      );

    return projectCloseoutTask?.dueDate || course.termDeadline || "Not set";
  };

  const getComplianceStatus = (course: CourseDevelopment) => {
    const closeoutTask =
      course.tasks?.find((task) =>
        task.name?.toLowerCase().includes("code check and archive")
      ) ||
      course.tasks?.find((task) =>
        task.phase?.toLowerCase().includes("project closeout")
      );

    if (!closeoutTask?.dueDate || !course.termDeadline) {
      return {
        compliant: true,
        message: "Timeline compliance cannot be evaluated yet.",
      };
    }

    try {
      const businessDays = countWorkingDaysBetween(
        closeoutTask.dueDate,
        course.termDeadline,
        customBlocked
      );

      return {
        compliant: businessDays >= 30,
        message:
          businessDays >= 30
            ? `${businessDays} business days between closeout and course deadline.`
            : `Only ${businessDays} business days between closeout and course deadline.`,
      };
    } catch {
      return {
        compliant: false,
        message: "Timeline compliance could not be calculated.",
      };
    }
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

  const visibleTasks = activeCourse
    ? sortTasksByStartDate(
        (activeCourse.tasks || []).filter((task) =>
          showCompletedTasks ? true : task.status !== "Complete"
        )
      )
    : [];

  const renderCourseFields = (
    data: CourseFormData,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => void,
    isEditing = false
  ) => {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Program
          </label>
          <input
            type="text"
            name="program"
            value={data.program}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Example: Health Navigation"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Course Number
          </label>
          <input
            type="text"
            name="courseNumber"
            value={data.courseNumber}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono uppercase"
            placeholder="HSA2322"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Course Title
          </label>
          <input
            type="text"
            name="courseTitle"
            value={data.courseTitle}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Course title"
            required
          />
        </div>

        {!isEditing && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Canvas Version Suffix
            </label>
            <input
              type="text"
              name="canvasVersionSuffix"
              value={data.canvasVersionSuffix}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="v1a"
            />
            <p className="mt-1 text-xs text-slate-500">
              Preview: {generatedCanvasVersion || "cel-[course number]-[suffix]"}
            </p>
          </div>
        )}

        {isEditing && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Canvas Version
            </label>
            <input
              type="text"
              name="canvasVersion"
              value={data.canvasVersion}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="cel-hsa2322-v1a"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Workshop Course
          </label>
          <input
            type="text"
            name="workshopCourse"
            value={data.workshopCourse}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder={generatedWorkshopCourse || "Optional"}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Development Type
          </label>
          <select
            name="devType"
            value={data.devType}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option value="Original">Original Development</option>
            <option value="New Release">New Release</option>
            <option value="Tier 1 & 2 Revision">Tier 1 &amp; 2 Revision</option>
            <option value="Modification">Modification</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Version Number
          </label>
          <input
            type="number"
            name="versionNumber"
            value={data.versionNumber}
            onChange={onChange}
            min={1}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Term Release
          </label>
          <select
            name="termRelease"
            value={data.termRelease}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>Spring A</option>
            <option>Spring B</option>
            <option>Spring C</option>
            <option>Summer A</option>
            <option>Summer B</option>
            <option>Summer C</option>
            <option>Fall A</option>
            <option>Fall B</option>
            <option>Fall C</option>
          </select>
        </div>

        {!isEditing && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Term Start Date
            </label>
            <input
              type="date"
              name="termStartDate"
              value={data.termStartDate}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Course deadline: {calculatedCourseDeadline || "Calculated as 30 business days before term start"}
            </p>
          </div>
        )}

        {isEditing && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Course Deadline
            </label>
            <input
              type="date"
              name="termDeadline"
              value={data.termDeadline}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Development Stagger Days
          </label>
          <input
            type="number"
            name="devStagger"
            value={data.devStagger}
            onChange={onChange}
            min={1}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Onboarding
          </label>
          <select
            name="onboarding"
            value={String(data.onboarding)}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            ALERTS
          </label>
          <select
            name="alertStatus"
            value={data.alertStatus}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option>No Concerns</option>
            <option>Potential Concerns</option>
            <option>High Priority Concerns</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            SME Name
          </label>
          <input
            type="text"
            name="smeName"
            value={data.smeName}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Professor full name"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            SME Email
          </label>
          <input
            type="email"
            name="smeEmail"
            value={data.smeEmail}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="sme@fscj.edu"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Dean Name
          </label>
          <input
            type="text"
            name="deanName"
            value={data.deanName}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Dean full name"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Dean Email
          </label>
          <input
            type="email"
            name="deanEmail"
            value={data.deanEmail}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="dean@fscj.edu"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            PM Name
          </label>
          <input
            type="text"
            name="managerName"
            value={data.managerName}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            PM Email
          </label>
          <input
            type="email"
            name="managerEmail"
            value={data.managerEmail}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Optional"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            name="courseNotes"
            value={data.courseNotes}
            onChange={onChange}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Course development notes"
          />
        </div>
      </div>
    );
  };

  const renderCreateCoursePanel = () => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 p-6 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#003E52] p-3 text-white">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Create Course Development
              </h2>
              <p className="text-sm text-slate-600">
                Open this panel only when creating a new course development.
              </p>
            </div>
          </div>

          {showCreateForm ? (
            <ChevronDown className="h-5 w-5 text-slate-500" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-500" aria-hidden="true" />
          )}
        </button>

        {showCreateForm && (
          <div className="border-t border-slate-200 p-6">
            <form onSubmit={createCourse} className="space-y-4">
              {renderCourseFields(formData, handleInputChange, false)}

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
              >
                <PlusCircle className="h-5 w-5" aria-hidden="true" />
                Create Course Development
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#003E52] p-3 text-white">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Course Developments</h1>
            <p className="text-sm text-slate-600">
              View active course developments first. Create new courses from the collapsible panel below.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Course Development List</h3>

          {safeCourses.length === 0 ? (
            <p className="text-sm text-slate-600">No course developments have been added yet.</p>
          ) : (
            <div className="space-y-3">
              {safeCourses.map((course) => {
                const progress = calculateProgress(course);
                const isSelected = activeCourse?.id === course.id;

                return (
                  <button
                    key={course.id || course.courseNumber}
                    type="button"
                    onClick={() => {
  const nextId = course.id || "";
  setSelectedId(nextId);
  localStorage.setItem("workloadHubSelectedCourseId", nextId);
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
                          {course.courseNumber}: {course.courseTitle}
                        </h4>
                        <p className={`mt-1 text-sm ${isSelected ? "text-slate-100" : "text-slate-600"}`}>
                          {course.program || "Program not entered"}
                        </p>
                        <p className={`mt-1 text-xs ${isSelected ? "text-slate-100" : "text-slate-500"}`}>
                          Deadline: {course.termDeadline || "Not set"}
                        </p>
                      </div>

                      <span
                        className="rounded-full px-2 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: devTypeColors[course.devType] || "#003E52" }}
                      >
                        {course.devType}
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
          {!activeCourse ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-600">
                Select a course development to view details.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {editingCourse ? (
                  <div>
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">Edit Course Development</h3>
                      <button
                        type="button"
                        onClick={cancelEditingCourse}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-4">
                      {renderCourseFields(editingCourse, handleEditingChange, true)}

                      <button
                        type="button"
                        onClick={saveEditingCourse}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
                      >
                        <Save className="h-5 w-5" aria-hidden="true" />
                        Save Course Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {activeCourse.courseNumber}: {activeCourse.courseTitle}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{activeCourse.program}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Canvas: {activeCourse.canvasVersion || "Not entered"} · Workshop:{" "}
                          {activeCourse.workshopCourse || "Not entered"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ backgroundColor: devTypeColors[activeCourse.devType] || "#003E52" }}
                        >
                          {activeCourse.devType}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getAlertBadgeClass(
                            activeCourse.alertStatus
                          )}`}
                        >
                          {activeCourse.alertStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditingCourse(activeCourse)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => regenerateTimeline(activeCourse)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          Regenerate Timeline
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCourse(activeCourse)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-500">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            Deadline
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {activeCourse.termDeadline || "Not set"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          30 business days before term start
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-500">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            Completion
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {getCompletionDate(activeCourse)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Pulled from Project Closeout
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-500">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            Progress
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {calculateProgress(activeCourse)}%
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Based on completed tasks
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      {(() => {
                        const compliance = getComplianceStatus(activeCourse);
                        return (
                          <div className="flex gap-3">
                            {compliance.compliant ? (
                              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" aria-hidden="true" />
                            ) : (
                              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-700" aria-hidden="true" />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Timeline Compliance
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {compliance.message}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Timeline Tasks
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Edit dates, status, and notes locally, then click Save Task Changes.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={showCompletedTasks}
                      onChange={(e) => setShowCompletedTasks(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Show completed tasks
                  </label>
                </div>

                {visibleTasks.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No visible tasks. Turn on “Show completed tasks” or regenerate the timeline.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {visibleTasks.map((task) => {
                      const draft = getTaskDraft(task);
                      const hasChanges = hasTaskDraftChanges(task);

                      return (
                        <article key={task.id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => quickToggleTaskStatus(activeCourse, task)}
                                className="mt-1"
                                aria-label={`Toggle ${task.name}`}
                              >
                                {task.status === "Complete" ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-700" aria-hidden="true" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-500" aria-hidden="true" />
                                )}
                              </button>

                              <div>
                                <h5 className="font-medium text-slate-900">{task.name}</h5>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  {task.phase}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                      roleColors[task.assignedTo] || "bg-slate-700 text-white"
                                    }`}
                                  >
                                    {task.assignedTo}
                                  </span>
                                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                                    {task.status}
                                  </span>
                                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                                    {task.durationDays} day(s)
                                  </span>
                                  {hasChanges && (
                                    <span className="rounded-full bg-orange-700 px-2 py-1 text-xs font-medium text-white">
                                      Unsaved Changes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={draft.startDate || ""}
                                  onChange={(e) =>
                                    updateTaskDraft(task, "startDate", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                  Due Date
                                </label>
                                <input
                                  type="date"
                                  value={draft.dueDate || ""}
                                  onChange={(e) =>
                                    updateTaskDraft(task, "dueDate", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                  Status
                                </label>
                                <select
                                  value={draft.status}
                                  onChange={(e) =>
                                    updateTaskDraft(
                                      task,
                                      "status",
                                      e.target.value as CourseDevelopmentTask["status"]
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                  <option>Not Started</option>
                                  <option>In Progress</option>
                                  <option>Developing (Content)</option>
                                  <option>Developing (Canvas)</option>
                                  <option>Scheduled</option>
                                  <option>On Hold</option>
                                  <option>Submission Late (SME)</option>
                                  <option>Complete</option>
                                  <option>Not Applicable</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                  Task Notes
                                </label>
                                <textarea
                                  value={draft.notes || ""}
                                  onChange={(e) =>
                                    updateTaskDraft(task, "notes", e.target.value)
                                  }
                                  rows={3}
                                  placeholder="Add task-specific notes..."
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2 sm:col-span-2">
                                <button
                                  type="button"
                                  onClick={() => saveTaskChanges(activeCourse, task)}
                                  disabled={!hasChanges}
                                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                                    hasChanges
                                      ? "bg-[#003E52] text-white hover:bg-[#073C5C]"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  <Save className="h-4 w-4" aria-hidden="true" />
                                  Save Task Changes
                                </button>

                                <button
                                  type="button"
                                  onClick={() => recalculateRemainingTimeline(activeCourse, task)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-[#003E52] bg-white px-3 py-2 text-sm font-medium text-[#003E52] hover:bg-slate-50"
                                >
                                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                  Recalculate Remaining Timeline
                                </button>

                                {hasChanges && (
                                  <button
                                    type="button"
                                    onClick={() => clearTaskDraft(task)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {renderCreateCoursePanel()}
    </section>
  );
}
