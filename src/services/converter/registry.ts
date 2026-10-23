import {
  SupportedInputFormat,
  SupportedOutputFormat,
  FormatCapability,
} from '../../types/converter';

export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_TEXT_SIZE_BYTES = 10 * 1024 * 1024;  // 10 MB

const FORMAT_CAPABILITIES: Record<SupportedInputFormat, FormatCapability> = {
  png: {
    inputFormat: 'png',
    outputFormats: ['webp', 'jpeg', 'png'],
    category: 'image',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    description: 'Convert PNG to modern WebP or compressed JPEG image',
  },
  jpeg: {
    inputFormat: 'jpeg',
    outputFormats: ['webp', 'png', 'jpeg'],
    category: 'image',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    description: 'Convert JPEG to lossless PNG or highly compressed WebP',
  },
  jpg: {
    inputFormat: 'jpg',
    outputFormats: ['webp', 'png', 'jpeg'],
    category: 'image',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    description: 'Convert JPG to lossless PNG or highly compressed WebP',
  },
  webp: {
    inputFormat: 'webp',
    outputFormats: ['png', 'jpeg', 'webp'],
    category: 'image',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    description: 'Convert WebP to universal PNG or JPEG format',
  },
  bmp: {
    inputFormat: 'bmp',
    outputFormats: ['png', 'webp', 'jpeg'],
    category: 'image',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    description: 'Convert uncompressed BMP to PNG, WebP, or JPEG',
  },
  gif: {
    inputFormat: 'gif',
    outputFormats: ['png', 'webp', 'jpeg'],
    category: 'image',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    description: 'Convert GIF to PNG, WebP, or JPEG image',
  },
  svg: {
    inputFormat: 'svg',
    outputFormats: ['png', 'webp', 'jpeg'],
    category: 'vector',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    description: 'Rasterize vector SVG to crisp PNG, WebP, or JPEG',
  },
  md: {
    inputFormat: 'md',
    outputFormats: ['html', 'txt'],
    category: 'text',
    maxSizeBytes: MAX_TEXT_SIZE_BYTES,
    description: 'Convert Markdown to semantic HTML page or stripped plain text',
  },
  markdown: {
    inputFormat: 'markdown',
    outputFormats: ['html', 'txt'],
    category: 'text',
    maxSizeBytes: MAX_TEXT_SIZE_BYTES,
    description: 'Convert Markdown to semantic HTML page or stripped plain text',
  },
  json: {
    inputFormat: 'json',
    outputFormats: ['csv', 'txt'],
    category: 'text',
    maxSizeBytes: MAX_TEXT_SIZE_BYTES,
    description: 'Convert JSON to structured CSV table or formatted text',
  },
  csv: {
    inputFormat: 'csv',
    outputFormats: ['json', 'html', 'txt'],
    category: 'text',
    maxSizeBytes: MAX_TEXT_SIZE_BYTES,
    description: 'Convert CSV to JSON object array, HTML table, or clean text',
  },
  html: {
    inputFormat: 'html',
    outputFormats: ['md', 'txt'],
    category: 'text',
    maxSizeBytes: MAX_TEXT_SIZE_BYTES,
    description: 'Extract Markdown or clean plain text from HTML content',
  },
  txt: {
    inputFormat: 'txt',
    outputFormats: ['html', 'md'],
    category: 'text',
    maxSizeBytes: MAX_TEXT_SIZE_BYTES,
    description: 'Format plain text into HTML paragraphs or Markdown block',
  },
};

/**
 * Detects format from file MIME type and extension
 */
export function detectInputFormat(file: File): SupportedInputFormat | null {
  const name = file.name.toLowerCase();
  const extMatch = name.match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';

  // Check extension first
  if (ext in FORMAT_CAPABILITIES) {
    return ext as SupportedInputFormat;
  }

  // Fallback to MIME type
  const type = file.type.toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpeg';
  if (type.includes('webp')) return 'webp';
  if (type.includes('bmp')) return 'bmp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('svg')) return 'svg';
  if (type.includes('markdown')) return 'md';
  if (type.includes('json')) return 'json';
  if (type.includes('csv')) return 'csv';
  if (type.includes('html')) return 'html';
  if (type.includes('text/plain')) return 'txt';

  return null;
}

export function getCapability(format: SupportedInputFormat): FormatCapability | null {
  return FORMAT_CAPABILITIES[format] || null;
}

export function getAllCapabilities(): FormatCapability[] {
  return Object.values(FORMAT_CAPABILITIES);
}

export function getMimeTypeForOutput(format: SupportedOutputFormat): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'html':
      return 'text/html';
    case 'md':
      return 'text/markdown';
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'txt':
    default:
      return 'text/plain';
  }
}

export function getExtensionForOutput(format: SupportedOutputFormat): string {
  switch (format) {
    case 'jpeg':
      return 'jpg';
    case 'html':
      return 'html';
    case 'md':
      return 'md';
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'webp':
      return 'webp';
    case 'png':
      return 'png';
    case 'txt':
    default:
      return 'txt';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
