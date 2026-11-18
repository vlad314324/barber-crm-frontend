import { useNavigate } from 'react-router';
import { MessageSquarePlus, Check, X } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { notificationApi } from '../api';
import type { Notification } from '../api/types';

// Поля сповіщень про пропозиції майстрів (бекенд: models/Notification.js).
type RequestNotification = Notification & {
  serviceName?: string;
  requestStatus?: 'approved' | 'rejected';
  rejectReason?: string;
};

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: () => void;
}

// service_change_request — адміну: майстер запропонував свій опис/фото.
// service_change_reviewed — майстру: адмін схвалив або відхилив.
const ServiceRequestNotificationRow = ({ notification, onRead, onNavigate }: Props) => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const n = notification as RequestNotification;
  const reviewed = n.type === 'service_change_reviewed';
  const approved = n.requestStatus === 'approved';

  const handleClick = () => {
    if (!n.isRead) {
      notificationApi.markRead(n._id).catch(() => {});
      onRead(n._id);
    }
    onNavigate();
    navigate('/services');
  };

  const Icon = !reviewed ? MessageSquarePlus : approved ? Check : X;
  const tone = !reviewed
    ? 'bg-brand-extra-soft text-brand'
    : approved ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
      : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400';
  const title = !reviewed ? t('serviceRequests.notifNewTitle')
    : approved ? t('serviceRequests.notifApproved') : t('serviceRequests.notifRejected');
  const line = !reviewed
    ? t('serviceRequests.notifNewLine', { name: n.employeeName || '', service: n.serviceName || '' })
    : `${n.serviceName || ''}${!approved && n.rejectReason ? ` — ${n.rejectReason}` : ''}`;

  return (
    <button onClick={handleClick} className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-canvas-soft transition-colors">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tone}`}>
        <Icon size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-ink-secondary mt-0.5 line-clamp-2">{line}</span>
      </span>
      {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
    </button>
  );
};

export default ServiceRequestNotificationRow;
