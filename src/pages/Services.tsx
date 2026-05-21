import { useState, useEffect } from 'react';
import { Scissors, Plus, Search, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';
import { serviceApi } from '../api';
import { Service } from '../api/types';
import Modal from '../components/Modal';

const CATEGORIES = ['Haircut', 'Beard Trim', 'Shave', 'Hair Wash', 'Styling', 'Other'] as const;

const defaultForm = {
  name: '', description: '', price: 0, duration: 30,
  category: 'Haircut' as Service['category'],
  isAvailable: true,
};

const categoryColors: Record<string, string> = {
  'Haircut': 'bg-blue-100 text-blue-700',
  'Beard Trim': 'bg-amber-100 text-amber-700',
  'Shave': 'bg-green-100 text-green-700',
  'Hair Wash': 'bg-cyan-100 text-cyan-700',
  'Styling': 'bg-purple-100 text-purple-700',
  'Other': 'bg-gray-100 text-gray-700',
};

const categoryEmoji: Record<string, string> = {
  'Haircut': '✂️',
  'Beard Trim': '🪒',
  'Shave': '🪭',
  'Hair Wash': '🚿',
  'Styling': '💈',
  'Other': '💇',
};

const categoryGradient: Record<string, string> = {
  'Haircut': 'from-blue-50 to-indigo-100',
  'Beard Trim': 'from-amber-50 to-orange-100',
  'Shave': 'from-green-50 to-emerald-100',
  'Hair Wash': 'from-cyan-50 to-sky-100',
  'Styling': 'from-purple-50 to-violet-100',
  'Other': 'from-gray-50 to-slate-100',
};

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await serviceApi.getAll();
      setServices(data);
    } catch {
      setError('Не вдалося завантажити послуги.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingService(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      isAvailable: service.isAvailable,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      alert('Заповніть обовʼязкові поля');
      return;
    }
    setSaving(true);
    try {
      if (editingService) {
        await serviceApi.update(editingService._id, formData);
      } else {
        await serviceApi.create(formData);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити послугу?')) return;
    try {
      await serviceApi.delete(id);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch {
      alert('Помилка видалення');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="text-gray-500">Завантаження...</div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center py-12">
      <div className="text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Scissors size={24} className="mr-2 text-indigo-600" />
          Services
        </h1>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={16} className="mr-2" />
          Add New Service
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Search services..."
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Послуг не знайдено</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <div key={service._id} className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
              
              {/* Замість картинки — кольоровий блок з emoji */}
              <div className={`h-32 flex items-center justify-center bg-gradient-to-br ${categoryGradient[service.category] || 'from-gray-50 to-slate-100'}`}>
                <span className="text-6xl select-none">
                  {categoryEmoji[service.category] || '✂️'}
                </span>
              </div>

              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[service.category] || 'bg-gray-100 text-gray-700'}`}>
                      {service.category}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${service.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {service.isAvailable ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{service.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <DollarSign size={14} className="mr-1 text-green-500" />
                    <span className="font-semibold">${service.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    {service.duration} min
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => openEditModal(service)}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <Pencil size={14} className="mr-1" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="inline-flex items-center text-sm text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} className="mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add New Service'}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Service name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Service description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                min="5"
                step="5"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Service['category'] })}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600"
            />
            <label htmlFor="isAvailable" className="text-sm text-gray-700">Available</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingService ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Services;