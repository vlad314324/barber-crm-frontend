import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Calendar, ChevronLeft, ChevronRight, Plus, UserPlus, Download, Upload, MessageSquare, MoreVertical, Coffee, CalendarDays, Sparkles, Clock } from 'lucide-react';
import { appointmentApi, clientApi, employeeApi, serviceApi, breakApi } from '../api';
import api from '../api';
import { Appointment, Client, Employee, Service, ShopSettings, ImportResult, EmployeeBreak } from '../api/types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';
import { downloadBlob } from '../utils/download';
import { useShopCurrency, useShopServiceRangesEnabled, useShopDurationUnit } from '../context/SettingsContext';
import { formatPrice, formatPriceRange, discounted } from '../utils/money';
import { formatDurationRangeForUnit } from '../utils/duration';
import { getCurrencySymbol } from '../constants/currencies';
import DurationInput from '../components/DurationInput';
import ClientPicker from '../components/ClientPicker';
import PhoneInput from '../components/PhoneInput';
import ServicePicker from '../components/ServicePicker';
import { errorFieldClass } from '../utils/formValidation';
import { effectiveService, effectiveServices } from '../utils/employeePricing';
import ScheduleGrid, { ScheduleColumn, HeaderMenuItem } from '../components/schedule/ScheduleGrid';
import { BREAK_PATTERN, toMin, validateBreaks, isActive } from '../components/schedule/scheduleTime';
import BreaksModal from '../components/schedule/BreaksModal';
import StoryModal from '../components/story/StoryModal';

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-slate-500 border-slate-600',
  Completed:  'bg-brand border-brand-dark',
  Cancelled:  'bg-amber-400 border-amber-500',
  'No-show':  'bg-red-400 border-red-500',
  Rescheduled: 'bg-sky-400 border-sky-500',
};

const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];

const parseDateLocal = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
// Понеділок тижня, що містить d (локальний час).
const weekStart = (d: Date) => {
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  n.setDate(n.getDate() - ((n.getDay() + 6) % 7));
  return n;
};
const addDays = (d: Date, k: number) => { const n = new Date(d); n.setDate(n.getDate() + k); return n; };
// "12 – 18 жовтня 2026 р." / "28 вересня – 4 жовтня 2026 р."
const formatWeekRange = (start: Date, lang: 'uk' | 'en') => {
  const end = addDays(start, 6);
  const loc = lang === 'uk' ? 'uk-UA' : 'en-US';
  const sameMonth = start.getMonth() === end.getMonth();
  const a = start.toLocaleDateString(loc, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' });
  const b = end.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
  return `${a} – ${b}`;
};
const formatDateLong = (d: Date, lang: 'uk' | 'en') =>
  d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

const MONTHS: Record<'uk' | 'en', string[]> = {
  uk: ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};
const DAYS_SHORT: Record<'uk' | 'en', string[]> = {
  uk: ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'],
  en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
};

const MiniCalendar = ({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) => {
  const { lang } = useLocale();
  const [view, setView] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const year = view.getFullYear(); const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length:days},(_,i)=>i+1)];
  while (cells.length % 7) cells.push(null);
  const today = new Date();

  return (
    <div className="ds-card p-3 w-56">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setView(new Date(year, month-1, 1))} className="p-1 rounded-xs hover:bg-canvas-soft"><ChevronLeft size={14}/></button>
        <span className="text-xs font-semibold text-ink-secondary">{MONTHS[lang][month]} {year}</span>
        <button onClick={() => setView(new Date(year, month+1, 1))} className="p-1 rounded-xs hover:bg-canvas-soft"><ChevronRight size={14}/></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT[lang].map(d => <div key={d} className="text-center text-xs text-ink-muted font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center">
            {d ? (
              <button onClick={() => onChange(new Date(year, month, d))}
                className={`w-7 h-7 rounded-full text-xs transition-colors
                  ${isSameDay(selected, new Date(year, month, d)) ? 'bg-brand text-white font-semibold'
                    : isSameDay(today, new Date(year, month, d)) ? 'border border-brand text-brand-dark font-medium hover:bg-brand-extra-soft'
                    : 'text-ink-secondary hover:bg-canvas-soft'}`}>
                {d}
              </button>
            ) : <div className="w-7 h-7"/>}
          </div>
        ))}
      </div>
    </div>
  );
};

const defaultAdd = {
  clientId:'', employeeId:'', serviceIds:[] as string[],
  date: dateStr(new Date()), startTime:'09:00', totalDuration:30, prepTime:0, totalPrice:0,
};
const defaultNC = { name:'', phone:'', email:'', instagram:'', birthday:'' };

interface EditApptForm {
  clientId: string;
  employeeId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  totalDuration: number;
  prepTime: number;
  totalPrice: number;
  status: Appointment['status'];
}
const defaultEdit: EditApptForm = {
  clientId:'', employeeId:'', serviceIds:[],
  date: dateStr(new Date()), startTime:'09:00', totalDuration:30, prepTime:0, totalPrice:0,
  status: 'Scheduled',
};

