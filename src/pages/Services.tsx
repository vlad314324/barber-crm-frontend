import { useState, useEffect, useCallback } from 'react';
import {
  Scissors, ScissorsLineDashed, Droplet, ShowerHead, Wind, Sparkles,
  Plus, Search, Pencil, Trash2, Clock, DollarSign,
} from 'lucide-react';
import { serviceApi } from '../api';
import { Service } from '../api/types';
import Modal from '../components/Modal';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';

const CATEGORIES = ['Haircut', 'Beard Trim', 'Shave', 'Hair Wash', 'Styling', 'Other'] as const;

const defaultForm = {
  name: '', description: '', price: 0, duration: 30,
  category: 'Haircut' as Service['category'],
  isAvailable: true,
};

const categoryIcon: Record<string, typeof Scissors> = {
  'Haircut': Scissors,
  'Beard Trim': ScissorsLineDashed,
  'Shave': Droplet,
  'Hair Wash': ShowerHead,
  'Styling': Wind,
  'Other': Sparkles,
};

const Services = () => {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceApi.getAll();
      setServices(data);
    } catch {
      setError(t('services.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

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
      alert(t('services.fillRequired'));
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
    } catch (err) {
      alert(getErrorMessage(err) || t('services.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('services.deleteConfirm'))) return;
    try {
      await serviceApi.delete(id);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch {
      alert(t('services.deleteError'));
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="text-ink-muted">{t('common.loading')}</div>
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
        <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center">
          <Scissors size={24} className="mr-2 text-brand" />
          {t('services.title')}
        </h1>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} />
          {t('services.addNew')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-ink-muted" />
        </div>
        <input
          className="field-input pl-10"
          placeholder={t('services.searchPlaceholder')}
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-ink-muted">{t('services.notFound')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            const CategoryIcon = categoryIcon[service.category] || Scissors;
            return (
            <div key={service._id} className="ds-card overflow-hidden flex flex-col">

              {/* Замість картинки — мінімалістична іконка */}
              <div className="h-32 flex items-center justify-center bg-brand-extra-soft">
                <CategoryIcon size={40} strokeWidth={1.5} className="text-brand" />
              </div>

              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-ink">{service.name}</h3>
                    <span className="badge badge-neutral mt-1">
                      {t(`categories.${service.category}`)}
                    </span>
                  </div>
                  <span className={`badge ${service.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                    {service.isAvailable ? t('services.active') : t('services.inactive')}
                  </span>
                </div>
                <p className="text-sm text-ink-muted mt-2">{service.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center text-sm text-ink-secondary">
                    <DollarSign size={14} className="mr-1 text-brand" />
                    <span className="font-semibold">${service.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm text-ink-muted">
                    <Clock size={14} className="mr-1" />
                    {service.duration} {t('services.minutes')}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-line flex justify-end gap-3">
                <button
                  onClick={() => openEditModal(service)}
                  className="inline-flex items-center text-sm text-brand hover:text-brand-dark"
                >
                  <Pencil size={14} className="mr-1" /> {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="inline-flex items-center text-sm text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} className="mr-1" /> {t('common.delete')}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? t('services.editModalTitle') : t('services.addModalTitle')}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label">{t('services.fieldName')}</label>
            <input
              type="text"
              className="field-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('services.fieldNamePlaceholder')}
            />
          </div>
          <div>
            <label className="field-label">{t('services.fieldDescription')}</label>
            <textarea
              className="field-input"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('services.fieldDescriptionPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('services.fieldPrice')}</label>
              <input
                type="number"
                className="field-input"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                min="0"
              />
            </div>
            <div>
              <label className="field-label">{t('services.fieldDuration')}</label>
              <input
                type="number"
                className="field-input"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                min="5"
                step="5"
              />
            </div>
          </div>
          <div>
            <label className="field-label">{t('services.fieldCategory')}</label>
            <select
              className="field-input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Service['category'] })}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="rounded border-line text-brand focus:ring-brand"
            />
            <label htmlFor="isAvailable" className="text-sm text-ink-secondary">{t('services.fieldAvailable')}</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? t('common.saving') : editingService ? t('common.save') : t('services.addNew')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Services;