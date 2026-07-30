import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Scissors, User, RefreshCw, Users } from 'lucide-react';
import api from '../api';
import { useLocale } from '../i18n/LocaleContext';

interface RevenueByMonth { month: string; amount: number; }
interface ServicePerformance { name: string; count: number; revenue: number; }
interface EmpPerformance { name: string; appointments: number; revenue: number; rating: number; }
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
}

interface ForecastSeriesPoint { date: string; count: number; }
interface ForecastPoint { date: string; predicted: number; }
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

const BAR_HEIGHT = 128; // px — висота зони графіку

const Reports = () => {
  const { t } = useLocale();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [forecast,  setForecast]  = useState<ForecastData | null>(null);
  const [rfm,       setRfm]       = useState<RfmData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'rfm'>('overview');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, f, r] = await Promise.all([
        api.get<DashboardData>('/analytics/dashboard'),
        api.get<ForecastData>('/analytics/forecast'),
        api.get<RfmData>('/analytics/rfm'),
      ]);
      setDashboard(d.data);
      setForecast(f.data);
      setRfm(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const segmentLabel = (s: string) => t(`reports.segment${SEGMENT_KEY[s] || 'Champions'}`);
  const segmentDesc = (s: string) => t(`reports.segment${SEGMENT_KEY[s] || 'Champions'}Desc`);

  if (loading) return <div className="text-center py-16 text-ink-muted">{t('common.loading')}</div>;

  const maxRev      = dashboard ? Math.max(...dashboard.revenueByMonth.map((d) => d.amount), 1) : 1;
  const maxForecast = forecast  ? Math.max(...(forecast.forecast || []).map((d) => d.predicted), 1) : 1;
  const maxSeries   = forecast  ? Math.max(...(forecast.series   || []).map((d) => d.count),    1) : 1;

  const barPx = (val: number, max: number) =>
    val === 0 ? 3 : Math.max(Math.round((val / max) * BAR_HEIGHT), 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center">
            <BarChart2 size={24} className="mr-2 text-brand"/>
            {t('reports.title')}
          </h1>
          <p className="text-ink-muted text-sm mt-0.5">{t('reports.subtitle')}</p>
        </div>
        <button onClick={fetchAll} className="btn btn-secondary">
          <RefreshCw size={14}/> {t('reports.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm w-fit">
        {([['overview',t('reports.tabOverview')],['forecast',t('reports.tabForecast')],['rfm',t('reports.tabRfm')]] as const).map(([tab, label]) => (
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: t('reports.totalRevenue'),  value: `$${dashboard.totalRevenue.toLocaleString()}`, sub: t('reports.totalRevenueSub', { value: dashboard.monthRevenue }) },
              { title: t('reports.totalAppointments'),    value: dashboard.totalAppointments,                  sub: t('reports.totalAppointmentsSub', { value: dashboard.monthAppointments }) },
              { title: t('reports.totalClients'),          value: dashboard.totalClients,                       sub: t('reports.totalClientsSub') },
              { title: t('reports.avgCheck'),      value: `$${dashboard.avgServiceValue}`,              sub: t('reports.avgCheckSub') },
            ].map((c, i) => (
              <div key={i} className="ds-card p-5">
                <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{c.title}</p>
                <p className="text-3xl font-bold mt-1 text-ink tracking-tight">{c.value}</p>
                <p className="text-xs text-ink-muted mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <div className="ds-card p-6">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2 mb-6">
              <TrendingUp size={18} className="text-brand"/> {t('reports.revenueChartTitle')}
            </h3>
            <div className="flex items-end gap-1" style={{ height: `${BAR_HEIGHT + 40}px` }}>
              {dashboard.revenueByMonth.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${d.amount}
                  </span>
                  <div
                    className="w-full bg-brand hover:bg-brand-dark rounded-t transition-colors"
                    style={{ height: `${barPx(d.amount, maxRev)}px` }}
                  />
                  <span className="text-xs text-ink-muted">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service performance */}
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
                        <td className="px-5 py-3 text-sm font-medium text-brand-dark text-right">${s.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Employee performance */}
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
                        <td className="px-5 py-3 text-sm font-medium text-brand-dark text-right">${e.revenue}</td>
                        <td className="px-5 py-3 text-sm text-amber-500 text-right">
                          {e.rating > 0 ? `⭐ ${e.rating}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FORECAST ── */}
      {activeTab === 'forecast' && forecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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
                    {d.date.slice(5)}
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
                  <span className="text-xs text-ink-muted text-center leading-tight">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RFM ── */}
      {activeTab === 'rfm' && rfm && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {rfm.summary.map((s) => (
              <div key={s.segment}
                className={`rounded-lg border p-4 ${SEGMENT_COLORS[s.segment] || 'bg-canvas-soft text-ink-secondary border-line'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{segmentLabel(s.segment)}</p>
                    <p className="text-xs opacity-75 mt-0.5">{segmentDesc(s.segment)}</p>
                  </div>
                  <span className="text-2xl font-bold">{s.count}</span>
                </div>
                <p className="text-xs mt-2 opacity-75">{t('reports.revenueLabel')}: ${s.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>

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
                <p className="text-xs text-ink-muted mt-0.5">{t('reports.rfmDetailsSub')}</p>
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
                    {rfm.segments.map((c) => (
                      <tr key={c.clientId} className="hover:bg-canvas-soft transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-ink">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-ink-secondary">{c.R}д</td>
                        <td className="px-4 py-3 text-sm text-ink-secondary">{c.F}</td>
                        <td className="px-4 py-3 text-sm text-ink-secondary">${c.M}</td>
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