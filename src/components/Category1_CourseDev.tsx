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
  meetingTime?: string;
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
  // Projected Course Completion is the final development-completion anchor.
  // Final Review must occur at least one week before development completion.
  // Midpoint Review must occur at least 30 days after Kickoff.
  const developmentCompletionStart = projectedCourseCompletionDate;
  const finalReviewStart = addCalendarDays(developmentCompletionStart, -7);
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
    task(6, 'Conduct initial meeting', 'Project Management; Course Design', 'Instructional Designer', initialMeetingStart, initialMeetingStart, 1, ['Send Initial Meeting Recap', 'Draft Course Design Plan', 'Send Course Design Plan draft to SME']),
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
    task(46, 'Course completion', 'Milestone', 'Instructional Designer', developmentCompletionStart, developmentCompletionStart, 5, ['Multimedia complete code check and archive', 'Request course completion in Quickbase', 'Send project completion notification email'])
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
  const [showCompensationDialog, setShowCompensationDialog] = useState(false);
  const [compensationDialogTitle, setCompensationDialogTitle] = useState('SME Compensation Notice');
  const [compensationDialogContent, setCompensationDialogContent] = useState('');
  const [editingCourse, setEditingCourse] = useState<typeof formData | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, Partial<CourseDevelopmentTask & { notes?: string; meetingTime?: string }>>>({});
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



    const handleEditingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!editingCourse) return;

    const { name, value } = e.target;

    setEditingCourse(prev => {
      if (!prev) return prev;

      if (name === 'courseNumber') {
        const courseNumber = value.toUpperCase();
        const previousPrefix = prev.courseNumber
          ? `cel-${prev.courseNumber.toLowerCase()}-v`
          : '';

        const currentSuffix =
          previousPrefix && prev.canvasVersion.startsWith(previousPrefix)
            ? prev.canvasVersion.slice(previousPrefix.length)
            : '';

        return {
          ...prev,
          courseNumber,
          canvasVersion: courseNumber
            ? `cel-${courseNumber.toLowerCase()}-v${currentSuffix}`
            : '',
        };
      }

      if (name === 'canvasVersion') {
        const cleanedValue = value
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, '');

        return {
          ...prev,
          canvasVersion: cleanedValue,
        };
      }

      return {
        ...prev,
        [name]:
          name === 'versionNumber' || name === 'devStagger'
            ? Number(value)
            : name === 'onboarding'
              ? value === 'true'
              : value,
      };
    });
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
      canvasVersion: editingCourse.canvasVersion.trim().toLowerCase(),
      workshopCourse: editingCourse.workshopCourse.trim().toLowerCase(),
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
      meetingTime: (stored as any).meetingTime ?? (task as any).meetingTime ?? '',
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
        meetingTime: (draft as any).meetingTime || '',
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
        (newTask as any).meetingTime = (existing as any).meetingTime || (newTask as any).meetingTime || '';
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

    const title = `FSCJ Sponsoring Compensation Prep Alert: ${course.courseNumber} ${course.courseTitle}`;
    const content = `To: cel@fscj.edu
Subject: ${title}

Hello CeL Operations & Leadership,

This is an automated compensation alert. The SME compensation triggers on ${compDate} relating to ${course.courseNumber} Module 1 development start.

Please process appropriate payroll documentation of 21 calendar days notice prior to work deployment.

Suggested alert date: ${alertDate || 'TBD'}

Thank you,
Chrystal Wickline
Instructional Designer, FSCJ Online`;

    setCompensationDialogTitle(title);
    setCompensationDialogContent(content);
    setShowCompensationDialog(true);
  };

  const copyCompensationDialogContent = async () => {
    try {
      await navigator.clipboard.writeText(compensationDialogContent);
      alert("SME compensation notice copied to clipboard.");
    } catch (error) {
      console.error("Unable to copy SME compensation notice:", error);
      alert("The compensation notice could not be copied automatically. Please select and copy the text manually.");
    }
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

    const taskNames = tasks.map((task) => task.name || "");

    const completedModules = taskNames
      .filter((name) => /Module \d+/.test(name))
      .map((name) => Number(name.match(/Module (\d+)/)?.[1]))
      .filter(Boolean);

    const uniqueModules = [...new Set(completedModules)].sort((a, b) => a - b);
    const nonModuleTasks = taskNames.filter((name) => !/Module \d+/.test(name));

    const cleanedTasks = nonModuleTasks.map((name) => {
      return name
        .replace(/^Start compensation$/i, "started compensation")
        .replace(/^Send SME introduction email$/i, "sent SME introduction email")
        .replace(/^Send onboarding reminder$/i, "sent onboarding reminder")
        .replace(/^Conduct onboarding meeting$/i, "conducted onboarding meeting")
        .replace(/^Schedule initial meeting$/i, "scheduled initial meeting")
        .replace(/^Conduct initial meeting$/i, "conducted initial meeting")
        .replace(/^Finalize Course Design Plan$/i, "finalized Course Design Plan")
        .replace(/^Schedule kickoff meeting$/i, "scheduled kickoff meeting")
        .replace(/^Complete Course Design Plan$/i, "completed Course Design Plan")
        .replace(/^Send kickoff reminder and agenda$/i, "sent kickoff reminder and agenda")
        .replace(/^Conduct kickoff meeting$/i, "conducted kickoff meeting")
        .replace(/^Schedule midpoint meeting$/i, "scheduled midpoint meeting")
        .replace(/^Send midpoint reminder and agenda$/i, "sent midpoint reminder and agenda")
        .replace(/^Conduct midpoint review$/i, "conducted midpoint review")
        .replace(/^Schedule final meeting$/i, "scheduled final meeting")
        .replace(/^Finalize course documents$/i, "finalized course documents")
        .replace(/^Submit proofreading request$/i, "submitted proofreading request")
        .replace(/^Complete proofreading$/i, "completed proofreading")
        .replace(/^Complete pre-QA checklist$/i, "completed pre-QA checklist")
        .replace(/^Complete QA review$/i, "completed QA review")
        .replace(/^Send final review reminder and agenda$/i, "sent final review reminder and agenda")
        .replace(/^Conduct final review$/i, "conducted final review")
        .replace(/^End compensation$/i, "ended compensation")
        .replace(/^Course completion$/i, "completed course development");
    });

    if (uniqueModules.length > 0) {
      const firstModule = uniqueModules[0];
      const lastModule = uniqueModules[uniqueModules.length - 1];

      cleanedTasks.push(
        firstModule === lastModule
          ? `developed and built Module ${firstModule}`
          : `developed and built Module ${firstModule}–${lastModule}`
      );
    }

    return `${cleanedTasks.join(", ")}.`;
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

  const getRoleActiveTasks = (
    course: CourseDevelopment,
    role: "SME" | "ID" | "MULTIMEDIA" | "QA"
  ) => {
    return (course.tasks || [])
      .filter((task) => {
        const status = task.status || "Not Started";

        return (
          roleMatches(task.assignedTo, role) &&
          status !== "Complete" &&
          status !== "Not Applicable"
        );
      })
      .sort((a, b) => {
        const firstDate = a.dueDate || a.startDate || "9999-12-31";
        const secondDate = b.dueDate || b.startDate || "9999-12-31";

        return firstDate.localeCompare(secondDate);
      });
  };

  const getRoleOpenTasks = (course: CourseDevelopment, role: "SME" | "ID" | "MULTIMEDIA" | "QA") => {
    return (course.tasks || []).filter((task) => {
      const status = task.status || "Not Started";
      return (
        roleMatches(task.assignedTo, role) &&
        status !== "Complete" &&
        status !== "Not Applicable"
      );
    });
  };

    const formatStatusTaskList = (tasks: CourseDevelopmentTask[]) => {
    if (!tasks.length) return "";

    return tasks
      .map((task) => {
        const dueDate = task.dueDate || task.startDate;
        const dueDateLabel = dueDate
          ? ` (due ${formatShortDate(dueDate)})`
          : "";

        return `- ${task.name} — ${task.status || "Not Started"}${dueDateLabel}`;
      })
      .join("\n");
  };

  const formatBulletedTaskList = (tasks: CourseDevelopmentTask[]) => {
    if (!tasks.length) return "- None at this time.";

    return tasks
      .map((task) => {
        const date = task.dueDate || task.startDate;
        const dateLabel = date ? ` (${formatShortDate(date)})` : "";
        return `- ${task.name}${dateLabel}, ${task.status || "Not Started"}`;
      })
      .join("\n");
  };

  const calculateModuleBuildProgress = (course: CourseDevelopment) => {
    const moduleBuildTasks = (course.tasks || []).filter((task) =>
      /^Review & Build Module \d+ content$/i.test(task.name || "")
    );

    if (!moduleBuildTasks.length) return 0;

    const completed = moduleBuildTasks.filter((task) => task.status === "Complete").length;
    return Math.round((completed / moduleBuildTasks.length) * 100);
  };

  const findTimelineTaskByExactName = (course: CourseDevelopment, taskName: string) => {
    const targetName = taskName.trim().toLowerCase();
    return (course.tasks || []).find((task) => (task.name || '').trim().toLowerCase() === targetName);
  };

  const formatMilestoneLine = (label: string, task?: CourseDevelopmentTask) => {
    if (!task) return `${label}: TBD, Not Started`;

    const showTime = [
      "ONBOARDING",
      "INITIAL MEETING",
      "KICKOFF",
      "MIDPOINT REVIEW",
      "FINAL REVIEW",
    ].includes(label);

    const meetingTime = (task as any).meetingTime;

    const formattedTime =
      showTime && meetingTime
        ? ` at ${new Date(`2000-01-01T${meetingTime}`).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
            }
          )}`
        : "";

    return `${label}: ${formatShortDate(
      task.dueDate || task.startDate
    )}${formattedTime}, ${task.status || "Not Started"}`;
  };

    const generateWeeklyStatusReport = (course: CourseDevelopment) => {
    const progress = calculateProgress(course);

    const smeTasks = getRoleActiveTasks(course, "SME");
    const idTasks = getRoleActiveTasks(course, "ID");
    const multimediaTasks = getRoleActiveTasks(course, "MULTIMEDIA");
    const qaTasks = getRoleActiveTasks(course, "QA");

    const milestones = [
      formatMilestoneLine(
        "ONBOARDING",
        findTimelineTaskByExactName(course, "Conduct onboarding meeting")
      ),
      formatMilestoneLine(
        "INITIAL MEETING",
        findTimelineTaskByExactName(course, "Conduct initial meeting")
      ),
      formatMilestoneLine(
        "COURSE DESIGN PLAN DUE",
        findTimelineTaskByExactName(course, "Complete Course Design Plan")
      ),
      formatMilestoneLine(
        "KICKOFF",
        findTimelineTaskByExactName(course, "Conduct kickoff meeting")
      ),
      formatMilestoneLine(
        "MIDPOINT REVIEW",
        findTimelineTaskByExactName(course, "Conduct midpoint review")
      ),
      formatMilestoneLine(
        "FINAL REVIEW",
        findTimelineTaskByExactName(course, "Conduct final review")
      ),
      formatMilestoneLine(
        "SME DELIVERABLES COMPLETE",
        findTimelineTaskByExactName(course, "End compensation")
      ),
      formatMilestoneLine(
        "DEVELOPMENT COMPLETION",
        findTimelineTaskByExactName(course, "Course completion")
      ),
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureOffTime = customBlocked
      .filter((dateStr) => {
        const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);

        return !Number.isNaN(date.getTime()) && date > today;
      })
      .sort()
      .map((date) => `- ${formatShortDate(date)}`)
      .join("\n");

    const offTimeSection = futureOffTime
      ? `\n\nCollege Closed / Vacation / Out-of-Office Dates:\n${futureOffTime}`
      : "";

    return `Overall Progress: Course design and development is ${progress}% complete.

SUBJECT MATTER EXPERT:
${formatStatusTaskList(smeTasks)}

INSTRUCTIONAL DESIGNER:
${formatStatusTaskList(idTasks)}

MULTIMEDIA:
${formatStatusTaskList(multimediaTasks)}

CEL QUALITY ASSURANCE:
${formatStatusTaskList(qaTasks)}

NOTES: ${course.courseNotes || "None at this time."}
ALERTS: ${course.alertStatus || "No Concerns"}

MILESTONES & OFF-TIME
${milestones.join("\n")}${offTimeSection}`;
  };

  const handleCopyStatusReport = (course: CourseDevelopment) => {
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

    const blockText = `TO: ${to}
CC: ${cc}
SUBJECT: ${subject}

BODY:
${body}`;

    navigator.clipboard.writeText(blockText);

    const statusWindow = window.open("", "_blank", "width=800,height=700,scrollbars=yes,resizable=yes");

    if (statusWindow) {
      statusWindow.document.write(`
        <html>
          <head>
            <title>${course.courseNumber} Weekly Status QB</title>
            <style>
              body { font-family: Open Sans, Source Sans Pro, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; }
              textarea { width: 100%; height: 560px; padding: 16px; font-family: Open Sans, Source Sans Pro, sans-serif; font-size: 14px; line-height: 1.5; border: 1px solid #cbd5e1; border-radius: 8px; }
              h1 { font-size: 20px; margin-bottom: 8px; }
              p { color: #475569; }
            </style>
          </head>
          <body>
            <h1>${course.courseNumber}: ${course.courseTitle}</h1>
            <p>Status QB email package copied to clipboard. You may also copy/edit from the text box below.</p>
            <textarea>${blockText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          </body>
        </html>
      `);
      statusWindow.document.close();
    } else {
      alert("Status QB email package copied to clipboard. Pop-up was blocked by the browser.");
    }
  };

  const escapeHtml = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const formatMeetingTime = (timeStr?: string) => {
    if (!timeStr) return "TBD";
    const parsed = new Date(`2000-01-01T${timeStr}`);
    if (Number.isNaN(parsed.getTime())) return timeStr;
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const openCommunicationToolWindow = (
    popupTitle: string,
    clipboardMessage: string,
    content: string
  ) => {
    navigator.clipboard?.writeText(content).catch(() => undefined);

    const popupWindow = window.open("", "_blank", "width=800,height=700,scrollbars=yes,resizable=yes");

    if (popupWindow) {
      popupWindow.document.write(`
        <html>
          <head>
            <title>${escapeHtml(popupTitle)}</title>
            <style>
              body { font-family: Open Sans, Source Sans Pro, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; }
              textarea { width: 100%; height: 560px; padding: 16px; font-family: Open Sans, Source Sans Pro, sans-serif; font-size: 14px; line-height: 1.5; border: 1px solid #cbd5e1; border-radius: 8px; }
              h1 { font-size: 20px; margin-bottom: 8px; }
              p { color: #475569; }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(popupTitle)}</h1>
            <p>${escapeHtml(clipboardMessage)}</p>
            <textarea>${escapeHtml(content)}</textarea>
          </body>
        </html>
      `);
      popupWindow.document.close();
    } else {
      alert(clipboardMessage.replace("You may also copy/edit from the text box below.", "Pop-up was blocked by the browser."));
    }
  };

  const handleOnboardingReminder = (course: CourseDevelopment) => {
  const hour = new Date().getHours();

  const greetingTime =
    hour < 12
      ? "morning"
      : hour < 17
      ? "afternoon"
      : "evening";

  const onboardingTask = findTimelineTaskByExactName(
    course,
    "Conduct onboarding meeting"
  );

  const meetingDate =
    onboardingTask?.startDate || onboardingTask?.dueDate || "";

  const meetingTime = formatMeetingTime(
    (onboardingTask as any)?.meetingTime
  );

  const to = [
    course.deptTeam.smeEmail,
    "cel@fscj.edu",
    "kris.kristen@fscj.edu",
  ]
    .filter(Boolean)
    .join("; ");

  const cc = [
    "christina.perrin@fscj.edu",
    "Golf.K@fscj.edu",
    course.deptTeam.deanEmail,
    "Ansa.Reams.Johnson@fscj.edu",
  ]
    .filter(Boolean)
    .join("; ");

  const popupTitle = `${course.courseNumber} Onboarding Meeting Reminder`;

  const clipboardMessage =
    "Onboarding reminder copied to clipboard. You may also copy/edit from the text box below.";

  const content = `TO: ${to}
CC: ${cc}
SUBJECT: ${course.courseNumber} Onboarding Meeting Reminder for Course Development

Good ${greetingTime},

This is a friendly reminder that we will hold the onboarding meeting for ${course.courseNumber}: ${course.courseTitle} on ${formatDisplayDate(meetingDate)} at ${meetingTime}.

Please let me know if there are any additional stakeholders who should be invited.

I look forward to meeting with everyone.`;

  openCommunicationToolWindow(
    popupTitle,
    clipboardMessage,
    content
  );
};

const handleOnboardingRecap = (course: CourseDevelopment) => {
  const hour = new Date().getHours();

  const greetingTime =
    hour < 12
      ? "morning"
      : hour < 17
      ? "afternoon"
      : "evening";

  const initialMeetingTask = findTimelineTaskByExactName(
    course,
    "Conduct initial meeting"
  );

  const popupTitle = `${course.courseNumber} Onboarding Information Session Recap`;

  const clipboardMessage =
    "Onboarding recap copied to clipboard. You may also copy/edit from the text box below.";

  const to = [
    course.deptTeam.smeEmail,
    "cel@fscj.edu",
    "kris.kristen@fscj.edu",
  ]
    .filter(Boolean)
    .join("; ");

  const cc = [
    "christina.perrin@fscj.edu",
    "Golf.K@fscj.edu",
    course.deptTeam.deanEmail,
    "Ansa.Reams.Johnson@fscj.edu",
    course.deptTeam.managerEmail,
  ]
    .filter(Boolean)
    .join("; ");

  const content = `TO: ${to}
CC: ${cc}
SUBJECT: ${course.courseNumber} Onboarding Information Session Recap

ATTACHMENTS: Onboarding Presentation; Course Outline

LINKS:
• CeL SME Course Design Hub
• Program Design Plan
• Program PLO Map

Good ${greetingTime},

Welcome to the course development process! Together, we will create a high-quality course that aligns with College standards, Quality Matters expectations, and supports student success. Your expertise and partnership are essential, and I'm looking forward to working with you.

ACTION ITEMS

The Initial Meeting will include the Instructional Designer (ID), Subject Matter Expert (SME), and Learning Experience Architect (LXA).

SUBJECT MATTER EXPERT: ${course.deptTeam.smeName || "SME"}, please

• Provide the ID with your availability for the Initial Meeting during the week of ${formatDisplayDate(initialMeetingTask?.startDate || initialMeetingTask?.dueDate || "")}.
• Review the College Credit Course Outline with track changes.
• Discuss prerequisite sequencing and confirm your textbook or instructional materials with your Program Dean.
• Come prepared with a general vision for the course and share all ideas.
• Review the Program Design Plan.
• Reference the Program PLO Map as needed.

INSTRUCTIONAL DESIGNER: Chrystal Wickline

• Finalize the course development planning and setup phase.
• Prepare Initial Meeting discussion points.
• Prepare the Course Design Plan template.
• Schedule the Initial Meeting.

ONBOARDING DISCUSSION HIGHLIGHTS

• Overview of the course development lifecycle.
• Review of the Kickoff, Midpoint Review, and Final Review milestones.
• Alignment between outcomes, activities, and assessments.
• Quality Matters and WCAG 2.1 AA expectations.
• Communication expectations and weekly status updates.

COURSE-SPECIFIC REQUIREMENTS

• This course will be developed as a ${course.devType} within the ${course.program} program.
• Keep discussions minimal.
• Design learning that encourages authentic student engagement and minimizes over-reliance on AI-generated responses.

NEXT STEPS

• Schedule and attend the Initial Meeting.
• Begin gathering or confirming instructional materials.
• Reference the CeL SME Course Design Hub throughout development.

Please do not hesitate to reach out if you have any questions or need clarification on any aspect of the process. I am available via Teams throughout the day and look forward to our collaboration!`;

  openCommunicationToolWindow(
    popupTitle,
    clipboardMessage,
    content
  );
};

  const handleScheduleInitialMeetingEmail = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const to = [course.deptTeam.smeEmail, "a.gustafson@fscj.edu"].filter(Boolean).join("; ");
    const popupTitle = `${course.courseNumber} Initial Meeting for Course Development`;
    const clipboardMessage = "Initial meeting email draft copied to clipboard. You may also copy/edit from the text box below.";

    const content = `To: ${to}
CC:
Subject: ${course.courseNumber} Initial Meeting for Course Development
Attachment: Course Outline

Good ${greetingTime},

I am assigned to work with you on course design and development for ${course.courseNumber}: ${course.courseTitle}.
Andrew Gustafson will be present to discuss the multimedia requirements at the beginning of the course development process. This will allow us ample time to incorporate necessary multimedia elements into the course and align them with your design plan.

STIPEND
Option 1: if the stipend is still in progress
The stipend is currently being processed. Official development cannot begin until the stipend is complete. However, we can still have our initial meeting to discuss your general ideas. I can share the Course Design Plan and Overview template document with you, and we can discuss what is expected.

Option 2: if the stipend is initialized
The stipend has been initialized, so we can officially begin planning, designing, and developing. During our initial meeting, I can share the Course Design Plan and Overview template document with you, and we can discuss expectations.

THE CENTER FOR ELEARNING’S (CeL) PROCESS
Note: only include The Center for eLearning’s (CeL) Process section if working with a new SME (to the CeL or ID)
We will organize one or more initial meetings to outline the course at a high level. This will include the outcomes, objectives of the modules, and assessments. Once we have a plan, we present it to the stakeholders for approval or revision suggestions in the kickoff meeting. After we receive approval, we will begin working on the course. There will be another meeting at the mid-point of our work, followed by a final review once we complete it. Finally, we will hand the course over to our multimedia and administration teams so CeL has time to distribute it to those who will teach it.

COLLEGE CREDIT COURSE (CURRICULUM) OUTLINE
Option 1: if the outline is not online or is outdated
The course outline is not provided online or appears to have not been updated since {{20yy}}. Please provide me with the appropriate version before our initial meeting if you possess a copy. This will allow me to familiarize myself with the curriculum.

Option 2: if the outline is current
Please find attached the College Credit Course (Curriculum) Outline for your reference and convenience. If it is not the correct or most up-to-date outline, kindly provide me with the appropriate version before our initial meeting. This will allow me to familiarize myself with the curriculum.

INITIAL MEETING TOPICS AND DISCUSSION
During our first meeting, we will discuss the course design, including how many modules, module topics, assignments, assessments, program requirements, feedback, meeting preferences, weekly updates, calendar reminders, third-party information, and course details.

I am excited to work with you! You can find my contact information below. Please do not hesitate to reach out if you have any questions or concerns.`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };

  const handleScheduleInitialMeetingCalendar = (course: CourseDevelopment) => {
  const hour = new Date().getHours();
  const greetingTime =
    hour < 12 ? "morning" :
    hour < 17 ? "afternoon" :
    "evening";

  const initialMeetingTask = findTimelineTaskByExactName(
    course,
    "Conduct initial meeting"
  );

  const meetingDate =
    initialMeetingTask?.startDate || initialMeetingTask?.dueDate || "";

  const meetingTime = formatMeetingTime(
    (initialMeetingTask as any)?.meetingTime
  );

  const to = [
    course.deptTeam.smeEmail,
    "a.gustafson@fscj.edu"
  ]
    .filter(Boolean)
    .join("; ");

  const popupTitle = `${course.courseNumber} Initial Meeting Invitation`;

  const clipboardMessage =
    "Initial meeting calendar invitation copied to clipboard. You may also copy/edit from the text box below.";

  const content = `TO: ${to}
CC:
SUBJECT: ${course.courseNumber} Initial Meeting for Course Development

Good ${greetingTime},

We'll hold our initial meeting for ${course.courseNumber} on ${formatDisplayDate(
    meetingDate
  )} at ${meetingTime} to prepare for the Kickoff and establish course design elements for the Course Design Plan.

Duration: 1 hour
Location: Teams

Please notify me of any stakeholders we may have missed, and I can add them, or feel free to forward this invite.

Thank you, and I look forward to a productive initial meeting.`;

  openCommunicationToolWindow(
    popupTitle,
    clipboardMessage,
    content
  );
};

  const handleSendCourseDesignPlanDraft = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const finalizeCourseDesignPlanTask = findTimelineTaskByExactName(
      course,
      "Finalize Course Design Plan"
    );

    const finalizeCourseDesignPlanDueDate = formatDisplayDate(
      finalizeCourseDesignPlanTask?.dueDate ||
        finalizeCourseDesignPlanTask?.startDate ||
        ""
    );

    const to = course.deptTeam.smeEmail || "";
    const popupTitle = `${course.courseNumber} Course Design Plan Template`;
    const clipboardMessage =
      "Course Design Plan draft email copied to clipboard. You may also copy/edit from the text box below.";

    const content = `TO: ${to}
SUBJECT: ${course.courseNumber} Course Design Plan Template
ATTACHMENT: Course Outline and Course Design Plan Template

Good ${greetingTime},

Thank you again ${course.deptTeam.smeName || "SME"}, for meeting with me today to discuss the plans for course development.

COURSE DESIGN PLAN

The Course Design Plan template we discussed in our initial meeting is attached. Please do not hesitate to let me know if you have any questions or concerns, or if you need help.

ACTION ITEMS: SUBJECT MATTER EXPERT

- Finalize the Course Design Plan for the Kick-off meeting
- Return the CDP to the ID by ${finalizeCourseDesignPlanDueDate}
- Communicate with ${course.deptTeam.deanName || "the Program Dean"} to finalize the College Credit Course Outline (Curriculum Outline)

ACTION ITEMS: INSTRUCTIONAL DESIGNER

- Add ${course.deptTeam.smeEmail || "the SME"} to the Workshop course
- Schedule the Kickoff Meeting
- Send a Kickoff Meeting reminder, agenda, and completed Course Design Plan to stakeholders

IDEAS FOR CUSTOM INSTRUCTIONAL MATERIALS

E.g., Infographic, Interactive Book, Canvas Page (webpage), Video

IDEAS FOR ACTIVITIES, ASSIGNMENTS, AND ASSESSMENTS

E.g., Interactive case study, Knowledge check, Reflection, Scenario-based decision-making, Course Project (scaffolding)`;

    openCommunicationToolWindow(
      popupTitle,
      clipboardMessage,
      content
    );
  };


  const handleInitialMeetingRecap = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const finalizeCourseDesignPlanTask = findTimelineTaskByExactName(
      course,
      "Finalize Course Design Plan"
    );

    const completeCourseDesignPlanTask = findTimelineTaskByExactName(
      course,
      "Complete Course Design Plan"
    );

    const to = [
      course.deptTeam.smeEmail,
      "a.gustafson@fscj.edu",
      course.deptTeam.deanName,
      "Ansa.Reams.Johnson@fscj.edu",
      course.deptTeam.deanEmail,
      course.deptTeam.managerEmail,
      "kris.kristen@fscj.edu",
    ].filter(Boolean).join("; ");

    const popupTitle = `${course.courseNumber} Initial Meeting Recap`;
    const clipboardMessage =
      "Initial meeting recap copied to clipboard. You may also copy/edit from the text box below.";

    const content = `TO: ${to}
CC:
SUBJECT: ${course.courseNumber} Recap: Course Vision and Initial Meeting
ATTACHMENT: Course Outline

Good ${greetingTime},

Thank you, ${course.deptTeam.smeName || "SME"} for meeting with me today to discuss the plans for course development. If there is anything I misinterpreted or missed during our discussion, please don't hesitate to reply to all for clarification.

COURSE DEVELOPMENT INFORMATION

- Program: ${course.program}
- Course: ${course.courseNumber}: ${course.courseTitle}
- Instructional Designer: Chrystal Wickline
- Subject Matter Expert: ${course.deptTeam.smeName || "SME"}
- Course Development Type: ${course.devType}

ACTIONS ITEMS

Subject Matter Expert: ${course.deptTeam.smeName || "SME"}
- Finalize the Course Design Plan (CDP) for the Kick-off meeting
- Return the CDP to the ID by ${formatDisplayDate(
      finalizeCourseDesignPlanTask?.dueDate || finalizeCourseDesignPlanTask?.startDate || ""
    )}

Instructional Designer: Chrystal Wickline
- Send CDP to SME by EOD ${formatDisplayDate(
      completeCourseDesignPlanTask?.startDate || completeCourseDesignPlanTask?.dueDate || ""
    )}
- Schedule the Kickoff Meeting
- Send a Kickoff Meeting reminder, agenda, and completed Course Design Plan to stakeholders

INITIAL MEETING COURSE VISION OVERVIEW

- College Curriculum Outline (Course Outline) is not current. Suggested updates are notated with track changes. The instructional designer will need the finalized version before the Kickoff to avoid delay in development.

- Multimedia
- There will be various types of interactive learning activities within the course; a minimum of seven. These will range from simple to complex.
- Possibility of custom images for instructional material timeline.
- Possibility of custom Canvas pages for instructional material to supplement textbook subject matter gaps.

- Instructional Materials
- Textbook: Being evaluated by the ${course.deptTeam.smeName || "SME"}. She will coordinate with Dr. Franklin to ensure the textbook meets expectations for the program.
- Other: website, videos, articles, FSCJ Library resources, and custom learning content

- Content Design and Development
- Modules: 7
- Activities, Assignments, and Assessments will include discussions (minimal, max of 2), midterm, final exam, learning activities, written assignments, scaffolding project, presentation.
- Program Requirements: Additional program requirements include APA Resources, Health Navigator LibGuide, and AI Usage Canvas page.
- Third-party platform or special software: None`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };

  const handleMidpointReminderAgenda = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const midpointTask = findTimelineTaskByExactName(course, "Conduct midpoint review");
    const midpointDate = formatDisplayDateShort(midpointTask?.startDate || midpointTask?.dueDate || "");
    const midpointTime = formatMeetingTime((midpointTask as any)?.meetingTime);

    const to = [
      "Ansa.Reams.Johnson@fscj.edu",
      "cel@fscj.edu",
      course.deptTeam.smeEmail,
      course.deptTeam.deanEmail,
      course.deptTeam.managerEmail,
    ].filter(Boolean).join("; ");

    const popupTitle = `${course.courseNumber} Midpoint Review Meeting Reminder for Course Development`;
    const clipboardMessage = "Midpoint reminder copied to clipboard. You may also copy/edit from the text box below.";

    const content = `To: ${to}
Cc: christina.perrin@fscj.edu; Golf.K@fscj.edu; kris.kristen@fscj.edu
Subject: ${course.courseNumber} Midpoint Review Meeting Reminder for Course Development
Attachments: Course Outline, Course Design Plan

Good ${greetingTime},

This email is a friendly reminder that we'll hold our midpoint review meeting for ${course.courseNumber} on ${midpointDate} at ${midpointTime} to assess progress against the design plan, address any feedback or concerns, and confirm approval to move forward with the remaining development. This is also an opportunity to discuss any needed timeline adjustments.`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };

  const handleMidpointRecap = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const moduleProgressPercent = calculateModuleBuildProgress(course);

    const smeOpenTasks = getRoleOpenTasks(course, "SME");
    const idOpenTasks = getRoleOpenTasks(course, "ID");

    const stakeholderMilestoneTasks = [
      ["MIDPOINT REVIEW", findTimelineTaskByExactName(course, "Conduct midpoint review")],
      ["FINAL REVIEW", findTimelineTaskByExactName(course, "Conduct final review")],
      ["SME DELIVERABLES COMPLETE", findTimelineTaskByExactName(course, "End compensation")],
      ["DEVELOPMENT COMPLETION", findTimelineTaskByExactName(course, "Course completion")],
    ] as Array<[string, CourseDevelopmentTask | undefined]>;

    const remainingStakeholderMilestones = stakeholderMilestoneTasks
      .filter(([, task]) => {
        if (!task) return true;
        const status = task.status || "Not Started";
        return status === "Scheduled" || status === "In Progress" || status === "Not Started";
      })
      .map(([label, task]) => formatMilestoneLine(label, task))
      .join("\n");

    const to = [
      "Ansa.Reams.Johnson@fscj.edu",
      "cel@fscj.edu",
      course.deptTeam.smeEmail,
      course.deptTeam.deanEmail,
      course.deptTeam.managerEmail,
    ].filter(Boolean).join("; ");

    const popupTitle = `${course.courseNumber} Midpoint Review Meeting Recap for Course Development`;
    const clipboardMessage = "Midpoint recap copied to clipboard. You may also copy/edit from the text box below.";

    const content = `To: ${to}
Cc: christina.perrin@fscj.edu; Golf.K@fscj.edu; kris.kristen@fscj.edu
Subject: ${course.courseNumber} Midpoint Review Meeting Recap for Course Development
Attachments: N/A

Good ${greetingTime},

Thank you for attending and taking part in today's Midpoint Review. If there is anything I misinterpreted or missed during our discussion, please do not hesitate to Reply All for clarification.

<h1>MEETING OUTCOMES</h1>
- Stakeholders reviewed approximately ${moduleProgressPercent}% of completed modules in Canvas and (approved the development progress | identified areas requiring modification).
- Professor ${course.deptTeam.smeName || "SME"}, the Subject Matter Expert, provided feedback on (specific topics) and (all concerns were addressed | the following items require follow-up: action items).
- The timeline for completing the remaining course development (confirmed as feasible | adjusted to accommodate, specific changes).
- Stakeholders (approved continuation of development for the remaining course modules | requested review of modifications before proceeding).

<h1>ACTION ITEMS</h1>
<h2>Subject Matter Expert: Professor ${course.deptTeam.smeName || "SME"}</h2>
${formatBulletedTaskList(smeOpenTasks)}

<h2>Instructional Designer: Chrystal Wickline</h2>
${formatBulletedTaskList(idOpenTasks)}

Thank you for joining the Midpoint Review Meeting today. I'm here to support you throughout this process, so please reach out anytime.

<h1>REMAINING STAKEHOLDER MILESTONE</h1>
${remainingStakeholderMilestones || "None at this time."}`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };

  const handleScheduleFinalReview = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const finalReviewTask = findTimelineTaskByExactName(course, "Conduct final review");
    const finalReviewDate = formatDisplayDateShort(finalReviewTask?.startDate || finalReviewTask?.dueDate || "");
    const finalReviewTime = formatMeetingTime((finalReviewTask as any)?.meetingTime);

    const to = [
      "Ansa.Reams.Johnson@fscj.edu",
      "cel@fscj.edu",
      course.deptTeam.smeEmail,
      course.deptTeam.deanEmail,
      course.deptTeam.managerEmail,
    ].filter(Boolean).join("; ");

    const popupTitle = `${course.courseNumber} Final Review Meeting for Course Development`;
    const clipboardMessage = "Final review meeting for Course Development copied to clipboard. You may also copy/edit from the text box below.";

    const content = `To: ${to}
Cc: christina.perrin@fscj.edu; Golf.K@fscj.edu; kris.kristen@fscj.edu
Subject: ${course.courseNumber} Final Review Meeting for Course Development
Attachments: N/A

Good ${greetingTime},

We will hold our final review meeting for ${course.courseNumber} on ${finalReviewDate} at ${finalReviewTime}.
Please let me know of any stakeholders we may have missed, and I can add them, or feel free to forward this invite. Thank you. I look forward to confirming the successful release of the course.

<h1>AGENDA</h1>
- Brief introduction of participants
- Present and discuss the course materials: Learning Grading Plan and Outcomes Map
- Present and discuss the course (Canvas review)
- Confirm approval to finalize the course development`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };

  const handleCourseDocumentsEmail = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const courseDocumentsTask = findTimelineTaskByExactName(course, "Finalize course documents");
    const dueDateValue = courseDocumentsTask?.dueDate || courseDocumentsTask?.startDate || "";

    const shortDueDate = dueDateValue
      ? new Date(`${dueDateValue.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
      : "TBD";

    const longDueDate = dueDateValue
      ? new Date(`${dueDateValue.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "TBD";

    const to = course.deptTeam.smeEmail || "";
    const popupTitle = `${course.courseNumber} Course Documents`;
    const clipboardMessage = "Course documents email copied to clipboard. You may also copy/edit from the text box below.";

    const content = `To: ${to}
Cc:
Subject: ${course.courseNumber} Course Documents (Please review & return by ${shortDueDate})
Attachments: Outcomes Map, Course-Specific Information, and Learning Grading Plan

Good ${greetingTime},

Please find attached the CeL course document templates as part of the CeL process. These documents are ready for your review and completion. The due date for returning them to me is ${longDueDate}. You are welcome to submit them earlier at your convenience.

I have pre-populated the documents based on the course design plan and other module documentation you have submitted to me.

<h1>OUTCOMES MAP ACTION ITEMS</h1>
Please:

- Review and confirm that all items are accurate and that alignment is identified and correct.
- Complete any content that is highlighted in blue.

<h1>COURSE-SPECIFIC INFORMATION ACTION ITEMS</h1>
Please:

- Review and confirm that all items are accurate.
- Complete any content that is highlighted in blue.
- Ensure the Suggested Teaching Schedule for Different Session Lengths section is organized in the way you believe is most effective for students.
- Ensure the Suggested Activities for Teaching Different Class Types (Modality) section provides accurate and suitable suggestions for other faculty and adjuncts when they teach this course. While hybrid courses may not be offered at this time, this information will serve as guidance for instructors and adjunct faculty should a hybrid section be available in the future. Feel free to include any additional information you think would be beneficial for instructors.

<h1>LEARNING GRADING PLAN ACTION ITEMS</h1>
Please:

- Review and confirm that all items are accurate.
- Complete any content that is highlighted in blue.`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };


  const handleFinalReviewReminderAgenda = (course: CourseDevelopment) => {
    const hour = new Date().getHours();
    const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const finalReviewTask = findTimelineTaskByExactName(course, "Conduct final review");
    const finalReviewDateValue = finalReviewTask?.startDate || finalReviewTask?.dueDate || "";

    const finalReviewDateTime = finalReviewDateValue
      ? `${new Date(`${finalReviewDateValue.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })} at ${formatMeetingTime((finalReviewTask as any)?.meetingTime)}`
      : "TBD";

    const to = [
      "Ansa.Reams.Johnson@fscj.edu",
      "cel@fscj.edu",
      course.deptTeam.smeEmail,
      course.deptTeam.deanEmail,
    ].filter(Boolean).join("; ");

    const popupTitle = `${course.courseNumber} Final Review Meeting Reminder for Course Development`;
    const clipboardMessage = "Final review reminder copied to clipboard. You may also copy/edit from the text box below.";

    const content = `To: ${to}
