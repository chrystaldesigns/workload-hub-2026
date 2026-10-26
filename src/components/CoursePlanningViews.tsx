import React, { useMemo, useRef, useState } from 'react';
import type { CourseDevelopment } from '../types';
import { TARGET_TERMS, validISODate, type TermPlanningSettings, type ProposedCourse, type TargetTerm } from '../utils/termPlanning';
import { proposedPlanningRows, selectProposalStart } from '../utils/proposedPlanning';

export interface CoursePlanningProps {
  courses?: CourseDevelopment[];
  settings?: TermPlanningSettings;
  customBlocked?: string[];
  onSave?: (settings: TermPlanningSettings) => Promise<void>;
  onCreateProject?: (proposal: ProposedCourse) => void;
}

export function CoursePlanningViews({ courses = [], settings, customBlocked = [], onSave, onCreateProject }: CoursePlanningProps) {
  // Keep accepted dates visible while persistence and the parent data reload finish.
  const [selection, setSelection] = useState<{ id: string; date: string } | null>(null);
  const [term, setTerm] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const savingRef = useRef(false);
  const [draft, setDraft] = useState({ courseNumber: '', termRelease: 'Spring Term' as TargetTerm, targetTermYear: 2027, onboarding: true });
  const effectiveSettings = useMemo(() => {
    if (!settings || !selection) return settings;
    return { ...settings, proposals: settings.proposals?.map(p => p.id === selection.id ? { ...p, projectStartDate: selection.date } : p) };
  }, [settings, selection]);
  const rows = useMemo(() => proposedPlanningRows(courses, effectiveSettings, customBlocked), [courses, effectiveSettings, customBlocked]);
  const filtered = rows.filter(row => !term || row.term === term);

  const save = async (action: () => Promise<void>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setBusy(true);
    setError('');
    setFeedback('');
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save planning changes. Please try again.'); }
    finally { savingRef.current = false; setBusy(false); }
  };

  const choose = (id: string, date: string) => save(async () => {
    if (!onSave || !settings) throw new Error('Planning changes cannot be saved right now. Please reload and try again.');
    const next = selectProposalStart(settings, id, date);
    const courseNumber = next.proposals!.find(p => p.id === id)!.courseNumber;
    setSelection({ id, date });
    try {
      await onSave(next);
      setFeedback(`${courseNumber}: selected start saved as ${date}.`);
    } finally {
      // Success now comes from persisted parent settings; failure restores saved dates.
      setSelection(null);
    }
  });

  return <div className="mt-5 space-y-4 border-t border-slate-200 pt-4" aria-busy={busy}>
    <label className="block text-sm">Compare term <select value={term} onChange={event => setTerm(event.target.value)} className="rounded border p-2">
      <option value="">All terms</option>
      {[...new Set(rows.map(row => row.term))].map(value => <option key={value}>{value}</option>)}
    </select></label>

    {onSave && settings && <form className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3 text-sm" onSubmit={event => {
      event.preventDefault();
      void save(async () => {
        await onSave({ ...settings, proposals: [...(settings.proposals || []), { ...draft, id: crypto.randomUUID(), courseNumber: draft.courseNumber.toUpperCase() }] });
        setDraft({ ...draft, courseNumber: '' });
        setFeedback('Proposed course added.');
      });
    }}>
      <label>Proposed course<input aria-label="Proposed course number" required pattern="[A-Za-z]{3}[0-9]{4}" placeholder="ABC1234" value={draft.courseNumber} onChange={event => setDraft({ ...draft, courseNumber: event.target.value })} className="block rounded border p-2" /></label>
      <label>Target term<select value={draft.termRelease} onChange={event => setDraft({ ...draft, termRelease: event.target.value as TargetTerm })} className="block rounded border p-2">{TARGET_TERMS.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Year<input required type="number" min="1900" max="9999" value={draft.targetTermYear} onChange={event => setDraft({ ...draft, targetTermYear: Number(event.target.value) })} className="block w-24 rounded border p-2" /></label>
      <label>Onboarding<select value={String(draft.onboarding)} onChange={event => setDraft({ ...draft, onboarding: event.target.value === 'true' })} className="block rounded border p-2"><option value="true">Yes</option><option value="false">No</option></select></label>
      <button type="submit" disabled={busy} className="rounded bg-[#006282] px-3 py-2 text-white disabled:opacity-50">Add proposed course</button>
    </form>}

    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <p role="status" aria-live="polite" className="text-sm text-[#006282]">{busy ? 'Saving planning changes…' : feedback}</p>
    {!rows.length && <p className="text-sm text-slate-500">No proposed courses yet. Add a proposed course above to calculate its recommended development start window.</p>}
    {!!rows.length && !filtered.length && <p className="text-sm text-slate-500">No proposed courses for the selected term. Choose another term or All terms.</p>}

    <div className="overflow-x-auto"><table className="w-full text-left text-xs">
      <caption className="sr-only">Proposed course development planning</caption>
      <thead><tr>{['Course / status', 'Target term', 'Onboarding', 'Recommended start window', 'Suggested staggered start', 'Selected start', 'Template preparation', 'Projected completion', 'Administrative deadline', 'Schedule status / warnings', 'Actions'].map(heading => <th key={heading} scope="col" className="border-b p-2">{heading}</th>)}</tr></thead>
      <tbody>{filtered.map(row => {
        const applied = !!row.suggested && row.selected === row.suggested;
        return <tr key={row.id} className="align-top">
          <td className="border-b p-2 font-semibold">{row.name}<br />Proposed</td>
          <td className="border-b p-2">{row.term}</td>
          <td className="border-b p-2">{row.course.onboarding ? 'Yes' : 'No'}</td>
          <td className="border-b p-2">{row.window ? `${row.window.earliest} – ${row.window.latest}` : 'Requires term date'}</td>
          <td className="border-b p-2">{row.suggested || 'No feasible suggestion'}<button type="button" disabled={busy || !onSave || !validISODate(row.suggested) || applied} onClick={() => void choose(row.id, row.suggested)} aria-label={`${applied ? 'Suggestion Applied' : 'Accept Suggestion'} for ${row.name}`} className="mt-2 block min-h-9 rounded-md border border-[#006282] bg-sky-50 px-3 py-2 font-semibold text-[#006282] hover:bg-sky-100 disabled:cursor-default disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500">{applied ? 'Suggestion Applied' : 'Accept Suggestion'}</button></td>
          <td className="border-b p-2"><input aria-label={`${row.name} selected start`} type="date" value={row.selected} disabled={busy || !onSave} onChange={event => { if (event.target.value) void choose(row.id, event.target.value); }} className="w-32 rounded border p-1" /></td>
          <td className="border-b p-2">{row.period.start} – {row.period.end}</td>
          <td className="border-b p-2">{row.completion || 'Select a start'}</td>
          <td className="border-b p-2">{row.deadline || 'Requires confirmation'}</td>
          <td className="max-w-xs border-b p-2">{row.warnings.length ? <details><summary className="cursor-pointer text-amber-800">Review {row.warnings.length} warning(s)</summary>{row.warnings.map((warning, index) => <p key={index} className="mt-1">{warning}</p>)}</details> : 'On schedule'}</td>
          <td className="border-b p-2"><button type="button" disabled={busy || !row.selected || !onCreateProject} title="Select or accept a start date first" onClick={() => onCreateProject?.(row.course as ProposedCourse)} className="whitespace-nowrap text-[#006282] underline disabled:text-slate-500">Create Project</button><button type="button" disabled={busy || !onSave} onClick={() => void save(async () => {
            if (!onSave || !settings) throw new Error('Planning changes cannot be saved right now.');
            await onSave({ ...settings, proposals: settings.proposals?.filter(proposal => proposal.id !== row.id) });
            setFeedback(`${row.name}: proposal removed.`);
          })} className="mt-2 block text-red-700 disabled:text-slate-500">Remove proposal</button></td>
        </tr>;
      })}</tbody>
    </table></div>
  </div>;
}
