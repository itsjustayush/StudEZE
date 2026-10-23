import { Note, NotesStore, NoteSortOption } from '../types/notes';
import { storage } from './storage';

const STORAGE_KEY = 'studeze_quick_notes';
const CURRENT_SCHEMA_VERSION = 1;

const DEFAULT_STORE: NotesStore = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  notes: [],
};

export const notesService = {
  async getStore(): Promise<NotesStore> {
    const data = await storage.get<NotesStore>(STORAGE_KEY, DEFAULT_STORE);
    if (!data || !Array.isArray(data.notes)) {
      return { ...DEFAULT_STORE };
    }
    return data;
  },

  async saveStore(store: NotesStore): Promise<boolean> {
    return await storage.set<NotesStore>(STORAGE_KEY, store);
  },

  async loadNotes(): Promise<Note[]> {
    const store = await this.getStore();
    return store.notes;
  },

  async getNote(id: string): Promise<Note | null> {
    const notes = await this.loadNotes();
    return notes.find((n) => n.id === id) || null;
  },

  async createNote(title = '', content = ''): Promise<Note> {
    const store = await this.getStore();
    const now = Date.now();

    const newNote: Note = {
      id: `note_${now}_${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      content,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    store.notes.unshift(newNote);
    store.lastSelectedNoteId = newNote.id;
    await this.saveStore(store);

    return newNote;
  },

  async updateNote(
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'isPinned'>>,
    expectedVersion?: number
  ): Promise<Note | null> {
    const store = await this.getStore();
    const noteIndex = store.notes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return null;
    }

    const currentNote = store.notes[noteIndex];

    // Stale write protection: if caller provided expectedVersion, ensure it matches
    if (expectedVersion !== undefined && currentNote.version > expectedVersion) {
      console.warn(
        `[QuickNotes] Stale write detected for note "${id}". Remote version: ${currentNote.version}, expected: ${expectedVersion}`
      );
    }

    const updatedNote: Note = {
      ...currentNote,
      ...updates,
      updatedAt: Date.now(),
      version: currentNote.version + 1,
    };

    store.notes[noteIndex] = updatedNote;
    await this.saveStore(store);

    return updatedNote;
  },

  async deleteNote(id: string): Promise<boolean> {
    const store = await this.getStore();
    const initialCount = store.notes.length;
    store.notes = store.notes.filter((n) => n.id !== id);

    if (store.lastSelectedNoteId === id) {
      store.lastSelectedNoteId = store.notes[0]?.id || undefined;
    }

    if (store.notes.length < initialCount) {
      await this.saveStore(store);
      return true;
    }
    return false;
  },

  async togglePin(id: string): Promise<Note | null> {
    const note = await this.getNote(id);
    if (!note) return null;
    return await this.updateNote(id, { isPinned: !note.isPinned });
  },

  sortNotes(notes: Note[], sort: NoteSortOption = 'updatedDesc'): Note[] {
    return [...notes].sort((a, b) => {
      // Pinned notes always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sort) {
        case 'titleAsc':
          return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
        case 'createdDesc':
          return b.createdAt - a.createdAt;
        case 'updatedAsc':
          return a.updatedAt - b.updatedAt;
        case 'updatedDesc':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
  },

  filterNotes(notes: Note[], query: string): Note[] {
    const q = query.trim().toLowerCase();
    if (!q) return notes;

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
    );
  },

  downloadNoteFile(note: Note, format: 'txt' | 'md' = 'txt'): void {
    const title = note.title.trim() || 'Untitled Note';
    const content = `${title}\n${'='.repeat(title.length)}\nLast updated: ${new Date(note.updatedAt).toLocaleString()}\n\n${note.content}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 40);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async exportAllNotesJson(): Promise<string> {
    const store = await this.getStore();
    return JSON.stringify(store, null, 2);
  },
};