Cc: christina.perrin@fscj.edu
Subject: ${course.courseNumber} Final Review Meeting for Course Development
Attachments: Outcomes Map and Learning Grading Plan

Good ${greetingTime},

This email is a friendly reminder that we will hold our final review meeting for ${course.courseNumber} on ${finalReviewDateTime} to confirm readiness prior to release.

<h1>AGENDA</h1>
- Brief introduction of participants
- Present and discuss the course materials: Learning Grading Plan and Outcomes Map
- Present and discuss the course (Canvas review)
- Confirm approval to finalize the course development`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };

  const handleFinalReviewRecap = (course: CourseDevelopment) => {
  const hour = new Date().getHours();

  const greetingTime =
    hour < 12
      ? "morning"
      : hour < 17
      ? "afternoon"
      : "evening";

  const finalReviewTask = findTimelineTaskByExactName(
    course,
    "Conduct final review"
  );

  const qaTask = findTimelineTaskByExactName(
    course,
    "Complete QA review"
  );

  const endCompTask = findTimelineTaskByExactName(
    course,
    "End compensation"
  );

  const qaDue =
    qaTask?.dueDate || qaTask?.startDate
      ? formatDisplayDate(
          qaTask?.dueDate || qaTask?.startDate || ""
        )
      : "[Month day, 20yy]";

  const archiveDue =
    endCompTask?.dueDate || endCompTask?.startDate
      ? formatDisplayDate(
          endCompTask?.dueDate || endCompTask?.startDate || ""
        )
      : "[Month day, 20yy]";

  const to = [
    course.deptTeam.smeEmail,
    course.deptTeam.deanName,
    "Ansa.Reams.Johnson@fscj.edu",
    course.deptTeam.managerEmail,
    "kris.kristen@fscj.edu",
  ]
    .filter(Boolean)
    .join("; ");

  const cc = [
    course.deptTeam.deanEmail,
    "cel@fscj.edu",
    "christina.perrin@fscj.edu",
  ]
    .filter(Boolean)
    .join("; ");

  const popupTitle = `${course.courseNumber} Final Review Meeting Recap`;

  const clipboardMessage =
    "Final Review recap copied to clipboard. You may also copy/edit from the text box below.";

  const content = `TO: ${to}
