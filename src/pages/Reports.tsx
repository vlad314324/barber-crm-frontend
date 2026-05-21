import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Scissors, User, RefreshCw, Users } from 'lucide-react';
import api from '../api';

const SEGMENT_COLORS: Record<string, string> = {
  Champions:       'bg-purple-100 text-purple-700 border-purple-200',
  Loyal:           'bg-blue-100 text-blue-700 border-blue-200',
  'At Risk':       'bg-orange-100 text-orange-700 border-orange-200',
  Lost:            'bg-red-100 text-red-700 border-red-200',
  'New Customers': 'bg-green-100 text-green-700 border-green-200',
  Promising:       'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const SEGMENT_DESC: Record<string, string> = {
  Champions:       'Найлояльніші, активні, витратні',
  Loyal:           'Стабільна база, потенціал для апсейлу',
  'At Risk':       'Раніше активні — починають відходити',
  Lost:            'Давно не відвідували',
  'New Customers': 'Новий клієнт — перший візит',
  Promising:       'Нові з потенціалом зростання',
};

const BAR_HEIGHT = 128; // px — висота зони графіку

const Reports = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [forecast,  setForecast]  = useState<any>(null);
  const [rfm,       setRfm]       = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'rfm'>('overview');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, f, r] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/forecast'),
        api.get('/analytics/rfm'),
      ]);
      setDashboard(d.data);
      setForecast(f.data);
      setRfm(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  if (loading) return <div className="text-center py-16 text-gray-500">Завантаження аналітики...</div>;

  const maxRev      = dashboard ? Math.max(...dashboard.revenueByMonth.map((d: any) => d.amount), 1) : 1;
  const maxForecast = forecast  ? Math.max(...(forecast.forecast || []).map((d: any) => d.predicted), 1) : 1;
  const maxSeries   = forecast  ? Math.max(...(forecast.series   || []).map((d: any) => d.count),    1) : 1;

  const barPx = (val: number, max: number) =>
    val === 0 ? 3 : Math.max(Math.round((val / max) * BAR_HEIGHT), 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart2 size={24} className="mr-2 text-indigo-600"/>
            Reports & Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Реальні дані з бази</p>
        </div>
        <button onClick={fetchAll}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
          <RefreshCw size={14}/> Оновити
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([['overview','Огляд'],['forecast','Прогнозування'],['rfm','RFM Сегменти']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Загальна виручка',  value: `$${dashboard.totalRevenue.toLocaleString()}`, sub: `Цього місяця: $${dashboard.monthRevenue}`,      color: 'text-green-600'  },
              { title: 'Всього записів',    value: dashboard.totalAppointments,                  sub: `Цього місяця: ${dashboard.monthAppointments}`,  color: 'text-blue-600'   },
              { title: 'Клієнтів',          value: dashboard.totalClients,                       sub: 'В базі',                                         color: 'text-purple-600' },
              { title: 'Середній чек',      value: `$${dashboard.avgServiceValue}`,              sub: 'За виконаний запис',                             color: 'text-amber-600'  },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{c.title}</p>
                <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <TrendingUp size={18} className="text-indigo-600"/> Виручка за 12 місяців
            </h3>
            <div className="flex items-end gap-1" style={{ height: `${BAR_HEIGHT + 40}px` }}>
              {dashboard.revenueByMonth.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${d.amount}
                  </span>
                  <div
                    className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t transition-colors"
                    style={{ height: `${barPx(d.amount, maxRev)}px` }}
                  />
                  <span className="text-xs text-gray-400">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service performance */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Scissors size={18} className="text-indigo-600"/>
                <h3 className="text-base font-semibold text-gray-900">Популярні послуги</h3>
              </div>
              {dashboard.servicePerformance.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center text-gray-400">Немає даних</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-2 text-left text-xs text-gray-500 font-medium">Послуга</th>
                      <th className="px-5 py-2 text-right text-xs text-gray-500 font-medium">Записів</th>
                      <th className="px-5 py-2 text-right text-xs text-gray-500 font-medium">Виручка</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.servicePerformance.map((s: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-900">{s.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600 text-right">{s.count}</td>
                        <td className="px-5 py-3 text-sm font-medium text-green-600 text-right">${s.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Employee performance */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <User size={18} className="text-indigo-600"/>
                <h3 className="text-base font-semibold text-gray-900">Продуктивність майстрів</h3>
              </div>
              {dashboard.empPerformance.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center text-gray-400">Немає даних</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-2 text-left text-xs text-gray-500 font-medium">Майстер</th>
                      <th className="px-5 py-2 text-right text-xs text-gray-500 font-medium">Записів</th>
                      <th className="px-5 py-2 text-right text-xs text-gray-500 font-medium">Виручка</th>
                      <th className="px-5 py-2 text-right text-xs text-gray-500 font-medium">Рейтинг</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.empPerformance.map((e: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{e.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600 text-right">{e.appointments}</td>
                        <td className="px-5 py-3 text-sm font-medium text-green-600 text-right">${e.revenue}</td>
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
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">SMA (7 днів)</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{forecast.sma}</p>
              <p className="text-xs text-gray-400 mt-1">Середнє за тиждень</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">MAE</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{forecast.mae}</p>
              <p className="text-xs text-gray-400 mt-1">Середня абсолютна похибка</p>
            </div>
          </div>

          {/* Historical */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Фактичне навантаження (14 днів)</h3>
            <p className="text-xs text-gray-400 mb-4">Кількість виконаних записів по днях</p>
            <div className="flex items-end gap-1" style={{ height: `${BAR_HEIGHT + 32}px` }}>
              {forecast.series.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                  <span className="text-xs text-gray-500 font-medium">{d.count > 0 ? d.count : ''}</span>
                  <div
                    className="w-full bg-indigo-400 hover:bg-indigo-600 rounded-t transition-colors"
                    style={{ height: `${barPx(d.count, maxSeries)}px` }}
                  />
                  <span className="text-gray-400 text-center leading-tight" style={{ fontSize: '9px' }}>
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Прогноз на 7 днів</h3>
            <p className="text-xs text-gray-400 mb-4">Комбінована модель SMA + лінійна регресія (α=0.6)</p>
            <div className="flex items-end gap-2" style={{ height: `${BAR_HEIGHT + 48}px` }}>
              {forecast.forecast.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-sm font-semibold text-gray-700">{d.predicted}</span>
                  <div
                    className="w-full bg-green-400 hover:bg-green-500 rounded-t transition-colors"
                    style={{ height: `${barPx(d.predicted, maxForecast)}px` }}
                  />
                  <span className="text-xs text-gray-400 text-center leading-tight">{d.date}</span>
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
            {rfm.summary.map((s: any) => (
              <div key={s.segment}
                className={`rounded-lg border p-4 ${SEGMENT_COLORS[s.segment] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{s.segment}</p>
                    <p className="text-xs opacity-75 mt-0.5">{SEGMENT_DESC[s.segment]}</p>
                  </div>
                  <span className="text-2xl font-bold">{s.count}</span>
                </div>
                <p className="text-xs mt-2 opacity-75">Виручка: ${s.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {rfm.summary.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Users size={32} className="mx-auto text-gray-300 mb-2"/>
              <p className="text-gray-500">Недостатньо даних для RFM аналізу.</p>
              <p className="text-sm text-gray-400 mt-1">Потрібні клієнти з виконаними записами.</p>
            </div>
          )}

          {rfm.segments.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Деталі клієнтів</h3>
                <p className="text-xs text-gray-400 mt-0.5">R — давність (дні), F — частота, M — виручка ($)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Клієнт','R','F','M','RFM','Сегмент'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rfm.segments.map((c: any) => (
                      <tr key={c.clientId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.R}д</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.F}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${c.M}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-indigo-600">{c.rfm}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                            ${SEGMENT_COLORS[c.segment] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {c.segment}
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