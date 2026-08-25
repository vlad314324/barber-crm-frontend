import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black/40 animate-modal-backdrop-in"
          onClick={onClose}
        />
        <div className={`relative bg-surface rounded-lg shadow-lg border border-line w-full ${SIZE_CLASSES[size]} z-50
          flex flex-col max-h-[85vh] animate-modal-in`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <h3 className="text-lg font-bold text-ink tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-5 flex-1 overflow-y-auto overflow-x-hidden min-h-0">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;