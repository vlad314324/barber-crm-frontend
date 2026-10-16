import { useState, useEffect, useCallback, ReactNode } from 'react';
import { BarChart2, TrendingUp, Scissors, User, RefreshCw, Users, CalendarDays, ListChecks, Info } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import api from '../api';
import type { PlatformSalonFunnelAnalytics } from '../api/platformApi';
import DonutChart, { DonutSlice } from '../components/charts/DonutChart';
import BookingFunnelSection from '../components/charts/BookingFunnelSection';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  axisTick, tooltipProps, BRAND, GRID_STROKE, CATEGORICAL_COLORS, MAX_CATEGORIES, OTHER_COLOR, compactNumber,
} from '../components/charts/chartTheme';
import { useLocale } from '../i18n/LocaleContext';
import { useShopCurrency } from '../context/SettingsContext';
import { formatPrice } from '../utils/money';
import { getCurrencySymbol } from '../constants/currencies';

interface RevenueByMonth { month: string; amount: number; }
interface ServicePerformance { name: string; count: number; revenue: number; }
interface EmpPerformance { name: string; appointments: number; revenue: number; rating: number; }
type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';
interface DashboardData {
  totalRevenue: number;
  monthRevenue: number;
  totalAppointments: number;
  monthAppointments: number;
  totalClients: number;
  avgServiceValue: number;
  revenueByMonth: RevenueByMonth[];
  servicePerformance: ServicePerformance[];
  empPerformance: EmpPerformance[];
  appointmentsByWeekday?: number[];
  appointmentsByStatus?: Record<AppointmentStatus, number>;
}

interface ForecastSeriesPoint { date: string; count: number; }
interface ForecastPoint { date: string; isoDate?: string; predicted: number; }
interface ForecastData {
  sma: number;
  mae: number;
  series: ForecastSeriesPoint[];
  forecast: ForecastPoint[];
}

interface RfmSegmentSummary { segment: string; count: number; revenue: number; }
interface RfmClientRow {
  clientId: string;
  name: string;
  R: number;
  F: number;
  M: number;
  rfm: number;
  segment: string;
}
interface RfmData { summary: RfmSegmentSummary[]; segments: RfmClientRow[]; }

const SEGMENT_COLORS: Record<string, string> = {
  Champions:       'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  Loyal:           'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  'At Risk':       'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  Lost:            'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  'New Customers': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  Promising:       'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
};

const SEGMENT_KEY: Record<string, string> = {
  Champions: 'Champions',
  Loyal: 'Loyal',
  'At Risk': 'AtRisk',
  Lost: 'Lost',
  'New Customers': 'NewCustomers',
  Promising: 'Promising',
};

const BAR_HEIGHT = 128; // px — висота зони графіку (вкладка прогнозу)

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const STATUS_ORDER: AppointmentStatus[] = ['Completed', 'Scheduled', 'Cancelled', 'No-show'];
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  Completed: 'var(--status-completed)',
  Scheduled: 'var(--status-scheduled)',
  Cancelled: 'var(--status-cancelled)',
  'No-show': 'var(--status-noshow)',
};

