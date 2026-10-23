import React from 'react';
import { TermRelease } from '../types';
import { TARGET_TERMS, TermPlanningSettings, normalizeTermRelease, getCourseTerm, planningDeadline, planningDateLabel } from '../utils/termPlanning';

export function TargetTermSummary({ termRelease, targetTermYear, settings }: { termRelease: TermRelease; targetTermYear: string | number; settings?: TermPlanningSettings }) {
  const term = getCourseTerm({ termRelease, targetTermYear: Number(targetTermYear) || undefined }, settings);
  const deadline = planningDeadline(term, settings);
  return <p className="mt-1 text-[11px] font-normal text-slate-500">
    {term?.sessionAStartDate ? <>Session A: {planningDateLabel(term.sessionAStartDate)} · Course completion: {planningDateLabel(deadline.date)} ({deadline.message})</>
      : 'Official Session A date requires confirmation for this term and year.'}
  </p>;
}
export function TargetTermFields({ termRelease, targetTermYear, onTermChange, onYearChange, settings, requiredYear = false }: {
  termRelease: TermRelease; targetTermYear: string; onTermChange: (term: TermRelease) => void; onYearChange: (year: string) => void;
  settings?: TermPlanningSettings; requiredYear?: boolean;
}) {
  return <div className="flex flex-col gap-2 text-xs">
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase text-slate-500">Target Term Release</span>
      <select name="termRelease" value={normalizeTermRelease(termRelease) || termRelease} onChange={(event) => onTermChange(event.target.value as TermRelease)} className="w-full border border-slate-300 bg-white px-3 py-2">
        {TARGET_TERMS.map((term) => <option key={term} value={term}>{term}</option>)}
      </select>
    </label>
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase text-slate-500">Target Term Year</span>
      <input type="number" name="targetTermYear" value={targetTermYear} min="1900" max="9999" step="1" required={requiredYear}
        onChange={(event) => onYearChange(event.target.value)} placeholder="YYYY" className="w-full border border-slate-300 bg-white px-3 py-2" />
    </label>
    <TargetTermSummary termRelease={termRelease} targetTermYear={targetTermYear} settings={settings} />
  </div>;
}
