export type SupportedInputFormat =
  | 'png'
  | 'jpeg'
  | 'jpg'
  | 'webp'
  | 'bmp'
  | 'gif'
  | 'svg'
  | 'md'
  | 'markdown'
  | 'json'
  | 'csv'
  | 'html'
  | 'txt';

export type SupportedOutputFormat =
  | 'png'
  | 'jpeg'
  | 'webp'
  | 'txt'
  | 'md'
  | 'html'
  | 'json'
  | 'csv';

export interface FormatCapability {
  inputFormat: SupportedInputFormat;
  outputFormats: SupportedOutputFormat[];
  category: 'image' | 'text' | 'vector';
  maxSizeBytes: number; // e.g. 25MB for images, 10MB for text
  description: string;
}

export interface ConversionOptions {
  imageQuality?: number; // 0.1 to 1.0 (default: 0.92)
  maxWidth?: number;
  maxHeight?: number;
  preserveAspectRatio?: boolean;
  prettyPrintJson?: boolean;
}

export interface ConvertedFileResult {
  blob: Blob;
  downloadUrl: string;
  originalFileName: string;
  outputFileName: string;
  outputMimeType: string;
  originalSizeBytes: number;
  outputSizeBytes: number;
  outputFormat: SupportedOutputFormat;
  previewUrl?: string;
  textPreview?: string;
}

export interface BatchItem {
  id: string;
  file: File;
  sourceFormat: SupportedInputFormat;
  targetFormat: SupportedOutputFormat;
  status: 'pending' | 'converting' | 'success' | 'error';
  progress: number;
  result?: ConvertedFileResult;
  errorMessage?: string;
}
