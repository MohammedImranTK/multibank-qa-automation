/**
 * One-off utility: renders the Task 2 markdown deliverables in docs/ to PDF.
 *
 * Not part of the test suite / CI — run manually with:
 *   node scripts/generate-task2-pdfs.js
 *
 * Uses Playwright's bundled Chromium (already a project dependency) to print
 * styled HTML to PDF, so no new npm packages are added to package.json.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUT_DIR = path.join(DOCS_DIR, 'pdf');

const FILES = [
  { md: 'qa-strategy.md', pdf: 'task2-qa-strategy.pdf', title: 'Task 2 — QA Strategy & Thinking' },
  { md: 'test-plan.md', pdf: 'task2-test-plan.pdf', title: 'Test Plan — Mobile Trading App' },
  {
    md: 'release-readiness-checklist.md',
    pdf: 'task2-release-readiness-checklist.pdf',
    title: 'Release Readiness Checklist',
  },
  { md: 'risk-matrix.md', pdf: 'task2-risk-matrix.pdf', title: 'Risk Matrix' },
];

/**
 * Minimal, purpose-built markdown -> HTML converter.
 * Not a general-purpose parser — handles exactly the subset used in these
 * four docs: ATX headers (#/##/###), pipe tables, unordered/ordered lists
 * (incl. GFM task-list checkboxes), bold, inline code, blank-line paragraphs.
 */
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let i = 0;

  const inline = (text) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      html += `<h${level}>${inline(headerMatch[2])}</h${level}>\n`;
      i++;
      continue;
    }

    // Tables (header row + separator row + body rows)
    if (line.trim().startsWith('|') && lines[i + 1] && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const headerCells = line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim());
      html += '<table><thead><tr>';
      headerCells.forEach((c) => (html += `<th>${inline(c)}</th>`));
      html += '</tr></thead><tbody>';
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
        html += '<tr>';
        cells.forEach((c) => (html += `<td>${inline(c)}</td>`));
        html += '</tr>';
        i++;
      }
      html += '</tbody></table>\n';
      continue;
    }

    // Unordered lists (incl. task-list checkboxes), possibly wrapped across lines
    if (/^\s*-\s+/.test(line)) {
      html += '<ul>\n';
      while (i < lines.length && (/^\s*-\s+/.test(lines[i]) || (lines[i].trim() !== '' && !/^#{1,4}\s/.test(lines[i]) && !lines[i].trim().startsWith('|') && !/^\d+\.\s/.test(lines[i]) && html.endsWith('')))) {
        if (/^\s*-\s+/.test(lines[i])) {
          let item = lines[i].replace(/^\s*-\s+/, '');
          // continuation lines (indented, no leading '-') get appended
          let j = i + 1;
          while (j < lines.length && lines[j].trim() !== '' && !/^\s*-\s+/.test(lines[j]) && !/^#{1,4}\s/.test(lines[j]) && !lines[j].trim().startsWith('|')) {
            item += ' ' + lines[j].trim();
            j++;
          }
          const taskMatch = item.match(/^\[( |x|X)\]\s+(.*)$/);
          if (taskMatch) {
            const checked = taskMatch[1].toLowerCase() === 'x';
            html += `<li class="task"><span class="box">${checked ? '☑' : '☐'}</span> ${inline(taskMatch[2])}</li>\n`;
          } else {
            html += `<li>${inline(item)}</li>\n`;
          }
          i = j;
        } else {
          break;
        }
      }
      html += '</ul>\n';
      continue;
    }

    // Ordered lists
    if (/^\s*\d+\.\s+/.test(line)) {
      html += '<ol>\n';
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*\d+\.\s+/, '');
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '' && !/^\s*\d+\.\s+/.test(lines[j]) && !/^#{1,4}\s/.test(lines[j])) {
          item += ' ' + lines[j].trim();
          j++;
        }
        html += `<li>${inline(item)}</li>\n`;
        i = j;
      }
      html += '</ol>\n';
      continue;
    }

    // Paragraph (collect until blank line)
    let para = line;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== '' && !/^#{1,4}\s/.test(lines[j]) && !lines[j].trim().startsWith('|') && !/^\s*-\s+/.test(lines[j]) && !/^\s*\d+\.\s+/.test(lines[j])) {
      para += ' ' + lines[j].trim();
      j++;
    }
    html += `<p>${inline(para)}</p>\n`;
    i = j;
  }

  return html;
}

const STYLE = `
  <style>
    @page { margin: 20mm 16mm; }
    body {
      font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      font-size: 10.5pt;
      line-height: 1.55;
    }
    h1 { font-size: 19pt; margin: 0 0 4mm; border-bottom: 2px solid #1f3a5f; padding-bottom: 2mm; color: #1f3a5f; }
    h2 { font-size: 14pt; margin: 8mm 0 3mm; color: #1f3a5f; border-bottom: 1px solid #d8dee5; padding-bottom: 1.5mm; }
    h3 { font-size: 11.5pt; margin: 5mm 0 2mm; color: #2d3748; }
    p { margin: 2mm 0; }
    ul, ol { margin: 2mm 0; padding-left: 6mm; }
    li { margin: 1mm 0; }
    li.task { list-style: none; margin-left: -6mm; padding-left: 0; }
    li.task .box { display: inline-block; width: 5mm; }
    table { border-collapse: collapse; width: 100%; margin: 3mm 0 5mm; font-size: 9pt; }
    th, td { border: 1px solid #ccd3db; padding: 1.8mm 2.5mm; text-align: left; vertical-align: top; }
    th { background: #1f3a5f; color: #fff; font-weight: 600; }
    tr:nth-child(even) td { background: #f4f6f8; }
    code { background: #eef1f4; padding: 0.3mm 1mm; border-radius: 2px; font-family: "SF Mono", Consolas, monospace; font-size: 9pt; }
    strong { color: #14213d; }
    a { color: #1f3a5f; }
    .doc-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6mm; font-size: 8.5pt; color: #667085; }
  </style>
`;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const file of FILES) {
    const mdPath = path.join(DOCS_DIR, file.md);
    const md = fs.readFileSync(mdPath, 'utf-8');
    const body = mdToHtml(md);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${STYLE}</head><body>
      <div class="doc-header"><span>MultiBank QA Automation — Task 2</span><span>Mohammed Imran</span></div>
      ${body}
    </body></html>`;

    await page.setContent(html, { waitUntil: 'load' });
    const outPath = path.join(OUT_DIR, file.pdf);
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;font-size:8px;color:#888;text-align:center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      margin: { top: '20mm', bottom: '16mm', left: '16mm', right: '16mm' },
    });
    console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
