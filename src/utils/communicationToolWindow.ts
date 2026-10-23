const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Reuse the standard communication window; QA version information additionally
// exposes explicit copy and close buttons without changing other pop-up flows.
export const openCommunicationToolWindow = (
  popupTitle: string,
  clipboardMessage: string,
  content: string,
  withCopyControls = false
) => {
  navigator.clipboard?.writeText(content).catch(() => undefined);
  const popupWindow = window.open('', '_blank', 'width=800,height=700,scrollbars=yes,resizable=yes');

  if (!popupWindow) {
    alert(clipboardMessage.replace('You may also copy/edit from the text box below.', 'Pop-up was blocked by the browser.'));
    return;
  }
  popupWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(popupTitle)}</title>
        <style>
          body { font-family: Open Sans, Source Sans Pro, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; }
          textarea { width: 100%; height: 560px; padding: 16px; font-family: Open Sans, Source Sans Pro, sans-serif; font-size: 14px; line-height: 1.5; border: 1px solid #cbd5e1; border-radius: 8px; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          p { color: #475569; }
          ${withCopyControls ? 'button { border: 1px solid #006282; border-radius: 6px; padding: 8px 12px; background: white; color: #006282; cursor: pointer; } button:hover { background: #006282; color: white; }' : ''}
        </style>
      </head>
      <body>
        <h1>${escapeHtml(popupTitle)}</h1>
        <p id="copy-status">${escapeHtml(clipboardMessage)}</p>
        <textarea>${escapeHtml(content)}</textarea>
        ${withCopyControls ? '<p><button id="copy-content" type="button">Copy to Clipboard</button> <button id="close-popup" type="button">Close</button></p>' : ''}
      </body>
    </html>
  `);
  popupWindow.document.close();
  if (withCopyControls) {
    popupWindow.document.getElementById('copy-content')?.addEventListener('click', async () => {
      const status = popupWindow.document.getElementById('copy-status');
      try {
        await popupWindow.navigator.clipboard.writeText(popupWindow.document.querySelector('textarea')?.value ?? content);
        if (status) status.textContent = `${popupTitle} copied to clipboard.`;
      } catch {
        if (status) status.textContent = 'Unable to copy. Please select and copy the text manually.';
      }
    });
    popupWindow.document.getElementById('close-popup')?.addEventListener('click', () => popupWindow.close());
  }
};
