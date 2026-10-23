import { describe, it, expect, beforeEach } from 'vitest';
import { notesService } from '../services/notesService';

describe('Quick Notes Service', () => {
  beforeEach(async () => {
    // Clear storage before each test
    await notesService.saveStore({ schemaVersion: 1, notes: [] });
  });

  it('creates and loads notes', async () => {
    const initialNotes = await notesService.loadNotes();
    expect(initialNotes).toHaveLength(0);

    const note1 = await notesService.createNote('Math Formulas', 'E = mc^2');
    expect(note1.id).toBeDefined();
    expect(note1.title).toBe('Math Formulas');
    expect(note1.content).toBe('E = mc^2');
    expect(note1.isPinned).toBe(false);
    expect(note1.version).toBe(1);

    const updatedList = await notesService.loadNotes();
    expect(updatedList).toHaveLength(1);
    expect(updatedList[0].id).toBe(note1.id);
  });

  it('updates an existing note and increments its version', async () => {
    const note = await notesService.createNote('Title 1', 'Content 1');
    const updated = await notesService.updateNote(note.id, {
      title: 'Title 1 Updated',
      content: 'New content',
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Title 1 Updated');
    expect(updated?.content).toBe('New content');
    expect(updated?.version).toBe(2);
  });

  it('toggles pin status and sorts pinned notes to top', async () => {
    const noteA = await notesService.createNote('Note A', 'A');
    const noteB = await notesService.createNote('Note B', 'B');

    // Pin note A
    const pinnedA = await notesService.togglePin(noteA.id);
    expect(pinnedA?.isPinned).toBe(true);

    const allNotes = await notesService.loadNotes();
    const sorted = notesService.sortNotes(allNotes, 'updatedDesc');

    // Note A must be first because it is pinned
    expect(sorted[0].id).toBe(noteA.id);
    expect(sorted[1].id).toBe(noteB.id);
  });

  it('filters notes by title and content query', async () => {
    await notesService.createNote('Chemistry Acids', 'HCl and H2SO4');
    await notesService.createNote('History Essay', 'WWII timeline');

    const all = await notesService.loadNotes();
    const result1 = notesService.filterNotes(all, 'acids');
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toBe('Chemistry Acids');

    const result2 = notesService.filterNotes(all, 'timeline');
    expect(result2).toHaveLength(1);
    expect(result2[0].title).toBe('History Essay');

    const emptyResult = notesService.filterNotes(all, 'nonexistent');
    expect(emptyResult).toHaveLength(0);
  });

  it('deletes a note permanently', async () => {
    const note = await notesService.createNote('Temporary', 'Bye');
    const delResult = await notesService.deleteNote(note.id);
    expect(delResult).toBe(true);

    const remaining = await notesService.loadNotes();
    expect(remaining).toHaveLength(0);
  });
});
