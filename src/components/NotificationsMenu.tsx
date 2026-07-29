import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

// No backend endpoint for notifications exists yet — this renders an honest
// empty state instead of the old hardcoded "3" badge. Wire up a real feed
// (e.g. GET /notifications) here once the backend supports it.
const NotificationsMenu = () => {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-ink-secondary hover:text-ink rounded-sm hover:bg-canvas-soft transition-colors focus:outline-none"
        aria-label={t('header.notifications')}
      >
        <Bell size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-line rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-ink">{t('header.notifications')}</p>
          </div>
          <p className="px-4 py-6 text-sm text-center text-ink-muted">{t('header.noNotifications')}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
