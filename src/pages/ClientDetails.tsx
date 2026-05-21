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

const ClientDetails = () => {
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
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Видалити клієнта?')) return;
    try {
      await clientApi.delete(id);
      navigate('/clients');
    } catch {
      alert('Помилка видалення');
    }
  };

  const completedVisits = appointments.filter(a => a.status === 'Completed');
  const lastVisit = completedVisits[0]?.date;

  if (loading) return <div className="text-center py-12 text-gray-500">Завантаження...</div>;
  if (!client) return <div className="text-center py-12 text-red-500">Клієнта не знайдено</div>;

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900">
        <ArrowLeft size={16} className="mr-1" />
        Back to Clients
      </Link>

      {/* Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <img
                className="h-16 w-16 rounded-full mr-4"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random&size=128`}
                alt={client.name}
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                <p className="text-sm text-gray-500">
                  {(client as any).createdAt
                    ? `Client since ${new Date((client as any).createdAt).toLocaleDateString()}`
                    : 'Client'}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit size={16} className="mr-2 text-gray-500" />
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone size={14} className="mr-1" /> Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail size={14} className="mr-1" /> Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Clock size={14} className="mr-1" /> Last Visit
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {lastVisit ? new Date(lastVisit).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User size={14} className="mr-1" /> Total Visits
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{completedVisits.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Spent</dt>
              <dd className="mt-1 text-sm font-semibold text-green-600">
                ${completedVisits.reduce((sum, a) => sum + a.totalPrice, 0).toFixed(0)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <Calendar size={18} className="mr-2 text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">Appointment History</h3>
          </div>
          <span className="text-sm text-gray-500">{appointments.length} total</span>
        </div>

        {appointments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center text-gray-500">Записів не знайдено</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barber</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(a.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{a.startTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {a.services?.map(s => typeof s === 'object' ? s.name : s).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof a.employee === 'object' ? a.employee.name : a.employee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        a.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        a.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        a.status === 'No-show' ? 'bg-gray-100 text-gray-500' :
                        'bg-blue-100 text-blue-700'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-red-600">Danger Zone</h3>
          <p className="text-sm text-gray-500 mt-1">Destructive actions that cannot be undone</p>
        </div>
        <div className="px-6 py-4">
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Client
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Client">
        <div className="space-y-4">
          {[
            { label: 'Name', key: 'name', type: 'text' },
            { label: 'Phone', key: 'phone', type: 'tel' },
            { label: 'Email', key: 'email', type: 'email' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={(formData as any)[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientDetails;