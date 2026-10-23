import {
  SupportedOutputFormat,
  ConvertedFileResult,
} from '../../types/converter';
import { getMimeTypeForOutput, getExtensionForOutput } from './registry';

/**
 * Robust, client-side text document transformations without any external network calls.
 */

// Simple markdown to HTML parser
export function markdownToHtml(md: string): string {
  let html = md
    // Escape basic HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');

  // Wrap lists
  html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');

  // Wrap lines in paragraphs
  const paragraphs = html
    .split(/\n\n+/)
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<blockquote')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 16px; color: #64748b; }
    ul { padding-left: 24px; }
  </style>
</head>
<body>
${paragraphs}
</body>
</html>`;
}

// Markdown to plain text
export function markdownToText(md: string): string {
  return md
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^\s*[\-\*]\s+/gm, '• ')
    .replace(/^\>\s+/gm, '')
    .trim();
}

// HTML to plain text
export function htmlToText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script and style elements
  doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());

  return doc.body.textContent?.trim() || '';
}

// HTML to Markdown
export function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function nodeToMd(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(nodeToMd).join('');

    switch (tag) {
      case 'h1':
        return `\n# ${children.trim()}\n\n`;
      case 'h2':
        return `\n## ${children.trim()}\n\n`;
      case 'h3':
        return `\n### ${children.trim()}\n\n`;
      case 'p':
        return `\n${children.trim()}\n\n`;
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 'code':
        return `\`${children}\``;
      case 'a':
        return `[${children}](${el.getAttribute('href') || ''})`;
      case 'li':
        return `- ${children.trim()}\n`;
      case 'blockquote':
        return `> ${children.trim()}\n\n`;
      case 'br':
        return '\n';
      case 'script':
      case 'style':
        return '';
      default:
        return children;
    }
  }

  return nodeToMd(doc.body).replace(/\n{3,}/g, '\n\n').trim();
}

// CSV Parser handling quotes and commas
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// CSV to JSON Array of objects
export function csvToJson(csvText: string): string {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return '[]';

  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index].trim() : '';
    });
    return obj;
  });

  return JSON.stringify(data, null, 2);
}

// CSV to HTML Table
export function csvToHtml(csvText: string): string {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return '<p>Empty CSV</p>';

  const headerHtml = rows[0]
    .map((h) => `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background: #f8fafc; text-align: left;">${h}</th>`)
    .join('');

  const bodyHtml = rows
    .slice(1)
    .map((row) => {
      const cells = row
        .map((c) => `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">${c}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CSV Table</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
    table { border-collapse: collapse; width: 100%; max-width: 1000px; margin: 0 auto; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
</body>
</html>`;
}

// JSON to CSV
export function jsonToCsv(jsonText: string): string {
  const parsed = JSON.parse(jsonText);
  const arr = Array.isArray(parsed) ? parsed : [parsed];

  if (arr.length === 0 || typeof arr[0] !== 'object' || arr[0] === null) {
    throw new Error('JSON must be an array of objects to convert to CSV');
  }

  const allKeys = Array.from(
    new Set(arr.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : [])))
  );

  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = allKeys.map(escapeField).join(',');
  const dataRows = arr.map((item) =>
    allKeys.map((key) => escapeField(item[key])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Main Text Converter pipeline
 */
export async function convertText(
  file: File,
  targetFormat: SupportedOutputFormat
): Promise<ConvertedFileResult> {
  const text = await file.text();
  const inputExt = file.name.split('.').pop()?.toLowerCase() || '';

  let outputText = '';

  if (inputExt === 'md' || inputExt === 'markdown') {
    if (targetFormat === 'html') {
      outputText = markdownToHtml(text);
    } else if (targetFormat === 'txt') {
      outputText = markdownToText(text);
    }
  } else if (inputExt === 'csv') {
    if (targetFormat === 'json') {
      outputText = csvToJson(text);
    } else if (targetFormat === 'html') {
      outputText = csvToHtml(text);
    } else if (targetFormat === 'txt') {
      outputText = text;
    }
  } else if (inputExt === 'json') {
    if (targetFormat === 'csv') {
      outputText = jsonToCsv(text);
    } else if (targetFormat === 'txt') {
      outputText = JSON.stringify(JSON.parse(text), null, 2);
    }
  } else if (inputExt === 'html') {
    if (targetFormat === 'md') {
      outputText = htmlToMarkdown(text);
    } else if (targetFormat === 'txt') {
      outputText = htmlToText(text);
    }
  } else if (inputExt === 'txt') {
    if (targetFormat === 'html') {
      outputText = `<p>${text.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
    } else if (targetFormat === 'md') {
      outputText = text;
    }
  }

  if (!outputText) {
    throw new Error(`Unsupported conversion from .${inputExt} to ${targetFormat.toUpperCase()}`);
  }

  const targetMime = getMimeTypeForOutput(targetFormat);
  const blob = new Blob([outputText], { type: `${targetMime};charset=utf-8` });
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = getExtensionForOutput(targetFormat);
  const outputFileName = `${baseName}.${ext}`;
  const downloadUrl = URL.createObjectURL(blob);

  return {
    blob,
    downloadUrl,
    originalFileName: file.name,
    outputFileName,
    outputMimeType: targetMime,
    originalSizeBytes: file.size,
    outputSizeBytes: blob.size,
    outputFormat: targetFormat,
    textPreview: outputText.slice(0, 1000), // First 1000 chars for preview
  };
}
