import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseDevelopment } from '../src/types';
import { CourseMaterialsFields } from '../src/components/CourseMaterialsFields';
import { Category1CourseDev, buildCourseDevelopmentTimeline } from '../src/components/Category1_CourseDev';
import { courseMaterialsFormValues, courseMaterialsFields, courseMaterialsValidation, courseMaterialsStatements, validateSavedCourseMaterials, CourseMaterialsFormData } from '../src/utils/courseMaterials';
import { buildVersionInformation, buildProjectCompletionNotification } from '../src/utils/projectNotifications';
import { openCommunicationToolWindow } from '../src/utils/communicationToolWindow';

const course = (): CourseDevelopment => ({
  id: 'notification-test', courseNumber: 'TEST1234', courseTitle: 'Notification Test', program: 'Test',
  canvasVersion: 'cel-test1234-v7', versionNumber: 99, workshopCourse: '', devType: 'Modification',
  termRelease: 'Fall A', termDeadline: '2027-08-23', devStagger: 0, onboarding: true,
  hideCompletedTasks: false, alertStatus: 'No Concerns',
  deptTeam: { smeName: 'Professor Test Smith', smeEmail: 'sme@example.com', deanName: 'Dean', deanEmail: 'dean@example.com', associateDeanEmail: 'associate@example.com' },
  celTeam: { golf: '', chrystal: '', admin: '' }, tasks: buildCourseDevelopmentTimeline('2027-05-03', true),
});
const now = new Date('2026-10-23T12:00:00');
const selected = (answer: 'yes' | 'no' = 'yes', instructionalMaterials: 'ZTC' | 'Textbook' | 'OER' = 'OER'): CourseMaterialsFormData => ({
  usesThirdPartyPlatform: answer, thirdPartyPlatformNames: 'uCertify, NETLAB+, and Packet Tracer', instructionalMaterials,
});
const inputs = (html: string) => html.match(/<input\b[^>]*>/g) || [];
function elements(element: React.ReactNode): React.ReactElement<any>[] {
  if (Array.isArray(element)) return element.flatMap(elements);
  if (!React.isValidElement(element)) return [];
  return [element, ...elements((element.props as any).children)];
}

test('legacy values remain unselected, do not invent statements, and are not overwritten on unrelated edits', () => {
  const legacy = course();
  const before = JSON.stringify(legacy);
  const values = courseMaterialsFormValues(legacy);
  assert.deepEqual(values, { usesThirdPartyPlatform: '', thirdPartyPlatformNames: '', instructionalMaterials: '' });
  assert.deepEqual(courseMaterialsFields(values), {});
  assert.equal(courseMaterialsValidation(values, false), '');
  assert(courseMaterialsValidation(values).includes('Yes or No'));
  assert(buildProjectCompletionNotification(legacy, now).includes('[Third-party platform information not provided]'));
  assert.throws(() => courseMaterialsStatements(legacy), /Yes or No/);
  assert.equal(JSON.stringify(legacy), before);
});

test('Yes and No share one radio group and only Yes exposes a required names input', () => {
  for (const answer of ['yes', 'no'] as const) {
    const html = renderToStaticMarkup(React.createElement(CourseMaterialsFields, { values: selected(answer), namePrefix: 'test', onChange: () => {} }));
    const radios = inputs(html).filter((input) => input.includes('name="test-third-party-platform"'));
    assert.equal(radios.length, 2);
    assert.equal(radios.filter((input) => input.includes('checked=""')).length, 1);
    assert(radios.find((input) => input.includes(`value="${answer}"`))!.includes('checked=""'));
    assert.equal(html.includes('placeholder="Enter third-party platform name(s)"'), answer === 'yes');
    if (answer === 'yes') assert(inputs(html).find((input) => input.includes('type="text"'))!.includes('required=""'));
    else assert(!html.includes('uCertify'));
  }
  const legacyHtml = renderToStaticMarkup(React.createElement(CourseMaterialsFields, { values: courseMaterialsFormValues(), namePrefix: 'legacy', onChange: () => {} }));
  assert.equal(inputs(legacyHtml).filter((input) => input.includes('checked=""')).length, 0);
});

