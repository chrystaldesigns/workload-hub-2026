import React, { useState } from 'react';
import { LssProject, LssTask } from '../types';
import { 
  FileText, FolderGit, Plus, Printer, CheckCircle, 
  Clock, AlertCircle, Trash2, ArrowRight, UserCheck, CheckCircle2, ChevronRight
} from 'lucide-react';
import { formatDate, parseDate, stepWorkingDays } from '../utils/calendarEngine';

interface Category2Props {
  lssProjects: LssProject[];
  customBlocked: string[];
  onAddProject: (project: LssProject) => Promise<void>;
  onUpdateProject: (project: LssProject) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function Category2LssProjects({
  lssProjects,
  customBlocked,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}: Category2Props) {
  const [selectedId, setSelectedId] = useState<string>(lssProjects[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Custom manual task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('Chrystal Wickline');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // SBM Form setup
  const [formData, setFormData] = useState({
    title: '',
    type: 'DMAIC',
    priority: 'Moderate' as const,
    startDate: '2026-06-01',
    status: 'In Progress' as const,
    projectLead: 'Chrystal Wickline',
    processOwner: '',
    projectChampion: '',
    stakeholders: '',
    problemStatement: '',
    businessCaseAndBenefits: '',
    inScope: '',
    outOfScope: '',
    performanceMetrics: '',
    risks: '',
    voiceOfCustomer: '',
    customerComment: '',
    issue: '',
    customerRequirement: '',
    objectiveMeasure: '',
    operationalDefinition: '',
    timelineMethodology: 'Six Sigma' as const,
    defineDuration: 4,
    measureDuration: 4,
    analyzeDuration: 4,
    improveDuration: 4,
    controlDuration: 4,
    timelineNotes: ''
  });

  const activeProject = lssProjects.find(p => p.id === selectedId) || lssProjects[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate phase Projected Completions
    const calculatePhaseDates = (start: string) => {
      let current = start;
      const dDays = Number(formData.defineDuration) * 5; // approx 5 work days/week
      const mDays = Number(formData.measureDuration) * 5;
      const aDays = Number(formData.analyzeDuration) * 5;
      const iDays = Number(formData.improveDuration) * 5;
      const cDays = Number(formData.controlDuration) * 5;

      const dComp = stepWorkingDays(current, dDays, 1, customBlocked);
      const mComp = stepWorkingDays(dComp, mDays, 1, customBlocked);
      const aComp = stepWorkingDays(mComp, aDays, 1, customBlocked);
      const iComp = stepWorkingDays(aComp, iDays, 1, customBlocked);
      const cComp = stepWorkingDays(iComp, cDays, 1, customBlocked);

      return {
        dComp, mComp, aComp, iComp, cComp
      };
    };

    const phaseComps = calculatePhaseDates(formData.startDate);

    const newProj: LssProject = {
      title: formData.title,
      type: formData.type,
      priority: formData.priority,
      startDate: formData.startDate,
      targetCompletionDate: phaseComps.cComp,
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
      defineProjectedCompletion: phaseComps.dComp,
      measureDuration: Number(formData.measureDuration),
      measureProjectedCompletion: phaseComps.mComp,
      analyzeDuration: Number(formData.analyzeDuration),
      analyzeProjectedCompletion: phaseComps.aComp,
      improveDuration: Number(formData.improveDuration),
      improveProjectedCompletion: phaseComps.iComp,
      controlDuration: Number(formData.controlDuration),
      controlProjectedCompletion: phaseComps.cComp,
      gateReviewDates: `Define Gate: ${phaseComps.dComp} | Measure Gate: ${phaseComps.mComp} | Analyze Gate: ${phaseComps.aComp}`,
      estimatedDuration: Number(formData.defineDuration) + Number(formData.measureDuration) + Number(formData.analyzeDuration) + Number(formData.improveDuration) + Number(formData.controlDuration),
      timelineNotes: formData.timelineNotes,
      tasks: []
    };

    await onAddProject(newProj);
    setShowAddModal(false);
    
    // reset form
    setFormData({
      title: '',
      type: 'DMAIC',
      priority: 'Moderate',
      startDate: '2026-06-01',
      status: 'In Progress',
      projectLead: 'Chrystal Wickline',
      processOwner: '',
      projectChampion: '',
      stakeholders: '',
      problemStatement: '',
      businessCaseAndBenefits: '',
      inScope: '',
      outOfScope: '',
      performanceMetrics: '',
      risks: '',
      voiceOfCustomer: '',
      customerComment: '',
      issue: '',
      customerRequirement: '',
      objectiveMeasure: '',
      operationalDefinition: '',
      timelineMethodology: 'Six Sigma',
      defineDuration: 4,
      measureDuration: 4,
      analyzeDuration: 4,
      improveDuration: 4,
      controlDuration: 4,
      timelineNotes: ''
    });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newTaskName || !newTaskDueDate) return;

    const newTask: LssTask = {
      id: `task-${Date.now()}`,
      name: newTaskName,
      assignedTo: newTaskOwner,
      dueDate: newTaskDueDate,
      status: 'Pending'
    };

    const updatedTasks = [...(activeProject.tasks || []), newTask];
    const updatedProject = {
      ...activeProject,
      tasks: updatedTasks
    };

    await onUpdateProject(updatedProject);
    setNewTaskName('');
    setNewTaskDueDate('');
  };

  const handleToggleTaskStatus = async (taskIdx: number) => {
    if (!activeProject) return;
    const updatedTasks = [...(activeProject.tasks || [])];
    const t = updatedTasks[taskIdx];
    t.status = t.status === 'Completed' ? 'Pending' : 'Completed';

    const updatedProject = {
      ...activeProject,
      tasks: updatedTasks
    };
    await onUpdateProject(updatedProject);
  };

  const handleDeleteTask = async (taskIdx: number) => {
    if (!activeProject) return;
    const updatedTasks = (activeProject.tasks || []).filter((_, i) => i !== taskIdx);
    const updatedProject = {
      ...activeProject,
      tasks: updatedTasks
    };
    await onUpdateProject(updatedProject);
  };

  const triggerNativePrint = () => {
    window.print();
  };

  const getPriorityBadge = (p: string) => {
    switch(p) {
      case 'Critical': return 'border-rose-400 bg-rose-50 text-rose-700 font-semibold';
      case 'High': return 'border-amber-400 bg-amber-50 text-amber-700 font-semibold';
      case 'Moderate': return 'border-blue-300 bg-blue-50 text-blue-700 font-semibold';
      default: return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  const calculateCompletionRate = (p: LssProject) => {
    if (!p.tasks || p.tasks.length === 0) return 0;
    const done = p.tasks.filter(t => t.status === 'Completed').length;
    return Math.round((done / p.tasks.length) * 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 print:p-0">
      
      {/* ACTION BLOCK */}
      <div className="flex justify-between items-center bg-white border border-[#E0DCD8] p-4 shadow-2xs print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-wide">
            Category 2: Lean Six Sigma Charters
          </h2>
          <p className="text-xs text-slate-500">
            Methodology-driven business continuous improvement registers mapping collegiate processes
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#006282] hover:bg-[#076092] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Project Charter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* MANUAL SIDEBAR SELECTION */}
        <div className="lg:col-span-4 flex flex-col gap-3 print:hidden">
          <div className="border-b border-slate-200 pb-1.5">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">
              Tracked Charters
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1">
            {lssProjects.length === 0 ? (
              <div className="p-6 bg-slate-50 text-center text-slate-400 border border-dashed border-slate-200">
                No Lean Six Sigma charter models active. Create one by clicking "+ Create Project Charter".
              </div>
            ) : (
              lssProjects.map(proj => {
                const isSelected = proj.id === (activeProject?.id || '');
                const rate = calculateCompletionRate(proj);
                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedId(proj.id || '')}
                    className={`p-4 border text-left bg-white transition-all flex flex-col gap-1.5 select-none cursor-pointer outline-none ${
                      isSelected 
                        ? 'border-[#006282] ring-1 ring-[#006282] shadow-xs' 
                        : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-center text-2xs font-mono mb-0.5">
                      <span className="text-[10px] font-bold text-[#006282] uppercase">{proj.type}</span>
                      <span className={`px-2 py-0.5 border text-[9px] uppercase font-mono ${getPriorityBadge(proj.priority)}`}>
                        {proj.priority}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {proj.title}
                    </h3>

                    <div className="text-2xs text-slate-500 font-mono mt-1 flex justify-between items-center">
                      <span>Target: {proj.targetCompletionDate}</span>
                      <span className="font-semibold text-[#006282]">{rate}% Tasks Done</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILS CHARTER SHEET */}
        <div className="lg:col-span-8 print:w-full print:col-span-12">
          {activeProject ? (
            <div id="printable-charter-sheet" className="bg-white border-2 border-slate-800 shadow-sm p-6 flex flex-col gap-6 print:border-0 print:p-0">
              
              {/* TOP HEADER CONTROLS (PRINT ONLY IN STYLE) */}
              <div className="border-b-4 border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#006282] font-semibold font-mono block">
                    Lean Six Sigma Continuous Quality Project Charter
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900 mt-1 print:text-xl">
                    {activeProject.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Operational Methodology: <strong>{activeProject.timelineMethodology} Timeline Framework</strong>
                  </p>
                </div>
                
                <div className="flex flex-col items-end shrink-0 print:items-start print:mt-1 font-mono text-xs">
                  <span className={`px-2.5 py-1 text-xs uppercase font-semibold border ${getPriorityBadge(activeProject.priority)}`}>
                    {activeProject.priority} Priority
                  </span>
                  <span className="text-2xs text-slate-500 mt-1 font-mono uppercase">
                    Status: {activeProject.status}
                  </span>
                </div>
              </div>

              {/* ACTION TOOLBAR (PRINT HIDDEN) */}
              <div className="flex justify-between items-center bg-[#F4F1ED]/40 border border-[#E0DCD8] p-3.5 print:hidden">
                <span className="text-2xs font-mono text-slate-500 font-semibold uppercase">
                  Institutional Charter Report Controls:
                </span>
                <div className="flex items-center gap-1.5 font-mono text-2xs">
                  <button
                    onClick={triggerNativePrint}
                    className="px-3 py-1.5 border border-slate-800 text-slate-800 hover:bg-slate-50 text-2xs font-semibold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-800" /> Export / Print APA compliance Charter
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this Continuous Improvement Charter?")) {
                        onDeleteProject(activeProject.id || '');
                      }
                    }}
                    className="px-2 py-1.5 text-rose-700 hover:bg-rose-50 text-2xs font-semibold uppercase cursor-pointer"
                  >
                    Delete Charter
                  </button>
                </div>
              </div>

              {/* SIBLINGS DESIGN SYSTEM STAKEHOLDERS METRICS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-dashed border-[#E0DCD8] pb-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Project Lead:</span>
                  <strong className="text-slate-800 font-semibold">{activeProject.projectLead}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Process Owner:</span>
                  <strong className="text-slate-800 font-semibold">{activeProject.processOwner || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Project Champion:</span>
                  <strong className="text-slate-800 font-semibold">{activeProject.projectChampion || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Stakeholders:</span>
                  <strong className="text-slate-800 font-semibold">{activeProject.stakeholders || 'N/A'}</strong>
                </div>
              </div>

              {/* SIX SIGMA CHARTER CORE BLOCKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="border border-slate-200 bg-slate-50 p-4 print:bg-white print:p-2">
                  <h4 className="font-semibold text-[#006282] uppercase mb-1 flex items-center gap-1">
                    Problem Statement
                  </h4>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    {activeProject.problemStatement || 'Problem statement review pending formal submission.'}
                  </p>
                </div>

                <div className="border border-slate-200 bg-slate-50 p-4 print:bg-white print:p-2">
                  <h4 className="font-semibold text-[#006282] uppercase mb-1">
                    Business Case & Cost Benefits [Y = f(x)]
                  </h4>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    {activeProject.businessCaseAndBenefits || 'Quantified business benefit mappings not yet calculated.'}
                  </p>
                </div>

                <div className="border border-slate-200 bg-slate-50 p-4 print:bg-white print:p-2">
                  <h4 className="font-semibold text-[#006282] uppercase mb-1">
                    In Scope Bounds
                  </h4>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    {activeProject.inScope || 'Roster system alignment bounds are undefined.'}
                  </p>
                </div>

                <div className="border border-slate-200 bg-slate-50 p-4 print:bg-white print:p-2">
                  <h4 className="font-semibold text-rose-800 uppercase mb-1">
                    Out of Scope Exclusions
                  </h4>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    {activeProject.outOfScope || 'Exceptions and non-process boundaries undefined.'}
                  </p>
                </div>

                <div className="border border-slate-200 bg-slate-50 p-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 print:bg-white print:p-2">
                  <div>
                    <h4 className="font-semibold text-[#006282] uppercase mb-1">
                      Cycle Metrics & Sigma Levels
                    </h4>
                    <p className="text-slate-700 leading-relaxed font-sans">
                      {activeProject.performanceMetrics || 'No processing duration or defect rate data logs logged.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#006282] uppercase mb-1">
                      Voice of Customer (VOC) {"->"} CTQ Mappings
                    </h4>
                    <p className="text-slate-700 leading-relaxed font-sans">
                      {activeProject.voiceOfCustomer || 'Customer statements and quality targets reviews outstanding.'}
                    </p>
                  </div>
                </div>

                {/* Sibling layouts for VOC CTQ detailed segments */}
                {(activeProject.customerComment || activeProject.issue) && (
                  <div className="border border-slate-200 bg-[#F4F1ED]/30 p-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-2xs font-mono">
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px]">VOC Comment:</span>
                      <span className="text-slate-800 font-medium font-sans leading-relaxed block">{activeProject.customerComment}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px]">Identified Quality Issue:</span>
                      <span className="text-slate-800 font-medium font-sans leading-relaxed block">{activeProject.issue}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px]">CTQ Target:</span>
                      <span className="text-slate-800 font-medium font-sans leading-relaxed block">{activeProject.customerRequirement}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px]">Metric Measure:</span>
                      <span className="text-slate-800 font-medium font-sans leading-relaxed block">{activeProject.objectiveMeasure}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* DMAIC ESTIMATED CASCADE TIMELINE */}
              <div className="border-t border-slate-300 pt-6">
                <h3 className="text-xs uppercase font-semibold text-slate-800 tracking-wider mb-2 font-mono">
                  DMAIC Phase Projected Milestones
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  
                  <div className="border p-2.5 bg-slate-50/50 flex flex-col font-mono text-[10px]">
                    <span className="font-semibold text-slate-700 text-[9px]">1. DEFINE (Duration: {activeProject.defineDuration || 4}w)</span>
                    <span className="text-slate-400 uppercase mt-1">Completion:</span>
                    <span className="text-[#006282] font-semibold mt-0.5">{activeProject.defineProjectedCompletion || 'Pending'}</span>
                  </div>

                  <div className="border p-2.5 bg-slate-50/50 flex flex-col font-mono text-[10px]">
                    <span className="font-semibold text-slate-700 text-[9px]">2. MEASURE (Duration: {activeProject.measureDuration || 4}w)</span>
                    <span className="text-slate-400 uppercase mt-1">Completion:</span>
                    <span className="text-[#006282] font-semibold mt-0.5">{activeProject.measureProjectedCompletion || 'Pending'}</span>
                  </div>

                  <div className="border p-2.5 bg-slate-50/50 flex flex-col font-mono text-[10px]">
                    <span className="font-semibold text-slate-700 text-[9px]">3. ANALYZE (Duration: {activeProject.analyzeDuration || 4}w)</span>
                    <span className="text-slate-400 uppercase mt-1">Completion:</span>
                    <span className="text-[#006282] font-semibold mt-0.5">{activeProject.analyzeProjectedCompletion || 'Pending'}</span>
                  </div>

                  <div className="border p-2.5 bg-slate-50/50 flex flex-col font-mono text-[10px]">
                    <span className="font-semibold text-slate-700 text-[9px]">4. IMPROVE (Duration: {activeProject.improveDuration || 4}w)</span>
                    <span className="text-slate-400 uppercase mt-1">Completion:</span>
                    <span className="text-[#006282] font-semibold mt-0.5">{activeProject.improveProjectedCompletion || 'Pending'}</span>
                  </div>

                  <div className="border p-2.5 bg-slate-50/50 flex flex-col font-mono text-[10px]">
                    <span className="font-semibold text-slate-700 text-[9px]">5. CONTROL (Duration: {activeProject.controlDuration || 4}w)</span>
                    <span className="text-slate-400 uppercase mt-1">Completion:</span>
                    <span className="text-[#006282] font-semibold mt-0.5">{activeProject.controlProjectedCompletion || 'Pending'}</span>
                  </div>

                </div>

                <div className="bg-[#F4F1ED]/40 border border-slate-200 p-2.5 text-[10px] text-slate-500 font-mono mt-3">
                  <span><strong>Synchronized Gate Reviews Agenda:</strong> {activeProject.gateReviewDates || 'Reviews schedules are calculated dynamically.'}</span>
                </div>
              </div>

              {/* RE-USABLE QUEUE FOR CATEGORY 2 DETAILED TASKS */}
              <div className="border-t border-slate-300 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs uppercase font-semibold text-slate-800 tracking-wider font-mono">
                    Charter Workflow Tasks Checklist
                  </h3>
                  
                  {/* Task creation form inline (hidden in print) */}
                  <form onSubmit={handleAddTask} className="flex gap-2 text-2xs font-semibold print:hidden">
                    <input
                      type="text"
                      placeholder="New task name..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      required
                      className="px-2 py-1 border border-slate-300 bg-white"
                    />
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      required
                      className="px-2 py-1 border border-slate-300 bg-white font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-950 text-white px-2.5 py-1 text-2xs uppercase tracking-wide cursor-pointer select-none"
                    >
                      + Add Task
                    </button>
                  </form>
                </div>

                <div className="border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b">
                        <th className="px-3 py-2">Task Details</th>
                        <th className="px-3 py-2">Assigned To</th>
                        <th className="px-3 py-2 font-semibold">Due Date</th>
                        <th className="px-3 py-2 text-center w-16">Status</th>
                        <th className="px-3 py-2 text-center w-12 print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {!activeProject.tasks || activeProject.tasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                            No manual timeline tasks defined yet. Add some using the toolbar above.
                          </td>
                        </tr>
                      ) : (
                        activeProject.tasks.map((t, idx) => {
                          const isComp = t.status === 'Completed';
                          const today = formatDate(new Date());
                          const isOver = t.status === 'Pending' && t.dueDate && t.dueDate < today;
                          return (
                            <tr key={t.id || idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 font-medium">
                                <div className="flex items-center gap-1">
                                  <span className={isComp ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}>
                                    {t.name}
                                  </span>
                                  {isOver && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-rose-600 animate-ping" title="Overdue Alert"></span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-slate-600 font-medium">{t.assignedTo}</td>
                              <td className={`px-3 py-2 font-mono font-semibold ${isOver ? 'text-rose-600' : 'text-slate-500'}`}>
                                {t.dueDate}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isComp}
                                  onChange={() => handleToggleTaskStatus(idx)}
                                  className="accent-[#006282] w-4 h-4 cursor-pointer print:hidden"
                                />
                                <span className="hidden print:inline font-mono font-bold text-[10px]">
                                  {isComp ? '✓ DONE' : '◯ PENDING'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center print:hidden">
                                <button
                                  onClick={() => handleDeleteTask(idx)}
                                  className="text-rose-600 hover:text-rose-800 font-bold"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-[#E0DCD8] p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center">
              <FolderGit className="w-12 h-12 text-slate-350 mb-2" />
              <p className="font-semibold text-slate-500 text-sm font-mono uppercase">No Active Manual LSS Charter project loaded</p>
              <p className="text-xs text-slate-400 mt-1">Input your charter details by hitting "+ Create Project Charter".</p>
            </div>
          )}
        </div>

      </div>

      {/* DIALOG MODAL: ADD MANUAL PROJECT CHARTER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto">
          <div className="bg-[#F4F1ED] border-2 border-slate-900 p-6 max-w-xl w-full flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <h3 className="text-md font-semibold text-slate-950 uppercase tracking-widest font-mono">
                Launch Lean Six Sigma Charter Wizard
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-3 text-xs font-semibold text-slate-800">
              
              <div>
                <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Project Charter Title:</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Course Registration Pipeline Optimization"
                  required
                  className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Sigma Tier Selection:</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                  >
                    <option value="DMAIC">DMAIC (Standard Continuous improvement)</option>
                    <option value="Green Belt">Green Belt Validation (Medium Bounds)</option>
                    <option value="Black Belt">Black Belt Focus (Institutional)</option>
                    <option value="Yellow Belt">Yellow Belt Support (Tactical)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Priority Index:</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Moderate">Moderate Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Priority Status</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Initial Launch Date:</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Project Lead Sponsor:</label>
                  <input
                    type="text"
                    name="projectLead"
                    value={formData.projectLead}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Process Owner:</label>
                  <input
                    type="text"
                    name="processOwner"
                    value={formData.processOwner}
                    onChange={handleInputChange}
                    placeholder="Sponsor Dean/VP"
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Project Champion:</label>
                  <input
                    type="text"
                    name="projectChampion"
                    value={formData.projectChampion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-500 mb-1">Key Stakeholders:</label>
                  <input
                    type="text"
                    name="stakeholders"
                    value={formData.stakeholders}
                    onChange={handleInputChange}
                    placeholder="Comma separated names"
                    className="w-full px-3 py-1.5 border border-slate-350 bg-white"
                  />
                </div>
              </div>

              <hr className="border-slate-300 my-1" />
              <h4 className="text-[10px] uppercase text-slate-500 font-bold font-mono">
                Continuous Quality Charter Matrices (Core Six Sigma Content Columns)
              </h4>

              <div className="grid grid-cols-2 gap-3 text-2xs">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Problem Statement:</label>
                  <textarea
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleInputChange}
                    placeholder="What is the current business cycle failure and median loss?"
                    rows={2}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-355 bg-white font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Business Case & benefits:</label>
                  <textarea
                    name="businessCaseAndBenefits"
                    value={formData.businessCaseAndBenefits}
                    onChange={handleInputChange}
                    placeholder="Specify the cost-saving metric Y = f(x)"
                    rows={2}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-355 bg-white font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-2xs">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">In Scope Bounds:</label>
                  <textarea
                    name="inScope"
                    value={formData.inScope}
                    onChange={handleInputChange}
                    rows={2}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-355 bg-white font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Out of Scope Bounds:</label>
                  <textarea
                    name="outOfScope"
                    value={formData.outOfScope}
                    onChange={handleInputChange}
                    rows={2}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-355 bg-white font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-2xs">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Cycle Metrics & Sigma Levels:</label>
                  <textarea
                    name="performanceMetrics"
                    value={formData.performanceMetrics}
                    onChange={handleInputChange}
                    placeholder="As-is median, target standard deviation goals"
                    rows={2}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-355 bg-white font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Voice of the Customer Comments:</label>
                  <textarea
                    name="voiceOfCustomer"
                    value={formData.voiceOfCustomer}
                    onChange={handleInputChange}
                    placeholder="Customer reports, survey highlights"
                    rows={2}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-355 bg-white font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 text-2xs font-mono">
                <div>
                  <label className="block text-[8px] uppercase text-slate-400">Define (w):</label>
                  <input type="number" name="defineDuration" value={formData.defineDuration} onChange={handleInputChange} min="1" className="w-full px-1.5 py-1 border" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase text-slate-400">Measure (w):</label>
                  <input type="number" name="measureDuration" value={formData.measureDuration} onChange={handleInputChange} min="1" className="w-full px-1.5 py-1 border" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase text-slate-400">Analyze (w):</label>
                  <input type="number" name="analyzeDuration" value={formData.analyzeDuration} onChange={handleInputChange} min="1" className="w-full px-1.5 py-1 border" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase text-slate-400">Improve (w):</label>
                  <input type="number" name="improveDuration" value={formData.improveDuration} onChange={handleInputChange} min="1" className="w-full px-1.5 py-1 border" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase text-slate-400">Control (w):</label>
                  <input type="number" name="controlDuration" value={formData.controlDuration} onChange={handleInputChange} min="1" className="w-full px-1.5 py-1 border" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-350 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#006282] hover:bg-[#076092] text-white px-5 py-2 cursor-pointer transition-colors"
                >
                  Analyze & Save Charter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
