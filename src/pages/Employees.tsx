import { useState, useEffect, useCallback } from 'react';
import { User, Plus, Star, Scissors, Pencil, Trash2 } from 'lucide-react';
import { employeeApi, reviewApi, clientApi } from '../api';
import { Employee, Client, Review } from '../api/types';
import Modal from '../components/Modal';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const DAY_LABELS: Record<'uk' | 'en', Record<typeof DAY_KEYS[number], string>> = {
  uk: { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд' },
  en: { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' },
};

const OFF = 'Вихідний';

const defaultSchedule = {
  mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00',
  thu: '09:00-18:00', fri: '09:00-18:00', sat: '10:00-16:00', sun: OFF,
};

const defaultForm = {
  name: '', phone: '', email: '',
  role: 'Barber' as Employee['role'],
  hourlyRate: 0, isAvailable: true,
  specialties: '', bio: '',
  schedule: { ...defaultSchedule },
};

const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-line-medium'}/>
    ))}
  </div>
);

const Employees = () => {
  const { t, lang } = useLocale();
  const DAYS = DAY_KEYS.map(key => ({ key, label: DAY_LABELS[lang][key] }));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients,   setClients]   = useState<Client[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string|null>(null);

  // add/edit modal
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [editingEmployee,setEditingEmployee]= useState<Employee|null>(null);
  const [formData,       setFormData]       = useState(defaultForm);
  const [saving,         setSaving]         = useState(false);

  // reviews modal
  const [reviewsEmp,    setReviewsEmp]    = useState<Employee|null>(null);
  const [reviews,       setReviews]       = useState<Review[]>([]);
  const [reviewsLoading,setReviewsLoading]= useState(false);
  const [newReview,     setNewReview]     = useState({ rating: 5, text: '', clientId: '' });
  const [addingReview,  setAddingReview]  = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setEmployees(await employeeApi.getAll());
    } catch { setError(t('employees.fetchError')); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { clientApi.getAll().then(setClients).catch(() => setClients([])); }, []);

  // ── open add/edit ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingEmployee(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name, phone: emp.phone, email: emp.email,
      role: emp.role, hourlyRate: emp.hourlyRate,
      isAvailable: emp.isAvailable,
      specialties: emp.specialties?.join(', ') || '',
      bio: emp.bio || '',
      schedule: emp.schedule
        ? { ...defaultSchedule, ...emp.schedule }
        : { ...defaultSchedule },
    });
    setIsModalOpen(true);
  };

  // ── schedule helpers ───────────────────────────────────────────────────────
  const toggleDay = (day: keyof typeof defaultSchedule) => {
    const cur = formData.schedule[day];
    setFormData(p => ({
      ...p,
      schedule: {
        ...p.schedule,
        [day]: cur === OFF ? '09:00-18:00' : OFF,
      },
    }));
  };

  const setDayHours = (day: keyof typeof defaultSchedule, value: string) => {
    setFormData(p => ({
      ...p,
      schedule: { ...p.schedule, [day]: value },
    }));
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert(t('employees.fillRequired')); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editingEmployee) {
        await employeeApi.update(editingEmployee._id, payload);
      } else {
        await employeeApi.create(payload);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(getErrorMessage(err) || t('employees.saveError'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('employees.deleteConfirm'))) return;
    try {
      await employeeApi.delete(id);
      setEmployees(p => p.filter(e => e._id !== id));
    } catch { alert(t('employees.deleteError')); }
  };

  // ── reviews ────────────────────────────────────────────────────────────────
  const openReviews = async (emp: Employee) => {
    setReviewsEmp(emp);
    setReviewsLoading(true);
    try {
      const data = await reviewApi.getAll();
      setReviews(data.filter((r) => {
        const eid = typeof r.employee === 'object' ? r.employee._id : r.employee;
        return eid === emp._id;
      }));
    } catch { setReviews([]); }
    finally { setReviewsLoading(false); }
  };

  const submitReview = async () => {
    if (!reviewsEmp) return;
    if (!newReview.clientId) {
      alert(t('employees.chooseClientForReview'));
      return;
    }
    setAddingReview(true);
    try {
      await reviewApi.create({
        employee: reviewsEmp._id,
        client: newReview.clientId,
        rating: newReview.rating,
        comment: newReview.text,
      });
      setNewReview({ rating: 5, text: '', clientId: '' });
      openReviews(reviewsEmp);
      fetchEmployees();
    } catch (err) {
      alert(getErrorMessage(err) || t('appointments.genericError'));
    } finally { setAddingReview(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center">
          <User size={24} className="mr-2 text-brand"/> {t('employees.title')}
        </h1>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={18}/> {t('employees.addNew')}
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-ink-muted">{t('common.loading')}</div>
      : error   ? <div className="text-center py-8 text-red-500">{error}</div>
      : employees.length === 0 ? <div className="text-center py-8 text-ink-muted">{t('employees.notFound')}</div>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div key={emp._id} className="ds-card overflow-hidden flex flex-col">

              {/* Header */}
              <div className="p-5 flex items-start gap-4">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=128`}
                  alt={emp.name} className="h-14 w-14 rounded-full flex-shrink-0 ring-1 ring-line"/>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-ink truncate">{emp.name}</h3>
                  <p className="text-sm text-brand">{t(`roles.${emp.role}`)}</p>
                  <p className="text-xs text-ink-muted truncate">{emp.email}</p>
                  {(emp.rating || 0) > 0 ? (
                    <button onClick={() => openReviews(emp)}
                      className="flex items-center gap-1 mt-1 hover:opacity-80">
                      <Stars rating={emp.rating || 0}/>
                      <span className="text-xs text-ink-muted">
                        {(emp.rating || 0).toFixed(1)} ({emp.reviewCount || 0})
                      </span>
                    </button>
                  ) : (
                    <button onClick={() => openReviews(emp)}
                      className="text-xs text-ink-muted mt-1 hover:text-brand">
                      {t('employees.noReviews')}
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {emp.bio && (
                <div className="px-5 pb-2">
                  <p className="text-xs text-ink-muted italic">{emp.bio}</p>
                </div>
              )}

              {/* Specialties */}
              {(emp.specialties?.length || 0) > 0 && (
                <div className="px-5 pb-3 flex flex-wrap gap-1">
                  {emp.specialties.map((s, i) => (
                    <span key={i} className="badge badge-neutral">
                      <Scissors size={10}/>{s}
                    </span>
                  ))}
                </div>
              )}

              {/* Schedule */}
              <div className="px-5 pb-4">
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {DAYS.map(({ key, label }) => {
                    const val = emp.schedule?.[key as keyof typeof emp.schedule] || '';
                    const isOff = val === OFF || val === 'Off' || val === '';
                    return (
                      <div key={key}>
                        <p className="text-xs font-medium text-ink-muted">{label}</p>
                        <div className={`mt-0.5 py-0.5 rounded-xs text-xs ${isOff ? 'bg-red-50 text-red-500' : 'bg-brand-soft text-brand-dark'}`}>
                          {isOff ? '×' : '✓'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-line flex justify-between items-center mt-auto">
                <span className={`badge ${emp.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                  {emp.isAvailable ? t('employees.available') : t('employees.unavailable')}
                </span>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(emp)} className="text-ink-secondary hover:text-ink">
                    <Pencil size={15}/>
                  </button>
                  <button onClick={() => handleDelete(emp._id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? t('employees.editModalTitle') : t('employees.addModalTitle')}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">

          {[
            { label: t('employees.fieldName'),         key: 'name' as const,       type: 'text',   placeholder: 'Employee name' },
            { label: t('employees.fieldPhone'),        key: 'phone' as const,      type: 'tel',    placeholder: '+380...' },
            { label: t('employees.fieldEmail'),        key: 'email' as const,      type: 'email',  placeholder: 'email@example.com' },
            { label: t('employees.fieldHourlyRate'),key: 'hourlyRate' as const, type: 'number', placeholder: '0' },
            { label: t('employees.fieldSpecialties'), key: 'specialties' as const, type: 'text', placeholder: t('employees.fieldSpecialtiesPlaceholder') },
            { label: t('employees.fieldBio'),            key: 'bio' as const,        type: 'text',   placeholder: t('employees.fieldBioPlaceholder') },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input type={type}
                className="field-input"
                value={String(formData[key])}
                placeholder={placeholder}
                onChange={e => setFormData({ ...formData, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}/>
            </div>
          ))}

          <div>
            <label className="field-label">{t('employees.fieldRole')}</label>
            <select className="field-input"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as Employee['role'] })}>
              <option value="Barber">{t('roles.Barber')}</option>
              <option value="Receptionist">{t('roles.Receptionist')}</option>
              <option value="Manager">{t('roles.Manager')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAvailable" checked={formData.isAvailable}
              onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="rounded border-line text-brand focus:ring-brand"/>
            <label htmlFor="isAvailable" className="text-sm text-ink-secondary">{t('employees.availableForAppointments')}</label>
          </div>

          {/* Schedule editor */}
          <div>
            <label className="field-label mb-2">{t('employees.schedule')}</label>
            <div className="space-y-2">
              {DAYS.map(({ key, label }) => {
                const val = formData.schedule[key] || OFF;
                const isOff = val === OFF;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-ink-secondary w-6">{label}</span>
                    <button type="button"
                      onClick={() => toggleDay(key)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
                        ${isOff ? 'bg-line-medium' : 'bg-brand'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                        ${isOff ? 'translate-x-0' : 'translate-x-4'}`}/>
                    </button>
                    {isOff ? (
                      <span className="text-xs text-red-500">{t('appointments.dayOff')}</span>
                    ) : (
                      <input type="text"
                        className="flex-1 border border-line rounded-xs px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
                        value={val}
                        placeholder="09:00-18:00"
                        onChange={e => setDayHours(key, e.target.value)}/>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? t('common.saving') : editingEmployee ? t('common.save') : t('employees.addNew')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── REVIEWS MODAL ── */}
      <Modal isOpen={!!reviewsEmp} onClose={() => setReviewsEmp(null)}
        title={t('employees.reviewsTitle', { name: reviewsEmp?.name || '' })}>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">

          {/* Rating summary */}
          {reviewsEmp && (
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <span className="text-3xl font-bold text-ink tracking-tight">
                {(reviewsEmp.rating || 0).toFixed(1)}
              </span>
              <div>
                <Stars rating={reviewsEmp.rating || 0} size={16}/>
                <p className="text-xs text-ink-muted mt-0.5">{t('employees.reviewsCount', { count: reviewsEmp.reviewCount || 0 })}</p>
              </div>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <p className="text-sm text-center text-ink-muted py-4">{t('common.loading')}</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-center text-ink-muted py-4">{t('employees.noReviewsYet')}</p>
          ) : reviews.map(r => (
            <div key={r._id} className="border border-line rounded-sm p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">
                    {typeof r.client === 'object' ? r.client.name : t('employees.clientLabel')}
                  </span>
                  <Stars rating={r.rating} size={12}/>
                </div>
                <span className="text-xs text-ink-muted">
                  {new Date(r.date).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US')}
                </span>
              </div>
              {r.comment && <p className="text-sm text-ink-secondary">{r.comment}</p>}
            </div>
          ))}

          {/* Add review */}
          <div className="border-t border-line pt-3 space-y-2">
            <p className="text-sm font-semibold text-ink">{t('employees.addReview')}</p>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">{t('employees.reviewClientLabel')}</label>
              <select className="field-input"
                value={newReview.clientId}
                onChange={e => setNewReview(p => ({ ...p, clientId: e.target.value }))}>
                <option value="">{t('appointments.choosePlaceholder')}</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setNewReview(p => ({ ...p, rating: i }))}>
                  <Star size={20}
                    className={i <= newReview.rating ? 'text-amber-400 fill-amber-400' : 'text-line-medium'}/>
                </button>
              ))}
            </div>
            <textarea
              className="field-input"
              rows={2} placeholder={t('employees.reviewPlaceholder')}
              value={newReview.text}
              onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))}/>
            <button onClick={submitReview} disabled={addingReview} className="btn btn-primary w-full">
              {addingReview ? t('common.saving') : t('employees.leaveReview')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;