const ChartCard = ({ icon, title, sub, children }: { icon: ReactNode; title: string; sub?: string; children: ReactNode }) => (
  <div className="ds-card p-6">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-ink flex items-center gap-2">{icon} {title}</h3>
      {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
    </div>
    {children}
  </div>
);

const Reports = () => {
  const { t, lang } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const currency = useShopCurrency();
  const locale = lang === 'en' ? 'en-US' : 'uk-UA';
  const loadFunnel = useCallback(
    async (days: number) => (await api.get<PlatformSalonFunnelAnalytics>('/analytics/funnel', { params: { days } })).data,
    [],
  );
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [forecast,  setForecast]  = useState<ForecastData | null>(null);
  const [rfm,       setRfm]       = useState<RfmData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'rfm'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [forecastInfoOpen, setForecastInfoOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setSelectedSegment(null);
    try {
      // Майстру — лише власна статистика (огляд і прогноз); RFM — адміну.
      const [d, f, r] = await Promise.all([
        api.get<DashboardData>('/analytics/dashboard'),
        api.get<ForecastData>('/analytics/forecast'),
        isAdmin ? api.get<RfmData>('/analytics/rfm') : Promise.resolve(null),
      ]);
      setDashboard(d.data);
      setForecast(f.data);
      setRfm(r?.data ?? null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [isAdmin]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const segmentLabel = (s: string) => t(`reports.segment${SEGMENT_KEY[s] || 'Champions'}`);
  const segmentDesc = (s: string) => t(`reports.segment${SEGMENT_KEY[s] || 'Champions'}Desc`);

  if (loading) return <div className="text-center py-16 text-ink-muted">{t('common.loading')}</div>;

  const weekdayData = WEEKDAY_KEYS.map((key, i) => ({
    day: t(`reports.weekday_${key}`),
    count: dashboard?.appointmentsByWeekday?.[i] || 0,
  }));
  const busiestCount = Math.max(...weekdayData.map(d => d.count));

  const statusCounts = dashboard?.appointmentsByStatus;
  const statusSlices: DonutSlice[] = STATUS_ORDER.map(st => ({
    name: t(`statuses.${st}`), value: statusCounts?.[st] || 0, color: STATUS_COLORS[st],
  }));
  const statusTotal = statusSlices.reduce((sum, d) => sum + d.value, 0);

  // Частка виручки по майстрах: перші 5 — власним кольором, решта — "Інші".
  const masterSlices = (emps: EmpPerformance[]): DonutSlice[] => {
    const sorted = [...emps].sort((a, b) => b.revenue - a.revenue);
    const head = sorted.length > MAX_CATEGORIES ? sorted.slice(0, MAX_CATEGORIES - 1) : sorted;
    const rest = sorted.slice(head.length).reduce((sum, e) => sum + e.revenue, 0);
    return [
      ...head.map((e, i) => ({ name: e.name, value: e.revenue, color: CATEGORICAL_COLORS[i] })),
      ...(rest > 0 ? [{ name: t('reports.other'), value: rest, color: OTHER_COLOR }] : []),
    ];
  };

  // "сб, 17 жовт." / "Sat, Oct 17" — мовою інтерфейсу, а не сервера.
  const forecastDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

  const maxForecast = forecast  ? Math.max(...(forecast.forecast || []).map((d) => d.predicted), 1) : 1;
  const maxSeries   = forecast  ? Math.max(...(forecast.series   || []).map((d) => d.count),    1) : 1;

  const barPx = (val: number, max: number) =>
    val === 0 ? 3 : Math.max(Math.round((val / max) * BAR_HEIGHT), 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight flex items-center">
            <BarChart2 size={24} className="mr-2 text-brand flex-shrink-0"/>
            <span className="truncate">{t('reports.title')}</span>
          </h1>
          <p className="text-ink-muted text-sm mt-0.5">{isAdmin ? t('reports.subtitle') : t('reports.subtitleBarber')}</p>
        </div>
        <button onClick={fetchAll} className="btn btn-secondary flex-shrink-0">
          <RefreshCw size={14}/> <span className="hidden sm:inline">{t('reports.refresh')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm w-fit">
        {([['overview',t('reports.tabOverview')],['forecast',t('reports.tabForecast')],['rfm',t('reports.tabRfm')]] as const)
          .filter(([tab]) => isAdmin || tab !== 'rfm').map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xs text-sm font-medium transition-all
              ${activeTab === tab ? 'bg-surface text-brand-dark shadow-sm' : 'text-ink-secondary hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: t('reports.totalRevenue'),  value: formatPrice(dashboard.totalRevenue, currency), sub: t('reports.totalRevenueSub', { value: formatPrice(dashboard.monthRevenue, currency) }) },
              { title: t('reports.totalAppointments'),    value: dashboard.totalAppointments,                  sub: t('reports.totalAppointmentsSub', { value: dashboard.monthAppointments }) },
              { title: t('reports.totalClients'),          value: dashboard.totalClients,                       sub: isAdmin ? t('reports.totalClientsSub') : t('reports.totalClientsSubBarber') },
              { title: t('reports.avgCheck'),      value: formatPrice(dashboard.avgServiceValue, currency),              sub: t('reports.avgCheckSub') },
            ].map((c, i) => (
              <div key={i} className="ds-card p-5">
                <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{c.title}</p>
                <p className="text-3xl font-bold mt-1 text-ink tracking-tight">{c.value}</p>
                <p className="text-xs text-ink-muted mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Виручка по місяцях */}
          <ChartCard icon={<TrendingUp size={18} className="text-brand"/>} title={t('reports.revenueChartTitle')}>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={dashboard.revenueByMonth} margin={{ left: -8, right: 4, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56}
                    tickFormatter={(v: number) => compactNumber(v, locale)} />
                  <Tooltip {...tooltipProps} formatter={(v) => [formatPrice(Number(v), currency), t('reports.tableRevenue')]} />
                  <Bar dataKey="amount" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Послуги: виручка по послугах + таблиця */}
            <div className="ds-card overflow-hidden">
              <div className="ds-card-header">
                <div className="flex items-center gap-2">
                  <Scissors size={18} className="text-brand"/>
                  <h3 className="text-base font-semibold text-ink">{t('reports.popularServicesTitle')}</h3>
                </div>
              </div>
              {dashboard.servicePerformance.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center text-ink-muted">{t('common.noData')}</p>
              ) : (
                <>
                <div className="px-5 pt-4">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('reports.revenueByServiceTitle')}</p>
                  <div style={{ width: '100%', height: dashboard.servicePerformance.length * 30 + 8 }}>
                    <ResponsiveContainer>
                      <BarChart data={[...dashboard.servicePerformance].sort((a, b) => b.revenue - a.revenue)}
                        layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }} barCategoryGap={5}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{ ...axisTick, width: 400 }} width={176} axisLine={false} tickLine={false}
                          tickFormatter={(v: string) => (v.length > 26 ? `${v.slice(0, 25)}…` : v)} />
                        <Tooltip {...tooltipProps} formatter={(v) => [formatPrice(Number(v), currency), t('reports.tableRevenue')]} />
                        <Bar dataKey="revenue" fill={BRAND} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="overflow-x-auto mt-3">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="px-5 py-2 text-left font-medium">{t('reports.tableService')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('reports.tableAppointments')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('reports.tableRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {dashboard.servicePerformance.map((s, i) => (
                      <tr key={i} className="hover:bg-canvas-soft transition-colors">
                        <td className="px-5 py-3 text-sm text-ink">{s.name}</td>
                        <td className="px-5 py-3 text-sm text-ink-secondary text-right">{s.count}</td>
                        <td className="px-5 py-3 text-sm font-medium text-brand-dark text-right">{formatPrice(s.revenue, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                </>
              )}
            </div>

            {/* Права колонка: майстри, дні тижня, статуси — щоб не лишати
                порожнього місця поруч із довгою карткою послуг */}
            <div className="space-y-6">
            {/* Майстри: частка виручки + таблиця (порівняння майстрів — лише адміну) */}
            {isAdmin && (
            <div className="ds-card overflow-hidden">
              <div className="ds-card-header">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-brand"/>
                  <h3 className="text-base font-semibold text-ink">{t('reports.employeePerformanceTitle')}</h3>
                </div>
              </div>
              {dashboard.empPerformance.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center text-ink-muted">{t('common.noData')}</p>
              ) : (
                <>
                <div className="px-5 pt-4">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">{t('reports.revenueShareTitle')}</p>
                  <DonutChart
                    data={masterSlices(dashboard.empPerformance)}
                    formatValue={v => formatPrice(v, currency)}
                    centerValue={formatPrice(dashboard.empPerformance.reduce((sum, e) => sum + e.revenue, 0), currency)}
                    centerLabel={t('reports.tableRevenue')}
                  />
                </div>
                <div className="overflow-x-auto mt-4">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="px-5 py-2 text-left font-medium">{t('reports.tableMaster')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('reports.tableAppointments')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('reports.tableRevenue')}</th>
                      <th className="px-5 py-2 text-right font-medium">{t('reports.tableRating')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {dashboard.empPerformance.map((e, i) => (
                      <tr key={i} className="hover:bg-canvas-soft transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-ink">{e.name}</td>
                        <td className="px-5 py-3 text-sm text-ink-secondary text-right">{e.appointments}</td>
                        <td className="px-5 py-3 text-sm font-medium text-brand-dark text-right">{formatPrice(e.revenue, currency)}</td>
                        <td className="px-5 py-3 text-sm text-amber-500 text-right">
                          {e.rating > 0 ? `⭐ ${e.rating}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                </>
              )}
            </div>
            )}

            {/* Завантаженість по днях тижня */}
            <ChartCard icon={<CalendarDays size={18} className="text-brand"/>} title={t('reports.weekdayTitle')} sub={t('reports.weekdaySub')}>
              {busiestCount === 0 ? (
                <p className="py-8 text-sm text-center text-ink-muted">{t('common.noData')}</p>
              ) : (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={weekdayData} margin={{ left: -24, right: 4, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                      <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
                      <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipProps} formatter={(v) => [Number(v), t('reports.tableAppointments')]} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                        {/* Найзавантаженіший день — темнішим відтінком того ж кольору */}
                        {weekdayData.map(d => (
                          <Cell key={d.day} fill={d.count === busiestCount ? 'rgb(var(--color-brand-dark))' : BRAND} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            {/* Статуси записів */}
            <ChartCard icon={<ListChecks size={18} className="text-brand"/>} title={t('reports.statusTitle')} sub={t('reports.statusSub')}>
              {statusTotal === 0 ? (
                <p className="py-8 text-sm text-center text-ink-muted">{t('common.noData')}</p>
              ) : (
                <DonutChart data={statusSlices} centerValue={String(statusTotal)} centerLabel={t('reports.statusCenterLabel')} />
              )}
            </ChartCard>
            </div>
          </div>

          {/* Воронка публічної сторінки бронювання — дані всього салону, лише адміну */}
          {isAdmin && (
          <div className="ds-card p-6">
            <BookingFunnelSection load={loadFunnel} />
            <p className="text-xs text-ink-muted mt-4">{t('reports.funnelHint')}</p>
          </div>
          )}
        </div>
      )}

      {/* ── FORECAST ── */}
      {activeTab === 'forecast' && forecast && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-ink-secondary">{t('reports.forecastIntro')}</p>
            <button type="button" onClick={() => setForecastInfoOpen(true)} className="btn btn-secondary shrink-0 self-start sm:self-auto">
              <Info size={16}/> {t('reports.infoBtn')}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="ds-card p-5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('reports.smaTitle')}</p>
              <p className="text-3xl font-bold text-brand-dark mt-1 tracking-tight">{forecast.sma}</p>
              <p className="text-xs text-ink-muted mt-1">{t('reports.smaSub')}</p>
            </div>
            <div className="ds-card p-5">
              <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('reports.maeTitle')}</p>
              <p className="text-3xl font-bold text-brand-dark mt-1 tracking-tight">{forecast.mae}</p>
              <p className="text-xs text-ink-muted mt-1">{t('reports.maeSub')}</p>
            </div>
          </div>

          {/* Historical */}
          <div className="ds-card p-6">
            <h3 className="text-base font-semibold text-ink mb-1">{t('reports.historicalTitle')}</h3>
            <p className="text-xs text-ink-muted mb-4">{t('reports.historicalSub')}</p>
            <div className="flex items-end gap-1" style={{ height: `${BAR_HEIGHT + 32}px` }}>
              {forecast.series.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                  <span className="text-xs text-ink-secondary font-medium">{d.count > 0 ? d.count : ''}</span>
                  <div
                    className="w-full bg-brand/70 hover:bg-brand rounded-t transition-colors"
                    style={{ height: `${barPx(d.count, maxSeries)}px` }}
                  />
                  <span className="text-ink-muted text-center leading-tight" style={{ fontSize: '9px' }}>
                    {`${d.date.slice(8, 10)}.${d.date.slice(5, 7)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast */}
          <div className="ds-card p-6">
            <h3 className="text-base font-semibold text-ink mb-1">{t('reports.forecastTitle')}</h3>
            <p className="text-xs text-ink-muted mb-4">{t('reports.forecastSub')}</p>
            <div className="flex items-end gap-2" style={{ height: `${BAR_HEIGHT + 48}px` }}>
              {forecast.forecast.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-sm font-semibold text-ink-secondary">{d.predicted}</span>
                  <div
                    className="w-full bg-brand-dark/80 hover:bg-brand-dark rounded-t transition-colors"
                    style={{ height: `${barPx(d.predicted, maxForecast)}px` }}
                  />
                  <span className="text-xs text-ink-muted text-center leading-tight">{d.isoDate ? forecastDate(d.isoDate) : d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={forecastInfoOpen} onClose={() => setForecastInfoOpen(false)} title={t('reports.forecastInfoTitle')} size="lg">
        <div className="space-y-5 text-sm text-ink-secondary leading-relaxed">
          <section>
            <h4 className="text-sm font-semibold text-ink mb-2">{t('reports.infoWhatTitle')}</h4>
            <ul className="space-y-1.5 list-disc pl-5">
              {([['smaTitle', 'infoWhatSma'], ['maeTitle', 'infoWhatMae'], ['historicalTitle', 'infoWhatHistory'], ['forecastTitle', 'infoWhatForecast']] as const).map(([term, text]) => (
                <li key={term}><span className="font-medium text-ink">{t(`reports.${term}`)}</span> — {t(`reports.${text}`)}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="text-sm font-semibold text-ink mb-2">{t('reports.infoHowTitle')}</h4>
            <ul className="space-y-1.5 list-disc pl-5">
              {(['infoHow1', 'infoHow2', 'infoHow3'] as const).map(k => <li key={k}>{t(`reports.${k}`)}</li>)}
            </ul>
          </section>
          <section>
            <h4 className="text-sm font-semibold text-ink mb-2">{t('reports.infoUseTitle')}</h4>
            <ul className="space-y-1.5 list-disc pl-5">
              {(['infoUse1', 'infoUse2', 'infoUse3', 'infoUse4'] as const).map(k => <li key={k}>{t(`reports.${k}`)}</li>)}
            </ul>
          </section>
          <p className="text-xs text-ink-muted bg-canvas-soft rounded-sm px-3 py-2">{t('reports.infoNote')}</p>
        </div>
      </Modal>

      {/* ── RFM ── */}
      {activeTab === 'rfm' && rfm && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rfm.summary.map((s) => {
              const isSelected = selectedSegment === s.segment;
              return (
                <button
                  key={s.segment}
                  type="button"
                  onClick={() => setSelectedSegment(prev => (prev === s.segment ? null : s.segment))}
                  aria-pressed={isSelected}
                  className={`text-left rounded-lg border p-4 transition-shadow cursor-pointer hover:shadow-md
                    ${SEGMENT_COLORS[s.segment] || 'bg-canvas-soft text-ink-secondary border-line'}
                    ${isSelected ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{segmentLabel(s.segment)}</p>
                      <p className="text-xs opacity-75 mt-0.5">{segmentDesc(s.segment)}</p>
                    </div>
                    <span className="text-2xl font-bold">{s.count}</span>
                  </div>
                  <p className="text-xs mt-2 opacity-75">{t('reports.revenueLabel')}: {formatPrice(s.revenue, currency)}</p>
                </button>
              );
            })}
          </div>

          {selectedSegment && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-secondary">{t('reports.filteredBySegment', { segment: segmentLabel(selectedSegment) })}</span>
              <button onClick={() => setSelectedSegment(null)} className="text-brand hover:text-brand-dark font-medium">
                {t('reports.clearFilter')}
              </button>
            </div>
          )}

          {rfm.summary.length === 0 && (
            <div className="ds-card p-8 text-center">
              <Users size={32} className="mx-auto text-line-medium mb-2"/>
              <p className="text-ink-secondary">{t('reports.rfmInsufficientData')}</p>
              <p className="text-sm text-ink-muted mt-1">{t('reports.rfmInsufficientDataSub')}</p>
            </div>
          )}

          {rfm.segments.length > 0 && (
            <div className="ds-card overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <h3 className="text-base font-semibold text-ink">{t('reports.rfmDetailsTitle')}</h3>
                <p className="text-xs text-ink-muted mt-0.5">{t('reports.rfmDetailsSub', { currency: getCurrencySymbol(currency) })}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      {[t('reports.tableClient'),'R','F','M','RFM',t('reports.tableSegment')].map(h => (
                        <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {(selectedSegment ? rfm.segments.filter(c => c.segment === selectedSegment) : rfm.segments).map((c) => (
                      <tr key={c.clientId} className="hover:bg-canvas-soft transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-ink">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-ink-secondary">{c.R}{t('reports.daysShort')}</td>
                        <td className="px-4 py-3 text-sm text-ink-secondary">{c.F}</td>
                        <td className="px-4 py-3 text-sm text-ink-secondary">{formatPrice(c.M, currency)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-brand-dark">{c.rfm}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                            ${SEGMENT_COLORS[c.segment] || 'bg-canvas-soft text-ink-secondary border-line'}`}>
                            {segmentLabel(c.segment)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;