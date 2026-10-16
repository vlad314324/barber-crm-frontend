import { useCallback } from 'react';
import { platformAuthApi } from '../../api/platformApi';
import BookingFunnelSection from '../charts/BookingFunnelSection';

interface SalonFunnelSectionProps {
  salonId: string;
}

// Воронка бронювання конкретного салону в картці платформного адміна.
const SalonFunnelSection = ({ salonId }: SalonFunnelSectionProps) => {
  const load = useCallback((days: number) => platformAuthApi.getSalonFunnelAnalytics(salonId, days), [salonId]);
  return <BookingFunnelSection load={load} />;
};

export default SalonFunnelSection;
