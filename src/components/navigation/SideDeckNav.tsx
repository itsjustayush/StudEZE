import React from 'react';
import { ArrowLeftRight, FileText, ClipboardEdit } from 'lucide-react';

export type SideDeckTool = 'converter' | 'notes' | 'roughcopy';

export interface SideDeckNavProps {
  activeTool: SideDeckTool;
  onSelectTool: (tool: SideDeckTool) => void;
}

export const SideDeckNav: React.FC<SideDeckNavProps> = ({
  activeTool,
  onSelectTool,
}) => {
  const tools: { id: SideDeckTool; label: string; icon: React.ReactNode }[] = [
    {
      id: 'converter',
      label: 'Convert',
      icon: <ArrowLeftRight size={14} />,
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <FileText size={14} />,
    },
    {
      id: 'roughcopy',
      label: 'Rough Copy',
      icon: <ClipboardEdit size={14} />,
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const next = (index + 1) % tools.length;
      onSelectTool(tools[next].id);
    } else if (e.key === 'ArrowLeft') {
      const prev = (index - 1 + tools.length) % tools.length;
      onSelectTool(tools[prev].id);
    }
  };

  return (
    <nav
      className="side-deck-nav"
      role="tablist"
      aria-label="Side Deck Utilities"
    >
      {tools.map((t, idx) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            className={`nav-tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTool(t.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            tabIndex={isActive ? 0 : -1}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
