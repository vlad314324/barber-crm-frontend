import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformSalonFunnelAnalytics, BookingFunnelStep } from '../../api/platformApi';

const DAY_OPTIONS = [7, 30, 90] as const;
const FUNNEL_STEPS: BookingFunnelStep[] = ['page_view', 'master_selected', 'service_selected', 'slot_selected', 'contacts_entered', 'submit_success'];
const PIE_COLORS = ['rgb(var(--color-brand))', 'rgb(var(--color-brand-dark))', 'rgb(var(--color-line))', 'rgb(var(--color-ink-muted))', 'rgb(var(--color-canvas-soft))'];

const axisTick = { fontSize: 11, fill: 'rgb(var(--color-ink-muted))' };

interface SalonFunnelSectionProps {
  salonId: string;
}

const SalonFunnelSection = ({ salonId }: SalonFunnelSectionProps) => {
  const { t } = useLocale();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<PlatformSalonFunnelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    platformAuthApi.getSalonFunnelAnalytics(salonId, days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [salonId, days]);

  const funnelChartData = (data?.funnel || []).map(f => ({
    step: t(`platformAdmin.funnelStep_${f.event}`),
    count: f.uniqueSessions,
  }));

  const sourceChartData = (data?.sourceBreakdown || []).map(s => ({
    name: s.source === 'direct' ? t('platformAdmin.sourceDirect') : s.source,
    value: s.count,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{t('platformAdmin.analyticsTitle')}</h3>
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
        <p className="text-sm text-ink-muted">{t('platformAdmin.loadingAnalytics')}</p>
      ) : !data || data.totalVisits === 0 ? (
        <p className="text-sm text-ink-muted">{t('platformAdmin.noAnalyticsData')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.totalVisitsLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.totalVisits}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.uniqueVisitorsLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.uniqueVisitors}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.totalBookingsLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{data.totalBookings}</p>
            </div>
            <div className="bg-canvas-soft rounded-sm px-3 py-2.5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('platformAdmin.conversionRateLabel')}</p>
              <p className="text-xl font-bold text-ink mt-0.5">{Math.round(data.conversionRate * 100)}%</p>
            </div>
          </div>

          {/* Воронка — drop-off по кроках (уникальні сесії на кожному кроці) */}
          <div style={{ width: '100%', height: FUNNEL_STEPS.length * 32 + 20 }}>
            <ResponsiveContainer>
              <BarChart data={funnelChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="rgb(var(--color-line))" />
                <XAxis type="number" tick={axisTick} allowDecimals={false} />
                <YAxis type="category" dataKey="step" tick={axisTick} width={110} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="rgb(var(--color-brand))" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.submitFailedCount > 0 && (
            <p className="text-xs text-ink-muted mt-1">{t('platformAdmin.submitFailedLabel')}: {data.submitFailedCount}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {/* Джерела переходів */}
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('platformAdmin.sourceBreakdownTitle')}</h4>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sourceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {sourceChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Денний тренд: переходи vs бронювання */}
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('platformAdmin.trendTitle', { days })}</h4>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <BarChart data={data.dailyTrend} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgb(var(--color-line))" />
                    <XAxis dataKey="date" tick={axisTick} tickFormatter={(v: string) => v.slice(8, 10)} />
                    <YAxis tick={axisTick} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="visits" fill="rgb(var(--color-line))" name={t('platformAdmin.totalVisitsLabel')} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="bookings" fill="rgb(var(--color-brand))" name={t('platformAdmin.totalBookingsLabel')} radius={[2, 2, 0, 0]} />
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

export default SalonFunnelSection;
