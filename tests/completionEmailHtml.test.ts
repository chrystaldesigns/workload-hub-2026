import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildProjectCompletionNotification } from '../src/utils/projectNotifications';
import { completionEmailHtml } from '../src/utils/completionEmailHtml';
import type { CourseDevelopment } from '../src/types';

test('completion email renders contacts, resource bullets and safe dynamic fields in both formats', () => {
  const content = buildProjectCompletionNotification({ courseNumber: 'TEST1234', deptTeam: { smeName: '<script>Smith' } } as CourseDevelopment);
  assert(content.includes('The course is ready for Anšá to move to ‘Production.’'));
  assert(!content.includes('Staging'));
  assert.equal(content.split('Director, Center for eLearning').length - 1, 2);
  assert(content.includes('DIRECTOR, CENTER FOR ELEARNING\n\nAnšá,'));
  assert(content.includes('Dr. Anšá Reams-Johnson (Ansa.Reams.Johnson@fscj.edu)'));
  assert(content.includes('Kris Kristen (kris.kristen@fscj.edu)'));
  const dom = new JSDOM(completionEmailHtml(content));
  const doc = dom.window.document;
  for (const [name, email, count] of [['Dr. Anšá Reams-Johnson', 'Ansa.Reams.Johnson@fscj.edu', 2], ['Kris Kristen', 'kris.kristen@fscj.edu', 1]] as const) {
    const links = doc.querySelectorAll(`a[href="mailto:${email}"]`);
    assert.equal(links.length, count);
    links.forEach(link => assert.equal(link.textContent, name));
  }
  const resources = Array.from(doc.querySelectorAll('ul')).find(ul => ul.textContent?.includes('View Teaching Schedule'))!;
  assert.equal(resources.children.length, 4);
  for (const item of resources.children) {
    const link = item.querySelector('a')!;
    assert.equal(item.textContent, link.textContent);
    assert(content.includes(`- ${link.textContent}: ${link.getAttribute('href')}`));
    assert(new URL(link.getAttribute('href')!).searchParams.has('module_item_id'));
  }
  assert.equal(doc.querySelectorAll('script').length, 0);
  assert(doc.body.textContent?.includes('Professor <script>Smith,'));
  assert(content.includes('SUBJECT: TEST1234 Course Completion & Next Steps'));
  dom.window.close();
});

test('completion preview updates after edits and copies HTML and plain text together', async () => {
  const { openCommunicationToolWindow } = await import('../src/utils/communicationToolWindow');
  const dom = new JSDOM('');
  const keys = ['window', 'navigator', 'ClipboardItem'];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  let copied: any;
  const clipboard = { writeText: async () => {}, write: async (items: any) => { copied = items[0]; } };
  Object.defineProperty(dom.window.navigator, 'clipboard', { value: clipboard });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { open: () => dom.window } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard } });
  Object.defineProperty(globalThis, 'ClipboardItem', { configurable: true, value: class { constructor(public data: any) {} } });
  try {
    const text = buildProjectCompletionNotification({ deptTeam: {} } as CourseDevelopment);
    openCommunicationToolWindow('Completion', 'Copied', text, false, true);
    const textarea = dom.window.document.querySelector('textarea')!;
    assert.equal(textarea.value, text);
    textarea.value += '\n\nEdited note';
    textarea.dispatchEvent(new dom.window.Event('input'));
    assert(dom.window.document.getElementById('email-preview')!.textContent?.includes('Edited note'));
    dom.window.document.getElementById('copy-html')!.click();
    assert.equal(await copied.data['text/plain'].text(), textarea.value);
    assert.equal(await copied.data['text/html'].text(), completionEmailHtml(textarea.value));
  } finally {
    dom.window.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    }
  }
});
