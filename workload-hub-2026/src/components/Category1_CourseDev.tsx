import React, { useState } from 'react';
import { CourseDevelopment, CourseDevelopmentTask } from '../types';
import { 
  FileText, Calendar, Plus, Mail, CheckCircle2, AlertTriangle, 
  Trash2, Sliders, ChevronRight, Share2, Clipboard, ShieldAlert,
  SlidersHorizontal, Sparkles
} from 'lucide-react';
import { 
  calculateTimelineTasks, 
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

export function Category1CourseDev({ 
  courseDevelopments, 
  customBlocked,
  onAddCourse, 
  onUpdateCourse, 
  onDeleteCourse 
}: Category1Props) {
  const [selectedId, setSelectedId] = useState<string>(courseDevelopments[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState<CourseDevelopmentTask | null>(null);

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

  const activeCourse = courseDevelopments.find(c => c.id === selectedId) || courseDevelopments[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: 'onboarding') => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Pre-calculate full timeline tasks
    const generatedTasks = calculateTimelineTasks(formData.termDeadline, formData.onboarding, customBlocked);
    
    const newCourse: CourseDevelopment = {
      program: formData.program,
      courseNumber: formData.courseNumber.toUpperCase(),
      courseTitle: formData.courseTitle,
      canvasVersion: formData.canvasVersion || `cel-${formData.courseNumber.toUpperCase()}-v${formData.versionNumber}`,
      workshopCourse: formData.workshopCourse || `wickline-wrkshp-cel-${formData.courseNumber.toUpperCase()}-v${formData.versionNumber}`,
      devType: formData.devType,
      versionNumber: Number(formData.versionNumber),
      termRelease: formData.termRelease,
      termDeadline: formData.termDeadline,
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
      hideCompletedTasks: false,
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

    await onUpdateCourse(updatedCourse);
  };

  const handleRecalculateTimeline = async (newDeadline: string) => {
    if (!activeCourse) return;
    const recalculatedTasks = calculateTimelineTasks(newDeadline, activeCourse.onboarding, customBlocked);
    // Maintain completed status for identical names if possible
    recalculatedTasks.forEach(newTask => {
      const existing = activeCourse.tasks.find(ot => ot.name === newTask.name);
      if (existing && existing.status === 'Complete') {
        newTask.status = 'Complete';
      }
    });

    const updatedCourse = {
      ...activeCourse,
      termDeadline: newDeadline,
      tasks: recalculatedTasks
    };

    await onUpdateCourse(updatedCourse);
  };

  const handleToggleOnboarding = async () => {
    if (!activeCourse) return;
    const nextOnboarding = !activeCourse.onboarding;
    const recalculatedTasks = calculateTimelineTasks(activeCourse.termDeadline, nextOnboarding, customBlocked);
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
    const task8 = course.tasks.find(t => t.id === 8 || t.id === 25 || t.name.toLowerCase().includes("develop module 1 content")); // "Develop Module 1 Content"
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
  const handleCopyStatusReport = (course: CourseDevelopment) => {
    const completedTasks = course.tasks.filter(t => t.status === 'Complete').map(t => `- ${t.name} (Done: ${t.dueDate || 'N/A'})`).join('\n');
    const pendingTasks = course.tasks.filter(t => t.status !== 'Complete' && t.status !== 'Not Applicable').slice(0, 4).map(t => `- [ ] ${t.name} (Due: ${t.dueDate || 'N/A'})`).join('\n');
    
    const blockText = `=================================================
FSCJ WEEKLY STATUS SUMMARY REPORT - ONLINE OPERATIONS
=================================================
[Division Sponsoring Program]: ${course.program}
[Academic Course Number]: ${course.courseNumber} - ${course.courseTitle}
[Operational Phase]: V${course.versionNumber} (${course.devType})
[Target Term Release]: ${course.termRelease}
[Critical Anchor Deadline]: ${course.termDeadline}
[Onboarding Sequence Active]: ${course.onboarding ? 'Yes' : 'No'}
[Overall Progression Grade]: ${calculateProgress(course)}% Completed

ACTIVE OUTSTANDING TASK QUEUE:
${pendingTasks || 'No outstanding tasks in planning bounds.'}

COMPLETED MILESTONES REVIEW:
${completedTasks || 'No milestones completed.'}

DEPARTMENT CORE DELEGATES:
SME: ${course.deptTeam.smeName} <${course.deptTeam.smeEmail}>
ID Lead: Chrystal Wickline <wickline@fscj.edu>
Dean Coordinator: ${course.deptTeam.deanName} <${course.deptTeam.deanEmail}>
=================================================`;

    navigator.clipboard.writeText(blockText);
    alert('Academic status report copied nicely to clipboard!');
  };

  // Compliance business rule calculation: check if Closeout is >= 30 days
  const getCloseoutCompliance = (course: CourseDevelopment) => {
    const task26 = course.tasks.find(t => t.id === 26 || t.id === 62 || t.name.toLowerCase().includes("code check and archive")); // "Code Check & Archive"
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
            Category 1: Academic Course Developments
          </h2>
          <p className="text-xs text-slate-500">
            Backward-staggered course creation calendars tracking collegiate accreditation
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#006282] hover:bg-[#076092] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Academic Course
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COURSES SIDEBAR */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="border-b border-slate-200 pb-1.5">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">
              Live Course Tracks list
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1">
            {courseDevelopments.length === 0 ? (
              <div className="p-6 bg-slate-50 text-center text-slate-400 border border-dashed border-slate-200">
                No course development schedules loaded. Click "+ Add Academic Course" to begin.
              </div>
            ) : (
              courseDevelopments.map(c => {
                const isSelected = c.id === (activeCourse?.id || '');
                const prog = calculateProgress(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id || '')}
                    className={`p-4 border text-left bg-white transition-all flex flex-col gap-2 select-none cursor-pointer outline-none relative overflow-hidden ${
                      isSelected 
                        ? 'border-[#006282] ring-1 ring-[#006282] shadow-xs' 
                        : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    {/* Dev Type Marker Box */}
                    <div className="absolute right-0 top-0 h-full w-1" style={{ backgroundColor: getDevTypeColor(c.devType) }}></div>
                    
                    <div className="flex justify-between items-start pr-2">
                      <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: `${getDevTypeColor(c.devType)}12`, color: getDevTypeColor(c.devType) }}>
                        {c.devType}
                      </span>
                      <span className="text-2xs font-mono font-semibold text-slate-400">
                        {c.termRelease}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {c.courseNumber} - {c.courseTitle}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium font-mono uppercase mt-0.5">
                        {c.program}
                      </p>
                    </div>

                    {/* Progress Bar Mini */}
                    <div className="mt-2 text-2xs flex justify-between items-center text-slate-500">
                      <span>Term Deadline: {c.termDeadline}</span>
                      <span className="font-semibold">{prog}% Completeness</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 mt-1">
                      <div className={`h-1 ${getProgressBarColor(prog)}`} style={{ width: `${prog}%` }}></div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="lg:col-span-8">
          {activeCourse ? (
            <div className="flex flex-col gap-6 bg-white border border-[#E0DCD8] p-6 shadow-xs relative">
              
              {/* UPPER DECK */}
              <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: getDevTypeColor(activeCourse.devType) }}>
                      {activeCourse.devType} Track - Canvas V{activeCourse.versionNumber}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">
                      Term Anchor: {activeCourse.termRelease} 
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-950 mt-1">
                    {activeCourse.courseNumber}: {activeCourse.courseTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xs uppercase text-slate-400 font-semibold font-mono">Alert Alignment:</span>
                  <select
                    value={activeCourse.alertStatus}
                    onChange={(e) => handleAlertStatusChange(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 bg-white font-semibold focus:outline-none"
                  >
                    <option value="No Concerns">No Concerns (Green)</option>
                    <option value="Potential Concerns">Potential Concerns (Orange)</option>
                    <option value="High Priority Concerns">High Priority (Red)</option>
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
                      Course closeout milestone (Task 26) is scheduled less than 30 business days before the Term Release Anchor date ({activeCourse.termDeadline}). Available gap is currently only {closeoutComp.count} business days, creating a bottleneck.
                    </span>
                  </div>
                </div>
              )}

              {/* STAKEHOLDERS METADATA CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-dashed border-[#E0DCD8] pb-4 font-mono text-xs">
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
              <div className="border border-slate-100 bg-[#F4F1ED]/40 p-4">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="uppercase text-slate-700">Course Design completeness matrix</span>
                  <span className="text-[#006282] font-semibold">{calculateProgress(activeCourse)}% Completed</span>
                </div>
                <div className="w-full bg-slate-200 h-2">
                  <div className={`h-2 transition-all duration-500 ${getProgressBarColor(calculateProgress(activeCourse))}`} style={{ width: `${calculateProgress(activeCourse)}%` }}></div>
                </div>
              </div>

              {/* STAKEHOLDERS PANEL WRITER */}
              <div className="bg-slate-5 * p-4 border border-[#E0DCD8]">
                <h4 className="text-xs uppercase font-semibold text-slate-700 mb-2 border-b pb-1">
                  CeL & Academic Division Sibling Contacts Map
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs md:font-mono">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">Subject Matter Expert:</span>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">{activeCourse.deptTeam.smeName}</span>
                      <span className="text-slate-500 font-normal">{activeCourse.deptTeam.smeEmail}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">Division ID:</span>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">Chrystal Wickline</span>
                      <span className="text-slate-500 font-normal">wickline@fscj.edu</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">Academic Dean:</span>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">{activeCourse.deptTeam.deanName}</span>
                      <span className="text-slate-500 font-normal">{activeCourse.deptTeam.deanEmail}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block font-semibold mb-0.5">Academic Program Manager:</span>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">{activeCourse.deptTeam.managerName || 'None assigned'}</span>
                      <span className="text-slate-500 font-normal">{activeCourse.deptTeam.managerEmail || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE CONTROLS SHELF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F4F1ED]/20 p-4 border border-[#E0DCD8]/80">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-slate-800 uppercase">Operational Dates Controllers</h4>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-slate-500 uppercase font-mono">Anchor Deadline:</span>
                    <input
                      type="date"
                      value={activeCourse.termDeadline}
                      onChange={(e) => handleRecalculateTimeline(e.target.value)}
                      className="text-2xs px-2 py-1 border border-slate-300 bg-white focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1.5 text-2xs">
                    <button
                      onClick={handleToggleOnboarding}
                      className="text-slate-600 hover:text-slate-900 font-semibold uppercase flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#33B1C8]" />
                      <span>Onboarding: {activeCourse.onboarding ? 'Active (28 Tasks)' : 'Bypassed (23 Tasks)'}</span>
                    </button>
                    <button
                      onClick={handleToggleHideCompleted}
                      className="text-slate-600 hover:text-slate-900 font-semibold uppercase flex items-center gap-1 cursor-pointer select-none"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeCourse.hideCompletedTasks ? 'Showing All Tasks' : 'Hide Completed Tasks'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleCopyStatusReport(activeCourse)}
                    className="px-3 py-1.5 border border-[#006282] text-slate-800 hover:bg-slate-50 text-2xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-[#006282]" /> Copy status summary Report
                  </button>
                  <button
                    onClick={() => triggerCompensationDraft(activeCourse)}
                    className="px-3 py-1.5 border border-[#087834] text-slate-800 hover:bg-slate-50 text-2xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#087834]" /> SME compensation notification
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this course schedule from Firestore permanently?")) {
                        onDeleteCourse(activeCourse.id || '');
                      }
                    }}
                    className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 text-2xs font-semibold uppercase flex items-center gap-1 cursor-pointer outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete Project
                  </button>
                </div>
              </div>

              {/* TASKS TABLE MATRIX */}
              <div className="border border-slate-200 mt-2">
                <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs uppercase font-semibold text-slate-700">Cascade Timeline Milestones</span>
                  <span className="text-2xs text-slate-400 font-mono">Sorted backwards from Anchor Deadline</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-500 font-semibold border-b text-[10px] uppercase">
                        <th className="px-4 py-2">Task</th>
                        <th className="px-4 py-2">Owner</th>
                        <th className="px-4 py-2">Start Date</th>
                        <th className="px-4 py-2">Due Date</th>
                        <th className="px-4 py-2 text-center w-16">Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCourse.tasks
                        .filter(t => !activeCourse.hideCompletedTasks || t.status !== 'Complete')
                        .map((task, idx) => {
                          const isNA = task.status === 'Not Applicable';
                          const isComp = task.status === 'Complete';
                          
                          // Check if task is overdue in system context
                          const today = formatDate(new Date());
                          const isOver = task.status !== 'Complete' && !isNA && task.dueDate && task.dueDate < today;

                          return (
                            <tr key={task.id} className={`hover:bg-slate-50/50 ${isNA ? 'bg-slate-50/30' : ''}`}>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-col">
                                  <span className={`font-semibold ${isComp ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {task.id}. {task.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Phase: {task.phase} {task.durationDays > 0 ? `(${task.durationDays} working days)` : ''}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-slate-700">
                                {task.assignedTo}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">
                                {task.startDate ? task.startDate : 'N/A'}
                              </td>
                              <td className={`px-4 py-2.5 font-mono font-semibold ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
                                {task.dueDate ? task.dueDate : 'N/A'}
                                {isOver && (
                                  <span className="ml-1 text-[9px] uppercase tracking-widest font-bold font-mono bg-rose-600 text-white px-1.5 py-0.5 rounded animate-pulse">
                                    Overdue Alert
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {!isNA ? (
                                  <input
                                    type="checkbox"
                                    checked={isComp}
                                    onChange={() => handleToggleTask(idx)}
                                    className="accent-[#006282] w-4.5 h-4.5 rounded cursor-pointer border-slate-300"
                                  />
                                ) : (
                                  <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5">
                                    N/A
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
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
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Term Deadline (Anchor):</label>
                  <input
                    type="date"
                    name="termDeadline"
                    value={formData.termDeadline}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white text-xs font-mono animate-fade-in"
                  />
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
  const task26 = course.tasks.find(t => t.id === 26 || t.id === 62 || t.name.toLowerCase().includes("code check and archive"));
  if (!task26 || !task26.dueDate) return true;
  
  const count = countWorkingDaysBetween(task26.dueDate, course.termDeadline, customBlocked);
  return count >= 30;
}
