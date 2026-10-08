import React, { useEffect, useRef, useState } from 'react';
import { Clipboard, X } from 'lucide-react';
import { CourseDevelopment } from '../types';

export function SmeReviewEmailDialog({ course, onClose }: { course: CourseDevelopment; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [recipient, setRecipient] = useState(() => course.deptTeam?.smeEmail?.trim() || '[SME Email]');
  const courseNumber = course.courseNumber?.trim() || '[course number]';
  const [subject, setSubject] = useState(() => `Ready for Review: ${courseNumber} Activity Development`);
  const [body, setBody] = useState(() => `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'},

The activities in ${courseNumber} are now prepared for your review. Please check them at your convenience and reply to this email with either option so I can coordinate with multimedia about the next steps.

1. All content has been reviewed and confirmed as accurate. No changes are necessary.
2. I have the following edits.
   - Please specify any changes you'd like to see.`);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    if (!copyMessage) return;
    const timer = window.setTimeout(() => setCopyMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [copyMessage]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${recipient}\nSubject: ${subject}\n\n${body}`);
      setCopyMessage('Email copied to clipboard.');
    } catch {
      setCopyMessage('Unable to copy. Please select and copy the fields manually.');
    }
  };
  const fieldClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33B1C8]';

  return (
    <dialog ref={dialogRef} aria-labelledby="sme-review-email-title" aria-describedby="sme-review-email-description" onCancel={onClose}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 id="sme-review-email-title" className="text-sm font-semibold uppercase tracking-wide text-slate-800">SME to Review Email</h2>
          <p id="sme-review-email-description" className="text-xs text-slate-500">Review, edit, and copy your email draft.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close email dialog" className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="space-y-4 p-5">
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">To
          <input autoFocus value={recipient} onChange={(e) => { setRecipient(e.target.value); setCopyMessage(''); }} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Subject
          <input value={subject} onChange={(e) => { setSubject(e.target.value); setCopyMessage(''); }} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Email body
          <textarea rows={12} value={body} onChange={(e) => { setBody(e.target.value); setCopyMessage(''); }} className={`${fieldClass} mt-1 font-mono normal-case tracking-normal`} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
        <p role="status" className="mr-auto text-xs text-slate-600">{copyMessage}</p>
        <button type="button" onClick={copyEmail} className="inline-flex items-center gap-1.5 rounded border border-[#006282] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#006282] hover:bg-[#006282] hover:text-white"><Clipboard className="h-3.5 w-3.5" /> Copy Email</button>
        <button type="button" onClick={onClose} className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50">Close</button>
      </div>
    </dialog>
  );
}
