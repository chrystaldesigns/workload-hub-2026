// Render only the completion email's plain-text format; escape course data first.
export function completionEmailHtml(content: string): string {
  const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const inline = (text: string) => escape(text)
    .replace(/Dr\. Anšá Reams-Johnson \(Ansa\.Reams\.Johnson@fscj\.edu\)/g, '<a href="mailto:Ansa.Reams.Johnson@fscj.edu">Dr. Anšá Reams-Johnson</a>')
    .replace(/Kris Kristen \(kris\.kristen@fscj\.edu\)/g, '<a href="mailto:kris.kristen@fscj.edu">Kris Kristen</a>')
    .replace(/^(View Teaching Schedule|Syllabus|Term Target Dates|CeL Master Courses): (https:\/\/canvas\.fscj\.edu\/[^\s]+)$/, '<a href="$2">$1</a>');
  return content.split('\n\n').map(block => {
    const lines = block.split('\n');
    return lines.every(line => line.startsWith('- '))
      ? `<ul style="padding-left:24px">${lines.map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`
      : `<p style="margin:0 0 16px">${lines.map(inline).join('<br>')}</p>`;
  }).join('\n');
}