CC: ${cc}
SUBJECT: ${course.courseNumber} Recap: Final Review Meeting for Course Development

Good ${greetingTime},

Thank you for attending and taking part in today's Final Review. If there is anything I misinterpreted or missed during our discussion, please do not hesitate to reply to all for clarification.

COURSE DOCUMENTS

- The ${course.courseNumber} <a class="inline_disabled" title="Learning and Grading Plan" href="https://cel.quickbase.com/nav/app/bs3dcdkm5/table/bs3dcdktv/action/q?qid=155&amp;NavFrom=Recents&amp;navfrom=Recents&amp;skip=230" target="_blank" rel="noopener">Learning and Grading Plan</a> provides information to complete your Course Syllabus. Be sure to add due dates or remove the column as needed.

- Outcomes Map (attached)

MEETING OUTCOMES

- The course was approved for release, with a commitment to send a recap and final instructions for releasing the stipend.

- [List any amendments to course prior to release if applicable]

ACTION ITEMS

Instructional Designer: Chrystal Wickline

- Send Stipend Completion email by EOD today

- CeL QA Team performs a Canvas Quality Control check due ${qaDue}

- CeL Multimedia performs a Code Check and Archive due ${archiveDue}

- ID sends Course Completion email due ${archiveDue}

SUGGESTIONS AND INQUIRIES (if applicable)

