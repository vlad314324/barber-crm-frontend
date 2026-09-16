import { useNavigate } from 'react-router';
import { CalendarPlus } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { notificationApi } from '../api';
import type { Notification } from '../api/types';

interface BookingNotificationRowProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: () => void;
}

const BookingNotificationRow = ({ notification, onRead, onNavigate }: BookingNotificationRowProps) => {
  const { t, lang } = useLocale();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) {
      notificationApi.markRead(notification._id).catch(() => {});
      onRead(notification._id);
    }
    onNavigate();
    navigate(`/appointments?appointmentId=${notification.appointmentId}`);
  };

  const formattedDate = notification.date
    ? new Date(notification.date).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-canvas-soft transition-colors"
    >
      <span className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
        <CalendarPlus size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ink">{t('notifications.newBookingTitle')}</span>
        <span className="block text-xs text-ink-secondary mt-0.5 truncate">
          {t('notifications.newBookingWith', { clientName: notification.clientName || '', date: formattedDate, time: notification.startTime || '' })}
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

export default BookingNotificationRow;