test('form handlers switch single selections and accept multiple platform names', () => {
  let values = selected();
  const fields = () => elements(CourseMaterialsFields({ values, namePrefix: 'test', onChange: (next) => { values = next; } }));
  fields().find((element) => element.type === 'input' && element.props.value === 'no')!.props.onChange();
  assert.equal(values.usesThirdPartyPlatform, 'no');
  assert(!fields().some((element) => element.props.placeholder === 'Enter third-party platform name(s)'));
  fields().find((element) => element.type === 'input' && element.props.value === 'yes')!.props.onChange();
  fields().find((element) => element.props.placeholder === 'Enter third-party platform name(s)')!.props.onChange({ target: { value: 'Pearson MyLab, McGraw Hill Connect' } });
  fields().find((element) => element.type === 'input' && element.props.value === 'Textbook')!.props.onChange();
  assert.equal(values.thirdPartyPlatformNames, 'Pearson MyLab, McGraw Hill Connect');
  assert.equal(values.instructionalMaterials, 'Textbook');
});

test('validation requires new selections, and platform names only for Yes', () => {
  assert.equal(courseMaterialsValidation(selected()), '');
  assert(courseMaterialsValidation({ ...selected(), thirdPartyPlatformNames: '  ' }).includes('Name of Third-Party'));
  assert.equal(courseMaterialsValidation({ ...selected('no'), thirdPartyPlatformNames: '' }), '');
  assert(courseMaterialsValidation({ ...selected('no'), instructionalMaterials: '' }).includes('Instructional Materials'));
  assert(courseMaterialsValidation({ ...selected(), thirdPartyPlatformNames: '' }, false).includes('Name of Third-Party'));
});

test('materials radio options are mutually exclusive with exact notification wording', () => {
  const statements = { ZTC: 'This course is ZTC.', Textbook: 'This course uses a Textbook.', OER: 'This course uses OER.' } as const;
  for (const [option, statement] of Object.entries(statements)) {
    const values = selected('no', option as keyof typeof statements);
    const html = renderToStaticMarkup(React.createElement(CourseMaterialsFields, { values, namePrefix: 'test', onChange: () => {} }));
    const radios = inputs(html).filter((input) => input.includes('name="test-instructional-materials"'));
    assert.equal(radios.length, 3);
    assert.equal(radios.filter((input) => input.includes('checked=""')).length, 1);
    assert.equal(courseMaterialsStatements({ ...course(), ...courseMaterialsFields(values) }).materials, statement);
  }
});

test('saved selections and names survive JSON persistence, edits, and reopening without changing tasks', () => {
  const original = course();
  const saved = JSON.parse(JSON.stringify({ ...original, ...courseMaterialsFields(selected()) }));
  assert.deepEqual(courseMaterialsFormValues(saved), selected());
  const edited = { ...saved, ...courseMaterialsFields({ ...selected('no', 'Textbook') }) };
  assert.equal(edited.usesThirdPartyPlatform, false);
  assert.equal(edited.thirdPartyPlatformNames, '');
  assert.equal(edited.instructionalMaterials, 'Textbook');
  assert.deepEqual(edited.tasks, original.tasks);
  const content = buildProjectCompletionNotification(edited, now);
  assert(content.includes('This course does not use a third-party platform.'));
  assert(!content.includes('uCertify'));
});

test('completion content reflects saved Yes names and exact materials text, without version information', () => {
  const content = buildProjectCompletionNotification({ ...course(), ...courseMaterialsFields(selected()) }, now);
  assert(content.includes('This course uses the following third-party platforms: uCertify, NETLAB+, and Packet Tracer.'));
  assert(content.includes('This course uses OER.'));
  assert(!content.includes('VERSION INFORMATION'));
  assert(!content.includes('Version Number:'));
  assert(!content.includes('[does/does not]'));
  assert(!content.includes('[is ZTC / uses a textbook]'));
  for (const heading of ['FSCJ ONLINE', 'SUBJECT MATTER EXPERT', 'Errors and Modifications', 'Future Classes Beyond This Term', 'Stipend Inquiries', 'DIRECTOR, E-ADMIN & SUPPORT SERVICES']) assert(content.includes(heading));
  assert(content.startsWith('TO: sme@example.com; dean@example.com; associate@example.com; Ansa.Reams.Johnson@fscj.edu; martha.mcnulty@fscj.edu\nCc:'));
  assert(content.endsWith('- The Outcomes Map is attached for your convenience.'));
});