- Suggestions were made to incorporate ...

3RD PARTY PLATFORM (if applicable)

- Platform:

- Course Name:

- Course Section:

- Start Date:

- End Date:

- Course Key (Copy Code):

- Notes:

- Student Course Code:

- Integration Type: Pair and sync integration

Thank you for joining the Final Review Meeting today. It has been a pleasure working with you.`;

  openCommunicationToolWindow(
    popupTitle,
    clipboardMessage,
    content
  );
};

  const handleSubmitProofreadingRequestQuickbase = (course: CourseDevelopment) => {
    const proofreadingRequestTask = findTimelineTaskByExactName(course, "Submit proofreading request");
    const finalReviewTask = findTimelineTaskByExactName(course, "Conduct final review");

    const dueDate = proofreadingRequestTask?.dueDate || proofreadingRequestTask?.startDate
      ? formatDisplayDateShort(proofreadingRequestTask?.dueDate || proofreadingRequestTask?.startDate || "")
      : "TBD";

    const finalReviewDate = finalReviewTask?.startDate || finalReviewTask?.dueDate
      ? formatDisplayDateShort(finalReviewTask?.startDate || finalReviewTask?.dueDate || "")
      : "TBD";

    const popupTitle = `${course.courseNumber} Course Documents Proofreading`;
    const clipboardMessage = "Proofreading request copied to clipboard. You may also copy/edit from the text box below.";

    const content = `Task Category: Support
