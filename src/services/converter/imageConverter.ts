import {
  SupportedOutputFormat,
  ConversionOptions,
  ConvertedFileResult,
} from '../../types/converter';
import { getMimeTypeForOutput, getExtensionForOutput } from './registry';

/**
 * Client-side browser image conversion using HTMLCanvasElement.
 * Purely local, no external libraries or network requests required.
 */
export async function convertImage(
  file: File,
  targetFormat: SupportedOutputFormat,
  options: ConversionOptions = {}
): Promise<ConvertedFileResult> {
  const targetMime = getMimeTypeForOutput(targetFormat);
  const quality = options.imageQuality ?? 0.92;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (options.maxWidth && width > options.maxWidth) {
          const ratio = options.maxWidth / width;
          width = options.maxWidth;
          height = Math.round(height * ratio);
        }

        if (options.maxHeight && height > options.maxHeight) {
          const ratio = options.maxHeight / height;
          height = options.maxHeight;
          width = Math.round(width * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to create 2D canvas context'));
          return;
        }

        // If converting to JPEG, render white background first so transparent areas don't turn black
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new Error(`Failed to encode image to ${targetFormat.toUpperCase()}`));
              return;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const ext = getExtensionForOutput(targetFormat);
            const outputFileName = `${baseName}.${ext}`;
            const downloadUrl = URL.createObjectURL(blob);

            resolve({
              blob,
              downloadUrl,
              originalFileName: file.name,
              outputFileName,
              outputMimeType: targetMime,
              originalSizeBytes: file.size,
              outputSizeBytes: blob.size,
              outputFormat: targetFormat,
              previewUrl: downloadUrl,
            });
          },
          targetMime,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new Error('Image conversion failed'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file. File may be corrupted or unsupported.'));
    };

    img.src = objectUrl;
  });
}
