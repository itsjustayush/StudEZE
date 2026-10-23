export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
  version: number;   // Incremental version for conflict / stale write protection
}

export interface NotesStore {
  schemaVersion: number;
  notes: Note[];
  lastSelectedNoteId?: string;
}

export type NoteSortOption = 'updatedDesc' | 'updatedAsc' | 'titleAsc' | 'createdDesc';