Task Type: Proofreading
Brief Title: ${course.courseNumber} Course Documents Proofreading
Status: Open
Due Date: ${dueDate}
Alt Assignment Full Name: Christina Perrin
Notes:

------------------------------------------------
ONEDRIVE COURSE DOCUMENTS FOLDER
------------------------------------------------
User to insert link

------------------------------------------------
ONEDRIVE QUALITY ASSURANCE FOLDER
------------------------------------------------
User to insert link

------------------------------------------------
FINAL REVIEW DATE
------------------------------------------------
${finalReviewDate}

------------------------------------------------
NOTES
------------------------------------------------
(1) The course documents are ready for proofreading.`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
  };

    const handleRequestCodeCheckArchiveQuickbase = (course: CourseDevelopment) => {
    const courseCompletionTask = findTimelineTaskByExactName(
  course,
  "Course completion"
);

const dueDate =
  courseCompletionTask?.dueDate || courseCompletionTask?.startDate
    ? formatDisplayDateShort(
        courseCompletionTask?.dueDate ||
          courseCompletionTask?.startDate ||
          ""
      )
    : "TBD";

    const popupTitle = `${course.courseNumber} Code Check & Archive`;

    const clipboardMessage =
      "Code Check & Archive request copied to clipboard. You may also copy/edit from the text box below.";

    const content = `Task Category: Multimedia
