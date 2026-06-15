import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CourseDevelopment, CourseDevelopmentTask } from '../types';
import { 
  FileText, Calendar, Plus, Mail, CheckCircle2, AlertTriangle, 
  Trash2, Sliders, ChevronRight, Share2, Clipboard, ShieldAlert,
  SlidersHorizontal, Sparkles, Pencil, Save, X, Archive
} from 'lucide-react';
import { 
  countWorkingDaysBetween, 
  formatDate,
  parseDate,
  stepWorkingDays,
  isWorkingDay
} from '../utils/calendarEngine';

interface Category1Props {
  courseDevelopments: CourseDevelopment[];
  customBlocked: string[];
  onAddCourse: (course: CourseDevelopment) => Promise<void>;
  onUpdateCourse: (course: CourseDevelopment) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
}


type TimelineSubtask = {
  id: string;
  title: string;
  complete: boolean;
};

type TimelineTaskExtra = CourseDevelopmentTask & {
  notes?: string;
  subtasks?: TimelineSubtask[];
  durationLabel?: string;
};

const addCalendarDays = (dateStr: string, days: number) => {
  const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

const normalizeTimelineSubtasks = (subtasks?: Array<string | Partial<TimelineSubtask>>): TimelineSubtask[] => {
  if (!subtasks?.length) return [];

  return subtasks.map((subtask, index) => {
    if (typeof subtask === 'string') {
      return {
        id: `subtask-${index + 1}`,
        title: subtask,
        complete: false,
      };
    }

    return {
      id: subtask.id || `subtask-${index + 1}`,
      title: subtask.title || '',
      complete: !!subtask.complete,
    };
  });
};

const buildCourseDevelopmentTimeline = (projectedCourseCompletionDate: string, onboarding: boolean): CourseDevelopmentTask[] => {
  const finalReviewStart = projectedCourseCompletionDate;
  const midpointStart = addCalendarDays(finalReviewStart, -60);
  const kickoffStart = addCalendarDays(midpointStart, -30);
  const completeCourseDesignPlanStart = addCalendarDays(kickoffStart, -14);
  const finalizeCourseDesignPlanStart = addCalendarDays(completeCourseDesignPlanStart, -10);
  const initialMeetingStart = finalizeCourseDesignPlanStart;
  const onboardingMeetingStart = addCalendarDays(initialMeetingStart, -14);
  const introductionEmailStart = addCalendarDays(onboardingMeetingStart, -7);
  const startCompensationStart = addCalendarDays(introductionEmailStart, -7);
  const moduleTemplateStart = completeCourseDesignPlanStart;
  const moduleTemplateDue = addCalendarDays(moduleTemplateStart, 14);

  const task = (
    id: number,
    name: string,
    category: string,
    owner: string,
    startDate: string,
    dueDate: string,
    durationDays: number,
    subtasks?: string[],
    notes?: string,
    durationLabel?: string
  ): TimelineTaskExtra => ({
    id,
    name,
    phase: category,
    assignedTo: owner,
    startDate,
    dueDate,
    durationDays,
    status: 'Not Started',
    notes: notes || '',
    subtasks: normalizeTimelineSubtasks(subtasks),
    durationLabel: durationLabel || (durationDays > 0 ? `${durationDays} days` : ''),
  } as TimelineTaskExtra);

  const getModuleBaseId = (moduleNumber: number) => {
    const baseIds: Record<number, number> = {
      1: 14,
      2: 17,
      3: 20,
      4: 26,
      5: 29,
      6: 32,
      7: 35,
    };

    return baseIds[moduleNumber];
  };

  const moduleTasks = (moduleNumber: number, offsetFromTemplates: number, multimediaDueAnchor: string): TimelineTaskExtra[] => {
    const developStart = addCalendarDays(moduleTemplateStart, offsetFromTemplates);
    const developDue = addCalendarDays(developStart, 5);
    const reviewStart = addCalendarDays(developDue, 1);
    const reviewDue = reviewStart;
    const multimediaStart = reviewDue;
    const multimediaDue = addCalendarDays(multimediaDueAnchor, -5);
    const baseId = getModuleBaseId(moduleNumber);

    return [
      task(baseId, `Develop Module ${moduleNumber} content`, 'Course Development', 'Subject Matter Expert', developStart, developDue, 5),
      task(baseId + 1, `Review & Build Module ${moduleNumber} content`, 'Course Development', 'Instructional Designer', reviewStart, reviewDue, 1, [`Enter Module ${moduleNumber} multimedia task in Quickbase`]),
      task(baseId + 2, `Develop Module ${moduleNumber} multimedia content`, 'Course Development', 'Multimedia', multimediaStart, multimediaDue, 0),
    ];
  };

  const tasks: TimelineTaskExtra[] = [
    task(1, 'Start compensation', 'Milestone', 'Operations', startCompensationStart, finalReviewStart, 0),
    task(2, 'Send SME introduction email', 'Project Management', 'Instructional Designer', introductionEmailStart, introductionEmailStart, 0, ['Schedule onboarding meeting', 'Customize onboarding presentation'], undefined, '5 hours'),
    task(3, 'Send onboarding reminder', 'Discovery & Planning', 'Instructional Designer', addCalendarDays(onboardingMeetingStart, -2), addCalendarDays(onboardingMeetingStart, -2), 0, undefined, undefined, '15 minutes'),
    task(4, 'Conduct onboarding meeting', 'Discovery & Planning; Project Management', 'Instructional Designer', onboardingMeetingStart, onboardingMeetingStart, 1, ['Finalize timeline', 'Send recap email', 'Schedule initial meeting', 'Enter course development tasks into Quickbase', 'Obtain course outline']),
    task(5, 'Schedule initial meeting', 'Project Management', 'Instructional Designer', addCalendarDays(initialMeetingStart, -2), addCalendarDays(initialMeetingStart, -2), 0, undefined, `Schedule meeting the week of ${formatDisplayDateShortSafe(initialMeetingStart)}`, '15 minutes'),
    task(6, 'Conduct initial meeting', 'Project Management; Course Design', 'Instructional Designer', initialMeetingStart, initialMeetingStart, 1, ['Draft Course Design Plan', 'Send Course Design Plan draft to SME']),
    task(7, 'Finalize Course Design Plan', 'Course Design', 'Subject Matter Expert', finalizeCourseDesignPlanStart, addCalendarDays(finalizeCourseDesignPlanStart, 5), 5),
    task(8, 'Schedule kickoff meeting', 'Project Management', 'Instructional Designer', addCalendarDays(initialMeetingStart, -2), addCalendarDays(initialMeetingStart, -2), 0, undefined, `Schedule meeting the week of ${formatDisplayDateShortSafe(kickoffStart)}`, '15 minutes'),
    task(9, 'Complete Course Design Plan', 'Course Design', 'Instructional Designer', completeCourseDesignPlanStart, completeCourseDesignPlanStart, 1, ['Analyze instructional material accessibility']),
    task(10, 'Send kickoff reminder and agenda', 'Stakeholder Engagement', 'Instructional Designer', addCalendarDays(kickoffStart, -2), addCalendarDays(kickoffStart, -2), 0, undefined, undefined, '15 minutes'),
    task(11, 'Conduct kickoff meeting', 'Milestone', 'Instructional Designer', kickoffStart, kickoffStart, 1, ['Send kickoff meeting recap', 'Enter instructional materials into Quickbase', 'Request Canvas shell in Quickbase']),
    task(12, 'Schedule midpoint meeting', 'Project Management', 'Instructional Designer', addCalendarDays(initialMeetingStart, -2), addCalendarDays(initialMeetingStart, -2), 0, undefined, `Schedule meeting the week of ${formatDisplayDateShortSafe(midpointStart)}`, '15 minutes'),
    task(13, 'Create module templates', 'Course Development', 'Instructional Designer', moduleTemplateStart, moduleTemplateDue, 14, ['Coordinate module delivery schedule', 'Configure calendar reminders', 'Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5', 'Module 6', 'Module 7']),
    ...moduleTasks(1, 2, midpointStart),
    ...moduleTasks(2, 7, midpointStart),
    ...moduleTasks(3, 12, midpointStart),
    task(23, 'Send midpoint reminder and agenda', 'Stakeholder Engagement', 'Instructional Designer', addCalendarDays(midpointStart, -2), addCalendarDays(midpointStart, -2), 0, undefined, undefined, '15 minutes'),
    task(24, 'Conduct midpoint review', 'Milestone', 'Instructional Designer', midpointStart, midpointStart, 1, ['Send midpoint review meeting recap']),
    task(25, 'Schedule final meeting', 'Project Management', 'Instructional Designer', addCalendarDays(initialMeetingStart, -2), addCalendarDays(initialMeetingStart, -2), 0, undefined, `Schedule meeting the week of ${formatDisplayDateShortSafe(addCalendarDays(midpointStart, 40))}`, '15 minutes'),
    ...moduleTasks(4, 17, finalReviewStart),
    ...moduleTasks(5, 22, finalReviewStart),
    ...moduleTasks(6, 27, finalReviewStart),
    ...moduleTasks(7, 32, finalReviewStart),
  ];

  const reviewBuildModule7 = tasks.find((item) => item.name === 'Review & Build Module 7 content');
  const finalizeDocsStart = addCalendarDays(reviewBuildModule7?.startDate || moduleTemplateStart, 1);
  const finalizeDocsDue = addCalendarDays(finalizeDocsStart, 3);
  const proofRequestStart = finalizeDocsDue;
  const proofRequestDue = addCalendarDays(proofRequestStart, 1);
  const proofreadingStart = proofRequestDue;
  const proofreadingDue = addCalendarDays(proofreadingStart, 5);
  const preQaStart = proofreadingDue;
  const preQaDue = addCalendarDays(preQaStart, 1);
  const qaStart = preQaDue;
  const qaDue = addCalendarDays(qaStart, 5);

  tasks.push(
    task(38, 'Finalize course documents', 'Course Development', 'Subject Matter Expert', finalizeDocsStart, finalizeDocsDue, 3),
    task(39, 'Submit proofreading request', 'Quality Assurance', 'Instructional Designer', proofRequestStart, proofRequestDue, 1),
    task(40, 'Complete proofreading', 'Quality Assurance', 'Quality Assurance', proofreadingStart, proofreadingDue, 5),
    task(41, 'Complete pre-QA checklist', 'Quality Assurance', 'Instructional Designer', preQaStart, preQaDue, 1, ['Request QA review in Quickbase']),
    task(42, 'Complete QA review', 'Quality Assurance', 'Quality Assurance', qaStart, qaDue, 5, ['Address QA findings']),
    task(43, 'Send final review reminder and agenda', 'Stakeholder Engagement', 'Instructional Designer', addCalendarDays(finalReviewStart, -2), addCalendarDays(finalReviewStart, -2), 0, undefined, undefined, '15 minutes'),
    task(44, 'Conduct final review', 'Milestone', 'Instructional Designer', finalReviewStart, finalReviewStart, 1, ['Send final review meeting recap']),
    task(45, 'End compensation', 'Project Closeout', 'Instructional Designer', finalReviewStart, finalReviewStart, 1, ['Send stipend notification email', 'Request stipend completion in Quickbase', 'Request code check and archive in Quickbase']),
    task(46, 'Course completion', 'Milestone', 'Instructional Designer', finalReviewStart, finalReviewStart, 5, ['Multimedia complete code check and archive', 'Request course completion in Quickbase', 'Send project completion notification email'])
  );

  if (!onboarding) {
    return tasks.map((item) => {
      if ([2, 3, 4].includes(item.id as number)) {
        return { ...item, status: 'Not Applicable' };
      }
      return item;
    });
  }

  return tasks;
};

function formatDisplayDateShortSafe(dateStr?: string) {
  if (!dateStr) return 'TBD';
  const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'TBD';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
}

export function Category1CourseDev({ 
  courseDevelopments, 
  customBlocked,
  onAddCourse, 
  onUpdateCourse, 
  onDeleteCourse 
}: Category1Props) {
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window === 'undefined') return courseDevelopments[0]?.id || '';
    return localStorage.getItem('workloadHubSelectedCourseId') || courseDevelopments[0]?.id || '';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState<CourseDevelopmentTask | null>(null);
  const [editingCourse, setEditingCourse] = useState<typeof formData | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, Partial<CourseDevelopmentTask & { notes?: string }>>>({});
  const taskListRef = useRef<HTMLDivElement | null>(null);
  const pendingTaskScrollRestoreRef = useRef<{
    taskId: number | string;
    scrollTop: number;
    scrollLeft: number;
    windowX: number;
    windowY: number;
    activeElementName: string;
  } | null>(null);

  // Form states for new Course
  const [formData, setFormData] = useState({
    program: '',
    courseNumber: '',
    courseTitle: '',
    canvasVersion: '',
    workshopCourse: '',
    devType: 'Original' as const,
    versionNumber: 1,
    termRelease: 'Fall B' as const,
    termDeadline: '2026-12-15',
    devStagger: 14,
    onboarding: true,
    smeName: '',
    smeEmail: '',
    deanName: '',
    deanEmail: '',
    managerName: '',
    managerEmail: '',
    courseNotes: '',
    alertStatus: 'No Concerns' as const,
  });

  const activeCourses = courseDevelopments.filter((course) => !(course as any).archived);
  const activeCourse = activeCourses.find(c => c.id === selectedId) || activeCourses[0];

  const selectCourse = (courseId: string) => {
    setSelectedId(courseId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('workloadHubSelectedCourseId', courseId);
    }
  };

  useEffect(() => {
    if (!activeCourses.length) {
      if (selectedId !== '') setSelectedId('');
      return;
    }

    const stillExists = activeCourses.some((course) => course.id === selectedId);
    if (selectedId && stillExists) return;

    const storedId = typeof window !== 'undefined'
      ? localStorage.getItem('workloadHubSelectedCourseId')
      : '';

    const nextId = activeCourses.find((course) => course.id === storedId)?.id || activeCourses[0]?.id || '';

    if (nextId && nextId !== selectedId) {
      setSelectedId(nextId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('workloadHubSelectedCourseId', nextId);
      }
    }
  }, [courseDevelopments, selectedId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleEditingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editingCourse) return;

    const { name, value } = e.target;
    setEditingCourse(prev => prev ? ({
      ...prev,
      [name]: name === 'versionNumber' || name === 'devStagger'
        ? Number(value)
        : name === 'onboarding'
          ? value === 'true'
          : value
    }) : prev);
  };

  const startEditingCourse = (course: CourseDevelopment) => {
    setEditingCourse({
      program: course.program || '',
      courseNumber: course.courseNumber || '',
      courseTitle: course.courseTitle || '',
      canvasVersion: course.canvasVersion || '',
      workshopCourse: course.workshopCourse || '',
      devType: course.devType || 'Original',
      versionNumber: Number(course.versionNumber || 1),
      termRelease: course.termRelease || 'Fall B',
      termDeadline: course.termDeadline || '',
      devStagger: Number(course.devStagger || 14),
      onboarding: !!course.onboarding,
      smeName: course.deptTeam?.smeName || '',
      smeEmail: course.deptTeam?.smeEmail || '',
      deanName: course.deptTeam?.deanName || '',
      deanEmail: course.deptTeam?.deanEmail || '',
      managerName: course.deptTeam?.managerName || '',
      managerEmail: course.deptTeam?.managerEmail || '',
      courseNotes: course.courseNotes || '',
      alertStatus: course.alertStatus || 'No Concerns',
    });
  };

  const cancelEditingCourse = () => {
    setEditingCourse(null);
  };

  const saveEditingCourse = async () => {
    if (!activeCourse || !editingCourse) return;

    if (!editingCourse.program.trim()) {
      alert('Program is required.');
      return;
    }

    if (!editingCourse.courseNumber.trim()) {
      alert('Course Number is required.');
      return;
    }

    if (!editingCourse.courseTitle.trim()) {
      alert('Course Title is required.');
      return;
    }

    await onUpdateCourse({
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
      calculatedDeadline: calculateProjectedCompletionDate(editingCourse.termDeadline || activeCourse.termDeadline),
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
    });

    setEditingCourse(null);
  };

  const getTaskKey = (task: CourseDevelopmentTask) => String(task.id);

  const getTaskDraft = (task: CourseDevelopmentTask) => {
    const key = getTaskKey(task);
    const stored = taskDrafts[key] || {};

    return {
      startDate: stored.startDate ?? task.startDate ?? '',
      dueDate: stored.dueDate ?? task.dueDate ?? '',
      status: stored.status ?? task.status,
      assignedTo: stored.assignedTo ?? task.assignedTo ?? '',
      notes: stored.notes ?? (task as any).notes ?? '',
    };
  };

  const updateTaskDraft = (task: CourseDevelopmentTask, field: string, value: string) => {
    const key = getTaskKey(task);
    setTaskDrafts(prev => ({
      ...prev,
      [key]: {
        ...getTaskDraft(task),
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const hasTaskDraftChanges = (task: CourseDevelopmentTask) => Boolean(taskDrafts[getTaskKey(task)]);

  const clearTaskDraft = (task: CourseDevelopmentTask) => {
    const key = getTaskKey(task);
    setTaskDrafts(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const restorePendingTaskScroll = () => {
    const pending = pendingTaskScrollRestoreRef.current;
    if (!pending) return;

    const taskList = taskListRef.current;

    if (taskList) {
      taskList.scrollTop = pending.scrollTop;
      taskList.scrollLeft = pending.scrollLeft;

      const editedTask = taskList.querySelector(`[data-task-id="${pending.taskId}"]`) as HTMLElement | null;
      if (editedTask) {
        const listRect = taskList.getBoundingClientRect();
        const taskRect = editedTask.getBoundingClientRect();

        if (taskRect.top < listRect.top || taskRect.bottom > listRect.bottom) {
          editedTask.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    }

    window.scrollTo(pending.windowX, pending.windowY);

    if (pending.activeElementName) {
      const focusedTaskField = document.querySelector(
        `[data-task-id="${pending.taskId}"] [name="${pending.activeElementName}"]`
      ) as HTMLElement | null;
      focusedTaskField?.focus?.({ preventScroll: true } as FocusOptions);
    }
  };

  useLayoutEffect(() => {
    if (!pendingTaskScrollRestoreRef.current) return;

    restorePendingTaskScroll();
    window.requestAnimationFrame(() => {
      restorePendingTaskScroll();
      window.setTimeout(restorePendingTaskScroll, 0);
      window.setTimeout(restorePendingTaskScroll, 100);
      window.setTimeout(() => {
        restorePendingTaskScroll();
        pendingTaskScrollRestoreRef.current = null;
      }, 250);
    });
  }, [courseDevelopments]);

  const preserveTaskListScroll = async (taskId: number | string, callback: () => Promise<void> | void) => {
    const taskList = taskListRef.current;
    const activeElement = document.activeElement as HTMLElement | null;

    pendingTaskScrollRestoreRef.current = {
      taskId,
      scrollTop: taskList?.scrollTop ?? 0,
      scrollLeft: taskList?.scrollLeft ?? 0,
      windowX: window.scrollX,
      windowY: window.scrollY,
      activeElementName: activeElement?.getAttribute('name') || '',
    };

    await callback();

    window.requestAnimationFrame(() => {
      restorePendingTaskScroll();
      window.setTimeout(restorePendingTaskScroll, 0);
      window.setTimeout(restorePendingTaskScroll, 100);
    });
  };

  const saveTaskChanges = async (task: CourseDevelopmentTask) => {
    if (!activeCourse) return;

    const draft = getTaskDraft(task);
    const updatedTasks = activeCourse.tasks.map(item => {
      if (item.id !== task.id) return item;

      return {
        ...item,
        assignedTo: draft.assignedTo || item.assignedTo,
        startDate: draft.startDate || '',
        dueDate: draft.dueDate || '',
        status: draft.status || item.status,
        notes: draft.notes || '',
      };
    });

    const preservedSelectedId = activeCourse.id || selectedId;

    if (preservedSelectedId && typeof window !== 'undefined') {
      localStorage.setItem('workloadHubSelectedCourseId', preservedSelectedId);
    }

    await preserveTaskListScroll(task.id, async () => {
      await onUpdateCourse({
        ...activeCourse,
        tasks: updatedTasks,
      });

      if (preservedSelectedId) {
        setSelectedId(preservedSelectedId);
      }

      clearTaskDraft(task);
    });
  };


  const autoSaveTaskField = async (task: CourseDevelopmentTask, field: string, value: string) => {
    if (!activeCourse) return;

    const updatedTasks = activeCourse.tasks.map(item => {
      if (item.id !== task.id) return item;

      return {
        ...item,
        [field]: value,
      };
    });

    const preservedSelectedId = activeCourse.id || selectedId;

    if (preservedSelectedId && typeof window !== 'undefined') {
      localStorage.setItem('workloadHubSelectedCourseId', preservedSelectedId);
    }

    await preserveTaskListScroll(task.id, async () => {
      await onUpdateCourse({
        ...activeCourse,
        tasks: updatedTasks,
      });

      if (preservedSelectedId) {
        setSelectedId(preservedSelectedId);
      }

      clearTaskDraft(task);
    });
  };

  const saveTaskNotesOnBlur = async (task: CourseDevelopmentTask) => {
    const draft = getTaskDraft(task);
    await autoSaveTaskField(task, 'notes', draft.notes || '');
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const formatDisplayDateShort = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}-${day}-${year}`;
  };

  const calculateProjectedCompletionDate = (startOfTerm?: string) => {
    if (!startOfTerm) return '';
    const date = new Date(`${startOfTerm.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() - 30);
    return formatDate(date);
  };

  const getProjectedCompletionDate = (course?: CourseDevelopment) => {
    if (!course) return '';
    return (course as any).calculatedDeadline || calculateProjectedCompletionDate(course.termDeadline);
  };

  const handleCheckboxChange = (name: 'onboarding') => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Start of Term is the static anchor. Projected Course Completion is 30 calendar days before it.
    const startOfTerm = formData.termDeadline;
    const projectedCompletionDate = calculateProjectedCompletionDate(startOfTerm);
    const generatedTasks = buildCourseDevelopmentTimeline(projectedCompletionDate, formData.onboarding);
    
    const newCourse: CourseDevelopment = {
      program: formData.program,
      courseNumber: formData.courseNumber.toUpperCase(),
      courseTitle: formData.courseTitle,
      canvasVersion: formData.canvasVersion || `cel-${formData.courseNumber.toUpperCase()}-v${formData.versionNumber}`,
      workshopCourse: formData.workshopCourse || `wickline-wrkshp-cel-${formData.courseNumber.toUpperCase()}-v${formData.versionNumber}`,
      devType: formData.devType,
      versionNumber: Number(formData.versionNumber),
      termRelease: formData.termRelease,
      termDeadline: startOfTerm,
      calculatedDeadline: projectedCompletionDate,
      devStagger: Number(formData.devStagger),
      onboarding: formData.onboarding,
      celTeam: {
        golf: 'Golf.K@fscj.edu',
        chrystal: 'wickline@fscj.edu',
        admin: 'cel@fscj.edu'
      },
      deptTeam: {
        smeName: formData.smeName,
        smeEmail: formData.smeEmail,
        deanName: formData.deanName,
        deanEmail: formData.deanEmail,
        managerName: formData.managerName,
        managerEmail: formData.managerEmail,
      },
      alertStatus: formData.alertStatus,
      courseNotes: formData.courseNotes,
      hideCompletedTasks: true,
      tasks: generatedTasks
    };

    await onAddCourse(newCourse);
    setShowAddModal(false);
    
    // Clear state
    setFormData({
      program: '',
      courseNumber: '',
      courseTitle: '',
      canvasVersion: '',
      workshopCourse: '',
      devType: 'Original',
      versionNumber: 1,
      termRelease: 'Fall B',
      termDeadline: '2026-12-15',
      devStagger: 14,
      onboarding: true,
      smeName: '',
      smeEmail: '',
      deanName: '',
      deanEmail: '',
      managerName: '',
      managerEmail: '',
      courseNotes: '',
      alertStatus: 'No Concerns',
    });
  };

  const handleToggleTask = async (taskId: number) => {
    if (!activeCourse) return;
    const updatedTasks = [...activeCourse.tasks];
    const taskIdx = updatedTasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;
    const task = updatedTasks[taskIdx];
    
    task.status = task.status === 'Complete' ? 'Not Started' : 'Complete';
    
    const updatedCourse = {
      ...activeCourse,
      tasks: updatedTasks
    };

    await preserveTaskListScroll(taskId, async () => {
      await onUpdateCourse(updatedCourse);
    });
  };


  const handleToggleSubtask = async (taskId: number, subtaskId: string) => {
    if (!activeCourse) return;

    const updatedTasks = activeCourse.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const subtasks = normalizeTimelineSubtasks((task as any).subtasks).map((subtask) => {
        if (subtask.id !== subtaskId) return subtask;
        return {
          ...subtask,
          complete: !subtask.complete,
        };
      });

      return {
        ...task,
        subtasks,
      };
    });

    await preserveTaskListScroll(taskId, async () => {
      await onUpdateCourse({
        ...activeCourse,
        tasks: updatedTasks,
      });
    });
  };

  const handleRecalculateTimeline = async (newStartOfTerm: string) => {
    if (!activeCourse) return;

    const projectedCompletionDate = calculateProjectedCompletionDate(newStartOfTerm);
    const recalculatedTasks = buildCourseDevelopmentTimeline(projectedCompletionDate, activeCourse.onboarding);

    // Maintain completed status for identical names if possible
    recalculatedTasks.forEach(newTask => {
      const existing = activeCourse.tasks.find(ot => ot.name === newTask.name);
      if (existing) {
        newTask.status = existing.status;
        (newTask as any).notes = (existing as any).notes || (newTask as any).notes || '';
        const existingSubtasks = normalizeTimelineSubtasks((existing as any).subtasks);
        const nextSubtasks = normalizeTimelineSubtasks((newTask as any).subtasks);
        (newTask as any).subtasks = nextSubtasks.map((subtask) => {
          const matchingExisting = existingSubtasks.find((item) => item.title === subtask.title);
          return matchingExisting ? { ...subtask, complete: matchingExisting.complete } : subtask;
        });
      }
    });

    const updatedCourse = {
      ...activeCourse,
      termDeadline: newStartOfTerm,
      calculatedDeadline: projectedCompletionDate,
      tasks: recalculatedTasks
    };

    await onUpdateCourse(updatedCourse);
  };

  const handleRecalculateCurrentTimeline = async () => {
    if (!activeCourse) return;
    await handleRecalculateTimeline(activeCourse.termDeadline);
  };

  const handleToggleOnboarding = async () => {
    if (!activeCourse) return;
    const nextOnboarding = !activeCourse.onboarding;
    const recalculatedTasks = buildCourseDevelopmentTimeline(getProjectedCompletionDate(activeCourse), nextOnboarding);
    const updatedCourse = {
      ...activeCourse,
      onboarding: nextOnboarding,
      tasks: recalculatedTasks
    };
    await onUpdateCourse(updatedCourse);
  };

  const handleToggleHideCompleted = async () => {
    if (!activeCourse) return;
    const updatedCourse = {
      ...activeCourse,
      hideCompletedTasks: !activeCourse.hideCompletedTasks
    };
    await onUpdateCourse(updatedCourse);
  };

  const handleArchiveCourse = async (course: CourseDevelopment) => {
    if (!course?.id) return;

    const confirmed = window.confirm(
      `Archive ${course.courseNumber}: ${course.courseTitle}?

Archived developments will be hidden from the active Course Developments list but will remain saved in Firestore.`
    );

    if (!confirmed) return;

    const nextActiveCourse = activeCourses.find((item) => item.id !== course.id);

    await onUpdateCourse({
      ...course,
      archived: true,
    } as CourseDevelopment & { archived?: boolean });

    selectCourse(nextActiveCourse?.id || '');
  };

  const handleAlertStatusChange = async (status: 'No Concerns' | 'Potential Concerns' | 'High Priority Concerns') => {
    if (!activeCourse) return;
    const updatedCourse = {
      ...activeCourse,
      alertStatus: status
    };
    await onUpdateCourse(updatedCourse);
  };

  // Helper selectors
  const getDevTypeColor = (type: string) => {
    switch(type) {
      case 'Original': return '#396431';
      case 'New Release': return '#14425C';
      case 'Tier 1 & 2 Revision': return '#B35C06';
      case 'Modification': return '#95226E';
      default: return '#555555';
    }
  };

  const getAlertBannerColor = (status: string) => {
    switch(status) {
      case 'No Concerns': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Potential Concerns': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'High Priority Concerns': return 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  const getAlertDotColor = (status: string) => {
    switch(status) {
      case 'No Concerns': return 'bg-emerald-600';
      case 'Potential Concerns': return 'bg-amber-600';
      case 'High Priority Concerns': return 'bg-rose-600';
      default: return 'bg-slate-600';
    }
  };

  const getAlertSelectClass = (status?: string) => {
    switch (status) {
      case 'High Priority Concerns':
        return 'bg-red-700 text-white border-red-700';
      case 'Potential Concerns':
        return 'bg-orange-600 text-white border-orange-600';
      default:
        return 'bg-green-700 text-white border-green-700';
    }
  };

  // Status metrics calculations
  const calculateProgress = (course: CourseDevelopment) => {
    if (!course || !course.tasks || course.tasks.length === 0) return 0;
    const activeTasks = course.tasks.filter(t => t.status !== 'Not Applicable');
    if (activeTasks.length === 0) return 0;
    const completed = activeTasks.filter(t => t.status === 'Complete').length;
    return Math.round((completed / activeTasks.length) * 100);
  };

  // Get color transition (red-orange-green)
  const getProgressBarColor = (prog: number) => {
    if (prog < 35) return 'bg-rose-600';
    if (prog < 75) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  // Draft compensation email 21 days prior
  const triggerCompensationDraft = (course: CourseDevelopment) => {
    const task8 = course.tasks.find(t => t.name.toLowerCase().includes("start compensation") || t.name.toLowerCase().includes("develop module 1 content"));
    if (!task8 || !task8.startDate) {
      alert("Please ensure Module 1 start date is active before drafting compensation notifications.");
      return;
    }
    const compDate = task8.startDate;
    const alertDate = stepWorkingDays(compDate, 15, -1, customBlocked); // approx 21 calendar days before

    const mailTo = `cel@fscj.edu`;
    const mailSub = `FSCJ Sponsoring Compensation Prep Alert: ${course.courseNumber} ${course.courseTitle}`;
    const mailBody = `Hello CeL Operations & Leadership,\n\nThis is an automated compensation alert. The SME compensation triggers on ${compDate} relating to ${course.courseNumber} Module 1 development start.\n\nPlease process appropriate payroll documentation of 21 calendar days notice prior to work deployment.\n\nThank you,\nChrystal Wickline\nInstructional Designer, FSCJ Online`;

    window.open(`mailto:${mailTo}?subject=${encodeURIComponent(mailSub)}&body=${encodeURIComponent(mailBody)}`);
  };

  // Weekly academic status report
  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    const parsed = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  const formatTaskList = (tasks: CourseDevelopmentTask[]) => {
    if (!tasks.length) return "None at this time.";
    return tasks
      .map((task) => `- ${task.name}${task.dueDate ? ` (${formatShortDate(task.dueDate)})` : ""}`)
      .join("\n");
  };

  const roleMatches = (assignedTo: string | undefined, role: "SME" | "ID" | "MULTIMEDIA" | "QA") => {
    const owner = (assignedTo || "").toLowerCase();

    if (role === "SME") {
      return owner.includes("sme") || owner.includes("subject matter") || owner.includes("faculty");
    }

    if (role === "ID") {
      return owner.includes("instructional") || owner.includes("designer") || owner.includes("id") || owner.includes("chrystal");
    }

    if (role === "MULTIMEDIA") {
      return owner.includes("multimedia") || owner.includes("mmt") || owner.includes("media");
    }

    return owner.includes("qa") || owner.includes("quality") || owner.includes("assurance");
  };

  const getRoleInProgressTasks = (course: CourseDevelopment, role: "SME" | "ID" | "MULTIMEDIA" | "QA") => {
    return (course.tasks || []).filter(
      (task) => task.status === "In Progress" && roleMatches(task.assignedTo, role)
    );
  };

  const findMilestoneTask = (course: CourseDevelopment, keywords: string[]) => {
    return (course.tasks || []).find((task) => {
      const name = (task.name || "").toLowerCase();
      const phase = (task.phase || "").toLowerCase();
      return keywords.some((keyword) => name.includes(keyword) || phase.includes(keyword));
    });
  };

  const formatMilestoneLine = (label: string, task?: CourseDevelopmentTask) => {
    if (!task) return `${label}: TBD, Not Started`;
    return `${label}: ${formatShortDate(task.dueDate || task.startDate)}, ${task.status || "Not Started"}`;
  };

  const generateWeeklyStatusReport = (course: CourseDevelopment) => {
    const completeTasks = (course.tasks || []).filter((task) => task.status === "Complete");
    const smeTasks = getRoleInProgressTasks(course, "SME");
    const idTasks = getRoleInProgressTasks(course, "ID");
    const multimediaTasks = getRoleInProgressTasks(course, "MULTIMEDIA");
    const qaTasks = getRoleInProgressTasks(course, "QA");

    const milestones = [
      formatMilestoneLine("ONBOARDING", findMilestoneTask(course, ["onboarding"])),
      formatMilestoneLine("INITIAL MEETING", findMilestoneTask(course, ["initial meeting"])),
      formatMilestoneLine("COURSE DESIGN PLAN DUE", findMilestoneTask(course, ["course design plan", "design plan"])),
      formatMilestoneLine("KICKOFF", findMilestoneTask(course, ["kickoff", "kick-off"])),
      formatMilestoneLine("MIDPOINT REVIEW", findMilestoneTask(course, ["midpoint", "mid-point"])),
      formatMilestoneLine("FINAL REVIEW", findMilestoneTask(course, ["final review"])),
      formatMilestoneLine("SME DELIVERABLES COMPLETE", findMilestoneTask(course, ["sme deliverables", "deliverables complete"])),
      formatMilestoneLine("DEVELOPMENT COMPLETION", findMilestoneTask(course, ["development completion", "project completion", "course completion"])),
    ];

    const offTime = customBlocked.length
      ? customBlocked.map((date) => `- ${formatShortDate(date)}`).join("\n")
      : "None listed.";

    return `COMPLETE:\n${formatTaskList(completeTasks)}\n\nSUBJECT MATTER EXPERT:\n${formatTaskList(smeTasks)}\n\nINSTRUCTIONAL DESIGNER:\n${formatTaskList(idTasks)}\n\nMULTIMEDIA:\n${formatTaskList(multimediaTasks)}\n\nCEL QUALITY ASSURANCE:\n${formatTaskList(qaTasks)}\n\nNOTES:\n${course.courseNotes || "None at this time."}\n\nALERTS: ${course.alertStatus || "No Concerns"}\n\nMILESTONES & OFF-TIME\n${milestones.join("\n")}\n\nCollege Closed / Vacation / Out-of-Office Dates:\n${offTime}`;
  };

  const handleCopyStatusReport = (course: CourseDevelopment) => {
    const blockText = generateWeeklyStatusReport(course);
    navigator.clipboard.writeText(blockText);

    const statusWindow = window.open("", "_blank", "width=800,height=700,scrollbars=yes,resizable=yes");

    if (statusWindow) {
      statusWindow.document.write(`
        <html>
          <head>
            <title>${course.courseNumber} Weekly Status QB</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; }
              textarea { width: 100%; height: 560px; padding: 16px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; border: 1px solid #cbd5e1; border-radius: 8px; }
              h1 { font-size: 20px; margin-bottom: 8px; }
              p { color: #475569; }
            </style>
          </head>
          <body>
            <h1>${course.courseNumber}: ${course.courseTitle}</h1>
            <p>Weekly status summary copied to clipboard. You may also copy/edit from the text box below.</p>
            <textarea>${blockText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          </body>
        </html>
      `);
      statusWindow.document.close();
    } else {
      alert("Weekly status summary copied to clipboard. Pop-up was blocked by the browser.");
    }
  };

  const triggerWeeklyStatusEmailDraft = (course: CourseDevelopment) => {
    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });

    const to = course.deptTeam.smeEmail || "";
    const cc = [course.deptTeam.deanEmail, course.deptTeam.managerEmail].filter(Boolean).join(",");
    const subject = `${course.courseNumber} Course Development Status ${today}`;
    const statusReport = generateWeeklyStatusReport(course);

    const body = `This is a friendly update on the status of the course development. You do not need to take any action or respond to this email. It is for your information only.\n\n${statusReport}`;

    // Keep the body available even if Outlook or the browser limits long compose URLs.
    navigator.clipboard?.writeText(body).catch(() => undefined);

    const outlookUrl =
      `https://outlook.office.com/mail/deeplink/compose` +
      `?to=${encodeURIComponent(to)}` +
      `&cc=${encodeURIComponent(cc)}` +
      `&subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    const composeWindow = window.open(outlookUrl, "_blank", "noopener,noreferrer");

    if (!composeWindow) {
      alert("The email body was copied to your clipboard, but the Outlook compose window was blocked by the browser.");
    }
  };

  // Compliance business rule calculation: check if Closeout is >= 30 days
  const getCloseoutCompliance = (course: CourseDevelopment) => {
    const task26 = course.tasks.find(t => t.name.toLowerCase().includes("course completion") || t.name.toLowerCase().includes("code check and archive"));
    if (!task26 || !task26.dueDate) return { success: true, count: 30 };
    
    const count = countWorkingDaysBetween(task26.dueDate, course.termDeadline, customBlocked);
    return {
      success: count >= 30,
      count
    };
  };

  const closeoutComp = activeCourse ? getCloseoutCompliance(activeCourse) : { success: true, count: 30 };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      
      {/* COLUMN ACTION RAILS */}
      <div className="flex justify-between items-center bg-white border border-[#E0DCD8] p-4 shadow-2xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-wide">
            Course Developments
          </h2>
          <p className="text-xs text-slate-500">
            Course development timelines, task progress, weekly status, and milestone tracking
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#006282] hover:bg-[#076092] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Academic Course
        </button>
      </div>

      <div className="flex flex-col gap-6">

        {/* COURSE SELECTOR */}
        <div className="flex flex-col gap-2 border-b border-dashed border-[#E0DCD8] pb-4">
          <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">
            Course List
          </span>

          <div className="flex flex-wrap gap-2">
            {activeCourses.length === 0 ? (
              <div className="p-4 bg-slate-50 text-center text-slate-400 border border-dashed border-slate-200 text-xs">
                No active course development schedules loaded. Click "+ Add Academic Course" to begin.
              </div>
            ) : (
              activeCourses.map(c => {
                const isSelected = c.id === (activeCourse?.id || '');
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCourse(c.id || '')}
                    className={`px-3 py-2 border text-xs font-semibold uppercase tracking-wide transition-all select-none cursor-pointer outline-none ${
                      isSelected 
                        ? 'border-[#006282] bg-[#006282] text-white shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#006282] hover:text-[#006282]'
                    }`}
                    title={`${c.courseNumber}: ${c.courseTitle}`}
                  >
                    {c.courseNumber}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="w-full">
          {activeCourse ? (
            <div className="flex flex-col gap-6 bg-white border border-[#E0DCD8] p-6 shadow-xs relative">
              
              {/* UPPER DECK */}
              <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: getDevTypeColor(activeCourse.devType) }}>
                      {activeCourse.devType} - Canvas V{activeCourse.versionNumber}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">
                      Term Release: {activeCourse.termRelease} 
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-950 mt-1">
                    {activeCourse.courseNumber}: {activeCourse.courseTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xs uppercase text-slate-400 font-semibold font-mono">
                    Alerts:
                  </span>
                  <select
                    value={activeCourse.alertStatus}
                    onChange={(e) => handleAlertStatusChange(e.target.value as any)}
                    className={`text-xs px-2.5 py-1.5 font-semibold border focus:outline-none ${getAlertSelectClass(activeCourse.alertStatus)}`}
                  >
                    <option value="No Concerns">No Concerns</option>
                    <option value="Potential Concerns">Potential Concerns</option>
                    <option value="High Priority Concerns">High Priority Concerns</option>
                  </select>
                </div>
              </div>

              {/* COMPLIANCE WARNING BLOCK */}
              {!complianceRule(activeCourse, customBlocked) && (
                <div className="flex items-center gap-2.5 border border-rose-300 bg-rose-50 text-rose-800 p-3.5 text-xs font-semibold">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-rose-700 animate-bounce" />
                  <div>
                    <span>CRITICAL SYSTEM NON-COMPLIANCE EXPOSURE: </span>
                    <span className="font-normal block text-[11px] mt-0.5">
                      Course closeout milestone (Task 26) is scheduled less than 30 business days before the Start of Term date ({formatDisplayDate(activeCourse.termDeadline)}). Available gap is currently only {closeoutComp.count} business days, creating a bottleneck.
                    </span>
                  </div>
                </div>
              )}

              {/* STAKEHOLDERS METADATA CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-y border-dashed border-[#E0DCD8] py-4 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] mb-1">Division Sponsoring Program:</span>
                  <span className="font-semibold text-slate-800 uppercase">{activeCourse.program}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] mb-1">Canvas / Sandbox Workspace:</span>
                  <span className="font-semibold text-slate-800">{activeCourse.canvasVersion}</span>
                </div>
              </div>

              {/* DYNAMIC PROGRESS BAR GAUGE */}
              <div className="border-y border-dashed border-[#E0DCD8] bg-[#F4F1ED]/40 p-4">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="uppercase text-slate-700">Course Design completeness matrix</span>
                  <span className="text-[#006282] font-semibold">{calculateProgress(activeCourse)}% Completed</span>
                </div>
                <div className="w-full bg-slate-200 h-2">
                  <div className={`h-2 transition-all duration-500 ${getProgressBarColor(calculateProgress(activeCourse))}`} style={{ width: `${calculateProgress(activeCourse)}%` }}></div>
                </div>
              </div>

              {/* CONTACTS + OPERATIONAL CONTROLS */}
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,420px)_1fr] gap-4">
                {/* OPERATIONAL DATES */}
                <div className="bg-[#F4F1ED]/20 p-4 border-y border-dashed border-[#E0DCD8]">
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-3">
                    Term Start and Course Completion Dates
                  </h4>

                  <div className="flex flex-col gap-3 text-xs">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">
                        Start of Term
                      </span>
                      <input
                        type="date"
                        value={activeCourse.termDeadline}
                        onChange={(e) => handleRecalculateTimeline(e.target.value)}
                        className="w-full max-w-[180px] text-xs px-2 py-1.5 border border-slate-300 bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">
                        Start of Term: {formatDisplayDateShort(activeCourse.termDeadline)}
                      </span>
                    </label>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">
                        Projected Course Completion
                      </span>
                      <div className="w-full max-w-[180px] border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800">
                        {formatDisplayDateShort(getProjectedCompletionDate(activeCourse))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRecalculateCurrentTimeline}
                      className="w-fit rounded-md border border-[#006282] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors cursor-pointer select-none"
                    >
                      Recalculate Timeline
                    </button>

                    <button
                      onClick={handleToggleOnboarding}
                      className="text-left text-slate-600 hover:text-slate-900 font-semibold uppercase flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#33B1C8]" />
                      <span>Onboarding: {activeCourse.onboarding ? 'Active' : 'Bypassed'}</span>
                    </button>

                    <button
                      onClick={handleToggleHideCompleted}
                      className="text-left text-slate-600 hover:text-slate-900 font-semibold uppercase flex items-center gap-1 cursor-pointer select-none"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeCourse.hideCompletedTasks ? 'Show Completed Tasks' : 'Hide Completed Tasks'}</span>
                    </button>
                  </div>
                </div>

                {/* CONTACT MAP */}
                <div className="bg-slate-50 p-4 border-y border-dashed border-[#E0DCD8]">
                  <h4 className="text-xs uppercase font-semibold text-slate-700 mb-3 border-b pb-1">
                    CeL & Academic Division Contacts
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs md:font-mono">
                    <div>
                      <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">
                        Subject Matter Expert
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">{activeCourse.deptTeam.smeName || 'Not entered'}</span>
                        <span className="text-slate-500 font-normal break-all">{activeCourse.deptTeam.smeEmail || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">
                        Division ID
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">Chrystal Wickline</span>
                        <span className="text-slate-500 font-normal break-all">wickline@fscj.edu</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">
                        Academic Dean
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">{activeCourse.deptTeam.deanName || 'Not entered'}</span>
                        <span className="text-slate-500 font-normal break-all">{activeCourse.deptTeam.deanEmail || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">
                        Academic Program Manager
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">{activeCourse.deptTeam.managerName || 'None assigned'}</span>
                        <span className="text-slate-500 font-normal break-all">{activeCourse.deptTeam.managerEmail || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {editingCourse && (
                <div className="border border-[#33B1C8]/40 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                      Edit Course Development
                    </h4>
                    <button
                      type="button"
                      onClick={cancelEditingCourse}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Program</span>
                      <input name="program" value={editingCourse.program} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Course Number</span>
                      <input name="courseNumber" value={editingCourse.courseNumber} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white uppercase" />
                    </label>

                    <label className="md:col-span-2 flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Course Title</span>
                      <input name="courseTitle" value={editingCourse.courseTitle} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Canvas Version</span>
                      <input name="canvasVersion" value={editingCourse.canvasVersion} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Workshop Course</span>
                      <input name="workshopCourse" value={editingCourse.workshopCourse} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Development Type</span>
                      <select name="devType" value={editingCourse.devType} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white">
                        <option value="Original">Original</option>
                        <option value="New Release">New Release</option>
                        <option value="Tier 1 & 2 Revision">Tier 1 &amp; 2 Revision</option>
                        <option value="Modification">Modification</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Version Number</span>
                      <input type="number" name="versionNumber" value={editingCourse.versionNumber} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Term Release</span>
                      <select name="termRelease" value={editingCourse.termRelease} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white">
                        <option value="Spring A">Spring A</option>
                        <option value="Spring B">Spring B</option>
                        <option value="Spring C">Spring C</option>
                        <option value="Summer A">Summer A</option>
                        <option value="Summer B">Summer B</option>
                        <option value="Summer C">Summer C</option>
                        <option value="Fall A">Fall A</option>
                        <option value="Fall B">Fall B</option>
                        <option value="Fall C">Fall C</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Start of Term</span>
                      <input type="date" name="termDeadline" value={editingCourse.termDeadline} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                      <span className="text-[10px] text-slate-500">Start of Term: {formatDisplayDateShort(editingCourse.termDeadline)}</span>
                      <span className="text-[10px] text-slate-500">Projected Course Completion: {formatDisplayDateShort(calculateProjectedCompletionDate(editingCourse.termDeadline))}</span>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Development Stagger Days</span>
                      <input type="number" name="devStagger" value={editingCourse.devStagger} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Onboarding</span>
                      <select name="onboarding" value={String(editingCourse.onboarding)} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Alerts</span>
                      <select name="alertStatus" value={editingCourse.alertStatus} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white">
                        <option value="No Concerns">No Concerns</option>
                        <option value="Potential Concerns">Potential Concerns</option>
                        <option value="High Priority Concerns">High Priority Concerns</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">SME Name</span>
                      <input name="smeName" value={editingCourse.smeName} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">SME Email</span>
                      <input type="email" name="smeEmail" value={editingCourse.smeEmail} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Dean Name</span>
                      <input name="deanName" value={editingCourse.deanName} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Dean Email</span>
                      <input type="email" name="deanEmail" value={editingCourse.deanEmail} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Program Manager Name</span>
                      <input name="managerName" value={editingCourse.managerName} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Program Manager Email</span>
                      <input type="email" name="managerEmail" value={editingCourse.managerEmail} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="md:col-span-2 flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Course Notes</span>
                      <textarea name="courseNotes" value={editingCourse.courseNotes} onChange={handleEditingChange} rows={3} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={cancelEditingCourse} className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button type="button" onClick={saveEditingCourse} className="inline-flex items-center gap-1 px-3 py-2 bg-[#006282] text-white text-xs font-semibold hover:bg-[#076092]">
                      <Save className="w-3.5 h-3.5" /> Save Course Development
                    </button>
                  </div>
                </div>
              )}

              {/* COURSE ACTIONS */}
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 bg-white py-2 text-[11px] border-b border-[#E0DCD8]/80">
                <button
                  type="button"
                  onClick={() => startEditingCourse(activeCourse)}
                  className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 hover:text-[#006282]"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStatusReport(activeCourse)}
                  className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 hover:text-[#006282]"
                >
                  <Clipboard className="w-3.5 h-3.5" /> Status QB
                </button>

                <button
                  type="button"
                  onClick={() => triggerWeeklyStatusEmailDraft(activeCourse)}
                  className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 hover:text-[#087834]"
                >
                  <Mail className="w-3.5 h-3.5" /> Status Email
                </button>

                <button
                  type="button"
                  onClick={() => triggerCompensationDraft(activeCourse)}
                  className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 hover:text-[#087834]"
                >
                  <Mail className="w-3.5 h-3.5" /> SME Compensation
                </button>

                <button
                  type="button"
                  onClick={() => handleArchiveCourse(activeCourse)}
                  className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 hover:text-[#B35C06]"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this course development from Firestore permanently?")) {
                      onDeleteCourse(activeCourse.id || '');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-rose-700 hover:text-rose-900"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              {/* TASKS TABLE MATRIX */}
              <div className="border-y border-dashed border-[#E0DCD8] mt-2">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                  <span className="text-xs uppercase font-semibold text-slate-700">Development Timeline and Milestones</span>
                  <span className="text-2xs text-slate-400 font-mono">Task edits auto-save when changed</span>
                </div>

                <div ref={taskListRef} className="max-h-[680px] overflow-y-auto p-2 space-y-2">
                  {activeCourse.tasks
                    .filter(t => activeCourse.hideCompletedTasks === false || (t.status !== 'Complete' && t.status !== 'Not Applicable'))
                    .map((task) => {
                      const draft = getTaskDraft(task);
                      const currentStatus = draft.status || task.status;
                      const isNA = currentStatus === 'Not Applicable';
                      const isComp = currentStatus === 'Complete';
                      const today = formatDate(new Date());
                      const isOver = currentStatus !== 'Complete' && !isNA && task.dueDate && task.dueDate < today;
                      const isEmailTask = /\[Email\]/i.test(task.name || '');
                      const displayTaskName = (task.name || '').replace(/\s*\[Email\]\s*/gi, '').trim();

                      return (
                        <article
                          key={task.id}
                          data-task-id={task.id}
                          className={`rounded-lg border-y border-dashed px-3 py-2 ${isNA ? 'border-slate-200 bg-slate-50/70' : 'border-[#E0DCD8] bg-white'}`}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <span className={`text-sm font-semibold leading-tight ${isComp ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {task.id}. {displayTaskName}
                                </span>
                                {isEmailTask && (
                                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#006282]" aria-label="Email task" />
                                )}
                              </div>

                              {isOver && (
                                <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-semibold uppercase text-white animate-pulse">
                                  Overdue
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 text-xs">
                              <label className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase text-slate-500 font-semibold">Owner</span>
                                <select
                                  name="assignedTo"
                                  value={draft.assignedTo || ''}
                                  onChange={(e) => autoSaveTaskField(task, 'assignedTo', e.target.value)}
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                                >
                                  <option>Operations</option>
                                  <option>Instructional Designer</option>
                                  <option>Subject Matter Expert</option>
                                  <option>Quality Assurance</option>
                                  <option>Multimedia</option>
                                  <option>Learning Experience Architect</option>
                                </select>
                              </label>

                              <label className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase text-slate-500 font-semibold">Status</span>
                                <select
                                  name="status"
                                  value={draft.status || 'Not Started'}
                                  onChange={(e) => autoSaveTaskField(task, 'status', e.target.value)}
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
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
                              </label>

                              <label className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase text-slate-500 font-semibold">Start</span>
                                <input
                                  type="date"
                                  name="startDate"
                                  value={draft.startDate || ''}
                                  onChange={(e) => autoSaveTaskField(task, 'startDate', e.target.value)}
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                                />
                              </label>

                              <label className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase text-slate-500 font-semibold">Due</span>
                                <input
                                  type="date"
                                  name="dueDate"
                                  value={draft.dueDate || ''}
                                  onChange={(e) => autoSaveTaskField(task, 'dueDate', e.target.value)}
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                                />
                              </label>
                            </div>

                            {draft.notes && (
                              <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
                                {draft.notes}
                              </div>
                            )}

                            {normalizeTimelineSubtasks((task as any).subtasks).length > 0 && (
                              <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                                <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Subtasks</div>
                                <div className="flex flex-col gap-1.5">
                                  {normalizeTimelineSubtasks((task as any).subtasks).map((subtask) => (
                                    <label key={subtask.id} className="flex items-center gap-2 text-xs text-slate-700">
                                      <input
                                        type="checkbox"
                                        checked={subtask.complete}
                                        onChange={() => handleToggleSubtask(task.id as number, subtask.id)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 accent-[#006282]"
                                      />
                                      <span className={subtask.complete ? 'line-through text-slate-400' : ''}>
                                        {subtask.title}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto] lg:items-end">
                              <label className="flex flex-col gap-0.5 text-xs">
                                <span className="text-[9px] uppercase text-slate-500 font-semibold">Notes</span>
                                <textarea
                                  name="notes"
                                  value={draft.notes || ''}
                                  onChange={(e) => updateTaskDraft(task, 'notes', e.target.value)}
                                  onBlur={() => saveTaskNotesOnBlur(task)}
                                  rows={1}
                                  placeholder="Add task-specific notes..."
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                                />
                              </label>

                              <div className="flex justify-end text-[10px] font-mono text-slate-400 lg:pb-1">
                                <span>
                                  {task.phase}{(task as any).durationLabel ? ` • ${(task as any).durationLabel}` : task.durationDays > 0 ? ` • ${task.durationDays} days` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-[#E0DCD8] p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
              <Sparkles className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-500 text-sm">No Active Core Academic Course schedule Selected</p>
              <p className="text-xs text-slate-400 mt-1">Configure yours by hitting the "+ Add Academic Course" button above.</p>
            </div>
          )}
        </div>

      </div>

      {/* DIALOG MODAL: ADD COURSE TRACK */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-[#F4F1ED] border-2 border-slate-900 p-6 max-w-xl w-full flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <h3 className="text-md font-semibold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-[#33B1C8]" /> Dispatcher Course creation Wizard
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer select-none">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-800">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Division program:</label>
                  <input
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    placeholder="e.g. Information Technology"
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Course Number [ABC1234]:</label>
                  <input
                    type="text"
                    name="courseNumber"
                    value={formData.courseNumber}
                    onChange={handleInputChange}
                    placeholder="COP2800"
                    pattern="^[A-Z]{3}\d{4}$"
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Course Title Name:</label>
                <input
                  type="text"
                  name="courseTitle"
                  value={formData.courseTitle}
                  onChange={handleInputChange}
                  placeholder="Java Language Foundations"
                  required
                  className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Type Design Mode:</label>
                  <select
                    name="devType"
                    value={formData.devType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs"
                  >
                    <option value="Original">Original Development (#396431)</option>
                    <option value="New Release">New Release (#14425C)</option>
                    <option value="Tier 1 & 2 Revision">Tier 1 & 2 Revision (#B35C06)</option>
                    <option value="Modification">Modification (#95226E)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Version Number:</label>
                  <input
                    type="number"
                    name="versionNumber"
                    value={formData.versionNumber}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Target Term Release:</label>
                  <select
                    name="termRelease"
                    value={formData.termRelease}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs animate-fade-in"
                  >
                    <option value="Spring A">Spring A</option>
                    <option value="Spring B">Spring B</option>
                    <option value="Spring C">Spring C</option>
                    <option value="Summer A">Summer A</option>
                    <option value="Summer B">Summer B</option>
                    <option value="Summer C">Summer C</option>
                    <option value="Fall A">Fall A</option>
                    <option value="Fall B">Fall B</option>
                    <option value="Fall C">Fall C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Start of Term:</label>
                  <input
                    type="date"
                    name="termDeadline"
                    value={formData.termDeadline}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs font-mono animate-fade-in"
                  />
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    Projected Course Completion: {formatDisplayDateShort(calculateProjectedCompletionDate(formData.termDeadline))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Dev Spacing / Stagger (days):</label>
                  <input
                    type="number"
                    name="devStagger"
                    value={formData.devStagger}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Onboarding Sequence?</label>
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-1.5 text-xs font-normal cursor-pointer select-none">
                      <input
                        type="radio"
                        name="onboarding"
                        checked={formData.onboarding === true}
                        onChange={() => handleCheckboxChange('onboarding')}
                        className="accent-[#006282]"
                      /> Yes
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-normal cursor-pointer select-none">
                      <input
                        type="radio"
                        name="onboarding"
                        checked={formData.onboarding === false}
                        onChange={() => handleCheckboxChange('onboarding')}
                        className="accent-[#006282]"
                      /> No
                    </label>
                  </div>
                </div>
              </div>

              <hr className="border-slate-300 my-1" />
              <h4 className="text-[10px] uppercase text-slate-500 font-bold font-mono">
                Department Core Delegates Setup (Sibling Inputs Map)
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Subject Matter Expert (Left):</label>
                  <input
                    type="text"
                    name="smeName"
                    value={formData.smeName}
                    onChange={handleInputChange}
                    placeholder="Instructor Full Name"
                    required
                    className="w-full px-3 py-1.5 border border-slate-355 bg-white text-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">SME Email Address (Right):</label>
                  <input
                    type="email"
                    name="smeEmail"
                    value={formData.smeEmail}
                    onChange={handleInputChange}
                    placeholder="sme@fscj.edu"
                    required
                    className="w-full px-3 py-1.5 border border-slate-355 bg-white text-2xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Division Dean (Left):</label>
                  <input
                    type="text"
                    name="deanName"
                    value={formData.deanName}
                    onChange={handleInputChange}
                    placeholder="Dean Full Name"
                    required
                    className="w-full px-3 py-1.5 border border-slate-355 bg-white text-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Dean Email Address (Right):</label>
                  <input
                    type="email"
                    name="deanEmail"
                    value={formData.deanEmail}
                    onChange={handleInputChange}
                    placeholder="dean@fscj.edu"
                    required
                    className="w-full px-3 py-1.5 border border-slate-355 bg-white text-2xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Academic PM (Left, Optional):</label>
                  <input
                    type="text"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleInputChange}
                    placeholder="PM Name"
                    className="w-full px-3 py-1.5 border border-slate-355 bg-white text-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">PM Email Address (Right):</label>
                  <input
                    type="email"
                    name="managerEmail"
                    value={formData.managerEmail}
                    onChange={handleInputChange}
                    placeholder="pm@fscj.edu"
                    className="w-full px-3 py-1.5 border border-slate-355 bg-white text-2xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Notes / Accreditation context:</label>
                <textarea
                  name="courseNotes"
                  value={formData.courseNotes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-350 bg-white font-normal text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-350 text-slate-700 bg-white text-2xs font-semibold uppercase hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#006282] hover:bg-[#076092] text-white px-5 py-2 text-2xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Create Development Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Quick helper to evaluate activeCourse compliance outside of the component body
function complianceRule(course: CourseDevelopment, customBlocked: string[]): boolean {
  const task26 = course.tasks.find(t => t.name.toLowerCase().includes("course completion") || t.name.toLowerCase().includes("code check and archive"));
  if (!task26 || !task26.dueDate) return true;
  
  const count = countWorkingDaysBetween(task26.dueDate, course.termDeadline, customBlocked);
  return count >= 30;
}
