import React, { useEffect, useRef, useState } from 'react';
import { Archive, Eye, Pencil, RefreshCw } from 'lucide-react';
import type { CourseDevelopment } from '../types';
import type { TermPlanningSettings } from '../utils/termPlanning';
import { courseProjectStart, prepareCourseSchedule } from '../utils/courseScheduleManagement';

const buttonClass = 'inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-sky-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-800 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8] disabled:cursor-wait disabled:opacity-50';
const iconClass = 'h-4 w-4 shrink-0';
export interface CourseManagementControlsProps {
  course: CourseDevelopment;
  settings?: TermPlanningSettings;
  customBlocked: string[];
  onSave: (course: CourseDevelopment) => Promise<void>;
  onEdit: () => void;
  onToggleArchived: () => void;
  onArchive: () => void;
  showArchived: boolean;
  activeCount: number;
  archivedCount: number;
}
export function CourseManagementControls({course,settings,customBlocked,onSave,onEdit,onToggleArchived,onArchive,showArchived,activeCount,archivedCount}:CourseManagementControlsProps) {
  const [start,setStart] = useState(()=>courseProjectStart(course));
  const [dirty,setDirty] = useState(false);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const savingRef = useRef(false);
  const persistedStart = courseProjectStart(course);
  useEffect(()=>{if(!dirty)setStart(persistedStart);},[persistedStart,dirty]);
  const warnings = course.schedulingWarnings ?? [];

  const submit = async(event:React.FormEvent) => {
    event.preventDefault();
    if(savingRef.current)return;
    savingRef.current=true;setSaving(true);setMessage('');setError('');
    try {
      const next=prepareCourseSchedule(course,start,settings,customBlocked);
      await onSave(next);
      setDirty(false);
      setMessage(`Schedule updated for ${course.courseNumber}.${next.schedulingWarnings?.length ? ' Review the scheduling warnings below.' : ''}`);
    } catch(failure) {
      const detail=failure instanceof Error?failure.message:'The schedule could not be saved.';
      setError(`${detail} Your entered date is retained. Check it and try Save & Recalculate Schedule again.`);
    } finally {savingRef.current=false;setSaving(false);}
  };

  return <section aria-label="Course Management" className="min-w-0 space-y-3">
    <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Course Management</h5>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={saving} onClick={onEdit} className={buttonClass}><Pencil className={iconClass} aria-hidden="true"/>Edit</button>
      <button type="button" disabled={saving} onClick={onToggleArchived} className={buttonClass}><Eye className={iconClass} aria-hidden="true"/>{showArchived?`Show Active (${activeCount})`:`Show Archived (${archivedCount})`}</button>
      <button type="button" disabled={saving} onClick={onArchive} className={buttonClass}><Archive className={iconClass} aria-hidden="true"/>{course.archived?'Restore':'Archive'}</button>
    </div>
    <form onSubmit={submit} noValidate className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]" aria-busy={saving}>
      <label className="min-w-0 text-xs font-semibold text-slate-700">Project Start Date
        <input type="date" aria-label="Project Start Date" value={start} required disabled={saving} onChange={event=>{setStart(event.target.value);setDirty(true);setMessage('');setError('');}} className="mt-1 min-h-10 w-full min-w-0 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8]"/>
      </label>
      <button type="submit" disabled={saving} className={buttonClass}><RefreshCw className={`${iconClass} ${saving?'animate-spin':''}`} aria-hidden="true"/>{saving?'Saving…':'Save & Recalculate Schedule'}</button>
    </form>
    {course.scheduleVersion!==1 && <p className="text-xs text-slate-500">Saving starts forward scheduling. The previous schedule is retained in the course history; manual overrides and completed work are preserved.</p>}
    <p role="status" aria-live="polite" className="text-xs text-[#006282]">{message}</p>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <details className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs" open={warnings.length>0}>
      <summary className="cursor-pointer font-semibold text-slate-700">Schedule Warnings ({warnings.length})</summary>
      {warnings.length ? warnings.map((warning,index)=><p key={index} className="mt-2 break-words text-amber-800">{warning}</p>) : <p className="mt-2 text-slate-500">No scheduling warnings.</p>}
    </details>
  </section>;
}
