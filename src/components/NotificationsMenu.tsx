import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { notificationApi } from '../api';
import type { Notification } from '../api/types';
import OnboardingGuideCard from './OnboardingGuideCard';
import BookingNotificationRow from './BookingNotificationRow';

const POLL_INTERVAL_MS = 60000;

const NotificationsMenu = () => {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationApi.getAll().then(setNotifications).catch(() => {});
    const interval = setInterval(() => {
      notificationApi.getAll().then(setNotifications).catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-ink-secondary hover:text-ink rounded-sm hover:bg-canvas-soft transition-colors focus:outline-none"
        aria-label={t('header.notifications')}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-brand text-white text-[10px] leading-[16px] text-center font-semibold">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-ink">{t('header.notifications')}</p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-ink-muted">{t('header.noNotifications')}</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(n => {
                if (n.type === 'onboarding_guide') {
                  return <OnboardingGuideCard key={n._id} notification={n} onRead={markRead} onNavigate={() => setOpen(false)} />;
                }
                if (n.type === 'new_booking') {
                  return <BookingNotificationRow key={n._id} notification={n} onRead={markRead} onNavigate={() => setOpen(false)} />;
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