test('version text uses current month, canvasVersion, development type, and SME name and refreshes with edits', () => {
  const text = buildVersionInformation(course(), now);
  assert.equal(text, 'VERSION INFORMATION\n\nDate: October 2026\nVersion Number: cel-test1234-v7\nAction: Modification\nDetails: This course was designed and developed by the Subject Matter Expert, Professor Test Smith, and Instructional Designer, Chrystal Wickline');
  const updated = buildVersionInformation({ ...course(), canvasVersion: 'cel-test1234-v8', devType: 'Original', deptTeam: { ...course().deptTeam, smeName: 'Updated SME' } }, new Date('2026-11-10T12:00:00'));
  assert(updated.includes('Date: November 2026'));
  assert(updated.includes('Version Number: cel-test1234-v8'));
  assert(updated.includes('Action: Original'));
  assert(updated.includes('Subject Matter Expert, Updated SME,'));
  assert(!updated.includes('Version Number: 99'));
});

test('QA task header exposes a Clipboard Version Information button and preserves the completion notification button', () => {
  const html = renderToStaticMarkup(React.createElement(Category1CourseDev, {
    courseDevelopments: [course()], customBlocked: [], onAddCourse: async () => {}, onUpdateCourse: async () => {}, onDeleteCourse: async () => {},
  }));
  const qa = html.match(/<article data-task-id="35"[\s\S]*?<\/article>/)![0];
  assert(qa.includes('aria-label="Version Information"'));
  assert(qa.includes('lucide-clipboard'));
  assert(qa.includes('Version Information</button>'));
  const complete = html.match(/<article data-task-id="39"[\s\S]*?<\/article>/)![0];
  assert(complete.includes('Project Completion Notification</button>'));
  assert(!complete.includes('Version Information</button>'));
});

// Exercise the actual shared pop-up helper using browser boundary doubles.
test('completion resources preserve full plain-text content in the pop-up and clipboard', async () => {
  const saved = { ...course(), ...courseMaterialsFields(selected()) };
  const before = JSON.stringify(saved);
  const content = buildProjectCompletionNotification(saved, now);
  const resources = [
    '- View Teaching Schedule: https://canvas.fscj.edu/courses/100662/pages/view-teaching-schedule-and-class-roster?module_item_id=4639710',
    '- Syllabus: https://canvas.fscj.edu/courses/100662/pages/syllabus?module_item_id=4701101',
    '- Term Target Dates: https://canvas.fscj.edu/courses/100662/pages/term-targets?module_item_id=4710811',
    '- CeL Master Courses: https://canvas.fscj.edu/courses/100662/pages/center-for-elearning-master-courses?module_item_id=4634868',
  ].join('\n');
  const section = 'Faculty Resources and Next Steps\n\n'
    + 'You can find your Faculty Schedule in myFSCJ (PeopleSoft). Instructions for accessing your schedule are available in the Faculty Exchange.\n\n'
    + 'I recommend visiting the Canvas pages linked below and saving them as favorites in your browser. The Faculty Exchange is a resource hub for adjunct faculty, with useful information that is regularly updated. Full-time faculty may also find these resources helpful.\n\n'
    + resources + '\n\n'
    + 'This page explains how to submit a request ticket to FSCJ Online to have course content loaded into your teaching sections.';
  assert(content.includes('\n\n' + section + '\n\nDIRECTOR, E-ADMIN & SUPPORT SERVICES'));
  assert(content.indexOf(section) > content.indexOf('Stipend Inquiries'));
  assert(content.includes('SUBJECT: TEST1234 Course Completion & Next Steps'));
  assert(content.includes('Professor Smith,'));
  assert(content.includes('This course uses the following third-party platforms: uCertify, NETLAB+, and Packet Tracer.'));
  assert.equal(JSON.stringify(saved), before);
  await withPopup(async (context) => {
    openCommunicationToolWindow(`${saved.courseNumber} Course Completion & Next Steps`,
      'Project completion notification copied to clipboard. You may also copy/edit from the text box below.', content);
    const dom = new JSDOM(context.html);
    try {
      const textarea = dom.window.document.querySelector('textarea')!;
      assert.equal(textarea.value, content);
      assert.equal(context.copies[0], content);
      assert(textarea.value.includes(resources));
      assert(!textarea.value.includes('**'));
      assert(!textarea.value.includes('](https://'));
    } finally {
      dom.window.close();
    }
  });
});

