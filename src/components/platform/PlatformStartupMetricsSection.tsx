import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformStartupMetrics, RetentionWeekOffset } from '../../api/platformApi';

const WEEK_OPTIONS = [8, 12, 26] as const;
const RETENTION_OFFSETS: RetentionWeekOffset[] = ['1', '4', '12'];
const axisTick = { fontSize: 11, fill: 'rgb(var(--color-ink-muted))' };

const pctCellClass = (pct: number | null) => {
  if (pct === null) return 'bg-canvas-soft text-ink-muted';
  if (pct >= 0.7) return 'bg-brand-soft text-brand-dark';
  if (pct >= 0.4) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-600';
};

const formatPct = (pct: number | null) => (pct === null ? '—' : `${Math.round(pct * 100)}%`);

const PlatformStartupMetricsSection = () => {
  const { t } = useLocale();
  const [weeks, setWeeks] = useState<number>(12);
  const [data, setData] = useState<PlatformStartupMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    platformAuthApi.getStartupMetrics(weeks)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [weeks]);

  const chartData = (data?.northStar || []).map(w => ({ week: w.weekStart.slice(5), bookings: w.bookings }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{t('platformAdmin.startupMetricsTitle')}</h3>
        <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm">
          {WEEK_OPTIONS.map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setWeeks(w)}
              className={`px-2.5 py-1 rounded-xs text-xs font-medium transition-colors ${
                weeks === w ? 'bg-surface text-brand-dark shadow-sm' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {t(`platformAdmin.weeks${w}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">{t('platformAdmin.loadingOverview')}</p>
      ) : !data ? (
        <p className="text-sm text-ink-muted">{t('platformAdmin.noStartupData')}</p>
      ) : (
        <>
          <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('platformAdmin.northStarTitle')}</h4>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgb(var(--color-line))" />
                <XAxis dataKey="week" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="bookings" stroke="rgb(var(--color-brand))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.activationTitle')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">
                {data.activation.rate === null ? t('platformAdmin.noSampleData') : `${Math.round(data.activation.rate * 100)}%`}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">{t('platformAdmin.activationSampleLabel', { activated: data.activation.activatedCount, eligible: data.activation.eligibleCount })}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.timeToFirstBookingTitle')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">
                {data.timeToFirstBooking.medianDays === null ? t('platformAdmin.noSampleData') : t('platformAdmin.timeToFirstBookingMedianLabel', { days: data.timeToFirstBooking.medianDays })}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">{t('platformAdmin.timeToFirstBookingSampleLabel', { count: data.timeToFirstBooking.sampleSize })}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.churnRateTitle')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">
                {data.churn.rate === null ? t('platformAdmin.noSampleData') : `${Math.round(data.churn.rate * 100)}%`}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">{t('platformAdmin.churnSampleLabel', { churned: data.churn.churnedCount, active: data.churn.everActiveCount })}</p>
            </div>
          </div>

          <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mt-6 mb-2">{t('platformAdmin.retentionTitle')}</h4>
          {data.cohortTable.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('platformAdmin.noCohortData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-muted border-b border-line">
                    <th className="pb-2 font-medium">{t('platformAdmin.cohortTableWeekCol')}</th>
                    <th className="pb-2 font-medium">{t('platformAdmin.cohortTableSalonsCol')}</th>
                    <th className="pb-2 font-medium">{t('platformAdmin.retentionWeek1')}</th>
                    <th className="pb-2 font-medium">{t('platformAdmin.retentionWeek4')}</th>
                    <th className="pb-2 font-medium">{t('platformAdmin.retentionWeek12')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.cohortTable.map(row => (
                    <tr key={row.cohortWeekStart}>
                      <td className="py-2 text-ink-secondary">{row.cohortWeekStart}</td>
                      <td className="py-2 text-ink-secondary">{row.salonCount}</td>
                      {RETENTION_OFFSETS.map(offset => (
                        <td key={offset} className="py-1.5">
                          <span className={`inline-block px-2 py-1 rounded-xs text-xs font-medium ${pctCellClass(row.retention[offset])}`}>
                            {formatPct(row.retention[offset])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlatformStartupMetricsSection;
