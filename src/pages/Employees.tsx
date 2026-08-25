import { useState, useEffect, useCallback } from 'react';
import { User, Plus, Star, Scissors, Pencil, UserX, UserCheck } from 'lucide-react';
import { employeeApi, reviewApi, clientApi, serviceApi, authApi } from '../api';
import { Employee, Client, Review, Service } from '../api/types';
import Modal from '../components/Modal';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';
import { useShopCurrency } from '../context/SettingsContext';
import { getCurrencySymbol } from '../constants/currencies';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const DAY_LABELS: Record<'uk' | 'en', Record<typeof DAY_KEYS[number], string>> = {
  uk: { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд' },
  en: { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' },
};

const defaultSchedule: Record<typeof DAY_KEYS[number], { isOpen: boolean; from: string; to: string }> = {
  mon: { isOpen: true,  from: '09:00', to: '18:00' },
  tue: { isOpen: true,  from: '09:00', to: '18:00' },
  wed: { isOpen: true,  from: '09:00', to: '18:00' },
  thu: { isOpen: true,  from: '09:00', to: '18:00' },
  fri: { isOpen: true,  from: '09:00', to: '18:00' },
  sat: { isOpen: true,  from: '10:00', to: '16:00' },
  sun: { isOpen: false, from: '10:00', to: '16:00' },
};

const formatRange = (d: { from: string; to: string }) => `${d.from}-${d.to}`;
const parseRange = (value: string) => {
  const [from, to] = value.split('-').map(s => s.trim());
  return { from: from || '09:00', to: to || '18:00' };
};

const defaultForm = {
  name: '', phone: '', email: '',
  role: 'Barber' as Employee['role'],
  customRoleLabel: '',
  hourlyRate: 0, isAvailable: true,
  specialties: '', bio: '',
  serviceIds: [] as string[],
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
  const currency = useShopCurrency();
  const DAYS = DAY_KEYS.map(key => ({ key, label: DAY_LABELS[lang][key] }));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients,   setClients]   = useState<Client[]>([]);
  const [services,  setServices]  = useState<Service[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deactivated'>('active');

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

  // create login modal
  const [loginEmp,    setLoginEmp]    = useState<Employee|null>(null);
  const [loginForm,   setLoginForm]   = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'barber' as 'admin' | 'barber' });
  const [loginSaving, setLoginSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setEmployees(await employeeApi.getAll());
    } catch { setError(t('employees.fetchError')); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { clientApi.getAll().then(setClients).catch(() => setClients([])); }, []);
  useEffect(() => { serviceApi.getAll().then(setServices).catch(() => setServices([])); }, []);

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
      role: emp.role, customRoleLabel: emp.customRoleLabel || '',
      hourlyRate: emp.hourlyRate,
      isAvailable: emp.isAvailable,
      specialties: emp.specialties?.join(', ') || '',
      bio: emp.bio || '',
      serviceIds: emp.services || [],
      schedule: emp.schedule
        ? { ...defaultSchedule, ...emp.schedule }
        : { ...defaultSchedule },
    });
    setIsModalOpen(true);
  };

  // ── schedule helpers ───────────────────────────────────────────────────────
  const toggleDay = (day: keyof typeof defaultSchedule) => {
    setFormData(p => ({
      ...p,
      schedule: {
        ...p.schedule,
        [day]: { ...p.schedule[day], isOpen: !p.schedule[day].isOpen },
      },
    }));
  };

  const setDayHours = (day: keyof typeof defaultSchedule, value: string) => {
    setFormData(p => ({
      ...p,
      schedule: { ...p.schedule, [day]: { ...p.schedule[day], ...parseRange(value) } },
    }));
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert(t('employees.fillRequired')); return;
    }
    setSaving(true);
    try {
      const { serviceIds, ...rest } = formData;
      const payload = {
        ...rest,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        services: serviceIds,
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

  const handleDeactivate = async (id: string) => {
    if (!confirm(t('employees.deactivateConfirm'))) return;
    try {
      const updated = await employeeApi.deactivate(id);
      setEmployees(p => p.map(e => e._id === id ? updated : e));
    } catch (err) { alert(getErrorMessage(err) || t('employees.deactivateError')); }
  };

  const handleReactivate = async (id: string) => {
    try {
      const updated = await employeeApi.reactivate(id);
      setEmployees(p => p.map(e => e._id === id ? updated : e));
    } catch (err) { alert(getErrorMessage(err) || t('employees.reactivateError')); }
  };

  // ── create / manage login ───────────────────────────────────────────────────
  const isManageMode = !!loginEmp?.userId;

  const openLogin = (emp: Employee) => {
    setLoginEmp(emp);
    setLoginForm({
      name: emp.name,
      email: emp.email,
      password: '',
      confirmPassword: '',
      role: emp.role === 'Manager' ? 'admin' : 'barber',
    });
  };

  const submitLogin = async () => {
    if (!loginEmp) return;

    if (isManageMode) {
      if (loginForm.password && loginForm.password !== loginForm.confirmPassword) {
        alert(t('employees.passwordMismatch')); return;
      }
      setLoginSaving(true);
      try {
        await authApi.updateStaffLogin(loginEmp._id, {
          role: loginForm.role,
          password: loginForm.password || undefined,
        });
        setLoginEmp(null);
      } catch (err) {
        alert(getErrorMessage(err) || t('employees.updateLoginError'));
      } finally { setLoginSaving(false); }
      return;
    }

    if (!loginForm.email || !loginForm.password) { alert(t('employees.fillRequired')); return; }
    if (loginForm.password !== loginForm.confirmPassword) { alert(t('employees.passwordMismatch')); return; }
    setLoginSaving(true);
    try {
      const { user } = await authApi.createStaffLogin({
        name: loginForm.name,
        email: loginForm.email,
        password: loginForm.password,
        role: loginForm.role,
        employeeId: loginEmp._id,
      });
      // Токен у відповіді належить щойно створеному співробітнику, а не
      // поточному адміну — свідомо не чіпаємо localStorage/AuthContext тут.
      setEmployees(prev => prev.map(e => e._id === loginEmp._id ? { ...e, userId: user.id } : e));
      setLoginEmp(null);
    } catch (err) {
      alert(getErrorMessage(err) || t('employees.createLoginError'));
    } finally { setLoginSaving(false); }
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
  const visibleEmployees = employees.filter(e =>
    activeTab === 'active' ? e.isActive !== false : e.isActive === false
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight flex items-center min-w-0">
          <User size={24} className="mr-2 text-brand flex-shrink-0"/> <span className="truncate">{t('employees.title')}</span>
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={18}/> <span className="hidden sm:inline">{t('employees.addNew')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm w-fit">
        {([['active', t('employees.tabActive')], ['deactivated', t('employees.tabDeactivated')]] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xs text-sm font-medium transition-all
              ${activeTab === tab ? 'bg-surface text-brand-dark shadow-sm' : 'text-ink-secondary hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-ink-muted">{t('common.loading')}</div>
      : error   ? <div className="text-center py-8 text-red-500">{error}</div>
      : visibleEmployees.length === 0 ? <div className="text-center py-8 text-ink-muted">{t('employees.notFound')}</div>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEmployees.map(emp => (
            <div key={emp._id} className={`ds-card overflow-hidden flex flex-col ${emp.isActive === false ? 'opacity-70' : ''}`}>

              {/* Header */}
              <div className="p-5 flex items-start gap-4">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=128`}
                  alt={emp.name} className="h-14 w-14 rounded-full flex-shrink-0 ring-1 ring-line"/>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-ink truncate">{emp.name}</h3>
                  <p className="text-sm text-brand">{emp.customRoleLabel?.trim() || t(`roles.${emp.role}`)}</p>
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

              {/* Призначені послуги */}
              {(emp.services?.length || 0) > 0 && (
                <div className="px-5 pb-3 flex flex-wrap gap-1">
                  {emp.services!.slice(0, 3).map(id => {
                    const svc = services.find(s => s._id === id);
                    return svc ? <span key={id} className="badge badge-neutral">{svc.name}</span> : null;
                  })}
                  {emp.services!.length > 3 && (
                    <span className="badge badge-neutral">+{emp.services!.length - 3}</span>
                  )}
                </div>
              )}

              {/* Schedule */}
              <div className="px-5 pb-4">
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {DAYS.map(({ key, label }) => {
                    const daySchedule = emp.schedule?.[key as keyof typeof emp.schedule];
                    const isOff = !daySchedule || !daySchedule.isOpen;
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
                <div className="flex gap-1.5 flex-wrap">
                  <span className={`badge ${emp.isAvailable ? 'badge-success' : 'badge-muted'}`}>
                    {emp.isAvailable ? t('employees.available') : t('employees.unavailable')}
                  </span>
                  {emp.isActive === false && (
                    <span className="badge badge-danger">{t('employees.deactivated')}</span>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  {emp.isActive !== false && (
                    <button onClick={() => openLogin(emp)} className="text-xs text-brand hover:text-brand-dark font-medium">
                      {emp.userId ? t('employees.manageLogin') : t('employees.createLogin')}
                    </button>
                  )}
                  <button onClick={() => openEdit(emp)} className="text-ink-secondary hover:text-ink">
                    <Pencil size={15}/>
                  </button>
                  {emp.isActive === false ? (
                    <button onClick={() => handleReactivate(emp._id)} className="text-emerald-500 hover:text-emerald-700" title={t('employees.reactivate')}>
                      <UserCheck size={15}/>
                    </button>
                  ) : (
                    <button onClick={() => handleDeactivate(emp._id)} className="text-red-400 hover:text-red-600" title={t('employees.deactivate')}>
                      <UserX size={15}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? t('employees.editModalTitle') : t('employees.addModalTitle')} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {[
                { label: t('employees.fieldName'),         key: 'name' as const,       type: 'text',   placeholder: 'Employee name' },
                { label: t('employees.fieldPhone'),        key: 'phone' as const,      type: 'tel',    placeholder: '+380...' },
                { label: t('employees.fieldEmail'),        key: 'email' as const,      type: 'email',  placeholder: 'email@example.com' },
                { label: `${t('employees.fieldHourlyRate')} (${getCurrencySymbol(currency)})`, key: 'hourlyRate' as const, type: 'number', placeholder: '0' },
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
                <label className="field-label">{t('employees.fieldServices')}</label>
                <p className="text-xs text-ink-muted mb-1">{t('employees.fieldServicesHint')}</p>
                <div className="border border-line rounded-sm p-2 max-h-40 overflow-y-auto space-y-1">
                  {services.map(s => (
                    <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-canvas-soft p-1 rounded-xs">
                      <input type="checkbox" className="rounded border-line text-brand focus:ring-brand"
                        checked={formData.serviceIds.includes(s._id)}
                        onChange={e => setFormData(p => ({
                          ...p,
                          serviceIds: e.target.checked ? [...p.serviceIds, s._id] : p.serviceIds.filter(id => id !== s._id),
                        }))}/>
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">{t('employees.fieldRole')}</label>
                <select className="field-input"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as Employee['role'] })}>
                  <option value="Barber">{t('roles.Barber')}</option>
                  <option value="Manager">{t('roles.Manager')}</option>
                </select>
              </div>

              <div>
                <label className="field-label">{t('employees.fieldCustomRole')}</label>
                <input type="text" className="field-input"
                  value={formData.customRoleLabel}
                  onChange={e => setFormData({ ...formData, customRoleLabel: e.target.value })}
                  placeholder={t('employees.fieldCustomRolePlaceholder')} />
                <p className="text-xs text-ink-muted mt-1.5">{t('employees.fieldCustomRoleHint')}</p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isAvailable" checked={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded border-line text-brand focus:ring-brand"/>
                <label htmlFor="isAvailable" className="text-sm text-ink-secondary">{t('employees.availableForAppointments')}</label>
              </div>
            </div>

            {/* Schedule editor */}
            <div>
              <label className="field-label mb-2">{t('employees.schedule')}</label>
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const day = formData.schedule[key];
                  const isOff = !day.isOpen;
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
                          className="flex-1 bg-surface text-ink border border-line rounded-xs px-2 py-1 text-xs placeholder:text-ink-muted dark:placeholder:text-ink-secondary focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
                          defaultValue={formatRange(day)}
                          placeholder="09:00-18:00"
                          onBlur={e => setDayHours(key, e.target.value)}/>
                      )}
                    </div>
                  );
                })}
              </div>
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
        title={t('employees.reviewsTitle', { name: reviewsEmp?.name || '' })} size="lg">
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

      {/* ── CREATE / MANAGE LOGIN MODAL ── */}
      <Modal isOpen={!!loginEmp} onClose={() => setLoginEmp(null)}
        title={isManageMode
          ? t('employees.manageLoginModalTitle', { name: loginEmp?.name || '' })
          : t('employees.createLoginModalTitle', { name: loginEmp?.name || '' })} size="lg">
        <div className="space-y-3">
          {!isManageMode && (
            <>
              <div>
                <label className="field-label">{t('employees.fieldName')}</label>
                <input className="field-input" value={loginForm.name}
                  onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))}/>
              </div>
              <div>
                <label className="field-label">{t('employees.fieldEmail')}</label>
                <input type="email" className="field-input" value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}/>
              </div>
            </>
          )}
          <div>
            <label className="field-label">{t('employees.fieldLoginRole')}</label>
            <select className="field-input" value={loginForm.role}
              onChange={e => setLoginForm(p => ({ ...p, role: e.target.value as 'admin' | 'barber' }))}>
              <option value="barber">{t('employees.loginRoleBarber')}</option>
              <option value="admin">{t('employees.loginRoleAdmin')}</option>
            </select>
          </div>
          <div>
            <label className="field-label">
              {isManageMode ? t('employees.fieldNewPassword') : t('employees.fieldPassword')}
            </label>
            <input type="password" className="field-input" value={loginForm.password}
              placeholder={isManageMode ? t('employees.leavePasswordBlank') : ''}
              onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}/>
          </div>
          {(!isManageMode || loginForm.password) && (
            <div>
              <label className="field-label">{t('employees.fieldConfirmPassword')}</label>
              <input type="password" className="field-input" value={loginForm.confirmPassword}
                onChange={e => setLoginForm(p => ({ ...p, confirmPassword: e.target.value }))}/>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setLoginEmp(null)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={submitLogin} disabled={loginSaving} className="btn btn-primary">
              {loginSaving ? t('common.saving') : isManageMode ? t('common.save') : t('employees.createLogin')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;