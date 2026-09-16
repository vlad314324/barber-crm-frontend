import { useNavigate } from 'react-router';
import { PartyPopper, ChevronRight } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { notificationApi } from '../api';
import type { Notification } from '../api/types';

interface OnboardingGuideCardProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: () => void;
}

const OnboardingGuideCard = ({ notification, onRead, onNavigate }: OnboardingGuideCardProps) => {
  const { t } = useLocale();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) {
      notificationApi.markRead(notification._id).catch(() => {});
      onRead(notification._id);
    }
    onNavigate();
    navigate('/onboarding');
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-canvas-soft transition-colors"
    >
      <span className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
        <PartyPopper size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ink">{t('onboarding.title')}</span>
        <span className="block text-xs text-ink-muted mt-0.5">{t('onboarding.subtitle')}</span>
      </span>
      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
      <ChevronRight size={16} className="text-ink-muted flex-shrink-0" />
    </button>
  );
};

export default OnboardingGuideCard;
