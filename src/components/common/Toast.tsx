import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === 'success' && (
            <CheckCircle2 size={14} color="var(--color-success)" />
          )}
          {toast.type === 'error' && (
            <AlertCircle size={14} color="var(--color-danger)" />
          )}
          {toast.type === 'info' && (
            <Info size={14} color="var(--color-primary-text)" />
          )}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
