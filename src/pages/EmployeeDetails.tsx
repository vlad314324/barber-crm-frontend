import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Phone, Mail, Star, Calendar, TrendingUp, Users } from 'lucide-react';
import { employeeApi } from '../api';
import { Employee, Appointment, EmployeeStats } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { useShopCurrency } from '../context/SettingsContext';
import { formatPrice } from '../utils/money';

const BAR_HEIGHT = 100;

const EmployeeDetails = () => {
  const { t } = useLocale();
  const currency = useShopCurrency();
  const { id } = useParams<{ id: string }>();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [emp, appts, empStats] = await Promise.all([
          employeeApi.getById(id),
          employeeApi.getAppointments(id),
          employeeApi.getStats(id),
        ]);
        setEmployee(emp);
        setAppointments(appts);
        setStats(empStats);
      } catch (err) {
        console.error('Error fetching employee:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-ink-muted">{t('common.loading')}</div>;
  if (!employee) return <div className="text-center py-12 text-red-500">{t('employeeDetails.notFound')}</div>;

  const statusLabel = (status: string) => t(`statuses.${status}`);
  const statusBadgeClass = (status: string) =>
    status === 'Completed' ? 'badge-success' :
    status === 'Cancelled' ? 'badge-danger' :
    status === 'No-show' ? 'badge-muted' :
    'badge-neutral';

  const maxEarning = stats ? Math.max(...stats.monthlyEarnings.map(m => m.amount), 1) : 1;
  const thisMonthEarning = stats?.monthlyEarnings[stats.monthlyEarnings.length - 1]?.amount || 0;
  const barPx = (val: number) => val === 0 ? 3 : Math.max(Math.round((val / maxEarning) * BAR_HEIGHT), 6);

  return (
    <div className="space-y-6">
      <Link to="/employees" className="inline-flex items-center text-sm font-medium text-brand hover:text-brand-dark">
        <ArrowLeft size={16} className="mr-1" />
        {t('employeeDetails.back')}
      </Link>

      {/* Header */}
      <div className="ds-card overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <img
                className="h-16 w-16 rounded-full mr-4 ring-1 ring-line"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&size=128`}
                alt={employee.name}
              />
              <div>
                <h2 className="text-2xl font-bold text-ink tracking-tight">{employee.name}</h2>
                <p className="text-sm text-ink-muted">{employee.customRoleLabel?.trim() || t(`roles.${employee.role}`)}</p>
                {employee.rating !== undefined && employee.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm text-ink-secondary">{employee.rating.toFixed(1)} ({employee.reviewCount || 0})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`badge ${employee.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                {employee.isAvailable ? t('employees.available') : t('employees.unavailable')}
              </span>
              {employee.isActive === false && <span className="badge badge-danger">{t('employees.deactivated')}</span>}
            </div>
          </div>
        </div>

        <div className="border-t border-line px-6 py-5">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <dt className="text-sm font-medium text-ink-muted flex items-center">
                <Phone size={14} className="mr-1" /> {t('clientDetails.phone')}
              </dt>
              <dd className="mt-1 text-sm text-ink">{employee.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-ink-muted flex items-center">
                <Mail size={14} className="mr-1" /> {t('clientDetails.email')}
              </dt>
              <dd className="mt-1 text-sm text-ink">{employee.email}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ds-card p-5">
          <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('employeeDetails.totalEarnings')}</p>
          <p className="text-2xl font-bold mt-1 text-ink tracking-tight">{formatPrice(stats?.totalEarnings || 0, currency)}</p>
        </div>
        <div className="ds-card p-5">
          <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('employeeDetails.thisMonthEarnings')}</p>
          <p className="text-2xl font-bold mt-1 text-ink tracking-tight">{formatPrice(thisMonthEarning, currency)}</p>
        </div>
        <div className="ds-card p-5">
          <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('employeeDetails.completedAppointments')}</p>
          <p className="text-2xl font-bold mt-1 text-ink tracking-tight">{stats?.totalCompletedAppointments || 0}</p>
        </div>
        <div className="ds-card p-5">
          <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{t('employeeDetails.clientCount')}</p>
          <p className="text-2xl font-bold mt-1 text-ink tracking-tight">{stats?.clients.length || 0}</p>
        </div>
      </div>

      {/* Monthly earnings chart */}
      <div className="ds-card p-6">
        <h3 className="text-base font-semibold text-ink flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-brand" /> {t('employeeDetails.earningsChartTitle')}
        </h3>
        <div className="flex items-end gap-1" style={{ height: `${BAR_HEIGHT + 40}px` }}>
          {(stats?.monthlyEarnings || []).map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatPrice(m.amount, currency)}
              </span>
              <div
                className="w-full bg-brand hover:bg-brand-dark rounded-t transition-colors"
                style={{ height: `${barPx(m.amount)}px` }}
              />
              <span className="text-xs text-ink-muted">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clients */}
      <div className="ds-card overflow-hidden">
        <div className="ds-card-header">
          <div className="flex items-center">
            <Users size={18} className="mr-2 text-brand" />
            <h3 className="text-base font-semibold text-ink">{t('employeeDetails.clientsTitle')}</h3>
          </div>
        </div>
        {(!stats || stats.clients.length === 0) ? (
          <p className="px-6 py-8 text-sm text-center text-ink-muted">{t('common.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-3 text-left">{t('clientDetails.clientLabel')}</th>
                  <th className="px-6 py-3 text-left">{t('clients.tablePhone')}</th>
                  <th className="px-6 py-3 text-left">{t('clients.tableVisits')}</th>
                  <th className="px-6 py-3 text-left">{t('employeeDetails.totalSpentCol')}</th>
                  <th className="px-6 py-3 text-left">{t('clients.tableLastVisit')}</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-line">
                {stats.clients.map((c) => (
                  <tr key={c.id} className="hover:bg-canvas-soft transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">
                      <Link to={`/clients/${c.id}`} className="text-brand hover:text-brand-dark">{c.name}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{c.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-secondary">{c.visits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-dark">{formatPrice(c.totalSpent, currency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-secondary">{new Date(c.lastVisit).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment history */}
      <div className="ds-card overflow-hidden">
        <div className="ds-card-header">
          <div className="flex items-center">
            <Calendar size={18} className="mr-2 text-brand" />
            <h3 className="text-base font-semibold text-ink">{t('employeeDetails.recordsTitle')}</h3>
          </div>
          <span className="text-sm text-ink-muted">{t('clientDetails.total', { count: appointments.length })}</span>
        </div>

        {appointments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center text-ink-muted">{t('clientDetails.noAppointments')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-3 text-left">{t('clientDetails.tableDate')}</th>
                  <th className="px-6 py-3 text-left">{t('clientDetails.clientLabel')}</th>
                  <th className="px-6 py-3 text-left">{t('clientDetails.tableService')}</th>
                  <th className="px-6 py-3 text-left">{t('clientDetails.tableStatus')}</th>
                  <th className="px-6 py-3 text-left">{t('clientDetails.tablePrice')}</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-line">
                {appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-canvas-soft transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-ink">{new Date(a.date).toLocaleDateString()}</div>
                      <div className="text-xs text-ink-muted">{a.startTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {typeof a.client === 'object' ? a.client?.name : a.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {a.services?.map(s => typeof s === 'object' ? s.name : s).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${statusBadgeClass(a.status)}`}>{statusLabel(a.status)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">
                      {formatPrice(a.totalPrice, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetails;
