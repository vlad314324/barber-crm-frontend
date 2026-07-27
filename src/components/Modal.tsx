import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-ink/40"
          onClick={onClose}
        />
        <div className="relative bg-surface rounded-lg shadow-lg border border-line w-full max-w-md z-50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h3 className="text-lg font-bold text-ink tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;