async function withPopup(run: (context: any) => Promise<void>) {
  const descriptors = Object.fromEntries(['window', 'navigator', 'alert'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const copies: string[] = [], listeners: Record<string, () => Promise<void>> = {};
  const status = { textContent: '' };
  const textarea = { value: '' };
  const context = { html: '', closed: false, blocked: false, failCopy: false, copies, listeners, status, textarea };
  const clipboard = { writeText: async (text: string) => { if (context.failCopy) throw new Error('denied'); copies.push(text); } };
  const popup = { navigator: { clipboard }, close: () => { context.closed = true; }, document: {
    write: (html: string) => { context.html = html; }, close: () => {},
    querySelector: () => textarea,
    getElementById: (id: string) => id === 'copy-status' ? status : { addEventListener: (_event: string, listener: any) => { listeners[id] = listener; } },
  } };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { open: () => context.blocked ? null : popup } });
  Object.defineProperty(globalThis, 'alert', { configurable: true, value: (text: string) => { status.textContent = text; } });
  try { await run(context); } finally {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    }
  }
}

test('Version Information pop-up opens, copies full multiline text, copies edits, and closes', async () => {
  await withPopup(async (context) => {
    const text = buildVersionInformation(course(), now);
    openCommunicationToolWindow('Version Information', 'Copied. You may also copy/edit from the text box below.', text, true);
    assert(context.html.includes('<title>Version Information</title>'));
    assert(context.html.includes('Copy to Clipboard'));
    assert(context.html.includes('Close</button>'));
    assert.equal(context.copies[0], text);
    context.textarea.value = text;
    await context.listeners['copy-content']();
    assert.equal(context.copies[1], text);
    context.textarea.value = text + '\nEdited note';
    await context.listeners['copy-content']();
    assert.equal(context.copies[2], text + '\nEdited note');
    context.listeners['close-popup']();
    assert.equal(context.closed, true);
  });
});

test('pop-up helper preserves existing notifications and handles blocked pop-ups, denied copy, and HTML escaping', async () => {
  await withPopup(async (context) => {
    openCommunicationToolWindow('Original <title>', 'Copied. You may also copy/edit from the text box below.', '<script>text</script>');
    assert(context.html.includes('Original &lt;title&gt;'));
    assert(context.html.includes('&lt;script&gt;text&lt;/script&gt;'));
    assert(!context.html.includes('id="copy-content"'));
    openCommunicationToolWindow('Version Information', 'Copied', 'Multiline\ntext', true);
    context.failCopy = true;
    await context.listeners['copy-content']();
    assert(context.status.textContent.includes('Unable to copy'));
    context.failCopy = false;
    context.blocked = true;
    openCommunicationToolWindow('Version Information', 'Copied. You may also copy/edit from the text box below.', 'Text', true);
    assert(context.status.textContent.includes('Pop-up was blocked'));
  });
});


test('API validation requires new project answers while permitting legacy updates and rejecting invalid saved fields', () => {
  assert.equal(validateSavedCourseMaterials(course()), '');
  assert(validateSavedCourseMaterials(course(), true).includes('Yes or No'));
  assert.equal(validateSavedCourseMaterials({ ...course(), ...courseMaterialsFields(selected()) }, true), '');
  assert(validateSavedCourseMaterials({ usesThirdPartyPlatform: true, instructionalMaterials: 'OER' }).includes('Name of Third-Party'));
  assert.equal(validateSavedCourseMaterials({ usesThirdPartyPlatform: false, instructionalMaterials: 'ZTC' }, true), '');
  assert(validateSavedCourseMaterials({ usesThirdPartyPlatform: 'no' } as any).includes('Yes or No'));
  assert(validateSavedCourseMaterials({ instructionalMaterials: 'unknown' } as any).includes('Instructional Materials'));
  assert(validateSavedCourseMaterials({ thirdPartyPlatformNames: 123 } as any).includes('Name of Third-Party'));
});

