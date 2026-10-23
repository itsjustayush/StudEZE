import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Copy,
  ClipboardPaste,
  Trash2,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  RoughCopyExpiryOption,
  RoughCopyRecord,
} from '../../types/roughCopy';
import {
  roughCopyService,
  DEFAULT_ROUGH_COPY,
} from '../../services/roughCopyService';

export interface RoughCopyProps {
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const RoughCopy: React.FC<RoughCopyProps> = ({ onNotify }) => {
  const [record, setRecord] = useState<RoughCopyRecord>(DEFAULT_ROUGH_COPY);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [showClearModal, setShowClearModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState<{
    label: string;
    isUrgent: boolean;
    isExpired: boolean;
  }>({ label: '', isUrgent: false, isExpired: false });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load and enforce expiry on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const loaded = await roughCopyService.load();
      if (isMounted) {
        setRecord(loaded);
        setContent(loaded.content);
        setSaveStatus(loaded.content ? 'saved' : 'idle');
        setRemainingTime(roughCopyService.getRemainingTimeString(loaded.expiresAt));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update countdown every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (record.expiresAt > 0) {
        const timeInfo = roughCopyService.getRemainingTimeString(record.expiresAt);
        setRemainingTime(timeInfo);

        // If it just expired while open
        if (timeInfo.isExpired && content) {
          roughCopyService.clear();
          setContent('');
          setRecord({ ...DEFAULT_ROUGH_COPY, expiryOption: record.expiryOption });
          onNotify?.('Temporary scratchpad content expired and was cleaned up.', 'info');
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [record.expiresAt, content, onNotify]);

  // Debounced autosave
  const triggerAutosave = useCallback(
    (newContent: string) => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const updated = await roughCopyService.save(newContent, record.expiryOption);
          setRecord(updated);
          setSaveStatus('saved');
          setRemainingTime(roughCopyService.getRemainingTimeString(updated.expiresAt));
        } catch (err) {
          console.error('[RoughCopy] Save error:', err);
          setSaveStatus('idle');
        }
      }, 350);
    },
    [record.expiryOption]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutosave(val);
  };

  const handleExpiryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value as RoughCopyExpiryOption;
    const updated = await roughCopyService.setExpiryOption(option);
    setRecord(updated);
    setRemainingTime(roughCopyService.getRemainingTimeString(updated.expiresAt));
    onNotify?.(`Expiry updated to ${option}. Timer reset from now.`, 'info');
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onNotify?.('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify?.('Failed to access clipboard automatically. Please press Ctrl+C to copy.', 'error');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        onNotify?.('Clipboard is empty.', 'info');
        return;
      }
      const newContent = content ? `${content}\n${text}` : text;
      setContent(newContent);
      triggerAutosave(newContent);
      onNotify?.('Pasted from clipboard!', 'success');
    } catch {
      onNotify?.('Clipboard access denied. Please press Ctrl+V directly in the scratchpad.', 'info');
      textareaRef.current?.focus();
    }
  };

  const handleClearConfirm = async () => {
    await roughCopyService.clear();
    setContent('');
    setRecord({ ...DEFAULT_ROUGH_COPY, expiryOption: record.expiryOption });
    setSaveStatus('idle');
    setShowClearModal(false);
    setRemainingTime({ label: '', isUrgent: false, isExpired: false });
    onNotify?.('Scratchpad cleared.', 'info');
  };

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content ? content.split('\n').length : 0;

  return (
    <div
      className="rough-copy-container"
      role="tabpanel"
      id="panel-roughcopy"
      aria-labelledby="tab-roughcopy"
    >
      {/* Header with Expiry and Quick Actions */}
      <div className="rough-copy-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="rough-copy-expiry" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Expires:
          </label>
          <select
            id="rough-copy-expiry"
            className="select-control"
            style={{ width: 'auto', padding: '3px 8px', fontSize: 11 }}
            value={record.expiryOption}
            onChange={handleExpiryChange}
            aria-label="Scratchpad retention period"
          >
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
          </select>

          {content && remainingTime.label && (
            <Badge
              variant={remainingTime.isUrgent ? 'warning' : 'neutral'}
              icon={<Clock size={11} />}
              style={{ fontSize: 10 }}
            >
              {remainingTime.label}
            </Badge>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {saveStatus === 'saving' && (
            <span style={{ fontSize: 11, color: 'var(--color-warning)', marginRight: 4 }}>
              Saving...
            </span>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
            onClick={handleCopy}
            disabled={!content.trim()}
            title="Copy all scratchpad text"
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<ClipboardPaste size={12} />}
            onClick={handlePaste}
            title="Paste clipboard text"
          >
            Paste
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={12} color="var(--color-danger)" />}
            onClick={() => setShowClearModal(true)}
            disabled={!content.trim()}
            title="Clear all text"
          />
        </div>
      </div>

      {/* Large distraction-free textarea */}
      <textarea
        ref={textareaRef}
        className="rough-copy-textarea"
        placeholder="Temporary scratchpad for copied paragraphs, calculations, reference links, and unfinished thoughts..."
        value={content}
        onChange={handleContentChange}
        aria-label="Rough Copy scratchpad text editor"
      />

      {/* Footer with counts and local privacy guarantee */}
      <div className="rough-copy-footer">
        <div className="rough-copy-stats">
          <span>{charCount} chars</span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{lineCount} lines</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            color: 'var(--color-text-faint)',
          }}
          title="Stored locally on this device. Automatically pruned on expiry. No AI or cloud upload."
        >
          <ShieldCheck size={12} color="var(--color-success)" />
          <span>Local only</span>
        </div>
      </div>

      {/* Clear Scratchpad Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Rough Copy?"
        message="This will instantly wipe your temporary scratchpad and delete the local storage record. This action cannot be undone."
        confirmLabel="Clear text"
        isDanger={true}
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
