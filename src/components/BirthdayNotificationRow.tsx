import { useNavigate } from 'react-router';
import { Cake } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { notificationApi } from '../api';
import type { Notification } from '../api/types';

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: () => void;
}

// Нагадування про день народження клієнта (сьогодні або через 7 днів) —
// клік відкриває картку клієнта.
const BirthdayNotificationRow = ({ notification, onRead, onNavigate }: Props) => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const name = notification.clientName || '';

  const handleClick = () => {
    if (!notification.isRead) {
      notificationApi.markRead(notification._id).catch(() => {});
      onRead(notification._id);
    }
    onNavigate();
    if (notification.clientId) navigate(`/clients/${notification.clientId}`);
  };

  return (
    <button onClick={handleClick} className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-canvas-soft transition-colors">
      <span className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
        <Cake size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ink">{t('birthdays.notifTitle')}</span>
        <span className="block text-xs text-ink-secondary mt-0.5">
          {notification.daysUntil ? t('birthdays.notifSoon', { n: notification.daysUntil, name }) : t('birthdays.notifToday', { name })}
        </span>
        <span className="block text-xs text-ink-muted mt-0.5">{t('birthdays.notifHint')}</span>
      </span>
      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
    </button>
  );
};

export default BirthdayNotificationRow;