test('completion drafts tolerate missing team, course number, platform names, and materials independently', async () => {
  for (const partial of [
    {},
    { usesThirdPartyPlatform: true },
    { usesThirdPartyPlatform: false },
    { instructionalMaterials: 'OER' },
  ]) {
    const content = buildProjectCompletionNotification(partial as CourseDevelopment, now);
    assert(content.includes('SUBJECT: [Not provided] Course Completion & Next Steps'));
    assert(content.includes('Professor [Not provided],'));
    assert(!content.includes('undefined'));
    assert(content.includes('Faculty Resources and Next Steps'));
    assert.equal((content.match(/https:\/\/canvas.fscj.edu\//g) || []).length, 4);
    if ('instructionalMaterials' in partial) assert(content.includes('This course uses OER.'));
    if (partial.usesThirdPartyPlatform === true) assert(content.includes('[Third-party platform information not provided]'));
    if (partial.usesThirdPartyPlatform === false) assert(content.includes('This course does not use a third-party platform.'));
    await withPopup(async (context) => {
      openCommunicationToolWindow('Completion', 'Copied', content);
      assert.equal(context.copies[0], content);
      const dom = new JSDOM(context.html);
      assert.equal(dom.window.document.querySelector('textarea')!.value, content);
      dom.window.close();
    });
  }
});

test('completion button opens incomplete course drafts without alerts, editing, or saves', async () => {
  const { createRoot } = await import('react-dom/client');
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const keys = ['window', 'document', 'navigator', 'localStorage', 'alert', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  let html = '', copied = '', alerts = 0, saves = 0;
  const globals = { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
    navigator: { clipboard: { writeText: async (text: string) => { copied = text; } } },
    alert: () => { alerts++; }, IS_REACT_ACT_ENVIRONMENT: true };
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, value });
  dom.window.open = (() => ({ document: { write: (text: string) => { html = text; }, close() {} } })) as any;
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    for (const incomplete of [course(), { ...course(), usesThirdPartyPlatform: true, thirdPartyPlatformNames: '', deptTeam: {}, courseNumber: '' } as CourseDevelopment]) {
      await React.act(async () => root.render(React.createElement(Category1CourseDev, {
        courseDevelopments: [incomplete], customBlocked: [], onAddCourse: async () => { saves++; },
        onUpdateCourse: async () => { saves++; }, onDeleteCourse: async () => {},
      })));
      const button = dom.window.document.querySelector<HTMLButtonElement>('[aria-label="Project Completion Notification"]');
      assert(button);
      const formsBefore = dom.window.document.querySelectorAll('form').length;
      await React.act(async () => button.click());
      assert(html.includes('<textarea>'));
      assert(copied.includes('[Not provided]'));
      assert(copied.includes('Faculty Resources and Next Steps'));
      const popup = new JSDOM(html);
      assert.equal(popup.window.document.querySelector('textarea')!.value, copied);
      popup.window.close();
      assert.equal(dom.window.document.querySelectorAll('form').length, formsBefore);
      assert.equal(alerts, 0);
      assert.equal(saves, 0);
      html = ''; copied = '';
    }
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    }
  }
});

const completionHeadings = [
  'FSCJ ONLINE', 'SUBJECT MATTER EXPERT', 'Errors and Modifications',
  'Future Classes Beyond This Term', 'Stipend Inquiries',
  'Faculty Resources and Next Steps', 'DIRECTOR, E-ADMIN & SUPPORT SERVICES',
];
function assertSingleCompletionSections(content: string) {
  let previous = -1;
  for (const heading of completionHeadings) {
    assert.equal(content.split(heading).length - 1, 1, heading);
    const position = content.indexOf(heading);
    assert(position > previous, heading + ' is in order');
    previous = position;
    assert(content.includes('\n\n' + heading + '\n\n'));
  }
  assert.equal((content.match(/^TO:/gm) || []).length, 1);
  assert.equal((content.match(/^Cc:/gm) || []).length, 1);
  assert.equal((content.match(/^SUBJECT:/gm) || []).length, 1);
  assert(!/\n{3,}|\r|[ \t]+\n/.test(content));
  assert.equal(content, content.trim());
  assert(!content.includes('[development is / modifications re]'));
  assert(!content.includes('**'));
  assert.equal((content.match(/^- .*third-party platform.*$/gmi) || []).length, 1);
  assert.equal((content.match(/^- (?:View Teaching Schedule|Syllabus|Term Target Dates|CeL Master Courses): https:\/\/canvas\.fscj\.edu\/courses\/100662\/pages\/[^\s]+\?module_item_id=\d+$/gm) || []).length, 4);
}

