import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, DollarSign, TrendingUp, Scissors } from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';
import { appointmentApi, clientApi, serviceApi } from '../api';
import { Appointment, Client, Service } from '../api/types';

const Dashboard = () => {
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
    { title: "Today's Appointments", value: loading ? '...' : String(todayAppointments.length), icon: <Calendar size={24} />, color: 'bg-blue-500' },
    { title: 'Total Clients', value: loading ? '...' : String(clients.length), icon: <Users size={24} />, color: 'bg-green-500' },
    { title: 'Avg. Service Time', value: loading ? '...' : `${avgDuration}m`, icon: <Clock size={24} />, color: 'bg-purple-500' },
    { title: "Today's Revenue", value: loading ? '...' : `$${todayRevenue.toFixed(0)}`, icon: <DollarSign size={24} />, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} title={m.title} value={m.value} icon={m.icon} color={m.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 flex items-center">
            <Calendar size={18} className="mr-2 text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">Today's Appointments</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <p className="px-4 py-6 text-sm text-center text-gray-500">Завантаження...</p>
            ) : todayAppointments.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-gray-500">Записів на сьогодні немає</p>
            ) : todayAppointments.slice(0, 6).map(a => (
              <div key={a._id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-500 w-12">{a.startTime}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.client?.name || 'Client'}</p>
                    <p className="text-xs text-gray-500">{a.employee?.name || 'Barber'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">${a.totalPrice}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    a.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    a.status === 'No-show' ? 'bg-gray-100 text-gray-500' :
                    'bg-blue-100 text-blue-700'
                  }`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 flex items-center">
            <Users size={18} className="mr-2 text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">Recent Clients</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <p className="px-4 py-6 text-sm text-center text-gray-500">Завантаження...</p>
            ) : recentClients.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-gray-500">Клієнтів немає</p>
            ) : recentClients.map(c => (
              <div key={c._id} className="px-4 py-3 flex items-center gap-3">
                <img
                  className="h-8 w-8 rounded-full"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&size=64`}
                  alt={c.name}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.visits || 0} visits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 flex items-center">
            <TrendingUp size={18} className="mr-2 text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">Revenue — Last 7 Days</h3>
          </div>
          <div className="p-4">
            {loading ? (
              <p className="text-sm text-center text-gray-500 py-4">Завантаження...</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {revenueByDay.map((d, i) => {
                  const height = Math.max((d.revenue / maxRev) * 100, 4);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">${d.revenue}</span>
                      <div
                        className="w-full bg-indigo-500 rounded-t transition-all"
                        style={{ height: `${Math.max((d.revenue / maxRev) * 128, d.revenue > 0 ? 6 : 3)}px` }}
                      />
                      <span className="text-xs text-gray-400">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 flex items-center">
            <Scissors size={18} className="mr-2 text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">Popular Services</h3>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <p className="text-sm text-center text-gray-500 py-4">Завантаження...</p>
            ) : topServices.length === 0 ? (
              <p className="text-sm text-center text-gray-500 py-4">Немає даних</p>
            ) : topServices.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{name}</span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
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