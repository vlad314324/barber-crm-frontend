import { useState, useEffect, useCallback } from 'react';
import {
  Scissors, ScissorsLineDashed, Droplet, ShowerHead, Wind, Sparkles,
  Heart, Flower2, Palette, Waves, Sun, Gem, Brush, Hand, Zap, SprayCan,
  Syringe, Sparkle, Vibrate, Stethoscope,
  Plus, Search, Pencil, Trash2, Clock, Banknote, Tags, X, Check,
} from 'lucide-react';
import { serviceApi, categoryApi } from '../api';
import { Service, Category } from '../api/types';
import Modal from '../components/Modal';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';
import { useShopCurrency } from '../context/SettingsContext';
import { formatPrice } from '../utils/money';
import { getCurrencySymbol } from '../constants/currencies';

const defaultForm = {
  name: '', description: '', price: 0, duration: 30,
  category: '',
  isAvailable: true,
};

const DEFAULT_ICON = 'Sparkles';

// Набір іконок, з яких адміністратор обирає для власної категорії — той
// самий список, що бекенд валідує у `routes/categoryRoutes.js` (VALID_ICONS).
const ICON_OPTIONS: Record<string, typeof Scissors> = {
  Scissors, ScissorsLineDashed, Droplet, ShowerHead, Wind, Sparkles,
  Heart, Flower2, Palette, Waves, Sun, Gem, Brush, Hand, Zap, SprayCan,
  Syringe, Sparkle, Vibrate, Stethoscope,
};

const IconPicker = ({ value, onChange }: { value: string; onChange: (icon: string) => void }) => (
  <div className="flex flex-wrap gap-1.5">
    {Object.entries(ICON_OPTIONS).map(([key, Icon]) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`p-2 rounded-sm border transition-colors ${
          value === key ? 'border-brand bg-brand-extra-soft text-brand' : 'border-line text-ink-secondary hover:border-line-medium'
        }`}
      >
        <Icon size={16} />
      </button>
    ))}
  </div>
);

const Services = () => {
  const { t } = useLocale();
  const currency = useShopCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(DEFAULT_ICON);
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryIcon, setEditCategoryIcon] = useState(DEFAULT_ICON);

  const categoryLabel = (name: string) => {
    const translated = t(`categories.${name}`);
    return translated === `categories.${name}` ? name : translated;
  };

  const iconForCategory = (categoryName: string) => {
    const iconKey = categories.find(c => c.name === categoryName)?.icon || DEFAULT_ICON;
    return ICON_OPTIONS[iconKey] || Sparkles;
  };

  const fetchCategories = useCallback(async () => {
    try {
      setCategories(await categoryApi.getAll());
    } catch {
      setCategories([]);
    }
  }, []);

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

  useEffect(() => { fetchServices(); fetchCategories(); }, [fetchServices, fetchCategories]);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ ...defaultForm, category: categories[0]?.name || '' });
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
    if (!formData.name) {
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

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setSavingCategory(true);
    try {
      const created = await categoryApi.create({ name, icon: newCategoryIcon });
      setCategories(prev => [...prev, created]);
      setNewCategoryName('');
      setNewCategoryIcon(DEFAULT_ICON);
    } catch (err) {
      alert(getErrorMessage(err) || t('services.categorySaveError'));
    } finally {
      setSavingCategory(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat._id);
    setEditCategoryName(cat.name);
    setEditCategoryIcon(cat.icon || DEFAULT_ICON);
  };

  const cancelEditCategory = () => setEditingCategoryId(null);

  const saveEditCategory = async () => {
    if (!editingCategoryId) return;
    const name = editCategoryName.trim();
    if (!name) return;
    try {
      const updated = await categoryApi.update(editingCategoryId, { name, icon: editCategoryIcon });
      setCategories(prev => prev.map(c => c._id === editingCategoryId ? updated : c));
      setEditingCategoryId(null);
      fetchServices();
    } catch (err) {
      alert(getErrorMessage(err) || t('services.categorySaveError'));
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(t('services.categoryDeleteConfirm', { name: categoryLabel(cat.name) }))) return;
    try {
      await categoryApi.delete(cat._id);
      setCategories(prev => prev.filter(c => c._id !== cat._id));
    } catch (err) {
      alert(getErrorMessage(err) || t('services.categoryDeleteError'));
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
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight flex items-center min-w-0">
          <Scissors size={24} className="mr-2 text-brand flex-shrink-0" />
          <span className="truncate">{t('services.title')}</span>
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setIsCategoryModalOpen(true)} className="btn btn-secondary">
            <Tags size={16} /> <span className="hidden sm:inline">{t('services.categoriesBtn')}</span>
          </button>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            <span className="hidden sm:inline">{t('services.addNew')}</span>
          </button>
        </div>
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
            const CategoryIcon = iconForCategory(service.category);
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
                      {categoryLabel(service.category)}
                    </span>
                  </div>
                  <span className={`badge ${service.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                    {service.isAvailable ? t('services.active') : t('services.inactive')}
                  </span>
                </div>
                <p className="text-sm text-ink-muted mt-2">{service.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center text-sm text-ink-secondary">
                    <Banknote size={14} className="mr-1 text-brand" />
                    <span className="font-semibold">{formatPrice(service.price, currency)}</span>
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
              <label className="field-label">{t('services.fieldPrice')} ({getCurrencySymbol(currency)})</label>
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
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.length === 0 && <option value="">{t('services.noCategoriesYet')}</option>}
              {categories.map(c => <option key={c._id} value={c.name}>{categoryLabel(c.name)}</option>)}
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

      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={t('services.manageCategoriesTitle')} size="lg">
        <div className="space-y-4">
          <div className="border border-line rounded-sm p-3 space-y-2">
            <input
              type="text"
              className="field-input"
              placeholder={t('services.categoryNamePlaceholder')}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
            />
            <IconPicker value={newCategoryIcon} onChange={setNewCategoryIcon} />
            <div className="flex justify-end">
              <button onClick={handleAddCategory} disabled={savingCategory || !newCategoryName.trim()} className="btn btn-primary">
                <Plus size={16} /> {t('services.addCategory')}
              </button>
            </div>
          </div>

          <div className="space-y-1 max-h-[45vh] overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-ink-muted py-2">{t('services.noCategoriesYet')}</p>
            ) : categories.map(c => {
              const Icon = ICON_OPTIONS[c.icon] || Sparkles;
              return editingCategoryId === c._id ? (
                <div key={c._id} className="border border-brand/30 bg-brand-extra-soft rounded-sm p-3 space-y-2">
                  <input
                    type="text"
                    className="field-input"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEditCategory(); }}
                    autoFocus
                  />
                  <IconPicker value={editCategoryIcon} onChange={setEditCategoryIcon} />
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEditCategory} className="btn btn-secondary">{t('common.cancel')}</button>
                    <button onClick={saveEditCategory} disabled={!editCategoryName.trim()} className="btn btn-primary">
                      <Check size={16} /> {t('common.save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div key={c._id} className="flex items-center justify-between py-1.5 px-2 rounded-xs hover:bg-canvas-soft">
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <Icon size={16} className="text-brand flex-shrink-0" /> {categoryLabel(c.name)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEditCategory(c)} className="text-ink-secondary hover:text-brand">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteCategory(c)} className="text-red-400 hover:text-red-600">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setIsCategoryModalOpen(false)} className="btn btn-secondary">{t('common.close')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Services;