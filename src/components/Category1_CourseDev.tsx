import React, { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  PlusCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
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
  workshopCourse: string;
  devType: CourseDevelopment["devType"];
  versionNumber: number;
  termRelease: CourseDevelopment["termRelease"];
  termStartDate: string;
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

const emptyCourseForm: CourseFormData = {
  program: "",
  courseNumber: "",
  courseTitle: "",
  canvasVersionSuffix: "",
  workshopCourse: "",
  devType: "Original",
  versionNumber: 1,
  termRelease: "Fall B",
  termStartDate: "",
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

export function Category1CourseDev({
  courseDevelopments,
  customBlocked,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
}: Category1Props) {
  const safeCourses = Array.isArray(courseDevelopments) ? courseDevelopments : [];

  const [selectedId, setSelectedId] = useState<string>("");
  const [formData, setFormData] = useState<CourseFormData>(emptyCourseForm);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

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

    const tasks = calculateTimelineTasks(
      calculatedCourseDeadline,
      formData.onboarding,
      customBlocked
    );

    const newCourse: CourseDevelopment = {
      program: formData.program.trim(),
      courseNumber: formData.courseNumber.trim().toUpperCase(),
      courseTitle: formData.courseTitle.trim(),
      canvasVersion: generatedCanvasVersion || "",
      workshopCourse: formData.workshopCourse.trim() || generatedWorkshopCourse,
      devType: formData.devType,
      versionNumber: Number(formData.versionNumber || 1),
      termRelease: formData.termRelease,
      termDeadline: calculatedCourseDeadline,
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
  };

  const regenerateTimeline = async (course: CourseDevelopment) => {
    const confirmed = window.confirm(
      "Regenerate this course timeline? This will replace the generated task dates."
    );

    if (!confirmed) return;

    const tasks = calculateTimelineTasks(
      course.termDeadline,
      course.onboarding,
      customBlocked
    );

    await onUpdateCourse({
      ...course,
      tasks,
    });
  };

  const updateTaskStatus = async (
    course: CourseDevelopment,
    task: CourseDevelopmentTask,
    status: CourseDevelopmentTask["status"]
  ) => {
    const updatedTasks = (course.tasks || []).map((item) =>
      item.id === task.id ? { ...item, status } : item
    );

    await onUpdateCourse({
      ...course,
      tasks: updatedTasks,
    });
  };

  const updateTaskDate = async (
    course: CourseDevelopment,
    task: CourseDevelopmentTask,
    field: "startDate" | "dueDate",
    value: string
  ) => {
    const updatedTasks = (course.tasks || []).map((item) =>
      item.id === task.id ? { ...item, [field]: value } : item
    );

    await onUpdateCourse({
      ...course,
      tasks: updatedTasks,
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
    ? (activeCourse.tasks || []).filter((task) =>
        showCompletedTasks ? true : task.status !== "Complete"
      )
    : [];

  const groupedTasks = visibleTasks.reduce<Record<string, CourseDevelopmentTask[]>>(
    (groups, task) => {
      const phase = task.phase || "Other";
      if (!groups[phase]) groups[phase] = [];
      groups[phase].push(task);
      return groups;
    },
    {}
  );

  const renderCreateCourseForm = () => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-[#003E52] p-3 text-white">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Course Developments</h2>
            <p className="text-sm text-slate-600">
              Create and manage course development timelines without opening a popup window.
            </p>
          </div>
        </div>

        <form onSubmit={createCourse} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Program
            </label>
            <input
              type="text"
              name="program"
              value={formData.program}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Example: Health Services Administration"
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
              value={formData.courseNumber}
              onChange={handleInputChange}
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
              value={formData.courseTitle}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Course title"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Canvas Version Suffix
            </label>
            <input
              type="text"
              name="canvasVersionSuffix"
              value={formData.canvasVersionSuffix}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="v1a"
            />
            <p className="mt-1 text-xs text-slate-500">
              Preview: {generatedCanvasVersion || "cel-[course number]-[suffix]"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Workshop Course
            </label>
            <input
              type="text"
              name="workshopCourse"
              value={formData.workshopCourse}
              onChange={handleInputChange}
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
              value={formData.devType}
              onChange={handleInputChange}
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
              value={formData.versionNumber}
              onChange={handleInputChange}
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
              value={formData.termRelease}
              onChange={handleInputChange}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Term Start Date
            </label>
            <input
              type="date"
              name="termStartDate"
              value={formData.termStartDate}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Course deadline: {calculatedCourseDeadline || "Calculated as 30 business days before term start"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Development Stagger Days
            </label>
            <input
              type="number"
              name="devStagger"
              value={formData.devStagger}
              onChange={handleInputChange}
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
              value={String(formData.onboarding)}
              onChange={handleInputChange}
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
              value={formData.alertStatus}
              onChange={handleInputChange}
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
              value={formData.smeName}
              onChange={handleInputChange}
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
              value={formData.smeEmail}
              onChange={handleInputChange}
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
              value={formData.deanName}
              onChange={handleInputChange}
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
              value={formData.deanEmail}
              onChange={handleInputChange}
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
              value={formData.managerName}
              onChange={handleInputChange}
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
              value={formData.managerEmail}
              onChange={handleInputChange}
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
              value={formData.courseNotes}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Course development notes"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#003E52] px-4 py-2 font-medium text-white hover:bg-[#073C5C]"
            >
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
              Create Course Development
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {renderCreateCourseForm()}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                    onClick={() => setSelectedId(course.id || "")}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#003E52] bg-[#003E52]/5"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {course.courseNumber}: {course.courseTitle}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {course.program || "Program not entered"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
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
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[#087834]"
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

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Subject Matter Expert
                    </p>
                    <p className="mt-1 text-sm text-slate-900">
                      {activeCourse.deptTeam?.smeName || "Not entered"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activeCourse.deptTeam?.smeEmail || "No email entered"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dean
                    </p>
                    <p className="mt-1 text-sm text-slate-900">
                      {activeCourse.deptTeam?.deanName || "Not entered"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activeCourse.deptTeam?.deanEmail || "No email entered"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      PM
                    </p>
                    <p className="mt-1 text-sm text-slate-900">
                      {activeCourse.deptTeam?.managerName || "Not entered"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activeCourse.deptTeam?.managerEmail || "No email entered"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                      {activeCourse.courseNotes || "No notes entered"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Timeline Tasks
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Generated course development tasks. Dates may be edited manually.
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
                  <div className="space-y-5">
                    {Object.entries(groupedTasks).map(([phase, tasks]) => (
                      <div key={phase} className="rounded-xl border border-slate-200">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                          <h4 className="text-sm font-semibold text-slate-900">{phase}</h4>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {tasks.map((task) => (
                            <article key={task.id} className="p-4">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTaskStatus(
                                        activeCourse,
                                        task,
                                        task.status === "Complete" ? "Not Started" : "Complete"
                                      )
                                    }
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
                                    </div>
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                      Start Date
                                    </label>
                                    <input
                                      type="date"
                                      value={task.startDate || ""}
                                      onChange={(e) =>
                                        updateTaskDate(activeCourse, task, "startDate", e.target.value)
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
                                      value={task.dueDate || ""}
                                      onChange={(e) =>
                                        updateTaskDate(activeCourse, task, "dueDate", e.target.value)
                                      }
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                      Status
                                    </label>
                                    <select
                                      value={task.status}
                                      onChange={(e) =>
                                        updateTaskStatus(
                                          activeCourse,
                                          task,
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
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
