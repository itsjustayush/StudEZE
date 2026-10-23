import { describe, it, expect, vi } from 'vitest';
import {
  detectInputFormat,
  getCapability,
  formatFileSize,
  markdownToHtml,
  markdownToText,
  htmlToText,
  htmlToMarkdown,
  csvToJson,
  jsonToCsv,
  csvToHtml,
  convertText,
} from '../services/converter';

describe('Converter Registry & Detection', () => {
  it('detects input formats correctly from file extension and mime type', () => {
    const pngFile = new File(['fake data'], 'photo.png', { type: 'image/png' });
    expect(detectInputFormat(pngFile)).toBe('png');

    const jpegFile = new File(['fake data'], 'scan.jpg', { type: 'image/jpeg' });
    expect(detectInputFormat(jpegFile)).toBe('jpg');

    const mdFile = new File(['# Title'], 'notes.md', { type: 'text/markdown' });
    expect(detectInputFormat(mdFile)).toBe('md');

    const jsonFile = new File(['{}'], 'data.json', { type: 'application/json' });
    expect(detectInputFormat(jsonFile)).toBe('json');

    const csvFile = new File(['a,b'], 'table.csv', { type: 'text/csv' });
    expect(detectInputFormat(csvFile)).toBe('csv');

    const unknownFile = new File(['xyz'], 'file.unknown', { type: 'application/octet-stream' });
    expect(detectInputFormat(unknownFile)).toBeNull();
  });

  it('retrieves capabilities for supported formats', () => {
    const pngCap = getCapability('png');
    expect(pngCap).not.toBeNull();
    expect(pngCap?.outputFormats).toContain('webp');
    expect(pngCap?.outputFormats).toContain('jpeg');

    const mdCap = getCapability('md');
    expect(mdCap).not.toBeNull();
    expect(mdCap?.outputFormats).toContain('html');
    expect(mdCap?.outputFormats).toContain('txt');
  });

  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });
});

describe('Text Conversions', () => {
  it('converts Markdown to semantic HTML', () => {
    const md = '# Main Header\n\nThis is **bold** text and `inline code`.';
    const html = markdownToHtml(md);
    expect(html).toContain('<h1>Main Header</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>inline code</code>');
  });

  it('converts Markdown to plain text', () => {
    const md = '# Chapter 1\n\nRead **carefully** and [visit docs](https://example.com).';
    const text = markdownToText(md);
    expect(text).toContain('Chapter 1');
    expect(text).toContain('carefully');
    expect(text).toContain('visit docs (https://example.com)');
    expect(text).not.toContain('#');
  });

  it('converts HTML to plain text without scripts or styles', () => {
    const html = `<div>
      <style>body { color: red; }</style>
      <h1>Heading</h1>
      <p>Paragraph text.</p>
      <script>alert("hack");</script>
    </div>`;
    const text = htmlToText(html);
    expect(text).toContain('Heading');
    expect(text).toContain('Paragraph text.');
    expect(text).not.toContain('color: red');
    expect(text).not.toContain('alert');
  });

  it('converts HTML to Markdown', () => {
    const html = '<h1>Notes</h1><p>Important <strong>point</strong>.</p><a href="https://example.com">Link</a>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('# Notes');
    expect(md).toContain('**point**');
    expect(md).toContain('[Link](https://example.com)');
  });

  it('converts CSV to JSON and JSON back to CSV', () => {
    const csv = 'name,role,level\nAlice,Developer,Senior\nBob,Designer,Lead';
    const jsonStr = csvToJson(csv);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Alice');
    expect(parsed[0].role).toBe('Developer');
    expect(parsed[1].name).toBe('Bob');

    // Round-trip back to CSV
    const regeneratedCsv = jsonToCsv(jsonStr);
    expect(regeneratedCsv).toContain('name,role,level');
    expect(regeneratedCsv).toContain('Alice,Developer,Senior');
  });

  it('converts CSV to an HTML table', () => {
    const csv = 'Product,Price\nBook,12\nPen,2';
    const html = csvToHtml(csv);
    expect(html).toContain('<table>');
    expect(html).toContain('>Product</th>');
    expect(html).toContain('>Book</td>');
  });

  it('runs convertText pipeline successfully', async () => {
    // Mock URL.createObjectURL
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');

    const file = new File(['# Hello World'], 'doc.md', { type: 'text/markdown' });
    const res = await convertText(file, 'html');

    expect(res.outputFileName).toBe('doc.html');
    expect(res.outputMimeType).toBe('text/html');
    expect(res.outputSizeBytes).toBeGreaterThan(0);
    expect(res.textPreview).toContain('<h1>Hello World</h1>');

    URL.createObjectURL = originalCreateObjectURL;
  });
});
