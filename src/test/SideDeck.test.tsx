import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SideDeck } from '../sidepanel/SideDeck';

describe('StudEZE SideDeck Integration', () => {
  it('renders the StudEZE branding, tabs, and default tool', async () => {
    await act(async () => {
      render(<SideDeck />);
    });

    // Brand and subtitle
    expect(screen.getByText('StudEZE')).toBeInTheDocument();
    expect(screen.getByText('Side Deck')).toBeInTheDocument();
    expect(screen.getByText('No-AI')).toBeInTheDocument();

    // The 3 tabs
    expect(screen.getByRole('tab', { name: /convert/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /rough copy/i })).toBeInTheDocument();
  });

  it('switches between tools when tabs are clicked', async () => {
    await act(async () => {
      render(<SideDeck />);
    });

    const convertTab = screen.getByRole('tab', { name: /convert/i });
    await act(async () => {
      fireEvent.click(convertTab);
    });
    expect(convertTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/drop file to convert/i)).toBeInTheDocument();

    const notesTab = screen.getByRole('tab', { name: /notes/i });
    await act(async () => {
      fireEvent.click(notesTab);
    });
    expect(notesTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText(/search notes/i)).toBeInTheDocument();

    const roughCopyTab = screen.getByRole('tab', { name: /rough copy/i });
    await act(async () => {
      fireEvent.click(roughCopyTab);
    });
    expect(roughCopyTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText(/temporary scratchpad/i)).toBeInTheDocument();
  });
});
