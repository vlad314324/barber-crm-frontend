import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Banknote, TrendingUp, Scissors } from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';
import { appointmentApi, clientApi } from '../api';
import { Appointment, Client } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { useShopCurrency } from '../context/SettingsContext';
import { formatPrice } from '../utils/money';

const Dashboard = () => {
  const { t } = useLocale();
  const currency = useShopCurrency();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [appts, cls] = await Promise.all([
          appointmentApi.getAll(),
          clientApi.getAll(),
        ]);
        setAppointments(appts);
        setClients(cls);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments.filter(a =>
    new Date(a.date).toISOString().split('T')[0] === today
  );

  const todayRevenue = todayAppointments
    .filter(a => a.status === 'Completed')
    .reduce((sum, a) => sum + a.totalPrice, 0);

  const avgDuration = appointments.length > 0
    ? Math.round(appointments.reduce((sum, a) => sum + a.totalDuration, 0) / appointments.length)
    : 0;

  const serviceCount: Record<string, number> = {};
  appointments.forEach(a => {
    a.services.forEach(s => {
      const name = typeof s === 'object' ? s.name : s;
      serviceCount[name] = (serviceCount[name] || 0) + 1;
    });
  });
  const topServices = Object.entries(serviceCount).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxCount = topServices[0]?.[1] || 1;

  const recentClients = [...clients].slice(0, 5);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const revenueByDay = last7Days.map(day => ({
    day: new Date(day).toLocaleDateString('uk-UA', { weekday: 'short' }),
    revenue: appointments
      .filter(a => new Date(a.date).toISOString().split('T')[0] === day && a.status === 'Completed')
      .reduce((sum, a) => sum + a.totalPrice, 0),
  }));

  const maxRev = Math.max(...revenueByDay.map(x => x.revenue), 1);

  const metrics = [
    { title: t('dashboard.metricTodayAppointments'), value: loading ? '...' : String(todayAppointments.length), icon: <Calendar size={22} /> },
    { title: t('dashboard.metricTotalClients'), value: loading ? '...' : String(clients.length), icon: <Users size={22} /> },
    { title: t('dashboard.metricAvgServiceTime'), value: loading ? '...' : `${avgDuration}m`, icon: <Clock size={22} /> },
    { title: t('dashboard.metricTodayRevenue'), value: loading ? '...' : formatPrice(todayRevenue, currency), icon: <Banknote size={22} /> },
  ];

  const statusLabel = (status: string) => t(`statuses.${status}`);
  const statusBadgeClass = (status: string) =>
    status === 'Completed' ? 'badge-success' :
    status === 'Cancelled' ? 'badge-danger' :
    status === 'No-show' ? 'badge-muted' :
    'badge-neutral';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-ink-secondary">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} title={m.title} value={m.value} icon={m.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 ds-card overflow-hidden">
          <div className="ds-card-header">
            <div className="flex items-center">
              <Calendar size={18} className="mr-2 text-brand" />
              <h3 className="text-base font-semibold text-ink">{t('dashboard.todayAppointments')}</h3>
            </div>
          </div>
          <div className="divide-y divide-line">
            {loading ? (
              <p className="px-5 py-6 text-sm text-center text-ink-muted">{t('common.loading')}</p>
            ) : todayAppointments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center text-ink-muted">{t('dashboard.noAppointmentsToday')}</p>
            ) : todayAppointments.slice(0, 6).map(a => (
              <div key={a._id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-ink-muted w-12">{a.startTime}</div>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.client?.name || t('dashboard.client')}</p>
                    <p className="text-xs text-ink-muted">{a.employee?.name || t('dashboard.barber')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-secondary">{formatPrice(a.totalPrice, currency)}</span>
                  <span className={`badge ${statusBadgeClass(a.status)}`}>{statusLabel(a.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ds-card overflow-hidden">
          <div className="ds-card-header">
            <div className="flex items-center">
              <Users size={18} className="mr-2 text-brand" />
              <h3 className="text-base font-semibold text-ink">{t('dashboard.recentClients')}</h3>
            </div>
          </div>
          <div className="divide-y divide-line">
            {loading ? (
              <p className="px-5 py-6 text-sm text-center text-ink-muted">{t('common.loading')}</p>
            ) : recentClients.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center text-ink-muted">{t('dashboard.noClients')}</p>
            ) : recentClients.map(c => (
              <div key={c._id} className="px-5 py-3 flex items-center gap-3">
                <img
                  className="h-8 w-8 rounded-full ring-1 ring-line"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&size=64`}
                  alt={c.name}
                />
                <div>
                  <p className="text-sm font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-ink-muted">{c.visits || 0} {t('dashboard.visits')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ds-card overflow-hidden">
          <div className="ds-card-header">
            <div className="flex items-center">
              <TrendingUp size={18} className="mr-2 text-brand" />
              <h3 className="text-base font-semibold text-ink">{t('dashboard.revenue7Days')}</h3>
            </div>
          </div>
          <div className="p-5">
            {loading ? (
              <p className="text-sm text-center text-ink-muted py-4">{t('common.loading')}</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {revenueByDay.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-ink-muted">{formatPrice(d.revenue, currency)}</span>
                    <div
                      className="w-full bg-brand rounded-t transition-all"
                      style={{ height: `${Math.max((d.revenue / maxRev) * 128, d.revenue > 0 ? 6 : 3)}px` }}
                    />
                    <span className="text-xs text-ink-muted">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ds-card overflow-hidden">
          <div className="ds-card-header">
            <div className="flex items-center">
              <Scissors size={18} className="mr-2 text-brand" />
              <h3 className="text-base font-semibold text-ink">{t('dashboard.popularServices')}</h3>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <p className="text-sm text-center text-ink-muted py-4">{t('common.loading')}</p>
            ) : topServices.length === 0 ? (
              <p className="text-sm text-center text-ink-muted py-4">{t('common.noData')}</p>
            ) : topServices.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-ink-secondary">{name}</span>
                  <span className="text-sm text-ink-muted">{count}</span>
                </div>
                <div className="w-full bg-canvas-soft rounded-full h-2">
                  <div
                    className="bg-brand h-2 rounded-full"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;