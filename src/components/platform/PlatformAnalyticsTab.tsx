import { useEffect, useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformAnalyticsOverview } from '../../api/platformApi';

const DAY_OPTIONS = [7, 30, 90] as const;

const healthBadgeClass = (score: number | null) => {
  if (score === null) return 'badge-muted';
  if (score >= 70) return 'badge-success';
  if (score >= 40) return 'badge-warning';
  return 'badge-danger';
};

const PlatformAnalyticsTab = () => {
  const { t } = useLocale();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<PlatformAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    platformAuthApi.getAnalyticsOverview(days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="ds-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">{t('platformAdmin.overviewTitle')}</h2>
        <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm">
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded-xs text-xs font-medium transition-colors ${
                days === d ? 'bg-surface text-brand-dark shadow-sm' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {t(`platformAdmin.days${d}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">{t('platformAdmin.loadingOverview')}</p>
      ) : !data || data.salons.length === 0 ? (
        <p className="text-sm text-ink-muted">{t('platformAdmin.noHealthData')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.platformTotalVisitsLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.platformTotals.totalVisits}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.platformTotalBookingsLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.platformTotals.totalBookings}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.platformCrmLoginsLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.platformTotals.crmLogins}</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-ink mb-3">{t('platformAdmin.salonsHealthTitle')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted border-b border-line">
                  <th className="pb-2 font-medium">{t('platformAdmin.tableName')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.tableHealthScore')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.totalVisitsLabel')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.totalBookingsLabel')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.tableCrmLoginsCol')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.tableCancellationRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.salons.map(s => (
                  <tr key={s.id}>
                    <td className="py-2 text-ink font-medium">{s.name}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${healthBadgeClass(s.healthScore)}`}>
                          {s.healthScore === null ? t('platformAdmin.healthScoreNoData') : s.healthScore}
                        </span>
                        {s.churnRisk && <span className="badge badge-danger">{t('platformAdmin.churnRiskBadge')}</span>}
                      </div>
                    </td>
                    <td className="py-2 text-ink-secondary">{s.totalVisits}</td>
                    <td className="py-2 text-ink-secondary">{s.totalBookings}</td>
                    <td className="py-2 text-ink-secondary">{s.crmLogins}</td>
                    <td className="py-2 text-ink-secondary">{Math.round(s.cancellationRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default PlatformAnalyticsTab;
