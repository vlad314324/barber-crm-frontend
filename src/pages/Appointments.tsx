import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Calendar, ChevronLeft, ChevronRight, Plus, UserPlus, ChevronDown, Download, Upload, MessageSquare, MoreVertical, Coffee, CalendarDays, Sparkles } from 'lucide-react';
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
import { effectiveService, effectiveServices } from '../utils/employeePricing';
import ScheduleGrid, { ScheduleColumn, HeaderMenuItem } from '../components/schedule/ScheduleGrid';
import { BREAK_PATTERN, toMin } from '../components/schedule/scheduleTime';
import BreaksModal from '../components/schedule/BreaksModal';
import StoryModal from '../components/story/StoryModal';

const COUNTRIES = [
  { code: '+380', flag: '🇺🇦', name: 'Україна' },
  { code: '+1',   flag: '🇺🇸', name: 'США / Канада' },
  { code: '+44',  flag: '🇬🇧', name: 'Велика Британія' },
  { code: '+49',  flag: '🇩🇪', name: 'Німеччина' },
  { code: '+33',  flag: '🇫🇷', name: 'Франція' },
  { code: '+48',  flag: '🇵🇱', name: 'Польща' },
  { code: '+7',   flag: '🇰🇿', name: 'Казахстан' },
  { code: '+39',  flag: '🇮🇹', name: 'Італія' },
  { code: '+34',  flag: '🇪🇸', name: 'Іспанія' },
  { code: '+31',  flag: '🇳🇱', name: 'Нідерланди' },
  { code: '+41',  flag: '🇨🇭', name: 'Швейцарія' },
  { code: '+43',  flag: '🇦🇹', name: 'Австрія' },
  { code: '+46',  flag: '🇸🇪', name: 'Швеція' },
  { code: '+47',  flag: '🇳🇴', name: 'Норвегія' },
  { code: '+45',  flag: '🇩🇰', name: 'Данія' },
  { code: '+358', flag: '🇫🇮', name: 'Фінляндія' },
  { code: '+420', flag: '🇨🇿', name: 'Чехія' },
  { code: '+36',  flag: '🇭🇺', name: 'Угорщина' },
  { code: '+40',  flag: '🇷🇴', name: 'Румунія' },
  { code: '+359', flag: '🇧🇬', name: 'Болгарія' },
];

const PhoneInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const { t } = useLocale();
  const [countryCode, setCountryCode] = useState('+380');
  const [localNumber, setLocalNumber] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropdown(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value === '') { setLocalNumber(''); setCountryCode('+380'); }
  }, [value]);

  const handleLocal = (v: string) => { setLocalNumber(v); onChange(countryCode + v); };
  const selectCountry = (code: string) => { setCountryCode(code); onChange(code + localNumber); setShowDropdown(false); setSearch(''); };
  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search));
  const current = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  return (
    <div className="flex gap-1 relative">
      <div ref={dropRef} className="relative">
        <button type="button" onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 px-2 py-1.5 border border-line rounded-sm text-sm bg-surface hover:bg-canvas-soft whitespace-nowrap">
          <span>{current.flag}</span>
          <span className="text-ink-secondary">{current.code}</span>
          <ChevronDown size={12} className="text-ink-muted"/>
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded-md shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-line">
              <input autoFocus type="text" placeholder={t('appointments.searchCountryPlaceholder')}
                className="w-full px-2 py-1 text-sm border border-line rounded-xs focus:outline-none focus:ring-1 focus:ring-brand"
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map(c => (
                <button key={c.code} type="button" onClick={() => selectCountry(c.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-extra-soft text-left ${c.code === countryCode ? 'bg-brand-extra-soft text-brand-dark' : 'text-ink-secondary'}`}>
                  <span>{c.flag}</span><span className="flex-1">{c.name}</span><span className="text-ink-muted">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <input type="tel"
        className="field-input flex-1 py-1.5"
        placeholder={t('appointments.phoneNumberPlaceholder')} value={localNumber} onChange={e => handleLocal(e.target.value)}/>
    </div>
  );
};

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-slate-500 border-slate-600',
  Completed:  'bg-brand border-brand-dark',
  Cancelled:  'bg-red-400 border-red-500',
  'No-show':  'bg-ink-muted border-ink-muted',
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
const defaultNC = { name:'', phone:'', email:'' };

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
      if (a.status === 'Cancelled' || a.status === 'No-show') return false;
      const aStart = toMin(a.startTime);
      return s < aStart + a.totalDuration + (a.prepTime ?? 0) && aStart < e + prep;
    }) || breaksFor(empId, date).some(b => s < toMin(b.endTime) && toMin(b.startTime) < e);
  };

  const handleSlotClick = (empId: string, time: string, date: Date = currentDate) => {
    if (isSlotBusy(empId, time, date)) return;
    setAddForm({ ...defaultAdd, date: dateStr(date), startTime: time, employeeId: empId });
    setAddingNC(false); setNewClient(defaultNC); setPhoneMatch(null);
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

  const handlePhoneChange = (phone: string) => {
    setNewClient(p => ({ ...p, phone }));
    const digits = phone.replace(/\D/g,'');
    const match  = clients.find(c => c.phone.replace(/\D/g,'') === digits);
    setPhoneMatch(match || null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let clientId = addForm.clientId;
      if (addingNC) {
        if (phoneMatch) {
          clientId = phoneMatch._id;
        } else {
          if (!newClient.name || !newClient.phone || !newClient.email) {
            alert(t('appointments.fillClientData')); setSaving(false); return;
          }
          const created = await clientApi.create(newClient);
          clientId = created._id;
          setClients(prev => [...prev, created]);
        }
      }
      if (!clientId || !addForm.employeeId || addForm.serviceIds.length === 0) {
        alert(t('appointments.fillClientMasterService')); setSaving(false); return;
      }
      // перевірка вихідного дня
const selectedBarber = barbers.find(e => e._id === addForm.employeeId);
if (selectedBarber) {
  const selectedDate = parseDateLocal(addForm.date);
  if (isDayOff(selectedBarber, selectedDate)) {
    alert(t('appointments.dayOffAlert'));
    setSaving(false); return;
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
    } catch(err){ alert(getErrorMessage(err) || t('appointments.genericError')); }
    finally { setSaving(false); }
  };

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
    if (editForm.status !== 'Cancelled'
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
            onClick={() => { setAddForm({...defaultAdd, date:dateStr(currentDate), employeeId: isAdmin ? '' : (myEmployee?._id || '')}); setAddingNC(false); setIsAddOpen(true); }}
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

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('appointments.newModalTitle')} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-ink">{t('appointments.client')}</label>
                <button type="button" onClick={() => { setAddingNC(!addingNC); setPhoneMatch(null); setNewClient(defaultNC); }}
                  className="text-xs text-brand hover:text-brand-dark flex items-center gap-1">
                  <UserPlus size={12}/> {addingNC ? t('appointments.chooseExisting') : t('appointments.newClient')}
                </button>
              </div>
              {addingNC ? (
                <div className="border border-line rounded-sm p-3 bg-canvas-soft space-y-2">
                  <div>
                    <label className="text-xs text-ink-muted mb-1 block">{t('appointments.phoneLabel')}</label>
                    <PhoneInput value={newClient.phone} onChange={handlePhoneChange}/>
                  </div>
                  {phoneMatch ? (
                    <div className="bg-brand-soft border border-brand/30 rounded-xs p-2">
                      <p className="text-brand-dark text-sm font-medium">✓ {t('appointments.found', { name: phoneMatch.name })}</p>
                      <p className="text-brand-dark text-xs">{phoneMatch.email}</p>
                      <p className="text-ink-muted text-xs mt-0.5">{t('appointments.willUseExisting')}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs text-ink-muted mb-0.5 block">{t('appointments.nameLabel')}</label>
                        <input type="text" className="field-input py-1.5"
                          placeholder={t('clients.namePlaceholder')} value={newClient.name}
                          onChange={e => setNewClient(p => ({...p, name:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="text-xs text-ink-muted mb-0.5 block">{t('appointments.emailLabel')}</label>
                        <input type="email" className="field-input py-1.5"
                          placeholder="email@example.com" value={newClient.email}
                          onChange={e => setNewClient(p => ({...p, email:e.target.value}))}/>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <select className="field-input"
                  value={addForm.clientId} onChange={e => setAddForm({...addForm, clientId:e.target.value})}>
                  <option value="">{t('appointments.choosePlaceholder')}</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="field-label">{t('appointments.master')}</label>
              {/* Майстер записує лише на себе — поле зафіксоване */}
              <select className="field-input disabled:opacity-70" disabled={!isAdmin}
                value={addForm.employeeId} onChange={e => {
                  const newEmpId = e.target.value;
                  const allowed = allowedServices(newEmpId);
                  const prunedIds = pruneAddons(addForm.serviceIds.filter(id => allowed.some(s => s._id === id)));
                  setAddForm({...addForm, employeeId:newEmpId, serviceIds:prunedIds, ...totalsFor(prunedIds, newEmpId)});
                }}>
                <option value="">{t('appointments.masterChoosePlaceholder')}</option>
                {assignableBarbers.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">{t('appointments.services')}</label>
            <div className="border border-line rounded-sm p-2 max-h-56 overflow-y-auto space-y-1">
              {allowedServices(addForm.employeeId).map(s => (
                <label key={s._id} className={`flex items-center gap-2 text-sm p-1 rounded-xs ${s.isAddon ? 'ml-6' : ''} ${addonLocked(s, addForm.serviceIds) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-canvas-soft'}`}>
                  <input type="checkbox" className="rounded border-line text-brand focus:ring-brand"
                    disabled={addonLocked(s, addForm.serviceIds)}
                    checked={addForm.serviceIds.includes(s._id)}
                    onChange={e => {
                      const {ids,totalPrice,totalDuration,prepTime} = toggleService(addForm.serviceIds, s._id, e.target.checked, addForm.employeeId);
                      setAddForm({...addForm, serviceIds:ids, totalPrice, totalDuration, prepTime});
                    }}/>
                  <span>{s.isAddon ? `+ ${s.name}` : s.name}</span>
                  <span className="ml-auto text-ink-muted text-xs">
                    {rangesEnabled ? formatPriceRange(s.price, s.priceMax, currency) : formatPrice(s.price, currency)} · {formatDurationRangeForUnit(s.duration, rangesEnabled ? s.durationMax : undefined, durationUnit, durationLabels)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('appointments.date')}</label>
              <input type="date" className="field-input"
                value={addForm.date} onChange={e => setAddForm({...addForm, date:e.target.value})}/>
            </div>
            <div>
              <label className="field-label">{t('appointments.time')}</label>
              <input type="time" className="field-input"
                value={addForm.startTime} onChange={e => setAddForm({...addForm, startTime:e.target.value})}/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">{t('appointments.duration')}{durationUnit === 'min' ? ` (${durationLabels.minute})` : ''}</label>
              <DurationInput unit={durationUnit} value={addForm.totalDuration} min={5} onChange={min => setAddForm({...addForm, totalDuration: min ?? 0})}/>
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

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsAddOpen(false)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? t('common.saving') : t('appointments.create')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal isOpen={!!editAppt} onClose={() => setEditAppt(null)} title={t('appointments.editModalTitle')} size="xl">
        {editAppt && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">{t('appointments.client')}</label>
                <select className="field-input"
                  value={editForm.clientId} onChange={e => setEditForm({...editForm, clientId:e.target.value})}>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
                </select>
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
              <div className="border border-line rounded-sm p-2 max-h-56 overflow-y-auto space-y-1">
                {allowedServices(editForm.employeeId).map(s => (
                  <label key={s._id} className={`flex items-center gap-2 text-sm p-1 rounded-xs ${s.isAddon ? 'ml-6' : ''} ${addonLocked(s, editForm.serviceIds||[]) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-canvas-soft'}`}>
                    <input type="checkbox" className="rounded border-line text-brand focus:ring-brand"
                      disabled={addonLocked(s, editForm.serviceIds||[])}
                      checked={(editForm.serviceIds||[]).includes(s._id)}
                      onChange={e => {
                        const {ids,totalPrice,totalDuration,prepTime} = toggleService(editForm.serviceIds||[], s._id, e.target.checked, editForm.employeeId);
                        // Запис зі знижкою до ДН — нова сума теж зі знижкою.
                        setEditForm({...editForm, serviceIds:ids, totalPrice: discounted(totalPrice, editAppt?.discountPercent), totalDuration, prepTime});
                      }}/>
                    <span>{s.isAddon ? `+ ${s.name}` : s.name}</span>
                    <span className="ml-auto text-ink-muted text-xs">
                      {rangesEnabled ? formatPriceRange(s.price, s.priceMax, currency) : formatPrice(s.price, currency)} · {formatDurationRangeForUnit(s.duration, rangesEnabled ? s.durationMax : undefined, durationUnit, durationLabels)}
                    </span>
                  </label>
                ))}
              </div>
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
                {['Scheduled','Completed','Cancelled','No-show'].map(s => (
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
            <div className="flex justify-between pt-2 border-t border-line">
              {isAdmin ? (
                <button onClick={() => handleDelete(editAppt._id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
                  {t('appointments.deleteAction')}
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button onClick={() => setEditAppt(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button onClick={handleEditSave} disabled={editSaving} className="btn btn-primary">
                  {editSaving ? t('common.saving') : t('common.save')}
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