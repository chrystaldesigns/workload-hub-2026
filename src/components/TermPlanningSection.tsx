import { CoursePlanningViews, type CoursePlanningProps } from './CoursePlanningViews';
import { recommendedWindow } from '../utils/forwardSchedule';
import React, { useState } from 'react';
import { TermPlanningSettings, TermCalendarRecord, TARGET_TERMS, TargetTerm, TERM_SOURCE, OPERATING_SOURCE, FLEX_SCHEDULE_SOURCE,
  getTermPlanningSettings, upcomingTerms, planningDeadline, planningDateLabel, termId, termAcademicYear, validateTermPlanningSettings } from '../utils/termPlanning';

export function TermPlanningSection({ settings, onSave, courses, customBlocked, onCreateProject, onSelectStart, today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) }: {
  settings?: TermPlanningSettings; onSave?: (settings: TermPlanningSettings) => Promise<void>; today?: string;
} & CoursePlanningProps & {
}) {
  const config = getTermPlanningSettings(settings);
  const draftFor = (term: TargetTerm, year: number) => {
    const record = config.terms.find((item) => item.term === term && item.year === year);
    const calendar = config.operatingCalendars.find((item) => item.id === record?.operatingCalendarId);
    return { term, year: String(year), date: record?.sessionAStartDate || '', academicYear: record?.academicYear || termAcademicYear(term, year),
      sourceUrl: record?.sourceUrl || TERM_SOURCE, verified: record?.verificationStatus === 'verified',
      calendarId: calendar?.id || `fscj-${termAcademicYear(term, year)}`, coverageStart: calendar?.coverageStart || '', coverageEnd: calendar?.coverageEnd || '',
      closures: calendar?.closedDates.join('\n') || '', calendarSourceUrl: calendar?.sourceUrl || OPERATING_SOURCE, calendarVerified: calendar?.verificationStatus === 'verified' };
  };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => draftFor('Spring Term', Number(today.slice(0, 4)) + 1));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm';
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onSave) return;
    const year = Number(draft.year);
    const record: TermCalendarRecord = { id: termId(draft.term, year), term: draft.term, year, academicYear: draft.academicYear,
      sessionAStartDate: draft.date, sourceUrl: draft.sourceUrl, verificationStatus: draft.verified ? 'verified' : 'manual',
      ...(draft.verified ? { lastVerifiedDate: today } : {}), recommendedProjectStartWindow: null };
    const calendars = [...config.operatingCalendars];
    if (draft.coverageStart || draft.coverageEnd) {
      const calendar = { id: draft.calendarId, academicYear: draft.academicYear, coverageStart: draft.coverageStart, coverageEnd: draft.coverageEnd,
        closedDates: [...new Set<string>(draft.closures.split(/\s+/).filter(Boolean))].sort(), sourceUrl: draft.calendarSourceUrl,
        verificationStatus: draft.calendarVerified ? 'verified' as const : 'manual' as const,
        ...(draft.calendarVerified ? { lastVerifiedDate: today } : {}) };
      const index = calendars.findIndex((item) => item.id === calendar.id);
      if (index >= 0) calendars[index] = calendar; else calendars.push(calendar);
      record.operatingCalendarId = calendar.id;
    }
    const next = { ...config, terms: [...config.terms.filter((term) => term.id !== record.id), record], operatingCalendars: calendars };
    const validation = validateTermPlanningSettings(next);
    if (validation) { setError(validation); return; }
    setSaving(true); setError('');
    try { await onSave(next); setEditing(false); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save term calendar.'); }
    finally { setSaving(false); }
  };
  return <section aria-labelledby="term-planning-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 id="term-planning-title" className="text-xl font-semibold text-[#003E52]">FSCJ Term Release Planning</h2>
      {onSave && <button type="button" onClick={() => { setDraft(draftFor('Spring Term', Number(today.slice(0, 4)) + 1)); setEditing(!editing); setError(''); }} className="rounded-md border border-[#008BA3] px-3 py-2 text-sm font-semibold text-[#006282]">Manage term dates</button>}
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {upcomingTerms(today, settings).map((term) => {
        const deadline = planningDeadline(term, settings, customBlocked);
        const calendar = config.operatingCalendars.find((item) => item.id === term.operatingCalendarId);
        return <article key={term.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <h3 className="mb-3 font-semibold text-[#003E52]">{term.term} {term.year}</h3>
          <dl className="space-y-3">
            <div><dt className="font-semibold">Session A Start</dt><dd>{planningDateLabel(term.sessionAStartDate)}</dd></div>
            <div><dt className="font-semibold">Course Completion Deadline</dt><dd>{deadline.date ? planningDateLabel(deadline.date) : 'Requires confirmation'}</dd><dd className="text-xs text-slate-500">{deadline.message}</dd></div>
            <div><dt className="font-semibold">Recommended Project Start Window</dt><dd>{(() => { const window = recommendedWindow(true, deadline.date, config, customBlocked); return window ? `${planningDateLabel(window.earliest)} – ${planningDateLabel(window.latest)} (onboarding; ${config.multimediaWorkdays ? 'configured multimedia estimate' : 'confirm multimedia estimate'}${window.calendarConfirmed ? '' : '; incomplete calendar coverage'})` : 'Requires confirmed Session A date'; })()}</dd></div>
            <div><dt className="font-semibold">Calendar Source</dt><dd><a className="text-[#006282] underline" href={term.sourceUrl} target="_blank" rel="noreferrer">FSCJ Academic Calendar</a></dd>
              <dd className="text-xs text-slate-500">{term.verificationStatus === 'verified' ? 'Verified' : term.verificationStatus === 'manual' ? 'Manual entry — not verified' : 'Date requires confirmation'} · {term.academicYear} · Last verified: {term.lastVerifiedDate || 'Not verified'}</dd></div>
            {calendar && <div><dt className="font-semibold">Operating calendar and closures</dt><dd><a className="text-[#006282] underline" href={calendar.sourceUrl} target="_blank" rel="noreferrer">{calendar.academicYear} FSCJ Operating Calendar</a></dd>
              <dd className="text-xs text-slate-500">{calendar.verificationStatus} · Last verified: {calendar.lastVerifiedDate || 'Not verified'}</dd></div>}
          </dl>
        </article>;
      })}
    </div>
    <p className="mt-3 text-xs text-slate-500">The completion deadline covers all course development work. The following 30 workdays are reserved for administrative copying. <a href={FLEX_SCHEDULE_SOURCE} target="_blank" rel="noreferrer" className="underline">FSCJ flexible workweek policy</a>.</p>
    <CoursePlanningViews courses={courses} settings={config} customBlocked={customBlocked} onSave={onSave} onCreateProject={onCreateProject} onSelectStart={onSelectStart}/>
    {onSave && <div className="mt-4 flex flex-wrap gap-3 text-sm"><label>Recommended window (workdays)<input type="number" min="1" max="260" defaultValue={config.planningWindowWorkdays||15} onBlur={e=>{const value=Number(e.target.value);if(Number.isInteger(value)&&value>0&&value<=260)void onSave({...config,planningWindowWorkdays:value}).catch(e=>setError(String(e)));}} className="ml-2 w-20 rounded border p-1"/></label><label>Multimedia estimate per module (workdays; requires confirmation)<input type="number" min="1" max="260" defaultValue={config.multimediaWorkdays||''} placeholder="Confirm" onBlur={e=>{const value=Number(e.target.value);if(Number.isInteger(value)&&value>0&&value<=260)void onSave({...config,multimediaWorkdays:value}).catch(e=>setError(String(e)));}} className="ml-2 w-20 rounded border p-1"/></label></div>}
    {editing && <form onSubmit={save} className="mt-5 space-y-3 border-t border-slate-200 pt-4">
      <h3 className="font-semibold text-[#003E52]">Maintain official term dates and closures</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Term<select value={draft.term} onChange={(event) => setDraft(draftFor(event.target.value as TargetTerm, Number(draft.year)))} className={inputClass}>{TARGET_TERMS.map((term) => <option key={term}>{term}</option>)}</select></label>
        <label>Term year<input type="number" min="1900" max="9999" required value={draft.year} onChange={(event) => setDraft(/^\d{4}$/.test(event.target.value) ? draftFor(draft.term, Number(event.target.value)) : { ...draft, year: event.target.value, verified: false })} className={inputClass} /></label>
        <label>Academic year<input required value={draft.academicYear} onChange={(event) => setDraft({ ...draft, academicYear: event.target.value })} className={inputClass} /></label>
        <label>Session A start date<input type="date" required value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value, verified: false })} className={inputClass} /></label>
        <label className="sm:col-span-2">Official FSCJ source URL<input type="url" required value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value, verified: false })} className={inputClass} /></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.verified} onChange={(event) => setDraft({ ...draft, verified: event.target.checked })} />I verified the Session A start date against the official source.</label>
      <details className="space-y-3"><summary className="cursor-pointer font-semibold">Operating calendar coverage and nonworking dates</summary>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>Coverage starts<input type="date" value={draft.coverageStart} onChange={(event) => setDraft({ ...draft, coverageStart: event.target.value, calendarVerified: false })} className={inputClass} /></label>
          <label>Coverage ends<input type="date" value={draft.coverageEnd} onChange={(event) => setDraft({ ...draft, coverageEnd: event.target.value, calendarVerified: false })} className={inputClass} /></label>
          <label className="sm:col-span-2">Operating calendar source URL<input type="url" value={draft.calendarSourceUrl} onChange={(event) => setDraft({ ...draft, calendarSourceUrl: event.target.value, calendarVerified: false })} className={inputClass} /></label>
          <label className="sm:col-span-2">College closures and nonworking dates (YYYY-MM-DD, one per line)<textarea rows={6} value={draft.closures} onChange={(event) => setDraft({ ...draft, closures: event.target.value, calendarVerified: false })} className={inputClass} /></label>
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={draft.calendarVerified} onChange={(event) => setDraft({ ...draft, calendarVerified: event.target.checked })} />I verified the complete operating calendar and its coverage.</label>
      </details>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2"><button disabled={saving} type="submit" className="rounded-md bg-[#006282] px-3 py-2 text-sm font-semibold text-white">{saving ? 'Saving…' : 'Save term calendar'}</button><button disabled={saving} type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Cancel</button></div>
    </form>}
  </section>;
}
