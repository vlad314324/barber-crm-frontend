import { X } from 'lucide-react';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../i18n/LocaleContext';

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

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  const { t } = useLocale();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Фокус-менеджмент і клавіатура — модалка раніше не мала жодного:
  // фокус лишався на елементі, що відкрив модалку (клавіатурний
  // користувач не міг дістатись до її вмісту через Tab), Escape нічого
  // не робив, а Tab міг вийти за межі модалки на фон.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black/40 animate-modal-backdrop-in"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`relative bg-surface rounded-lg shadow-lg border border-line w-full ${SIZE_CLASSES[size]} z-50
          flex flex-col max-h-[85vh] animate-modal-in outline-none`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <h3 id={titleId} className="text-lg font-bold text-ink tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
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