Multimedia Task Type: Code Check

Brief Title:
${course.courseNumber} Code Check & Archive

Status:
Open

Due Date:
${dueDate}

Notes:

• The Proofreading and Quality Control reviews are complete.

• The course is ready for code check and archive.`;

    openCommunicationToolWindow(
      popupTitle,
      clipboardMessage,
      content
    );
  };

  const handleRequestQaReviewQuickbase = (course: CourseDevelopment) => {
    const finalReviewTask = findTimelineTaskByExactName(course, "Conduct final review");
    const finalReviewDate = finalReviewTask?.startDate || finalReviewTask?.dueDate
      ? formatDisplayDateShort(finalReviewTask?.startDate || finalReviewTask?.dueDate || "")
      : "TBD";

    const popupTitle = `${course.courseNumber} Quality Assurance Review`;
    const clipboardMessage = "Quality assurance review request copied to clipboard. You may also copy/edit from the text box below.";

    const content = `${course.courseNumber} Quality Assurance Review

------------------------------------------------
ONEDRIVE COURSE DOCUMENTS FOLDER
------------------------------------------------
User to insert link

------------------------------------------------
ONEDRIVE QUALITY ASSURANCE FOLDER
------------------------------------------------
User to insert link

------------------------------------------------
FINAL REVIEW DATE
------------------------------------------------
${finalReviewDate}

