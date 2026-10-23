import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  File as FileIcon,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  SupportedOutputFormat,
  ConvertedFileResult,
  ConversionOptions,
} from '../../types/converter';
import {
  detectInputFormat,
  getCapability,
  formatFileSize,
  convertFile,
} from '../../services/converter';

export interface FileConverterProps {
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FileConverter: React.FC<FileConverterProps> = ({ onNotify }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedOutputFormat | ''>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConvertedFileResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Conversion options
  const [imageQuality, setImageQuality] = useState<number>(0.92);
  const [showOptions, setShowOptions] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    };
  }, [result]);

  const handleFile = (file: File) => {
    setError(null);
    setResult(null);

    const inputFmt = detectInputFormat(file);
    if (!inputFmt) {
      setError(`Unsupported file type "${file.name}". Please upload a supported image or text document.`);
      setSelectedFile(null);
      setTargetFormat('');
      return;
    }

    const cap = getCapability(inputFmt);
    if (!cap) {
      setError(`No converter found for .${inputFmt}`);
      setSelectedFile(null);
      setTargetFormat('');
      return;
    }

    if (file.size > cap.maxSizeBytes) {
      setError(`File size exceeds limit of ${formatFileSize(cap.maxSizeBytes)}.`);
      setSelectedFile(null);
      setTargetFormat('');
      return;
    }

    setSelectedFile(file);
    // Default to the first available output format
    setTargetFormat(cap.outputFormats[0] || '');
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile || !targetFormat) return;

    setIsConverting(true);
    setError(null);

    try {
      const options: ConversionOptions = {
        imageQuality,
      };

      const res = await convertFile(selectedFile, targetFormat as SupportedOutputFormat, options);
      setResult(res);
      onNotify?.(`Converted to ${targetFormat.toUpperCase()} successfully!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Conversion failed.';
      setError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    setSelectedFile(null);
    setTargetFormat('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const detectedFormat = selectedFile ? detectInputFormat(selectedFile) : null;
  const capability = detectedFormat ? getCapability(detectedFormat) : null;
  const isImageOutput = targetFormat === 'jpeg' || targetFormat === 'webp';

  return (
    <div
      className="converter-container"
      role="tabpanel"
      id="panel-converter"
      aria-labelledby="tab-converter"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-label="Upload file for conversion"
      />

      {/* No File Selected -> Dropzone */}
      {!selectedFile && !result && (
        <div
          className={`dropzone ${isDragging ? 'active' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Drag and drop a file or click to browse"
        >
          <div className="dropzone-icon">
            <UploadCloud size={20} />
          </div>
          <div className="dropzone-title">Drop file to convert</div>
          <div className="dropzone-subtitle">
            Images (PNG, JPG, WebP, SVG) & Documents (Markdown, HTML, CSV, JSON)
          </div>
          <Button
            size="sm"
            variant="secondary"
            style={{ marginTop: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse files
          </Button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          className="badge badge-danger"
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
          role="alert"
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {/* File Selected & Not Yet Converted */}
      {selectedFile && !result && (
        <>
          <div className="file-card">
            <div className="file-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <FileIcon size={16} color="var(--color-primary-text)" style={{ flexShrink: 0 }} />
                <span className="file-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove selected file"
                onClick={handleReset}
                style={{ padding: 4 }}
              >
                <X size={14} />
              </Button>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Badge variant="neutral">
                {detectedFormat?.toUpperCase() || 'UNKNOWN'}
              </Badge>
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          </div>

          {/* Conversion Configuration */}
          {capability && (
            <div className="conversion-options-card">
              <div className="option-row">
                <label htmlFor="target-format-select" className="option-label">
                  Output format
                </label>
                <select
                  id="target-format-select"
                  className="select-control"
                  style={{ width: 'auto', minWidth: 120 }}
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as SupportedOutputFormat)}
                >
                  {capability.outputFormats.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      .{fmt.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Quality Settings */}
              {isImageOutput && (
                <div style={{ marginTop: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 0', fontSize: 11, color: 'var(--color-text-muted)' }}
                    onClick={() => setShowOptions(!showOptions)}
                  >
                    <Sliders size={12} />
                    <span>{showOptions ? 'Hide options' : 'Compression options'}</span>
                  </button>

                  {showOptions && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className="option-row">
                        <span className="option-label">Quality: {Math.round(imageQuality * 100)}%</span>
                        <input
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={imageQuality}
                          onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                          style={{ width: 130 }}
                          aria-label="Image compression quality slider"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleConvert}
                loading={isConverting}
                style={{ marginTop: 6 }}
              >
                Convert file
              </Button>
            </div>
          )}
        </>
      )}

      {/* Converted Success Result */}
      {result && (
        <div className="result-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-text-main)' }}>
                Conversion complete
              </span>
            </div>
            <Badge variant="success">.{result.outputFormat.toUpperCase()}</Badge>
          </div>

          <div className="result-stat">
            <span>Output file:</span>
            <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>
              {result.outputFileName}
            </span>
          </div>

          <div className="result-stat">
            <span>Size:</span>
            <span>
              {formatFileSize(result.originalSizeBytes)} →{' '}
              <strong style={{ color: 'var(--color-text-main)' }}>
                {formatFileSize(result.outputSizeBytes)}
              </strong>
              {result.outputSizeBytes < result.originalSizeBytes && (
                <span style={{ color: 'var(--color-success)', marginLeft: 6 }}>
                  (-{Math.round((1 - result.outputSizeBytes / result.originalSizeBytes) * 100)}%)
                </span>
              )}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <a
              href={result.downloadUrl}
              download={result.outputFileName}
              className="btn btn-primary"
              style={{ flex: 1, textDecoration: 'none' }}
              onClick={() => onNotify?.(`Downloaded ${result.outputFileName}`, 'info')}
            >
              <Download size={14} />
              <span>Download</span>
            </a>

            {(result.previewUrl || result.textPreview) && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Eye size={14} />}
                onClick={() => setShowPreviewModal(true)}
                title="Preview converted file"
              >
                Preview
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleReset}
              title="Convert another file"
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && result && (
        <div
          className="modal-backdrop"
          onClick={() => setShowPreviewModal(false)}
          role="dialog"
          aria-label="Converted file preview"
        >
          <div
            className="modal-card"
            style={{ maxWidth: 440, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{result.outputFileName}</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowPreviewModal(false)}
                aria-label="Close preview"
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              {result.previewUrl && (
                <img
                  src={result.previewUrl}
                  alt="Converted preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 280,
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                    background: '#1e293b',
                  }}
                />
              )}
              {result.textPreview && (
                <pre
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    background: 'var(--color-bg-base)',
                    padding: 10,
                    borderRadius: 'var(--radius-sm)',
                    overflowX: 'auto',
                    maxHeight: 260,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {result.textPreview}
                </pre>
              )}
            </div>
            <div className="modal-actions">
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                Close
              </Button>
              <a
                href={result.downloadUrl}
                download={result.outputFileName}
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <Download size={12} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
