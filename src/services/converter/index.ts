import {
  SupportedOutputFormat,
  ConversionOptions,
  ConvertedFileResult,
} from '../../types/converter';
import { detectInputFormat, getCapability, formatFileSize } from './registry';
import { convertImage } from './imageConverter';
import { convertText } from './textConverter';
import { convertSvg } from './svgConverter';

/**
 * Universal client-side file converter.
 * Checks format capabilities, validates limits, and coordinates conversion.
 */
export async function convertFile(
  file: File,
  targetFormat: SupportedOutputFormat,
  options: ConversionOptions = {}
): Promise<ConvertedFileResult> {
  const inputFormat = detectInputFormat(file);

  if (!inputFormat) {
    throw new Error(
      `Unsupported file type "${file.name}". Please upload a supported image or text document.`
    );
  }

  const capability = getCapability(inputFormat);
  if (!capability) {
    throw new Error(`No conversion capability registered for format .${inputFormat}`);
  }

  if (!capability.outputFormats.includes(targetFormat)) {
    throw new Error(
      `Cannot convert .${inputFormat} to ${targetFormat.toUpperCase()}. Supported target formats: ${capability.outputFormats.join(', ').toUpperCase()}`
    );
  }

  if (file.size > capability.maxSizeBytes) {
    throw new Error(
      `File exceeds maximum allowed size of ${formatFileSize(capability.maxSizeBytes)} (file size: ${formatFileSize(file.size)}).`
    );
  }

  if (capability.category === 'vector') {
    return await convertSvg(file, targetFormat, options);
  } else if (capability.category === 'image') {
    return await convertImage(file, targetFormat, options);
  } else if (capability.category === 'text') {
    return await convertText(file, targetFormat);
  }

  throw new Error(`Unhandled capability category: ${capability.category}`);
}

export * from './registry';
export * from './imageConverter';
export * from './textConverter';
export * from './svgConverter';
