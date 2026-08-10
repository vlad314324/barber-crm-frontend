import type { PlatformSalon } from '../api/platformApi';

export type SalonStatus = 'deactivated' | 'expired' | 'expiringSoon' | 'healthy' | 'noSubscription';

const EXPIRING_SOON_THRESHOLD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export const getSalonStatus = (salon: Pick<PlatformSalon, 'isActive' | 'subscriptionExpiresAt'>): SalonStatus => {
  if (!salon.isActive) return 'deactivated';
  if (!salon.subscriptionExpiresAt) return 'noSubscription';

  const daysLeft = Math.ceil((new Date(salon.subscriptionExpiresAt).getTime() - Date.now()) / DAY_MS);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= EXPIRING_SOON_THRESHOLD_DAYS) return 'expiringSoon';
  return 'healthy';
};

export const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / DAY_MS);