------------------------------------------------
NOTES
------------------------------------------------
(1) This course is ready for quality assurance review.
(2) The pre-check is complete.
(3) The course documents have been proofread.
(4) The assigned reviewer has been added to the course.`;

    openCommunicationToolWindow(popupTitle, clipboardMessage, content);
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
                        className="w-full max-w-[225px] text-xs px-2 py-1.5 border border-slate-300 bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">
                        Start of Term: {formatDisplayDateShort(activeCourse.termDeadline)}
                      </span>
                    </label>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">
                        Projected Course Completion
                      </span>
                      <div className="w-full max-w-[225px] border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800">
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
                      <input
  type="text"
  name="courseNumber"
  value={editingCourse.courseNumber}
  onChange={handleEditingChange}
  placeholder="CTS1131C"
  pattern="[A-Za-z]{3}[0-9]{4}[A-Za-z]?"
  title="Enter three letters, four numbers, and an optional final letter, such as CTS1131C."
  className="px-3 py-2 border border-slate-300 bg-white uppercase"
/>
                    </label>

                    <label className="md:col-span-2 flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Course Title</span>
                      <input name="courseTitle" value={editingCourse.courseTitle} onChange={handleEditingChange} className="px-3 py-2 border border-slate-300 bg-white" />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">Canvas Version</span>
                      <input
  type="text"
  name="canvasVersion"
  value={editingCourse.canvasVersion}
  onChange={handleEditingChange}
  placeholder="cel-cts1131c-v3a"
  pattern="cel-[a-z]{3}[0-9]{4}[a-z]?-v[a-z0-9.-]+"
  title="After the v, you may enter lowercase letters, numbers, periods, and hyphens, such as 3a or 2.a.1."
  className="px-3 py-2 border border-slate-300 bg-white lowercase font-mono"
/>
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
                      const meetingTaskIds = [4, 6, 11, 24, 44];
                      const showMeetingTime = meetingTaskIds.includes(Number(task.id));

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
                                {Number(task.id) === 3 && (
  <button
    type="button"
    onClick={() => handleOnboardingReminder(activeCourse)}
    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
  >
    <Mail className="h-3.5 w-3.5" /> Onboarding Reminder
  </button>
)}

{Number(task.id) === 4 && (
  <button
    type="button"
    onClick={() => handleOnboardingRecap(activeCourse)}
    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
  >
    <Mail className="h-3.5 w-3.5" /> Send Onboarding Recap
  </button>
)}
                                {Number(task.id) === 5 && (
                                  <div className="flex flex-wrap gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleScheduleInitialMeetingEmail(activeCourse)}
                                      className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                    >
                                      <Mail className="h-3.5 w-3.5" /> Initial Meeting Email
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleScheduleInitialMeetingCalendar(activeCourse)}
                                      className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                    >
                                      <Calendar className="h-3.5 w-3.5" /> Schedule Initial Meeting
                                    </button>
                                  </div>
                                )}
                                {Number(task.id) === 6 && (
                                  <div className="flex flex-wrap gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleInitialMeetingRecap(activeCourse)}
                                      className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                    >
                                      <Mail className="h-3.5 w-3.5" /> Initial Meeting Recap
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSendCourseDesignPlanDraft(activeCourse)}
                                      className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                    >
                                      <Mail className="h-3.5 w-3.5" /> Send Course Design Plan Draft
                                    </button>
                                  </div>
                                )}
                                {Number(task.id) === 23 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMidpointReminderAgenda(activeCourse)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                  >
                                    <Mail className="h-3.5 w-3.5" /> Midpoint Reminder and Agenda
                                  </button>
                                )}
                                {Number(task.id) === 24 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMidpointRecap(activeCourse)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                  >
                                    <Mail className="h-3.5 w-3.5" /> Midpoint Recap
                                  </button>
                                )}
                                {Number(task.id) === 25 && (
                                  <button
                                    type="button"
                                    onClick={() => handleScheduleFinalReview(activeCourse)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                  >
                                    <Calendar className="h-3.5 w-3.5" /> Schedule Final Review
                                  </button>
                                )}
                                {Number(task.id) === 38 && (
                                  <button
                                    type="button"
                                    onClick={() => handleCourseDocumentsEmail(activeCourse)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                  >
                                    <Mail className="h-3.5 w-3.5" /> Course Documents
                                  </button>
                                )}
                                {Number(task.id) === 39 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitProofreadingRequestQuickbase(activeCourse)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                  >
                                    <Clipboard className="h-3.5 w-3.5" /> Submit Proofreading Request [Quickbase]
                                  </button>
                                )}
                                {Number(task.id) === 41 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRequestQaReviewQuickbase(activeCourse)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                  >
                                    <Clipboard className="h-3.5 w-3.5" /> Request QA Review [Quickbase]
                                  </button>
                                )}
                                {Number(task.id) === 45 && (
  <button
    type="button"
    onClick={() => handleRequestCodeCheckArchiveQuickbase(activeCourse)}
    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
  >
    <Clipboard className="h-3.5 w-3.5" /> Request Code Check and Archive [Quickbase]
  </button>
)}
                                {Number(task.id) === 43 && (
                                  <button
                                    type="button"
                                    onClick={() => handleFinalReviewReminderAgenda(activeCourse)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
                                  >
                                    <Mail className="h-3.5 w-3.5" /> Final Review Reminder and Agenda
                                  </button>
                                )}

                                {Number(task.id) === 44 && (
  <button
    type="button"
    onClick={() => handleFinalReviewRecap(activeCourse)}
    className="inline-flex items-center gap-1 rounded-md border border-[#006282]/30 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#006282] hover:bg-[#006282] hover:text-white transition-colors"
  >
    <Mail className="h-3.5 w-3.5" />
    Final Review Recap
  </button>
)}
                              </div>

                              {isOver && (
                                <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-semibold uppercase text-white animate-pulse">
                                  Overdue
                                </span>
                              )}
                            </div>

                            <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs ${showMeetingTime ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
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
                                  <option value="Projected">Projected</option>
                                  <option>On Hold</option>
                                  <option>Submission Late (SME)</option>
                                  <option>Submitted to MT Queue</option>
                                  <option>SME Reviewing</option>
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

                              {showMeetingTime && (
                                <label className="flex flex-col gap-0.5">
                                  <span className="text-[9px] uppercase text-slate-500 font-semibold">Meeting Time</span>
                                  <input
                                    type="time"
                                    name="meetingTime"
                                    value={(draft as any).meetingTime || ''}
                                    onChange={(e) => autoSaveTaskField(task, 'meetingTime', e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                                  />
                                </label>
                              )}
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

      {showCompensationDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">{compensationDialogTitle}</h3>
                <p className="text-xs text-slate-500">Review and copy the compensation notice without leaving the workspace.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompensationDialog(false)}
                className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Compensation notice preview
              </label>
              <textarea
                rows={14}
                value={compensationDialogContent}
                onChange={(e) => setCompensationDialogContent(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={copyCompensationDialogContent}
                className="inline-flex items-center gap-1.5 rounded border border-[#006282] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#006282] hover:bg-[#006282] hover:text-white"
              >
                <Clipboard className="h-3.5 w-3.5" /> Copy
              </button>
              <button
                type="button"
                onClick={() => setShowCompensationDialog(false)}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