const Appointments = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { t, lang } = useLocale();
  const currency = useShopCurrency();
  const rangesEnabled = useShopServiceRangesEnabled();
  const durationUnit = useShopDurationUnit();
  const durationLabels = { hour: t('services.hours'), minute: t('services.minutes') };
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients,      setClients]      = useState<Client[]>([]);
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [services,     setServices]     = useState<Service[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState('');
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  // Режим календаря: день (колонки — майстри) або тиждень одного майстра.
  const [view, setView] = useState<'day' | 'week'>('day');
  const [weekEmployeeId, setWeekEmployeeId] = useState('');
  const [breaks, setBreaks] = useState<EmployeeBreak[]>([]);
  const [breakTarget, setBreakTarget] = useState<{ employee: Employee; date: Date } | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  // Модалка "Новий запис" вміє ще й ставити паузу майстру (той самий
  // майстер/дата/час, замість окремого діалогу перерв).
  const [addMode, setAddMode] = useState<'appointment' | 'pause'>('appointment');
  const [pauseEnd, setPauseEnd] = useState('');
  const [pauseComment, setPauseComment] = useState('');
  // Помилки форми запису — під полями, а не alert().
  const [addErrors, setAddErrors] = useState<Set<'client' | 'master' | 'services'>>(new Set());
  const [addError, setAddError] = useState('');
  const [addManual, setAddManual] = useState(false);
  const clearAddError = (f: 'client' | 'master' | 'services') =>
    setAddErrors(prev => { if (!prev.has(f)) return prev; const n = new Set(prev); n.delete(f); return n; });
  const resetAddForm = () => { setAddErrors(new Set()); setAddError(''); setAddManual(false); };
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [addForm,   setAddForm]   = useState(defaultAdd);
  const [saving,    setSaving]    = useState(false);
  const [addingNC,  setAddingNC]  = useState(false);
  const [newClient, setNewClient] = useState(defaultNC);
  const [phoneMatch,setPhoneMatch]= useState<Client|null>(null);

  const [editAppt,   setEditAppt]   = useState<Appointment|null>(null);
  const [editForm,   setEditForm]   = useState<EditApptForm>(defaultEdit);
  const [editSaving, setEditSaving] = useState(false);
  const [noteText,   setNoteText]   = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Меню "Ще" — на вузьких екранах ховає Експорт/Імпорт за іконкою замість
  // того, щоб вони тіснили заголовок і кнопку "Новий запис".
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [a, c, e, s, settings] = await Promise.all([
        appointmentApi.getAll(), clientApi.getAll(),
        employeeApi.getAll(), serviceApi.getAll(),
        api.get('/settings').then(r => r.data),
      ]);
      setAppointments(a); setClients(c); setEmployees(e); setServices(s);
      setShopSettings(settings);
    } catch(err){
      // Раніше збій тут лише логувався в консоль, а сторінка мовчки
      // лишалась із порожнім календарем — невідмінно від "у салону взагалі
      // немає записів". Тепер показуємо явну помилку з повторною спробою.
      setLoadError(getErrorMessage(err) || t('appointments.loadError'));
    }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Перерви — лише для видимого діапазону (день або Пн–Нд).
  const rangeFrom = view === 'week' ? weekStart(currentDate) : currentDate;
  const rangeTo = view === 'week' ? addDays(rangeFrom, 6) : currentDate;
  const rangeKey = `${dateStr(rangeFrom)}_${dateStr(rangeTo)}`;
  const fetchBreaks = useCallback(async () => {
    const [from, to] = rangeKey.split('_');
    try { setBreaks(await breakApi.list(from, to)); } catch { setBreaks([]); }
  }, [rangeKey]);
  useEffect(() => { fetchBreaks(); }, [fetchBreaks]);

  const handleExport = async () => {
    try {
      downloadBlob(await appointmentApi.export(), `appointments-${Date.now()}.xlsx`);
    } catch {
      alert(t('common.exportError'));
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      setImportResult(await appointmentApi.import(file));
      fetchAll();
    } catch (err) {
      alert(getErrorMessage(err) || t('common.importError'));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const barbers = employees.filter(e => e.role === 'Barber');
  // Деактивованих не можна призначати на нові/існуючі записи — окрім випадку,
  // коли редагується запис, вже призначений на деактивованого майстра (щоб
  // не втратити можливість переглянути/зберегти цей запис без примусової
  // зміни майстра).
  const assignableBarbers = barbers.filter(e => e.isActive !== false);
  const editAssignedEmployee = editAppt && typeof editAppt.employee === 'object' ? editAppt.employee : null;
  const editBarbers = editAssignedEmployee && editAssignedEmployee.isActive === false
    && !assignableBarbers.some(b => b._id === editAssignedEmployee._id)
    ? [...assignableBarbers, editAssignedEmployee]
    : assignableBarbers;

  // ── day off check ─────────────────────────────────────────────────────────
  const DAY_KEYS_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const isDayOff = (emp: Employee, date: Date): boolean => {
  const dayKeyFull = DAY_KEYS_FULL[date.getDay()];

  // Перевірка 1 — заклад закритий
  if (shopSettings?.workingHours) {
    const shopDay = shopSettings.workingHours[dayKeyFull];
    if (!shopDay || !shopDay.isOpen) return true;
  }

  // Перевірка 2 — вихідний конкретного майстра
  const empDayKey = DAY_KEYS[date.getDay()];
  const val = emp.schedule?.[empDayKey as keyof typeof emp.schedule];
  if (!val || !val.isOpen) return true;

  return false;
};

  const clientName = (ref: string | Client | null | undefined) => {
    if (!ref) return t('appointments.client');
    if (typeof ref === 'object') return ref.name || t('appointments.client');
    return clients.find(c => c._id === ref)?.name || t('appointments.client');
  };
  
  const svcNames = (refs: (string | Service)[] | null | undefined) => {
    if (!refs || refs.length === 0) return '';
    return refs.map(r => {
      if (!r) return '?';
      return typeof r === 'object' ? r.name : services.find(s => s._id === r)?.name || '?';
    }).join(', ');
  };
  const apptDate = (a: Appointment) =>
    typeof a.date === 'string' ? parseDateLocal(a.date.slice(0,10)) : new Date(a.date);

  const apptsFor = (id: string, date: Date) => appointments.filter(a => {
    // a.employee може бути null, якщо майстра видалили (а не деактивували)
    // після створення запису — typeof null === 'object', тож без явної
    // перевірки на null тут би впало з винятком.
    const eid = a.employee && typeof a.employee === 'object' ? a.employee._id : a.employee;
    return eid === id && isSameDay(apptDate(a), date);
  });
  const apptsByBarber = (id: string) => apptsFor(id, currentDate);

  const breaksFor = (id: string, date: Date) =>
    breaks.filter(b => b.employee === id && b.date.slice(0, 10) === dateStr(date));

  // Майстер, прив'язаний до поточного логіна (для barber — "моя колонка").
  const myEmployee = employees.find(e => !!user?.employeeId && e._id === user.employeeId)
    || employees.find(e => e.userId && e.userId === user?.id);
  const canEditBreaks = (emp: Employee) => isAdmin || emp._id === myEmployee?._id;

  // Деактивований майстер зникає з колонок календаря на майбутні дати (щоб
  // на нього не можна було записати клієнта надалі), але лишається видимим
  // на сьогодні й у минулих датах — щоб історія записів у календарі не
  // зникала заднім числом. Якщо в деактивованого майстра вже є нескасований
  // запис саме на цю майбутню дату — колонка теж лишається, щоб цей запис
  // не загубився з очей.
  const todayNormalized = new Date(); todayNormalized.setHours(0,0,0,0);
  const currentDateNormalized = new Date(currentDate); currentDateNormalized.setHours(0,0,0,0);
  const isFutureDate = currentDateNormalized.getTime() > todayNormalized.getTime();
  const calendarBarbers = isFutureDate
    ? barbers.filter(e => e.isActive !== false || apptsByBarber(e._id).some(a => a.status !== 'Cancelled'))
    : barbers;

  // Інтервал [start, start+duration) перетинає інший запис або перерву майстра?
  // Записи займають ще й час на підготовку після себе; prep нового запису
  // не має налазити на інші записи (на перерву — можна).
  const isSlotBusy = (empId: string, slotTime: string, date: Date, duration = 1, excludeId?: string, prep = 0): boolean => {
    const s = toMin(slotTime);
    const e = s + Math.max(duration, 1);
    return apptsFor(empId, date).some(a => {
      if (excludeId && a._id === excludeId) return false;
      if (!isActive(a)) return false;
      const aStart = toMin(a.startTime);
      return s < aStart + a.totalDuration + (a.prepTime ?? 0) && aStart < e + prep;
    }) || breaksFor(empId, date).some(b => s < toMin(b.endTime) && toMin(b.startTime) < e);
  };

  const handleSlotClick = (empId: string, time: string, date: Date = currentDate) => {
    if (isSlotBusy(empId, time, date)) return;
    setAddForm({ ...defaultAdd, date: dateStr(date), startTime: time, employeeId: empId });
    setAddingNC(false); setNewClient(defaultNC); setPhoneMatch(null);
    setAddMode('appointment'); setPauseEnd(''); setPauseComment(''); resetAddForm();
    setIsAddOpen(true);
  };

  // ── колонки календаря ─────────────────────────────────────────────────────
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
  const today = new Date();
  const openBreaks = (employee: Employee, date: Date) => setBreakTarget({ employee, date });
  const breakMenuItem = (emp: Employee, date: Date) => canEditBreaks(emp)
    ? [{ label: t('appointments.addBreak'), icon: <Coffee size={15}/>, onClick: () => openBreaks(emp, date) }]
    : [];

  // Тиждень: активні майстри + обраний (навіть якщо його деактивували).
  const weekBarbers = barbers.filter(e => e.isActive !== false || e._id === weekEmployeeId);
  const weekEmployee = weekBarbers.find(b => b._id === weekEmployeeId)
    || (myEmployee && weekBarbers.find(b => b._id === myEmployee._id))
    || weekBarbers[0];

  const columnFor = (emp: Employee, date: Date, header: ReactNode, extraMenu: HeaderMenuItem[], key: string, highlight = false): ScheduleColumn => ({
    key,
    employeeId: emp._id,
    date,
    header,
    menuItems: [...breakMenuItem(emp, date), ...extraMenu],
    dayOff: isDayOff(emp, date),
    dayOffLabel: t('appointments.dayOff'),
    highlight,
    appointments: apptsFor(emp._id, date),
    breaks: breaksFor(emp._id, date),
    onSlotClick: time => handleSlotClick(emp._id, time, date),
    onBreakClick: canEditBreaks(emp) ? () => openBreaks(emp, date) : undefined,
  });

  const gridColumns: ScheduleColumn[] = view === 'day'
    ? calendarBarbers.map(emp => {
      const off = isDayOff(emp, currentDate);
      return columnFor(emp, currentDate, (
        <>
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=40`}
            alt={emp.name}
            className={`w-8 h-8 rounded-full mx-auto mb-1 ${off ? 'opacity-40 grayscale' : ''}`}/>
          <p className={`text-xs font-semibold truncate ${off ? 'text-ink-muted' : 'text-ink'}`}>{emp.name}</p>
          <p className="text-xs text-ink-muted truncate">{off ? `😴 ${t('appointments.dayOff')}` : (emp.customRoleLabel?.trim() || t(`roles.${emp.role}`))}</p>
        </>
      ), [{
        label: t('appointments.weekSchedule'),
        icon: <CalendarDays size={15}/>,
        onClick: () => { setWeekEmployeeId(emp._id); setView('week'); },
      }], emp._id);
    })
    : weekEmployee
      ? Array.from({ length: 7 }, (_, i) => addDays(weekStart(currentDate), i)).map(date => {
        const isToday = isSameDay(date, today);
        const off = isDayOff(weekEmployee, date);
        return columnFor(weekEmployee, date, (
          <>
            <p className={`text-xs capitalize ${isToday ? 'text-brand-dark font-semibold' : 'text-ink-muted'}`}>
              {date.toLocaleDateString(locale, { weekday: 'short' })}
            </p>
            <p className={`text-sm font-semibold ${isToday ? 'text-brand-dark' : off ? 'text-ink-muted' : 'text-ink'}`}>
              {date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
            </p>
            {off && <p className="text-xs text-ink-muted truncate">😴 {t('appointments.dayOff')}</p>}
          </>
        ), [], dateStr(date), isToday);
      })
      : [];

  // ── Перетягування записів у календарі ──
  // Лише заплановані; майстер — тільки свої і тільки у своїй колонці
  // (сервер перевіряє те саме, тут — щоб не показувати марний drag).
  const apptEmployeeId = (a: Appointment) =>
    a.employee && typeof a.employee === 'object' ? a.employee._id : (a.employee as unknown as string);
  const canDragAppt = (a: Appointment) =>
    a.status === 'Scheduled' && (isAdmin || (!!myEmployee && apptEmployeeId(a) === myEmployee._id));

  const canDropAppt = (a: Appointment, colKey: string, time: string) => {
    const col = gridColumns.find(c => c.key === colKey);
    if (!col || col.dayOff) return false;
    if (!isAdmin && col.employeeId !== myEmployee?._id) return false;
    if (col.employeeId !== apptEmployeeId(a)) {
      const allowed = new Set(allowedServices(col.employeeId).map(s => s._id));
      if (!a.services.every(s => allowed.has(typeof s === 'object' ? s._id : s))) return false;
    }
    return !isSlotBusy(col.employeeId, time, col.date, a.totalDuration, a._id, a.prepTime ?? 0);
  };

  const handleApptDrop = async (a: Appointment, colKey: string, time: string) => {
    const col = gridColumns.find(c => c.key === colKey);
    if (!col) return;
    const emp = employees.find(e => e._id === col.employeeId);
    const ok = window.confirm(t('appointments.moveConfirm', {
      name: clientName(a.client),
      date: col.date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' }),
      time,
      master: emp?.name || '',
    }));
    if (!ok) return;
    const masterChanged = col.employeeId !== apptEmployeeId(a);
    const prev = appointments;
    // Одразу ставимо блок на нове місце, сервер підтвердить або відкотимо.
    setAppointments(list => list.map(x => x._id === a._id
      ? { ...x, date: dateStr(col.date), startTime: time, employee: emp ?? x.employee }
      : x));
    try {
      await appointmentApi.update(a._id, {
        employee: col.employeeId, date: dateStr(col.date), startTime: time,
        // З іншим майстром сервер перевірить, що він надає ці послуги.
        ...(masterChanged ? { services: a.services.map(s => (typeof s === 'object' ? s._id : s)) } : {}),
      });
      // Тихе оновлення: fetchAll показав би лоадер на всю сторінку.
      appointmentApi.getAll().then(setAppointments).catch(() => {});
    } catch (err) {
      setAppointments(prev);
      alert(getErrorMessage(err) || t('appointments.moveFailed'));
    }
  };

  const handlePhoneChange = (phone: string) => {
    setNewClient(p => ({ ...p, phone }));
    const digits = phone.replace(/\D/g,'');
    const match  = clients.find(c => c.phone.replace(/\D/g,'') === digits);
    setPhoneMatch(match || null);
  };

  const plusHour = (hhmm: string) => {
    const m = Math.min(toMin(hhmm || '09:00') + 60, 24 * 60 - 1);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  // Пауза дописується до вже наявних перерв майстра на цей день —
  // API зберігає набір перерв дня цілим (PUT /breaks/:employeeId/:date).
  const handleSavePause = async () => {
    if (!addForm.employeeId) { alert(t('appointments.fillClientMasterService')); return; }
    const newRow = { startTime: addForm.startTime, endTime: pauseEnd || plusHour(addForm.startTime), comment: pauseComment.trim() };
    const rows = [
      ...breaksFor(addForm.employeeId, parseDateLocal(addForm.date))
        .map(b => ({ startTime: b.startTime, endTime: b.endTime, comment: b.comment || '' })),
      newRow,
    ];
    const invalid = validateBreaks(rows);
    if (invalid) { alert(t(invalid)); return; }
    setSaving(true);
    try {
      await breakApi.saveDay(addForm.employeeId, addForm.date, rows);
      setIsAddOpen(false);
      fetchBreaks();
    } catch (err) { alert(getErrorMessage(err) || t('appointments.breaksSaveError')); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    const errs = new Set<'client' | 'master' | 'services'>();
    if (addingNC ? !phoneMatch && (!newClient.name || newClient.phone.replace(/\D/g, '').length < 7 || !newClient.email) : !addForm.clientId) errs.add('client');
    if (!addForm.employeeId) errs.add('master');
    if (addForm.serviceIds.length === 0) errs.add('services');
    setAddErrors(errs);
    setAddError('');
    if (errs.size > 0) return;
    const selectedBarber = barbers.find(e => e._id === addForm.employeeId);
    if (selectedBarber && isDayOff(selectedBarber, parseDateLocal(addForm.date))) {
      setAddError(t('appointments.dayOffAlert')); return;
    }
    setSaving(true);
    try {
      let clientId = addForm.clientId;
      if (addingNC) {
        if (phoneMatch) {
          clientId = phoneMatch._id;
        } else {
          const created = await clientApi.create(newClient);
          clientId = created._id;
          setClients(prev => [...prev, created]);
        }
      }
      await appointmentApi.create({
        client: clientId, employee: addForm.employeeId,
        services: addForm.serviceIds, date: addForm.date,
        startTime: addForm.startTime, totalDuration: addForm.totalDuration,
        prepTime: addForm.prepTime, totalPrice: addForm.totalPrice,
      });
      setIsAddOpen(false);
      fetchAll();
    } catch(err){ setAddError(getErrorMessage(err) || t('appointments.genericError')); }
    finally { setSaving(false); }
  };

  const serviceMeta = (s: Service) => ({
    price: rangesEnabled ? formatPriceRange(s.price, s.priceMax, currency) : formatPrice(s.price, currency),
    duration: formatDurationRangeForUnit(s.duration, rangesEnabled ? s.durationMax : undefined, durationUnit, durationLabels),
  });

  const openEdit = (appt: Appointment) => {
    const empId = appt.employee && typeof appt.employee === 'object' ? appt.employee._id : appt.employee;
    const cliId = appt.client && typeof appt.client === 'object'     ? appt.client._id   : appt.client;
    const svcIds = appt.services.map(s => typeof s==='object' ? s._id : s);
    setEditForm({
      clientId:cliId, employeeId:empId, serviceIds:svcIds,
      date: dateStr(parseDateLocal(typeof appt.date==='string' ? appt.date.slice(0,10) : new Date(appt.date).toISOString().slice(0,10))),
      startTime:appt.startTime, totalDuration:appt.totalDuration, prepTime:appt.prepTime ?? 0,
      totalPrice:appt.totalPrice, status:appt.status,
    });
    setEditAppt(appt);
    setNoteText('');
  };

  // Дозволяє відкрити конкретний запис при переході з посилання на
  // сповіщення про нове бронювання (`/appointments?appointmentId=...`).
  useEffect(() => {
    const id = searchParams.get('appointmentId');
    if (!id || appointments.length === 0) return;
    const appt = appointments.find(a => a._id === id);
    if (appt) {
      setCurrentDate(new Date(appt.date));
      openEdit(appt);
    }
    setSearchParams(prev => { prev.delete('appointmentId'); return prev; }, { replace: true });
  }, [appointments, searchParams]);

  const handleEditSave = async () => {
    if (!editAppt) return;
    if (editForm.status !== 'Cancelled' && editForm.status !== 'Rescheduled'
      && isSlotBusy(editForm.employeeId, editForm.startTime, parseDateLocal(editForm.date), editForm.totalDuration, editAppt._id, editForm.prepTime)) {
      alert(t('appointments.slotBusy')); return;
    }
    setEditSaving(true);
    try {
      await appointmentApi.update(editAppt._id, {
        client:editForm.clientId, employee:editForm.employeeId,
        services:editForm.serviceIds, date:editForm.date,
        startTime:editForm.startTime, totalDuration:editForm.totalDuration, prepTime:editForm.prepTime,
        totalPrice:editForm.totalPrice, status:editForm.status,
      });
      setEditAppt(null);
      fetchAll();
    } catch(err){ alert(getErrorMessage(err) || t('appointments.genericError')); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id:string) => {
    if (!confirm(t('appointments.deleteConfirm'))) return;
    try {
      await appointmentApi.delete(id);
      setAppointments(prev => prev.filter(a => a._id !== id));
      setEditAppt(null);
    } catch { alert(t('appointments.genericError')); }
  };

  const handleAddNote = async () => {
    if (!editAppt || !noteText.trim()) return;
    setAddingNote(true);
    try {
      const updated = await appointmentApi.addNote(editAppt._id, noteText.trim());
      setEditAppt(updated);
      setNoteText('');
    } catch (err) { alert(getErrorMessage(err) || t('appointments.genericError')); }
    finally { setAddingNote(false); }
  };

  // Ціна й тривалість — обраного майстра (індивідуальні, якщо задані).
  const totalsFor = (ids: string[], employeeId: string) => {
    const emp = employees.find(e => e._id === employeeId);
    const priced = (id: string) => {
      const svc = services.find(sv => sv._id === id);
      return svc ? effectiveService(svc, emp) : undefined;
    };
    const totalPrice = ids.reduce((s,id) => s + (priced(id)?.price||0), 0);
    const totalDuration = ids.reduce((s,id) => {
      const svc = priced(id);
      if (!svc) return s;
      return s + (rangesEnabled ? (svc.durationMax ?? svc.duration) : svc.duration);
    }, 0);
    // Кілька послуг — одна підготовка після візиту, найбільша з них.
    const prepTime = ids.reduce((m,id) => Math.max(m, services.find(sv => sv._id === id)?.prepTime ?? 0), 0);
    return { totalPrice, totalDuration: totalDuration || 30, prepTime };
  };

  // Додаткові без своєї основної серед обраних — прибираються.
  const pruneAddons = (ids: string[]) => {
    const mainIds = new Set(ids.filter(id => !services.find(s => s._id === id)?.isAddon));
    return ids.filter(id => {
      const svc = services.find(s => s._id === id);
      return !svc?.isAddon || (svc.addonFor || []).some(p => mainIds.has(p));
    });
  };
  // Додаткову можна відмітити лише разом з її основною.
  const addonLocked = (s: Service, ids: string[]) =>
    !!s.isAddon && !ids.includes(s._id) && !(s.addonFor || []).some(p => ids.includes(p));

  const toggleService = (ids: string[], svcId: string, isAdd: boolean, employeeId: string) => {
    const next = pruneAddons(isAdd ? [...ids, svcId] : ids.filter(id => id !== svcId));
    return { ids: next, ...totalsFor(next, employeeId) };
  };

  // Порожній/невизначений emp.services означає "без обмежень" — майстер
  // може виконувати всі послуги, доки адмін явно щось не призначить.
  const allowedServices = (employeeId: string): Service[] => {
    const emp = employees.find(e => e._id === employeeId);
    const list = !emp || !emp.services || emp.services.length === 0
      ? services.filter(s => s.isAvailable)
      : services.filter(s => s.isAvailable && emp.services!.includes(s._id));
    // Кожна основна, під нею — її додаткові (один раз, під першою основною).
    const mains = list.filter(s => !s.isAddon);
    const used = new Set<string>();
    const ordered = mains.flatMap(m => {
      const own = list.filter(a => a.isAddon && !used.has(a._id) && a.addonFor?.includes(m._id));
      own.forEach(a => used.add(a._id));
      return [m, ...own];
    });
    return effectiveServices(ordered, emp);
  };

  const statusLabel = (status: string) => t(`statuses.${status}`);

  if (loading) return <div className="text-center py-12 text-ink-muted">{t('common.loading')}</div>;
  if (loadError) return (
    <div className="text-center py-12">
      <p className="text-sm text-red-600 mb-3">{loadError}</p>
      <button onClick={fetchAll} className="btn btn-secondary">{t('common.retry')}</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight flex items-center min-w-0">
          <Calendar size={24} className="mr-2 text-brand flex-shrink-0"/> <span className="truncate">{t('appointments.title')}</span>
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Експорт/імпорт — admin-only (сервер теж це вимагає, PUT/GET на цих ручках) */}
          {isAdmin && (
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={handleExport} className="btn btn-secondary">
              <Download size={16}/> {t('common.export')}
            </button>
            <button onClick={() => importFileInputRef.current?.click()} className="btn btn-secondary" disabled={importing}>
              <Upload size={16}/> {importing ? t('common.importing') : t('common.import')}
            </button>
          </div>
          )}

          {/* Мобільне меню "Ще" — Експорт/Імпорт за іконкою нижче sm */}
          {isAdmin && (
          <div ref={actionsMenuRef} className="relative sm:hidden">
            <button onClick={() => setShowActionsMenu(v => !v)} className="btn btn-secondary p-2" aria-label={t('common.more')}>
              <MoreVertical size={16}/>
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-line rounded-md shadow-lg z-30 overflow-hidden">
                <button onClick={() => { handleExport(); setShowActionsMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-canvas-soft">
                  <Download size={15}/> {t('common.export')}
                </button>
                <button onClick={() => { importFileInputRef.current?.click(); setShowActionsMenu(false); }} disabled={importing}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-canvas-soft">
                  <Upload size={15}/> {importing ? t('common.importing') : t('common.import')}
                </button>
              </div>
            )}
          </div>
          )}

          {isAdmin && (
          <input ref={importFileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFileChange}/>
          )}
          {(isAdmin || myEmployee) && (
          <button onClick={() => setIsStoryOpen(true)} className="btn btn-secondary" title={t('story.modalTitle')}>
            <Sparkles size={16}/> <span className="hidden sm:inline">{t('story.button')}</span>
          </button>
          )}
          {(isAdmin || myEmployee) && (
          <button
            onClick={() => { setAddForm({...defaultAdd, date:dateStr(currentDate), employeeId: isAdmin ? '' : (myEmployee?._id || '')}); setAddingNC(false); setAddMode('appointment'); setPauseEnd(''); setPauseComment(''); resetAddForm(); setIsAddOpen(true); }}
            className="btn btn-primary">
            <Plus size={16}/> <span className="hidden sm:inline">{t('appointments.addNew')}</span>
          </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
        {/* Left panel */}
        <div className="flex-shrink-0 space-y-3">
          <MiniCalendar selected={currentDate} onChange={d => setCurrentDate(d)}/>
          <div className="space-y-1.5 pl-1">
            {Object.entries(STATUS_COLORS).map(([s,cls]) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${cls.split(' ')[0]}`}/>
                <span className="text-xs text-ink-muted">{statusLabel(s)}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-canvas-soft"/>
              <span className="text-xs text-ink-muted">{t('appointments.dayOff')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm flex-shrink-0 border border-line" style={{ background: BREAK_PATTERN }}/>
              <span className="text-xs text-ink-muted">{t('appointments.breakLabel')}</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 ds-card overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-line flex flex-wrap items-center gap-2">
            <button onClick={() => setCurrentDate(d => addDays(d, view === 'week' ? -7 : -1))}
              aria-label={t('appointments.prev')}
              className="p-1.5 rounded-xs hover:bg-canvas-soft"><ChevronLeft size={18}/></button>
            <span className="text-base font-semibold text-ink capitalize min-w-0 truncate">
              {view === 'week' ? formatWeekRange(weekStart(currentDate), lang) : formatDateLong(currentDate, lang)}
            </span>
            <button onClick={() => setCurrentDate(d => addDays(d, view === 'week' ? 7 : 1))}
              aria-label={t('appointments.next')}
              className="p-1.5 rounded-xs hover:bg-canvas-soft"><ChevronRight size={18}/></button>
            <button onClick={() => setCurrentDate(new Date())}
              className="ml-1 px-3 py-1 text-xs border border-line rounded-xs hover:bg-canvas-soft">
              {t('appointments.todayBtn')}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              {view === 'week' && isAdmin && (
                <select value={weekEmployee?._id || ''} onChange={e => setWeekEmployeeId(e.target.value)}
                  aria-label={t('appointments.master')}
                  className="field-input py-1 text-sm w-auto max-w-[200px]">
                  {weekBarbers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              )}
              <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm" role="group">
                {(['day', 'week'] as const).map(v => (
                  <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                    className={`px-3 py-1 rounded-xs text-xs font-medium whitespace-nowrap transition-colors ${
                      view === v ? 'bg-surface text-brand-dark shadow-sm' : 'text-ink-secondary hover:text-ink'}`}>
                    {t(v === 'day' ? 'appointments.viewDay' : 'appointments.viewWeek')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ScheduleGrid
            columns={gridColumns}
            emptyText={isAdmin ? t('appointments.noBarbers') : t('appointments.notLinked')}
            breakLabel={t('appointments.breakLabel')}
            prepLabel={min => t('appointments.prepLabel', { min })}
            onAppointmentClick={openEdit}
            canDrag={canDragAppt}
            canDrop={canDropAppt}
            onAppointmentDrop={handleApptDrop}
            renderAppointment={(a, height) => {
              const color = STATUS_COLORS[a.status] || 'bg-brand border-brand-dark';
              return (
                <div className={`h-full rounded border-l-4 px-1.5 py-px text-white text-xs leading-[14px] cursor-pointer hover:opacity-90 shadow-sm overflow-hidden ${color}`}>
                  <p className="font-semibold truncate flex items-center gap-1">
                    {clientName(a.client)}
                    {(a.notes?.length ?? 0) > 0 && <MessageSquare size={11} className="shrink-0 opacity-90"/>}
                  </p>
                  {height >= 28 && <p className="truncate opacity-90">{svcNames(a.services)}</p>}
                  {height >= 44 && <p className="opacity-75">{a.startTime} · {formatPrice(a.totalPrice, currency)}</p>}
                </div>
              );
            }}
          />
        </div>
      </div>

      <BreaksModal
        employee={breakTarget?.employee ?? null}
        date={breakTarget?.date ?? null}
        dateKey={breakTarget ? dateStr(breakTarget.date) : ''}
        breaks={breakTarget ? breaksFor(breakTarget.employee._id, breakTarget.date) : []}
        onClose={() => setBreakTarget(null)}
        onSaved={fetchBreaks}
      />

      {/* ── ADD MODAL ── */}
      {isStoryOpen && (
        <StoryModal isOpen onClose={() => setIsStoryOpen(false)}
          employees={isAdmin ? barbers : (myEmployee ? [myEmployee] : [])}
          fixedEmployeeId={isAdmin ? undefined : myEmployee?._id}
          shopName={shopSettings?.shopName}/>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('appointments.newModalTitle')} size="xl"
        headerExtra={
          <div className="inline-flex gap-1 bg-canvas-soft p-1 rounded-sm mb-4" role="group">
            {(['appointment', 'pause'] as const).map(m => (
              <button key={m} type="button" onClick={() => setAddMode(m)} aria-pressed={addMode === m}
                className={`px-3.5 py-1.5 rounded-xs text-xs font-bold whitespace-nowrap transition-colors ${
                  addMode === m ? 'bg-surface text-brand-dark shadow-sm' : 'text-ink-secondary hover:text-ink'}`}>
                {t(m === 'appointment' ? 'appointments.modeAppointment' : 'appointments.modePause')}
              </button>
            ))}
          </div>
        }
        footer={addMode === 'pause' ? (<>
          <span className="flex-1 min-w-0 text-sm font-bold text-ink truncate">
            {t('appointments.modePause')} {addForm.startTime}–{pauseEnd || plusHour(addForm.startTime)}
          </span>
          <button onClick={() => setIsAddOpen(false)} className="btn btn-secondary">{t('common.cancel')}</button>
          <button onClick={handleSavePause} disabled={saving} className="btn btn-primary">
            {saving ? t('common.saving') : t('appointments.createPause')}
          </button>
        </>) : (<>
          <div className="flex-1 min-w-0">
            {addError
              ? <p className="text-sm font-semibold text-red-600">{addError}</p>
              : <>
                <p className="text-sm font-bold text-ink truncate">
                  {addForm.serviceIds.length > 0
                    ? t('appointments.summaryLine', { count: addForm.serviceIds.length, duration: formatDurationRangeForUnit(addForm.totalDuration, undefined, durationUnit, durationLabels), price: formatPrice(addForm.totalPrice, currency) })
                    : t('appointments.chooseServicesHint')}
                </p>
                <p className="text-xs text-ink-secondary truncate">
                  {parseDateLocal(addForm.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })} · {addForm.startTime}
                  {employees.find(e => e._id === addForm.employeeId) ? ` · ${employees.find(e => e._id === addForm.employeeId)!.name}` : ''}
                </p>
              </>}
          </div>
          <button onClick={() => setIsAddOpen(false)} className="btn btn-secondary">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? t('common.saving') : t('appointments.create')}
          </button>
        </>)}>
        {addMode === 'pause' ? (
          <div className="space-y-4">
            <div>
              <label className="field-label">{t('appointments.master')}</label>
              <select className="field-input disabled:opacity-70" disabled={!isAdmin}
                value={addForm.employeeId} onChange={e => setAddForm({...addForm, employeeId: e.target.value})}>
                <option value="">{t('appointments.masterChoosePlaceholder')}</option>
                {assignableBarbers.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label">{t('appointments.date')}</label>
                <input type="date" className="field-input"
                  value={addForm.date} onChange={e => setAddForm({...addForm, date:e.target.value})}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.breakFrom')}</label>
                <input type="time" step={300} className="field-input"
                  value={addForm.startTime} onChange={e => setAddForm({...addForm, startTime:e.target.value})}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.breakTo')}</label>
                <input type="time" step={300} className="field-input"
                  value={pauseEnd || plusHour(addForm.startTime)} onChange={e => setPauseEnd(e.target.value)}/>
              </div>
            </div>
            <div>
              <label className="field-label">{t('appointments.breakComment')}</label>
              <input type="text" maxLength={100} className="field-input" value={pauseComment}
                placeholder={t('appointments.breakCommentPlaceholder')} onChange={e => setPauseComment(e.target.value)}/>
            </div>
          </div>
        ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h4 className="form-section-title">{t('appointments.sectionClientMaster')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="field-label mb-0">{t('appointments.client')} <span className="text-red-500">*</span></label>
                  <button type="button" onClick={() => { setAddingNC(!addingNC); setPhoneMatch(null); setNewClient(defaultNC); clearAddError('client'); }}
                    className="text-xs font-bold text-brand-dark hover:text-brand flex items-center gap-1">
                    <UserPlus size={13}/> {addingNC ? t('appointments.chooseExisting') : t('appointments.newClient')}
                  </button>
                </div>
                {addingNC ? (
                  <div className={`border rounded-md p-3 bg-canvas-soft/60 space-y-2.5 ${addErrors.has('client') ? 'border-red-400' : 'border-line'}`}>
                    <PhoneInput value={newClient.phone} onChange={handlePhoneChange}/>
                    {phoneMatch ? (
                      <div className="bg-brand-soft border border-brand/30 rounded-sm p-2.5">
                        <p className="text-brand-dark text-sm font-semibold">✓ {t('appointments.found', { name: phoneMatch.name })}</p>
                        <p className="text-brand-dark text-xs">{phoneMatch.email}</p>
                        <p className="text-ink-secondary text-xs mt-0.5">{t('appointments.willUseExisting')}</p>
                      </div>
                    ) : (
                      <>
                        <input type="text" className="field-input" aria-label={t('appointments.nameLabel')}
                          placeholder={`${t('clients.fullName')} *`} value={newClient.name}
                          onChange={e => { setNewClient(p => ({...p, name:e.target.value})); clearAddError('client'); }}/>
                        <input type="email" className="field-input" aria-label={t('appointments.emailLabel')}
                          placeholder="Email *" value={newClient.email}
                          onChange={e => { setNewClient(p => ({...p, email:e.target.value})); clearAddError('client'); }}/>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="field-input flex items-center gap-0.5 min-w-0 focus-within:border-brand">
                            <span className="text-ink-muted">@</span>
                            <input type="text" className="flex-1 min-w-0 bg-transparent outline-none" aria-label={t('clients.instagram')}
                              placeholder="instagram" value={newClient.instagram}
                              onChange={e => setNewClient(p => ({...p, instagram:e.target.value.replace(/^@/, '')}))}/>
                          </div>
                          <input type="date" className="field-input min-w-0" aria-label={t('clients.birthday')} title={t('clients.birthday')}
                            value={newClient.birthday} max={new Date().toISOString().slice(0, 10)}
                            onChange={e => setNewClient(p => ({...p, birthday:e.target.value}))}/>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <ClientPicker clients={clients} value={addForm.clientId} invalid={addErrors.has('client')}
                    onChange={id => { setAddForm(f => ({...f, clientId:id})); clearAddError('client'); }}
                    placeholder={t('appointments.clientSearchPlaceholder')} emptyText={t('clients.notFound')}/>
                )}
                {addErrors.has('client') && (
                  <p className="text-xs font-medium text-red-500 mt-1">{t(addingNC ? 'appointments.fillClientData' : 'appointments.chooseClientError')}</p>
                )}
              </div>

              <div>
                <label className="field-label">{t('appointments.master')} <span className="text-red-500">*</span></label>
                {/* Майстер записує лише на себе — поле зафіксоване */}
                <select className={`field-input disabled:opacity-70 ${errorFieldClass(addErrors.has('master'))}`} disabled={!isAdmin}
                  value={addForm.employeeId} onChange={e => {
                    const newEmpId = e.target.value;
                    const allowed = allowedServices(newEmpId);
                    const prunedIds = pruneAddons(addForm.serviceIds.filter(id => allowed.some(s => s._id === id)));
                    setAddForm({...addForm, employeeId:newEmpId, serviceIds:prunedIds, ...totalsFor(prunedIds, newEmpId)});
                    clearAddError('master');
                  }}>
                  <option value="">{t('appointments.masterChoosePlaceholder')}</option>
                  {assignableBarbers.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
                {addErrors.has('master') && <p className="text-xs font-medium text-red-500 mt-1">{t('appointments.chooseMasterError')}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="form-section-title">{t('appointments.services')} <span className="text-red-500">*</span></h4>
            <ServicePicker
              services={allowedServices(addForm.employeeId)}
              selected={addForm.serviceIds}
              invalid={addErrors.has('services')}
              isLocked={s => addonLocked(s, addForm.serviceIds)}
              meta={serviceMeta}
              onToggle={(id, on) => {
                const {ids,totalPrice,totalDuration,prepTime} = toggleService(addForm.serviceIds, id, on, addForm.employeeId);
                setAddForm({...addForm, serviceIds:ids, totalPrice, totalDuration, prepTime});
                clearAddError('services');
              }}/>
            {addErrors.has('services') && <p className="text-xs font-medium text-red-500">{t('appointments.chooseServiceError')}</p>}
          </section>

          <section className="space-y-3">
            <h4 className="form-section-title">{t('appointments.sectionWhen')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('appointments.date')}</label>
                <input type="date" className="field-input"
                  value={addForm.date} onChange={e => { setAddForm({...addForm, date:e.target.value}); setAddError(''); }}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.time')}</label>
                <input type="time" className="field-input"
                  value={addForm.startTime} onChange={e => setAddForm({...addForm, startTime:e.target.value})}/>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-canvas-soft rounded-md px-3.5 py-3">
              <Clock size={17} className="text-ink-secondary shrink-0"/>
              <p className="flex-1 min-w-0 text-sm text-ink">
                <b>{formatDurationRangeForUnit(addForm.totalDuration, undefined, durationUnit, durationLabels)}</b>
                {addForm.prepTime > 0 && <span className="text-ink-secondary"> · {t('appointments.prepSuffix', { min: addForm.prepTime })}</span>}
                <span className="text-ink-secondary"> · </span><b>{formatPrice(addForm.totalPrice, currency)}</b>
              </p>
              <button type="button" onClick={() => setAddManual(v => !v)} aria-expanded={addManual}
                className="text-sm font-bold text-brand-dark hover:text-brand px-1 py-1">
                {addManual ? t('appointments.hideManual') : t('appointments.editManual')}
              </button>
            </div>
            {addManual && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="field-label">{t('appointments.duration')}{durationUnit === 'min' ? ` (${durationLabels.minute})` : ''}</label>
                  <DurationInput unit={durationUnit} value={addForm.totalDuration} min={5} onChange={min => setAddForm(f => ({...f, totalDuration: min ?? 0}))}/>
                </div>
                <div>
                  <label className="field-label">{t('appointments.prepTime')}</label>
                  <input type="number" className="field-input" min={0} max={240} step={5}
                    value={addForm.prepTime} onChange={e => setAddForm({...addForm, prepTime: Math.min(240, Math.max(0, Math.round(Number(e.target.value) || 0)))})}/>
                </div>
                <div>
                  <label className="field-label">{t('appointments.price')} ({getCurrencySymbol(currency)})</label>
                  <input type="number" className="field-input"
                    value={addForm.totalPrice} onChange={e => setAddForm({...addForm, totalPrice:Number(e.target.value)})}/>
                </div>
              </div>
            )}
          </section>
        </div>
        )}
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal isOpen={!!editAppt} onClose={() => setEditAppt(null)} title={t('appointments.editModalTitle')} size="xl"
        footer={editAppt && (<>
          {isAdmin && (
            <button onClick={() => handleDelete(editAppt._id)}
              className="px-2 py-1.5 text-sm text-red-600 hover:text-red-700 font-semibold">
              {t('appointments.deleteAction')}
            </button>
          )}
          <div className="flex-1" />
          <button onClick={() => setEditAppt(null)} className="btn btn-secondary">
            {t('common.cancel')}
          </button>
          <button onClick={handleEditSave} disabled={editSaving} className="btn btn-primary">
            {editSaving ? t('common.saving') : t('common.save')}
          </button>
        </>)}>
        {editAppt && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">{t('appointments.client')}</label>
                <ClientPicker clients={clients} value={editForm.clientId}
                  onChange={id => setEditForm(f => ({...f, clientId:id}))}
                  placeholder={t('clients.searchPlaceholder')} emptyText={t('clients.notFound')}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.master')}</label>
                <select className="field-input disabled:opacity-70" disabled={!isAdmin}
                  value={editForm.employeeId} onChange={e => {
                    const newEmpId = e.target.value;
                    const allowed = allowedServices(newEmpId);
                    const prunedIds = pruneAddons((editForm.serviceIds||[]).filter(id => allowed.some(s => s._id === id)));
                    const totals = totalsFor(prunedIds, newEmpId);
                    setEditForm({...editForm, employeeId:newEmpId, serviceIds:prunedIds, ...totals, totalPrice: discounted(totals.totalPrice, editAppt?.discountPercent)});
                  }}>
                  {editBarbers.map(e => (
                    <option key={e._id} value={e._id}>{e.name}{e.isActive === false ? ` (${t('employees.deactivated')})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">{t('appointments.services')}</label>
              <ServicePicker
                services={allowedServices(editForm.employeeId)}
                selected={editForm.serviceIds || []}
                isLocked={s => addonLocked(s, editForm.serviceIds || [])}
                meta={serviceMeta}
                onToggle={(id, on) => {
                  const {ids,totalPrice,totalDuration,prepTime} = toggleService(editForm.serviceIds||[], id, on, editForm.employeeId);
                  // Запис зі знижкою до ДН — нова сума теж зі знижкою.
                  setEditForm({...editForm, serviceIds:ids, totalPrice: discounted(totalPrice, editAppt?.discountPercent), totalDuration, prepTime});
                }}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('appointments.date')}</label>
                <input type="date" className="field-input"
                  value={editForm.date} onChange={e => setEditForm({...editForm, date:e.target.value})}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.time')}</label>
                <input type="time" className="field-input"
                  value={editForm.startTime} onChange={e => setEditForm({...editForm, startTime:e.target.value})}/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label">{t('appointments.duration')}{durationUnit === 'min' ? ` (${durationLabels.minute})` : ''}</label>
                <DurationInput unit={durationUnit} value={editForm.totalDuration} min={5} onChange={min => setEditForm({...editForm, totalDuration: min ?? 0})}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.prepTime')}</label>
                <input type="number" className="field-input" min={0} max={240} step={5}
                  value={editForm.prepTime} onChange={e => setEditForm({...editForm, prepTime: Math.min(240, Math.max(0, Math.round(Number(e.target.value) || 0)))})}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.price')} ({getCurrencySymbol(currency)})</label>
                <input type="number" className="field-input"
                  value={editForm.totalPrice} onChange={e => setEditForm({...editForm, totalPrice:Number(e.target.value)})}/>
              </div>
            </div>
            {editAppt?.discountPercent ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 px-3 py-1 text-xs font-medium">
                🎁 {t('appointments.birthdayDiscount', { pct: editAppt.discountPercent })}
                {editAppt.priceBeforeDiscount !== undefined && (
                  <span className="text-rose-500">· {t('appointments.withoutDiscount', { price: formatPrice(editAppt.priceBeforeDiscount, currency) })}</span>
                )}
              </p>
            ) : null}
            <div>
              <label className="field-label mb-2">{t('appointments.status')}</label>
              <div className="flex gap-2 flex-wrap">
                {(['Scheduled','Completed','Cancelled','Rescheduled','No-show'] as const).map(s => (
                  <button key={s} onClick={() => setEditForm({...editForm, status:s})}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                      ${editForm.status===s ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-secondary border-line hover:border-brand/50'}`}>
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label mb-2">{t('appointments.notes')}</label>
              {editAppt.notes && editAppt.notes.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto mb-2 pr-1">
                  {editAppt.notes.map((n, i) => (
                    <div key={n._id || i} className="bg-canvas-soft rounded-sm p-2 text-sm">
                      <div className="flex justify-between items-baseline mb-0.5 gap-2">
                        <span className="font-medium text-ink">{n.authorName}</span>
                        <span className="text-xs text-ink-muted shrink-0">
                          {new Date(n.createdAt).toLocaleString(lang === 'uk' ? 'uk-UA' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-ink-secondary whitespace-pre-wrap">{n.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted mb-2">{t('appointments.noNotes')}</p>
              )}
              <div className="flex gap-2">
                <textarea rows={2} className="field-input flex-1 resize-none"
                  placeholder={t('appointments.notesPlaceholder')}
                  value={noteText} onChange={e => setNoteText(e.target.value)}/>
                <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()}
                  className="btn btn-secondary self-end">
                  {t('appointments.addNote')}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!importResult} onClose={() => setImportResult(null)} title={t('common.importResultTitle')}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">{t('common.importCreated', { count: importResult?.created ?? 0 })}</span>
            <span className="text-brand font-medium">{t('common.importUpdated', { count: importResult?.updated ?? 0 })}</span>
            <span className="text-red-500 font-medium">{t('common.importFailed', { count: importResult?.failed ?? 0 })}</span>
          </div>
          {importResult && importResult.errors.length > 0 && (
            <div className="border-t border-line pt-2 space-y-1">
              {importResult.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-500">
                  {t('common.importRowError', { row: e.row })}: {e.message}
                </p>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={() => setImportResult(null)} className="btn btn-secondary">{t('common.close')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Appointments;