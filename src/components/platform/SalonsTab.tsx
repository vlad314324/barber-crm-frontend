import { useEffect, useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformSalon } from '../../api/platformApi';
import { getSalonStatus, daysUntil } from '../../utils/platformSalonStatus';
import SalonDetailModal from './SalonDetailModal';

type Filter = 'all' | 'healthy' | 'expiringSoon' | 'expired' | 'deactivated';

const FILTERS: Filter[] = ['all', 'healthy', 'expiringSoon', 'expired', 'deactivated'];

const SalonsTab = () => {
  const { t, lang } = useLocale();
  const [salons, setSalons] = useState<PlatformSalon[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<PlatformSalon | null>(null);

  const fetchSalons = () => {
    platformAuthApi.getSalons().then(setSalons).catch(() => setSalons([]));
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  const filterLabel: Record<Filter, string> = {
    all: t('platformAdmin.filterAll'),
    healthy: t('platformAdmin.filterHealthy'),
    expiringSoon: t('platformAdmin.filterExpiringSoon'),
    expired: t('platformAdmin.filterExpired'),
    deactivated: t('platformAdmin.filterDeactivated'),
  };

  const counts: Record<Filter, number> = {
    all: salons?.length || 0,
    healthy: 0, expiringSoon: 0, expired: 0, deactivated: 0,
  };
  (salons || []).forEach(s => {
    const status = getSalonStatus(s);
    if (status !== 'noSubscription') counts[status]++;
  });

  const visibleSalons = (salons || []).filter(s => {
    if (filter === 'all') return true;
    return getSalonStatus(s) === filter;
  });

  const StatusBadge = ({ salon }: { salon: PlatformSalon }) => {
    const status = getSalonStatus(salon);
    if (status === 'deactivated') return <span className="badge badge-danger">{t('platformAdmin.badgeDeactivated')}</span>;
    if (status === 'expired') return <span className="badge badge-danger">{t('platformAdmin.badgeExpired')}</span>;
    if (status === 'expiringSoon') return <span className="badge badge-warning">{t('platformAdmin.badgeExpiringSoon', { days: daysUntil(salon.subscriptionExpiresAt!) })}</span>;
    if (status === 'healthy') return <span className="badge badge-success">{t('platformAdmin.badgeHealthy')}</span>;
    return <span className="badge badge-muted">{t('platformAdmin.badgeNoSubscription')}</span>;
  };

  const handleSalonUpdated = (updated: PlatformSalon) => {
    setSalons(prev => (prev || []).map(s => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  };

  return (
    <div className="ds-card p-6">
      <h2 className="text-lg font-bold text-ink mb-4">{t('platformAdmin.salonsTitle')}</h2>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? 'bg-brand text-white' : 'bg-canvas-soft text-ink-secondary hover:text-ink'
            }`}
          >
            {filterLabel[f]} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-line">
              <th className="pb-2 font-medium">{t('platformAdmin.tableName')}</th>
              <th className="pb-2 font-medium">{t('platformAdmin.tableSlug')}</th>
              <th className="pb-2 font-medium">{t('platformAdmin.tableOwner')}</th>
              <th className="pb-2 font-medium">{t('platformAdmin.tableStatus')}</th>
              <th className="pb-2 font-medium">{t('platformAdmin.tableRegistered')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visibleSalons.map(s => (
              <tr key={s.id} onClick={() => setSelected(s)} className="cursor-pointer hover:bg-canvas-soft">
                <td className="py-2 text-ink font-medium">{s.name}</td>
                <td className="py-2 text-ink-muted">{s.slug}</td>
                <td className="py-2 text-ink-secondary">{s.ownerEmail}</td>
                <td className="py-2"><StatusBadge salon={s} /></td>
                <td className="py-2 text-ink-muted">{new Date(s.createdAt).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US')}</td>
              </tr>
            ))}
            {salons && visibleSalons.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-ink-muted">{t('platformAdmin.noSalons')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <SalonDetailModal salon={selected} onClose={() => setSelected(null)} onUpdated={handleSalonUpdated} />
      )}
    </div>
  );
};

export default SalonsTab;
