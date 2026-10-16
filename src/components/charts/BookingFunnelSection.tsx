import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
  ComposedChart, Area,
} from 'recharts';
import { useLocale } from '../../i18n/LocaleContext';
import type { PlatformSalonFunnelAnalytics } from '../../api/platformApi';
import DonutChart, { DonutSlice } from './DonutChart';
import {
  axisTick, tooltipProps, BRAND, GRID_STROKE, CATEGORICAL_COLORS, MAX_CATEGORIES, OTHER_COLOR,
} from './chartTheme';

const DAY_OPTIONS = [7, 30, 90] as const;

interface Props {
  load: (days: number) => Promise<PlatformSalonFunnelAnalytics>;
}

// Воронка публічної сторінки бронювання: KPI, проходження кроків, джерела
// переходів і денний тренд. Використовується у Звітах салону і в картці
// салону платформного адміна — дані ті самі, різниться лише джерело.
const BookingFunnelSection = ({ load }: Props) => {
  const { t, lang } = useLocale();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<PlatformSalonFunnelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load(days)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load, days]);

  const locale = lang === 'en' ? 'en-US' : 'uk-UA';
  const firstStep = data?.funnel[0]?.uniqueSessions || 0;
  const funnelChartData = (data?.funnel || []).map(f => ({
    step: t(`platformAdmin.funnelStep_${f.event}`),
    count: f.uniqueSessions,
    label: `${f.uniqueSessions} · ${firstStep > 0 ? Math.round((f.uniqueSessions / firstStep) * 100) : 0}%`,
  }));

  // Джерела: перші 5 — власним кольором, решта — в "Інші".
  const sources = data?.sourceBreakdown || [];
  const sourceName = (s: string) => (s === 'direct' ? t('platformAdmin.sourceDirect') : s);
  const head = sources.length > MAX_CATEGORIES ? sources.slice(0, MAX_CATEGORIES - 1) : sources;
  const restCount = sources.slice(head.length).reduce((sum, s) => sum + s.count, 0);
  const sourceSlices: DonutSlice[] = [
    ...head.map((s, i) => ({ name: sourceName(s.source), value: s.count, color: CATEGORICAL_COLORS[i] })),
    ...(restCount > 0 ? [{ name: t('reports.other'), value: restCount, color: OTHER_COLOR }] : []),
  ];

  const shortDate = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
  const longDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-ink">{t('platformAdmin.analyticsTitle')}</h3>
        <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm">
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded-xs text-xs font-medium whitespace-nowrap transition-colors ${
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              [t('platformAdmin.totalVisitsLabel'), data.totalVisits],
              [t('platformAdmin.uniqueVisitorsLabel'), data.uniqueVisitors],
              [t('platformAdmin.totalBookingsLabel'), data.totalBookings],
              [t('platformAdmin.conversionRateLabel'), `${Math.round(data.conversionRate * 100)}%`],
            ].map(([label, value]) => (
              <div key={label} className="bg-canvas-soft rounded-sm px-3 py-2.5">
                <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-ink mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Проходження кроків: скільки сесій дійшло до кожного і % від тих, хто відкрив сторінку */}
          <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('reports.funnelStepsTitle')}</h4>
          <div style={{ width: '100%', height: funnelChartData.length * 34 + 8 }}>
            <ResponsiveContainer>
              <BarChart data={funnelChartData} layout="vertical" margin={{ left: 0, right: 88, top: 0, bottom: 0 }} barCategoryGap={6}>
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="step" tick={{ ...axisTick, width: 400 }} width={124} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipProps} formatter={(v) => [Number(v), t('reports.sessions')]} />
                <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="label" position="right" style={{ fontSize: 11, fill: 'rgb(var(--color-ink-secondary))' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.submitFailedCount > 0 && (
            <p className="text-xs text-ink-muted mt-1">{t('platformAdmin.submitFailedLabel')}: {data.submitFailedCount}</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">{t('platformAdmin.sourceBreakdownTitle')}</h4>
              <DonutChart data={sourceSlices} centerValue={String(data.totalVisits)} centerLabel={t('platformAdmin.totalVisitsLabel')} />
            </div>

            {/* Денний тренд: переходи — область, бронювання — стовпчики, одна вісь (обидва — штуки) */}
            <div>
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">{t('platformAdmin.trendTitle', { days: data.dailyTrend.length })}</h4>
              <div className="flex items-center gap-4 text-xs text-ink-secondary mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-sm" style={{ background: 'var(--chart-2)', opacity: 0.35, outline: '1.5px solid var(--chart-2)' }} />
                  {t('platformAdmin.totalVisitsLabel')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-3 rounded-sm" style={{ background: BRAND }} />
                  {t('platformAdmin.totalBookingsLabel')}
                </span>
              </div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.dailyTrend} margin={{ left: -24, right: 4, top: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                    <XAxis dataKey="date" tick={axisTick} tickFormatter={shortDate} minTickGap={24} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
                    <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipProps} labelFormatter={(v) => longDate(String(v))} />
                    <Area type="monotone" dataKey="visits" name={t('platformAdmin.totalVisitsLabel')}
                      stroke="var(--chart-2)" strokeWidth={2} fill="var(--chart-2)" fillOpacity={0.15}
                      dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                    <Bar dataKey="bookings" name={t('platformAdmin.totalBookingsLabel')}
                      fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingFunnelSection;
