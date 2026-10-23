import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Copy,
  Download,
  ArrowLeft,
  FileText,
  Clock,
} from 'lucide-react';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import { Note, NoteSortOption } from '../../types/notes';
import { notesService } from '../../services/notesService';

export interface QuickNotesProps {
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({ onNotify }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<NoteSortOption>('updatedDesc');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [deleteModalNoteId, setDeleteModalNoteId] = useState<string | null>(null);

  // Active note editor state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Autosave debounce timer ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const loaded = await notesService.loadNotes();
      if (isMounted) {
        setNotes(loaded);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // When switching active note, initialize edit state
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
      setSaveStatus('saved');
    }
  }, [activeNoteId]);

  // Debounced autosave
  const triggerAutosave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!activeNoteId) return;

      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const updated = await notesService.updateNote(activeNoteId, {
            title: newTitle,
            content: newContent,
          });

          if (updated) {
            setNotes((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
            setSaveStatus('saved');
          }
        } catch (err) {
          console.error('Autosave error:', err);
          setSaveStatus('idle');
        }
      }, 400);
    },
    [activeNoteId]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditTitle(val);
    triggerAutosave(val, editContent);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditContent(val);
    triggerAutosave(editTitle, val);
  };

  const handleCreateNote = async () => {
    const newNote = await notesService.createNote();
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    onNotify?.('New note created', 'info');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalNoteId) return;
    const success = await notesService.deleteNote(deleteModalNoteId);
    if (success) {
      setNotes((prev) => prev.filter((n) => n.id !== deleteModalNoteId));
      if (activeNoteId === deleteModalNoteId) {
        setActiveNoteId(null);
      }
      onNotify?.('Note deleted', 'info');
    }
    setDeleteModalNoteId(null);
  };

  const handleTogglePin = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    const updated = await notesService.togglePin(noteId);
    if (updated) {
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
      onNotify?.(updated.isPinned ? 'Note pinned' : 'Note unpinned', 'info');
    }
  };

  const handleCopyNote = async () => {
    if (!activeNote) return;
    const fullText = activeNote.title
      ? `${activeNote.title}\n\n${activeNote.content}`
      : activeNote.content;
    try {
      await navigator.clipboard.writeText(fullText);
      onNotify?.('Note copied to clipboard!', 'success');
    } catch {
      onNotify?.('Failed to access clipboard.', 'error');
    }
  };

  const handleDownloadNote = (format: 'txt' | 'md') => {
    if (!activeNote) return;
    notesService.downloadNoteFile(activeNote, format);
    onNotify?.(`Exported note as .${format}`, 'info');
  };

  // Filtered and sorted notes list
  const filteredNotes = notesService.filterNotes(notes, searchQuery);
  const sortedNotes = notesService.sortNotes(filteredNotes, sortOption);

  const wordCount = editContent.trim() ? editContent.trim().split(/\s+/).length : 0;
  const charCount = editContent.length;

  return (
    <div
      className="notes-container"
      role="tabpanel"
      id="panel-notes"
      aria-labelledby="tab-notes"
    >
      {/* View A: Note Editor View */}
      {activeNote ? (
        <div className="note-editor">
          <div className="note-editor-header">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={14} />}
              onClick={() => setActiveNoteId(null)}
              aria-label="Back to all notes"
            >
              Notes
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {saveStatus === 'saving' && (
                <span style={{ fontSize: 11, color: 'var(--color-warning)' }}>
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
                  Saved
                </span>
              )}

              <Button
                variant={activeNote.isPinned ? 'primary' : 'ghost'}
                size="sm"
                icon={<Pin size={13} />}
                onClick={(e) => handleTogglePin(e, activeNote.id)}
                title={activeNote.isPinned ? 'Unpin note' : 'Pin note to top'}
                aria-label="Toggle pin"
              />

              <Button
                variant="ghost"
                size="sm"
                icon={<Copy size={13} />}
                onClick={handleCopyNote}
                title="Copy note content"
                aria-label="Copy note"
              />

              <Button
                variant="ghost"
                size="sm"
                icon={<Download size={13} />}
                onClick={() => handleDownloadNote('txt')}
                title="Export as text file"
                aria-label="Export note"
              />

              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={13} color="var(--color-danger)" />}
                onClick={() => setDeleteModalNoteId(activeNote.id)}
                title="Delete note"
                aria-label="Delete note"
              />
            </div>
          </div>

          <div style={{ padding: '8px 12px 0 12px' }}>
            <input
              type="text"
              className="note-title-input"
              placeholder="Note Title..."
              value={editTitle}
              onChange={handleTitleChange}
              aria-label="Note title"
            />
          </div>

          <textarea
            className="note-textarea"
            placeholder="Start typing your study notes, thoughts, or reminders..."
            value={editContent}
            onChange={handleContentChange}
            aria-label="Note body content"
          />

          <div className="note-editor-footer">
            <span>
              {wordCount} words • {charCount} chars
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {new Date(activeNote.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      ) : (
        /* View B: Notes List View */
        <>
          <div className="notes-toolbar">
            <div className="notes-search-box">
              <Search size={13} className="notes-search-icon" />
              <input
                type="text"
                className="notes-search-input"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search notes"
              />
            </div>

            <select
              className="select-control"
              style={{ width: 'auto', padding: '5px 6px', fontSize: 11 }}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as NoteSortOption)}
              aria-label="Sort notes"
            >
              <option value="updatedDesc">Recent</option>
              <option value="titleAsc">Title</option>
              <option value="createdDesc">Created</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={handleCreateNote}
              aria-label="Create new note"
            >
              New
            </Button>
          </div>

          <div className="notes-list">
            {sortedNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileText size={32} />
                </div>
                <div className="empty-state-title">
                  {searchQuery ? 'No matching notes' : 'No notes yet'}
                </div>
                <div className="empty-state-description">
                  {searchQuery
                    ? `No notes matching "${searchQuery}"`
                    : 'Capture study thoughts, equations, or bookmarks while browsing.'}
                </div>
                {!searchQuery && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={handleCreateNote}
                    style={{ marginTop: 8 }}
                  >
                    Create first note
                  </Button>
                )}
              </div>
            ) : (
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="note-item"
                  onClick={() => setActiveNoteId(note.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setActiveNoteId(note.id);
                  }}
                  aria-label={`Open note: ${note.title || 'Untitled note'}`}
                >
                  <div className="note-item-title">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title.trim() || 'Untitled Note'}
                    </span>
                    {note.isPinned && (
                      <Pin size={11} color="var(--color-primary-text)" style={{ flexShrink: 0 }} />
                    )}
                  </div>

                  <div className="note-item-preview">
                    {note.content.trim() ? note.content.slice(0, 90) : 'Empty note'}
                  </div>

                  <div className="note-item-footer">
                    <span>
                      {new Date(note.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>
                      {note.content.trim()
                        ? `${note.content.trim().split(/\s+/).length} words`
                        : '0 words'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalNoteId !== null}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action permanently removes it from your local storage."
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalNoteId(null)}
      />
    </div>
  );
};
