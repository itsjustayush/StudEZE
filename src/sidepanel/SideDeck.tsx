import React, { useState } from 'react';
import { SideDeckNav, SideDeckTool } from '../components/navigation/SideDeckNav';
import { FileConverter } from '../components/converter/FileConverter';
import { QuickNotes } from '../components/notes/QuickNotes';
import { RoughCopy } from '../components/roughcopy/RoughCopy';
import { Toast, ToastMessage } from '../components/common/Toast';
import { Shield } from 'lucide-react';

export const SideDeck: React.FC = () => {
  const [activeTool, setActiveTool] = useState<SideDeckTool>('roughcopy');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="studeze-side-deck">
      {/* Extension Header */}
      <header className="side-deck-header">
        <div className="brand-wrapper">
          <div className="brand-badge">S</div>
          <div>
            <h1 className="brand-title">StudEZE</h1>
          </div>
          <span className="brand-tag">Side Deck</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="badge badge-neutral"
            title="StudEZE operates 100% locally on your browser. Zero AI, zero external uploads."
            style={{ cursor: 'help' }}
          >
            <Shield size={10} color="var(--color-success)" />
            <span>No-AI</span>
          </span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <SideDeckNav activeTool={activeTool} onSelectTool={setActiveTool} />

      {/* Main Tools Container: Keeping mounted preserves state during navigation */}
      <main className="side-deck-content">
        <div
          style={{
            display: activeTool === 'converter' ? 'flex' : 'none',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
          }}
        >
          <FileConverter onNotify={showToast} />
        </div>

        <div
          style={{
            display: activeTool === 'notes' ? 'flex' : 'none',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
          }}
        >
          <QuickNotes onNotify={showToast} />
        </div>

        <div
          style={{
            display: activeTool === 'roughcopy' ? 'flex' : 'none',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
          }}
        >
          <RoughCopy onNotify={showToast} />
        </div>
      </main>

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
