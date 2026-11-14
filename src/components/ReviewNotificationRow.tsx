import { useNavigate } from 'react-router';
import { Star } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api';
import type { Notification } from '../api/types';

interface ReviewNotificationRowProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: () => void;
}

// Новий відгук клієнта (залишений за посиланням після візиту). Адміна веде
// у профіль майстра, де видно відгук і можна його приховати.
const ReviewNotificationRow = ({ notification, onRead, onNavigate }: ReviewNotificationRowProps) => {
  const { t } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canOpen = user?.role === 'admin' && !!notification.employee;

  const handleClick = () => {
    if (!notification.isRead) {
      notificationApi.markRead(notification._id).catch(() => {});
      onRead(notification._id);
    }
    if (!canOpen) return;
    onNavigate();
    navigate(`/employees/${notification.employee}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-canvas-soft transition-colors"
    >
      <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
        <Star size={16} className="fill-current" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ink">{t('notifications.newReviewTitle')}</span>
        <span className="block text-xs text-ink-secondary mt-0.5 truncate">
          {t('notifications.newReviewFrom', { clientName: notification.clientName || '', rating: notification.rating ?? '' })}
        </span>
        {notification.employeeName && (
          <span className="block text-xs text-ink-muted mt-0.5 truncate">
            {t('notifications.newBookingMaster', { name: notification.employeeName })}
          </span>
        )}
      </span>
      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
    </button>
  );
};

export default ReviewNotificationRow;
