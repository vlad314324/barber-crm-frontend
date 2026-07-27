import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Calendar, Phone, Mail, Clock,
  ArrowLeft, Edit, Trash2
} from 'lucide-react';
import { clientApi } from '../api';
import api from '../api';
import { Client, Appointment } from '../api/types';
import Modal from '../components/Modal';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';

const ClientDetails = () => {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [clientData, clientAppointments] = await Promise.all([
          clientApi.getById(id),
          api.get(`/clients/${id}/appointments`).then(r => r.data),
        ]);
        setClient(clientData);
        setFormData({ name: clientData.name, phone: clientData.phone, email: clientData.email });
        setAppointments(clientAppointments);
      } catch (err) {
        console.error('Error fetching client:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!id || !formData.name || !formData.phone || !formData.email) return;
    setSaving(true);
    try {
      const updated = await clientApi.update(id, formData);
      setClient(updated);
      setIsEditOpen(false);
    } catch (err) {
      alert(getErrorMessage(err) || t('clientDetails.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm(t('clientDetails.deleteConfirm'))) return;
    try {
      await clientApi.delete(id);
      navigate('/clients');
    } catch {
      alert(t('clientDetails.deleteError'));
    }
  };

  const completedVisits = appointments.filter(a => a.status === 'Completed');
  const lastVisit = completedVisits[0]?.date;

  if (loading) return <div className="text-center py-12 text-ink-muted">{t('common.loading')}</div>;
  if (!client) return <div className="text-center py-12 text-red-500">{t('clientDetails.notFound')}</div>;

  const statusLabel = (status: string) => t(`statuses.${status}`);
  const statusBadgeClass = (status: string) =>
    status === 'Completed' ? 'badge-success' :
    status === 'Cancelled' ? 'badge-danger' :
    status === 'No-show' ? 'badge-muted' :
    'badge-neutral';

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center text-sm font-medium text-brand hover:text-brand-dark">
        <ArrowLeft size={16} className="mr-1" />
        {t('clientDetails.back')}
      </Link>

      {/* Header */}
      <div className="ds-card overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <img
                className="h-16 w-16 rounded-full mr-4 ring-1 ring-line"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random&size=128`}
                alt={client.name}
              />
              <div>
                <h2 className="text-2xl font-bold text-ink tracking-tight">{client.name}</h2>
                <p className="text-sm text-ink-muted">
                  {client.createdAt
                    ? t('clientDetails.clientSince', { date: new Date(client.createdAt).toLocaleDateString() })
                    : t('clientDetails.clientLabel')}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <button onClick={() => setIsEditOpen(true)} className="btn btn-secondary">
                <Edit size={16} />
                {t('clientDetails.edit')}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-line px-6 py-5">
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <dt className="text-sm font-medium text-ink-muted flex items-center">
                <Phone size={14} className="mr-1" /> {t('clientDetails.phone')}
              </dt>
              <dd className="mt-1 text-sm text-ink">{client.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-ink-muted flex items-center">
                <Mail size={14} className="mr-1" /> {t('clientDetails.email')}
              </dt>
              <dd className="mt-1 text-sm text-ink">{client.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-ink-muted flex items-center">
                <Clock size={14} className="mr-1" /> {t('clientDetails.lastVisit')}
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {lastVisit ? new Date(lastVisit).toLocaleDateString() : t('common.na')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-ink-muted flex items-center">
                <User size={14} className="mr-1" /> {t('clientDetails.totalVisits')}
              </dt>
              <dd className="mt-1 text-sm text-ink">{completedVisits.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-ink-muted">{t('clientDetails.totalSpent')}</dt>
              <dd className="mt-1 text-sm font-semibold text-brand-dark">
                ${completedVisits.reduce((sum, a) => sum + a.totalPrice, 0).toFixed(0)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Appointment History */}
      <div className="ds-card overflow-hidden">
        <div className="ds-card-header">
          <div className="flex items-center">
            <Calendar size={18} className="mr-2 text-brand" />
            <h3 className="text-base font-semibold text-ink">{t('clientDetails.history')}</h3>
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
                  <th className="px-6 py-3 text-left">{t('clientDetails.tableService')}</th>
                  <th className="px-6 py-3 text-left">{t('clientDetails.tableBarber')}</th>
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
                      {a.services?.map(s => typeof s === 'object' ? s.name : s).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {typeof a.employee === 'object' ? a.employee.name : a.employee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${statusBadgeClass(a.status)}`}>{statusLabel(a.status)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">
                      ${a.totalPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="ds-card overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <h3 className="text-base font-semibold text-red-600">{t('clientDetails.dangerZone')}</h3>
          <p className="text-sm text-ink-muted mt-1">{t('clientDetails.dangerZoneDesc')}</p>
        </div>
        <div className="px-6 py-4">
          <button onClick={handleDelete} className="btn btn-danger-solid">
            <Trash2 size={16} />
            {t('clientDetails.deleteClient')}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={t('clientDetails.editTitle')}>
        <div className="space-y-4">
          {[
            { label: t('common.name'), key: 'name' as const, type: 'text' },
            { label: t('common.phone'), key: 'phone' as const, type: 'tel' },
            { label: t('common.email'), key: 'email' as const, type: 'email' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input
                type={type}
                className="field-input"
                value={formData[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsEditOpen(false)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientDetails;