import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformSalonUsageAnalytics } from '../../api/platformApi';

const DAY_OPTIONS = [7, 30, 90] as const;
const axisTick = { fontSize: 11, fill: 'rgb(var(--color-ink-muted))' };
const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'rgb(var(--color-brand))',
  Completed: 'rgb(var(--color-brand-dark))',
  Cancelled: 'rgb(var(--color-line))',
  'No-show': 'rgb(var(--color-ink-muted))',
};

interface SalonUsageSectionProps {
  salonId: string;
}

const SalonUsageSection = ({ salonId }: SalonUsageSectionProps) => {
  const { t } = useLocale();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<PlatformSalonUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    platformAuthApi.getSalonUsageAnalytics(salonId, days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [salonId, days]);

  const hourChartData = (data?.hourHistogram || []).map((count, hour) => ({ hour, count }));
  const statusChartData = data
    ? (Object.keys(STATUS_COLORS) as Array<keyof typeof STATUS_COLORS>).map(status => ({
        status: t(`statuses.${status}`),
        count: data.bookingsByStatus[status as 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show'],
        color: STATUS_COLORS[status],
      }))
    : [];
  const sourceChartData = data
    ? [
        { source: t('platformAdmin.sourcePublic'), count: data.bookingsBySource.public },
        { source: t('platformAdmin.sourceAdmin'), count: data.bookingsBySource.admin },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{t('platformAdmin.usageTitle')}</h3>
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
        <p className="text-sm text-ink-muted">{t('platformAdmin.loadingUsage')}</p>
      ) : !data || data.loginCount === 0 ? (
        <p className="text-sm text-ink-muted">{t('platformAdmin.noUsageData')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.loginCountLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.loginCount}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.activeDaysLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.activeDaysCount}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.totalActiveMinutesLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.totalActiveMinutes}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.avgSessionMinutesLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.avgSessionMinutes}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('platformAdmin.hourHistogramTitle')}</h4>
            <div style={{ width: '100%', height: 120 }}>
              <ResponsiveContainer>
                <BarChart data={hourChartData} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgb(var(--color-line))" />
                  <XAxis dataKey="hour" tick={axisTick} interval={1} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="rgb(var(--color-brand))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('platformAdmin.bookingsBySourceTitle')}</h4>
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer>
                  <BarChart data={sourceChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke="rgb(var(--color-line))" />
                    <XAxis type="number" tick={axisTick} allowDecimals={false} />
                    <YAxis type="category" dataKey="source" tick={axisTick} width={90} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="rgb(var(--color-brand))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('platformAdmin.bookingsByStatusTitle')}</h4>
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer>
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke="rgb(var(--color-line))" />
                    <XAxis type="number" tick={axisTick} allowDecimals={false} />
                    <YAxis type="category" dataKey="status" tick={axisTick} width={90} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                      {statusChartData.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalonUsageSection;
