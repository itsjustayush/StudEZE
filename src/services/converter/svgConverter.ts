import {
  SupportedOutputFormat,
  ConversionOptions,
  ConvertedFileResult,
} from '../../types/converter';
import { getMimeTypeForOutput, getExtensionForOutput } from './registry';

/**
 * Client-side SVG rasterization to PNG, JPEG, WebP via Canvas
 */
export async function convertSvg(
  file: File,
  targetFormat: SupportedOutputFormat,
  options: ConversionOptions = {}
): Promise<ConvertedFileResult> {
  const svgText = await file.text();
  const targetMime = getMimeTypeForOutput(targetFormat);
  const quality = options.imageQuality ?? 0.95;

  return new Promise((resolve, reject) => {
    // Create an SVG blob URL
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      try {
        const width = options.maxWidth || img.naturalWidth || img.width || 800;
        const height = options.maxHeight || img.naturalHeight || img.height || 600;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to create 2D canvas context'));
          return;
        }

        // White background for JPEG
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);

            if (!blob) {
              reject(new Error(`Failed to encode SVG to ${targetFormat.toUpperCase()}`));
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
        URL.revokeObjectURL(url);
        reject(err instanceof Error ? err : new Error('SVG rasterization failed'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG. Invalid or malformed XML syntax.'));
    };

    img.src = url;
  });
}
