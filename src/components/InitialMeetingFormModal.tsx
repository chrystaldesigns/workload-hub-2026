import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Save, X } from "lucide-react";
import { CourseDevelopment, InitialMeetingFormData } from "../types";
import {
  assignmentLabels,
  createEmptyInitialMeetingForm,
  instructionalMaterialLabels,
  integrationTypeLabels,
  multimediaLabels,
  otherLearningActivityOptions,
} from "../utils/initialMeetingReport";

interface Props {
  course: CourseDevelopment;
  projectedCloseout: string;
  formatDate: (value?: string) => string;
  onSave: (data: InitialMeetingFormData) => Promise<void>;
  onClose: () => void;
  onGenerateReport: (data?: InitialMeetingFormData) => void;
}

const inputClass = "w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800";
const sectionClass = "space-y-3 border-b border-dashed border-slate-300 pb-5";
const headingClass = "text-xs font-semibold uppercase tracking-wide text-slate-800";

export function InitialMeetingFormModal({ course, projectedCloseout, formatDate, onSave, onClose, onGenerateReport }: Props) {
  const saved = course.initialMeetingForm;
  const initial = useMemo(() => saved ? structuredClone(saved) : createEmptyInitialMeetingForm(), [saved]);
  const [draft, setDraft] = useState<InitialMeetingFormData>(initial);
  const [baseline, setBaseline] = useState<InitialMeetingFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(Boolean(saved?.savedAt));
  const [savedMessage, setSavedMessage] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  useEffect(() => {
    const next = saved ? structuredClone(saved) : createEmptyInitialMeetingForm();
    setDraft(next);
    setBaseline(next);
    setHasSavedData(Boolean(saved?.savedAt));
    setSavedMessage("");
  }, [course.id, saved?.savedAt]);

  const update = <K extends keyof InitialMeetingFormData>(key: K, value: InitialMeetingFormData[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSavedMessage("");
  };
  const toggleList = (key: "otherLearningActivityOptions" | "integrationTypes", value: string) => {
    const next = draft[key].includes(value) ? draft[key].filter((item) => item !== value) : [...draft[key], value];
    update(key, next);
  };
  const setChoice = (group: "multimedia" | "instructionalMaterials", key: string, field: "selected" | "notes", value: boolean | string) => {
    update(group, {
      ...draft[group],
      [key]: { ...draft[group][key as keyof typeof draft[typeof group]], [field]: value },
    });
  };
  const requestClose = () => {
    if (!dirty || window.confirm("Discard unsaved Initial Meeting Form changes?")) onClose();
  };
  const save = async (closeAfter: boolean) => {
    setSaving(true);
    try {
      const savedData = { ...draft, savedAt: new Date().toISOString() };
      await onSave(savedData);
      setDraft(savedData);
      setBaseline(savedData);
      setHasSavedData(true);
      setSavedMessage("Initial Meeting Form saved successfully.");
      if (closeAfter) onClose();
    } finally {
      setSaving(false);
    }
  };

  const choiceGrid = (
    group: "multimedia" | "instructionalMaterials",
    labels: Record<string, string>
  ) => Object.entries(labels).map(([key, label]) => {
    const choice = draft[group][key as keyof typeof draft[typeof group]];
    return (
      <div key={key} className="rounded border border-slate-200 bg-white p-3">
        <label className="flex items-start gap-2 text-xs font-semibold text-slate-800">
          <input type="checkbox" checked={choice.selected} onChange={(e) => setChoice(group, key, "selected", e.target.checked)} className="mt-0.5 accent-[#006282]" />
          <span>{label}</span>
        </label>
        {choice.selected && <input aria-label={`${label} notes`} value={choice.notes} onChange={(e) => setChoice(group, key, "notes", e.target.value)} placeholder="Optional notes" className={`${inputClass} mt-2`} />}
      </div>
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3">
      <div role="dialog" aria-modal="true" aria-labelledby="initial-meeting-form-title" className="flex max-h-[94vh] w-full max-w-5xl flex-col border-2 border-slate-900 bg-[#F4F1ED] shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-900 px-5 py-4">
          <div><h2 id="initial-meeting-form-title" className="text-sm font-semibold uppercase tracking-widest">Initial Meeting Form</h2><p className="mt-1 text-xs text-slate-500">{course.courseNumber}: {course.courseTitle}</p></div>
          <button type="button" onClick={requestClose} aria-label="Close Initial Meeting Form"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-6 overflow-y-auto p-5">
          <section className={sectionClass} aria-labelledby="course-information-heading">
            <h3 id="course-information-heading" className={headingClass}>Course Development Information</h3>
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div><dt className="font-semibold">Program Title</dt><dd>{course.program || "Not entered"}</dd></div>
              <div><dt className="font-semibold">Course</dt><dd>{course.courseNumber}: {course.courseTitle}</dd></div>
              <div><dt className="font-semibold">Instructional Designer</dt><dd>Chrystal Wickline, wickline@fscj.edu</dd></div>
              <div><dt className="font-semibold">Subject Matter Expert</dt><dd>{course.deptTeam.smeName || "Not entered"}{course.deptTeam.smeEmail ? `, ${course.deptTeam.smeEmail}` : ""}</dd></div>
              <div><dt className="font-semibold">Course Development Type</dt><dd>{course.devType || "Not entered"}</dd></div>
              <div><dt className="font-semibold">Projected Course Development Close-out</dt><dd>{formatDate(projectedCloseout)}</dd></div>
              <div><dt className="font-semibold">Workshop Course</dt><dd>{course.workshopCourse || "Not entered"}</dd></div>
            </dl>
            <label className="block text-xs font-semibold">Course Offerings<input value={draft.courseOfferings} onChange={(e) => update("courseOfferings", e.target.value)} className={`${inputClass} mt-1`} /></label>
          </section>

          <section className={sectionClass} aria-labelledby="curriculum-heading">
            <h3 id="curriculum-heading" className={headingClass}>1. College Curriculum Outline (Course Outline)</h3>
            <fieldset><legend className="text-xs font-semibold">Current status</legend><div className="mt-2 flex flex-wrap gap-4 text-xs">
              {[['current','Are current'],['notCurrent','Are not current']].map(([value,label]) => <label key={value} className="flex gap-2"><input type="radio" name="curriculumStatus" checked={draft.curriculumStatus === value} onChange={() => update("curriculumStatus", value as InitialMeetingFormData["curriculumStatus"])} />{label}</label>)}
            </div></fieldset>
            <label className="block text-xs font-semibold">Optional notes<textarea value={draft.curriculumNotes} onChange={(e) => update("curriculumNotes", e.target.value)} rows={2} className={`${inputClass} mt-1`} /></label>
          </section>

          <section className={sectionClass} aria-labelledby="multimedia-heading"><h3 id="multimedia-heading" className={headingClass}>2. Multimedia Production</h3><div className="grid gap-3 md:grid-cols-2">{choiceGrid("multimedia", multimediaLabels)}</div>
            {draft.multimedia.otherLearningActivities.selected && <fieldset><legend className="text-xs font-semibold">Other Learning Activity Options</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{otherLearningActivityOptions.map((item) => <label key={item} className="flex gap-2 text-xs"><input type="checkbox" checked={draft.otherLearningActivityOptions.includes(item)} onChange={() => toggleList("otherLearningActivityOptions", item)} />{item}</label>)}</div></fieldset>}
          </section>

          <section className={sectionClass} aria-labelledby="materials-heading"><h3 id="materials-heading" className={headingClass}>3. Instructional Materials</h3><div className="grid gap-3 md:grid-cols-2">{choiceGrid("instructionalMaterials", instructionalMaterialLabels)}</div>
            {draft.instructionalMaterials.textbook.selected && <div className="grid gap-3 rounded border border-slate-300 bg-white p-3 sm:grid-cols-2">{([['title','Title'],['edition','Edition'],['author','Author'],['publisher','Publisher'],['year','Year'],['isbn13','ISBN-13']] as const).map(([key,label]) => <label key={key} className="text-xs font-semibold">{label}<input value={draft.textbook[key]} onChange={(e) => update("textbook", {...draft.textbook,[key]:e.target.value})} className={`${inputClass} mt-1`} /></label>)}<fieldset className="sm:col-span-2"><legend className="text-xs font-semibold">Textbook Cost</legend><div className="mt-2 flex gap-4 text-xs">{[['purchaseRequired','Purchase Required'],['ztc','Zero Textbook Cost (ZTC)']].map(([value,label]) => <label key={value} className="flex gap-2"><input type="radio" name="textbookCost" checked={draft.textbook.costDesignation === value} onChange={() => update("textbook", {...draft.textbook,costDesignation:value as InitialMeetingFormData['textbook']['costDesignation']})} />{label}</label>)}</div></fieldset></div>}
          </section>

          <section className={sectionClass} aria-labelledby="design-heading"><h3 id="design-heading" className={headingClass}>4. Design and Plan</h3><label className="block max-w-xs text-xs font-semibold">Number of Modules<input type="number" min="1" value={draft.numberOfModules} onChange={(e) => update("numberOfModules", e.target.value)} className={`${inputClass} mt-1`} /></label><label className="flex gap-2 text-xs font-semibold"><input type="checkbox" checked={draft.assignmentsEnabled} onChange={(e) => update("assignmentsEnabled", e.target.checked)} />Assignments and Assessments</label>
            {draft.assignmentsEnabled && <div className="grid gap-2 sm:grid-cols-2">{Object.entries(assignmentLabels).map(([key,label]) => <div key={key}><label className="flex gap-2 text-xs"><input type="checkbox" checked={draft.assignments[key as keyof typeof draft.assignments]} onChange={(e) => update("assignments", {...draft.assignments,[key]:e.target.checked})} />{label}</label>{key === 'courseProject' && draft.assignments.courseProject && <label className="ml-6 mt-2 flex gap-2 text-xs"><input type="checkbox" checked={draft.courseProjectScaffolded} onChange={(e) => update("courseProjectScaffolded", e.target.checked)} />The Course Project includes scaffolded parts.</label>}</div>)}</div>}
          </section>

          <section className={sectionClass} aria-labelledby="collaboration-heading"><h3 id="collaboration-heading" className={headingClass}>5. Collaboration and Communication</h3><fieldset><legend className="text-xs font-semibold">Meeting Preference</legend><div className="mt-2 flex flex-wrap gap-4 text-xs">{[['weekly','Weekly one-on-one meetings'],['adHoc','Ad hoc meetings as needed']].map(([value,label]) => <label key={value} className="flex gap-2"><input type="radio" name="meetingPreference" checked={draft.meetingPreference === value} onChange={() => update("meetingPreference", value as InitialMeetingFormData['meetingPreference'])} />{label}</label>)}</div></fieldset>
            {draft.meetingPreference === 'weekly' && <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold">Preferred day<input value={draft.preferredMeetingDay} onChange={(e) => update("preferredMeetingDay",e.target.value)} className={`${inputClass} mt-1`} /></label><label className="text-xs font-semibold">Preferred time<input value={draft.preferredMeetingTime} onChange={(e) => update("preferredMeetingTime",e.target.value)} placeholder="e.g. 2:30" className={`${inputClass} mt-1`} /></label><label className="text-xs font-semibold">AM or PM<select value={draft.preferredMeetingPeriod} onChange={(e) => update("preferredMeetingPeriod",e.target.value as 'AM'|'PM')} className={`${inputClass} mt-1`}><option>AM</option><option>PM</option></select></label></div>}
            <label className="flex gap-2 text-xs"><input type="checkbox" checked={draft.weeklyStatusUpdates} onChange={(e) => update("weeklyStatusUpdates",e.target.checked)} />Include weekly course-development status updates</label><fieldset><legend className="text-xs font-semibold">Calendar Reminders</legend><div className="mt-2 flex flex-wrap gap-4 text-xs">{[['optedIn','Opted to receive calendar reminders'],['optedOut','Opted out of receiving calendar reminders']].map(([value,label]) => <label key={value} className="flex gap-2"><input type="radio" name="calendarReminders" checked={draft.calendarReminders === value} onChange={() => update("calendarReminders",value as InitialMeetingFormData['calendarReminders'])} />{label}</label>)}</div></fieldset>
          </section>

          <section className="space-y-3" aria-labelledby="third-party-heading"><h3 id="third-party-heading" className={headingClass}>6. Third-Party Information</h3><label className="flex gap-2 text-xs font-semibold"><input type="checkbox" checked={draft.thirdPartyApplies} onChange={(e) => update("thirdPartyApplies",e.target.checked)} />Third-party platform, software, or tool applies to this course</label>
            {draft.thirdPartyApplies && <div className="space-y-4 rounded border border-slate-300 bg-white p-4"><label className="block text-xs font-semibold">Publisher and Platform Name<input value={draft.thirdPartyName} onChange={(e) => update("thirdPartyName",e.target.value)} className={`${inputClass} mt-1`} /></label><label className="block text-xs font-semibold">SME Experience Level<select value={draft.smeExperience} onChange={(e) => update("smeExperience",e.target.value as InitialMeetingFormData['smeExperience'])} className={`${inputClass} mt-1`}><option value="">Select</option><option value="none">No Experience — Will Need ID Assistance</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
              <label className="flex gap-2 text-xs"><input type="checkbox" checked={draft.thirdPartyDevelopmentRequired} onChange={(e) => update("thirdPartyDevelopmentRequired",e.target.checked)} />Third-Party Course Development</label>{draft.thirdPartyDevelopmentRequired && <label className="block max-w-xs text-xs font-semibold">Ready by<input type="date" value={draft.thirdPartyDevelopmentDate} onChange={(e) => update("thirdPartyDevelopmentDate",e.target.value)} className={`${inputClass} mt-1`} /></label>}
              <fieldset><legend className="text-xs font-semibold">Has the third-party requestor submitted a request to IT?</legend><div className="mt-2 flex gap-4 text-xs">{[['yes','Yes'],['no','No'],['na','Not Applicable']].map(([value,label]) => <label key={value} className="flex gap-2"><input type="radio" name="permissionsRequest" checked={draft.permissionsRequest === value} onChange={() => update("permissionsRequest",value as InitialMeetingFormData['permissionsRequest'])} />{label}</label>)}</div></fieldset><label className="block text-xs font-semibold">Optional IT request notes<input value={draft.permissionsNotes} onChange={(e) => update("permissionsNotes",e.target.value)} className={`${inputClass} mt-1`} /></label>
              <label className="flex gap-2 text-xs"><input type="checkbox" checked={draft.collegeCostApplies} onChange={(e) => update("collegeCostApplies",e.target.checked)} />College or department cost applies</label>{draft.collegeCostApplies && <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Cost or notes<input value={draft.collegeCostNotes} onChange={(e) => update("collegeCostNotes",e.target.value)} className={`${inputClass} mt-1`} /></label><label className="text-xs font-semibold">Budget/Dean discussion and IT approval<select value={draft.collegeCostApproval} onChange={(e) => update("collegeCostApproval",e.target.value as InitialMeetingFormData['collegeCostApproval'])} className={`${inputClass} mt-1`}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="na">Not Applicable</option></select></label></div>}
              <label className="flex gap-2 text-xs"><input type="checkbox" checked={draft.studentCostApplies} onChange={(e) => update("studentCostApplies",e.target.checked)} />Student cost applies</label>{draft.studentCostApplies && <label className="block text-xs font-semibold">Cost per student, term, or course<input value={draft.studentCostNotes} onChange={(e) => update("studentCostNotes",e.target.value)} className={`${inputClass} mt-1`} /></label>}
              <fieldset><legend className="text-xs font-semibold">Integration Type</legend><div className="mt-2 space-y-2">{integrationTypeLabels.map((item) => <label key={item} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={draft.integrationTypes.includes(item)} onChange={() => toggleList("integrationTypes",item)} className="mt-0.5" />{item}</label>)}</div></fieldset>
            </div>}
          </section>
          {savedMessage && <p role="status" className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />{savedMessage}</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-300 px-5 py-4">
          <button type="button" onClick={requestClose} className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold">Cancel/Close</button>
          <button type="button" onClick={() => onGenerateReport(baseline)} disabled={!hasSavedData} className="inline-flex items-center gap-1.5 border border-[#006282] bg-white px-3 py-2 text-xs font-semibold text-[#006282] disabled:opacity-50"><FileText className="h-4 w-4" />Generate Report</button>
          <button type="button" onClick={() => save(false)} disabled={saving} className="inline-flex items-center gap-1.5 bg-[#006282] px-3 py-2 text-xs font-semibold text-white"><Save className="h-4 w-4" />Save</button>
          <button type="button" onClick={() => save(true)} disabled={saving} className="bg-slate-800 px-3 py-2 text-xs font-semibold text-white">Save and Close</button>
        </div>
      </div>
    </div>
  );
}