test('stored email pasted into platform names cannot duplicate sections or cross-course information', async () => {
  const original = { ...course(), ...courseMaterialsFields(selected()), courseNumber: 'OTHER1234' };
  // Production had a complete email flattened by the single-line names input.
  const embeddedEmail = buildProjectCompletionNotification(original, now);
  for (const names of [embeddedEmail, embeddedEmail.replace(/\n/g, ' '),
    'TO: wrong@example.com Cc: other@example.com SUBJECT: OTHER1234 - This course does use a 3rd-party platform: PacketTracer, NDG NETLAB+, uCertify.',
  ]) {
    const contaminated = { ...course(), ...courseMaterialsFields(selected()), thirdPartyPlatformNames: names };
    const before = JSON.stringify(contaminated);
    const content = buildProjectCompletionNotification(contaminated, now);
    assertSingleCompletionSections(content);
    assert(content.includes('- [Third-party platform information needs review]'));
    assert(!content.includes('OTHER1234'));
    assert(!content.includes('wrong@example.com'));
    assert(!content.includes('uCertify'));
    assert.equal(JSON.stringify(contaminated), before);
    await withPopup(async context => {
      openCommunicationToolWindow('Completion', 'Copied', content);
      const popup = new JSDOM(context.html);
      try {
        const textarea = popup.window.document.querySelector('textarea')!;
        assert.equal(textarea.value, content);
        assert.equal(context.copies[0], content);
        assertSingleCompletionSections(textarea.value);
      } finally { popup.window.close(); }
    });
  }
});

test('multiple stored platforms appear once, with consistent spacing and no unrelated field fallback', () => {
  const saved = { ...course(), ...courseMaterialsFields(selected()), thirdPartyPlatformNames: 'PacketTracer, NDG NETLAB+, uCertify' };
  const content = buildProjectCompletionNotification(saved, now);
  assert(content.includes('- This course uses the following third-party platforms: PacketTracer, NDG NETLAB+, uCertify.\n'));
  assertSingleCompletionSections(content);
  const multiline = buildProjectCompletionNotification({ ...saved, thirdPartyPlatformNames: 'PacketTracer,\r\nNDG NETLAB+,\n\nuCertify. ' }, now);
  assert.equal(multiline, content);
  const missing = buildProjectCompletionNotification({ ...saved, thirdPartyPlatformNames: '', courseTitle: 'Not a platform' }, now);
  assert(missing.includes('- [Third-party platform information not provided]'));
  assert(!missing.includes('Not a platform'));
  assert(buildProjectCompletionNotification({ ...saved, thirdPartyPlatformNames: ' ... ' }, now).includes('- [Third-party platform information not provided]'));
  const no = buildProjectCompletionNotification({ ...saved, usesThirdPartyPlatform: false }, now);
  assert(no.includes('- This course does not use a third-party platform.'));
  assert(!no.includes('PacketTracer'));
});

test('all existing development types produce grammatical completion wording', () => {
  for (const devType of ['Original (New) Development', 'Original', 'New Release', 'Tier 1 & 2 Revision', 'Modification', undefined] as const) {
    const content = buildProjectCompletionNotification({ ...course(), devType }, now);
    const sentence = devType === 'Modification' || devType === 'Tier 1 & 2 Revision'
      ? 'The course modifications are complete.'
      : devType ? 'The course development is complete.' : 'The course is complete.';
    assert(content.includes('FSCJ ONLINE\n\n- ' + sentence + '\n'));
    assertSingleCompletionSections(content);
  }
});
