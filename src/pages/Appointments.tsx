import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, UserPlus, ChevronDown, Download, Upload, MessageSquare } from 'lucide-react';
import { appointmentApi, clientApi, employeeApi, serviceApi } from '../api';
import api from '../api';
import { Appointment, Client, Employee, Service, ShopSettings, ImportResult } from '../api/types';
import Modal from '../components/Modal';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';
import { downloadBlob } from '../utils/download';

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
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-line rounded-md shadow-lg z-50 overflow-hidden">
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

const SLOT_MIN    = 30;
const START_HOUR  = 8;
const END_HOUR    = 20;
const PX_PER_SLOT = 32;

const SLOTS = Array.from(
  { length: ((END_HOUR - START_HOUR) * 60) / SLOT_MIN },
  (_, i) => {
    const t = START_HOUR * 60 + i * SLOT_MIN;
    return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
  }
);
const TOTAL_H = SLOTS.length * PX_PER_SLOT;

const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];

const parseDateLocal = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const durToH = (min: number) => Math.max(min / SLOT_MIN * PX_PER_SLOT, PX_PER_SLOT);
const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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
  date: dateStr(new Date()), startTime:'09:00', totalDuration:30, totalPrice:0,
};
const defaultNC = { name:'', phone:'', email:'' };

interface EditApptForm {
  clientId: string;
  employeeId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  totalDuration: number;
  totalPrice: number;
  status: Appointment['status'];
}
const defaultEdit: EditApptForm = {
  clientId:'', employeeId:'', serviceIds:[],
  date: dateStr(new Date()), startTime:'09:00', totalDuration:30, totalPrice:0,
  status: 'Scheduled',
};

const Appointments = () => {
  const { t, lang } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients,      setClients]      = useState<Client[]>([]);
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [services,     setServices]     = useState<Service[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
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

  const fetchAll = useCallback(async () => {
    try {
      const [a, c, e, s, settings] = await Promise.all([
        appointmentApi.getAll(), clientApi.getAll(),
        employeeApi.getAll(), serviceApi.getAll(),
        api.get('/settings').then(r => r.data),
      ]);
      setAppointments(a); setClients(c); setEmployees(e); setServices(s);
      setShopSettings(settings);
    } catch(err){ console.error(err); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

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
  const dayAppts = appointments.filter(a => {
    const d = typeof a.date === 'string' ? parseDateLocal(a.date.slice(0,10)) : new Date(a.date);
    return isSameDay(d, currentDate);
  });

  const apptsByBarber = (id: string) => dayAppts.filter(a => {
    const eid = typeof a.employee==='object' ? a.employee._id : a.employee;
    return eid === id;
  });

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

  const isSlotBusy = (empId: string, slotTime: string, excludeId?: string): boolean => {
    const [sh, sm] = slotTime.split(':').map(Number);
    const slotStart = sh * 60 + sm;
    return apptsByBarber(empId).some(a => {
      if (excludeId && a._id === excludeId) return false;
      if (a.status === 'Cancelled' || a.status === 'No-show') return false;
      const [ah, am] = a.startTime.split(':').map(Number);
      const aStart = ah * 60 + am;
      const aEnd   = aStart + a.totalDuration;
      return slotStart >= aStart && slotStart < aEnd;
    });
  };

  const handleSlotClick = (empId: string, time: string) => {
    if (isSlotBusy(empId, time)) return;
    setAddForm({ ...defaultAdd, date: dateStr(currentDate), startTime: time, employeeId: empId });
    setAddingNC(false); setNewClient(defaultNC); setPhoneMatch(null);
    setIsAddOpen(true);
  };

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
        totalPrice: addForm.totalPrice,
      });
      setIsAddOpen(false);
      fetchAll();
    } catch(err){ alert(getErrorMessage(err) || t('appointments.genericError')); }
    finally { setSaving(false); }
  };

  const openEdit = (appt: Appointment) => {
    const empId = typeof appt.employee==='object' ? appt.employee._id : appt.employee;
    const cliId = typeof appt.client==='object'   ? appt.client._id   : appt.client;
    const svcIds = appt.services.map(s => typeof s==='object' ? s._id : s);
    setEditForm({
      clientId:cliId, employeeId:empId, serviceIds:svcIds,
      date: dateStr(parseDateLocal(typeof appt.date==='string' ? appt.date.slice(0,10) : new Date(appt.date).toISOString().slice(0,10))),
      startTime:appt.startTime, totalDuration:appt.totalDuration,
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
    if (isSlotBusy(editForm.employeeId, editForm.startTime, editAppt._id)) {
      alert(t('appointments.slotBusy')); return;
    }
    setEditSaving(true);
    try {
      await appointmentApi.update(editAppt._id, {
        client:editForm.clientId, employee:editForm.employeeId,
        services:editForm.serviceIds, date:editForm.date,
        startTime:editForm.startTime, totalDuration:editForm.totalDuration,
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

  const toggleService = (ids: string[], svcId: string, isAdd: boolean) => {
    const next = isAdd ? [...ids, svcId] : ids.filter(id => id !== svcId);
    const price = next.reduce((s,id) => s + (services.find(sv=>sv._id===id)?.price||0), 0);
    const dur   = next.reduce((s,id) => s + (services.find(sv=>sv._id===id)?.duration||0), 0);
    return { ids: next, price, dur: dur || 30 };
  };

  const statusLabel = (status: string) => t(`statuses.${status}`);

  if (loading) return <div className="text-center py-12 text-ink-muted">{t('common.loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center">
          <Calendar size={24} className="mr-2 text-brand"/> {t('appointments.title')}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary">
            <Download size={16}/> {t('common.export')}
          </button>
          <button onClick={() => importFileInputRef.current?.click()} className="btn btn-secondary" disabled={importing}>
            <Upload size={16}/> {importing ? t('common.importing') : t('common.import')}
          </button>
          <input ref={importFileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFileChange}/>
          <button
            onClick={() => { setAddForm({...defaultAdd, date:dateStr(currentDate)}); setAddingNC(false); setIsAddOpen(true); }}
            className="btn btn-primary">
            <Plus size={16}/> {t('appointments.addNew')}
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
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
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 ds-card overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <button onClick={() => setCurrentDate(d => { const n=new Date(d); n.setDate(n.getDate()-1); return n; })}
              className="p-1.5 rounded-xs hover:bg-canvas-soft"><ChevronLeft size={18}/></button>
            <span className="text-base font-semibold text-ink capitalize min-w-0 truncate">
              {formatDateLong(currentDate, lang)}
            </span>
            <button onClick={() => setCurrentDate(d => { const n=new Date(d); n.setDate(n.getDate()+1); return n; })}
              className="p-1.5 rounded-xs hover:bg-canvas-soft"><ChevronRight size={18}/></button>
            <button onClick={() => setCurrentDate(new Date())}
              className="ml-1 px-3 py-1 text-xs border border-line rounded-xs hover:bg-canvas-soft">
              {t('appointments.todayBtn')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-canvas-soft border-b border-line">
                  <th className="w-16 border-r border-line"/>
                  {calendarBarbers.length === 0
                    ? <th className="py-4 text-sm text-ink-muted font-normal">{t('appointments.noBarbers')}</th>
                    : calendarBarbers.map(emp => {
                      const off = isDayOff(emp, currentDate);
                      return (
                        <th key={emp._id} className={`border-l border-line py-2 px-2 text-center font-normal ${off ? 'bg-canvas-soft' : ''}`}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=40`}
                            alt={emp.name}
                            className={`w-8 h-8 rounded-full mx-auto mb-1 ${off ? 'opacity-40 grayscale' : ''}`}/>
                          <p className={`text-xs font-semibold truncate ${off ? 'text-ink-muted' : 'text-ink'}`}>{emp.name}</p>
                          <p className="text-xs text-ink-muted">{off ? `😴 ${t('appointments.dayOff')}` : t(`roles.${emp.role}`)}</p>
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot} className={slot.endsWith(':00') ? 'border-t border-line' : 'border-t border-line/50'}>
                    <td className="w-16 border-r border-line pr-2 text-right align-top pt-0.5"
                      style={{ height: PX_PER_SLOT }}>
                      {slot.endsWith(':00') && (
                        <span className="text-xs text-ink-muted leading-none">{slot}</span>
                      )}
                    </td>
                    {calendarBarbers.map(emp => {
                      const off = isDayOff(emp, currentDate);

                      // ── вихідний день ──────────────────────────────────────
                      if (off) {
                        const isFirstSlot = slot === SLOTS[0];
                        return (
                          <td key={emp._id}
                            style={{ height: PX_PER_SLOT, position:'relative', padding:0 }}
                            className="border-l border-line/50 bg-canvas-soft cursor-not-allowed select-none">
                            {isFirstSlot && (
                              <div style={{ position:'absolute', top:0, left:0, right:0, height:`${TOTAL_H}px`, zIndex:4 }}
                                className="flex items-center justify-center bg-canvas-soft bg-opacity-70">
                                <span className="text-sm text-ink-muted font-medium">{t('appointments.dayOff')}</span>
                              </div>
                            )}
                          </td>
                        );
                      }

                      // ── робочий день ───────────────────────────────────────
                      const busy     = isSlotBusy(emp._id, slot);
                      const apptHere = apptsByBarber(emp._id).find(a => a.startTime === slot);
                      const [sh2, sm2] = slot.split(':').map(Number);
                      const slotMin  = sh2 * 60 + sm2;
                      const covered  = !apptHere && apptsByBarber(emp._id).some(a => {
                        const [ah, am] = a.startTime.split(':').map(Number);
                        const aStart = ah*60+am;
                        const aEnd   = aStart + a.totalDuration;
                        return slotMin > aStart && slotMin < aEnd &&
                          a.status !== 'Cancelled' && a.status !== 'No-show';
                      });

                      return (
                        <td key={emp._id}
                          style={{ height: PX_PER_SLOT, position:'relative', padding:0 }}
                          className={`border-l border-line/50 align-top
                            ${!busy && !covered ? 'cursor-pointer hover:bg-brand-extra-soft transition-colors' : ''}
                            ${busy && !apptHere && !covered ? 'bg-canvas-soft' : ''}`}
                          onClick={() => !busy && !covered && handleSlotClick(emp._id, slot)}>
                          {apptHere && (() => {
                            const height = durToH(apptHere.totalDuration);
                            const color  = STATUS_COLORS[apptHere.status] || 'bg-brand border-brand-dark';
                            return (
                              <div
                                onClick={e => { e.stopPropagation(); openEdit(apptHere); }}
                                style={{ height:`${height}px`, position:'absolute', top:0, left:4, right:4, zIndex:5 }}
                                className={`rounded border-l-4 px-1.5 py-0.5 text-white text-xs cursor-pointer hover:opacity-90 shadow-sm overflow-hidden ${color}`}>
                                <p className="font-semibold truncate leading-tight flex items-center gap-1">
                                  {clientName(apptHere.client)}
                                  {(apptHere.notes?.length ?? 0) > 0 && <MessageSquare size={11} className="shrink-0 opacity-90"/>}
                                </p>
                                <p className="truncate opacity-90 leading-tight">{svcNames(apptHere.services)}</p>
                                {height > 40 && <p className="opacity-75 leading-tight">{apptHere.startTime} · ${apptHere.totalPrice}</p>}
                              </div>
                            );
                          })()}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ADD MODAL ── */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t('appointments.newModalTitle')} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <select className="field-input"
                value={addForm.employeeId} onChange={e => setAddForm({...addForm, employeeId:e.target.value})}>
                <option value="">{t('appointments.masterChoosePlaceholder')}</option>
                {assignableBarbers.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">{t('appointments.services')}</label>
            <div className="border border-line rounded-sm p-2 max-h-56 overflow-y-auto space-y-1">
              {services.filter(s=>s.isAvailable).map(s => (
                <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-canvas-soft p-1 rounded-xs">
                  <input type="checkbox" className="rounded border-line text-brand focus:ring-brand"
                    checked={addForm.serviceIds.includes(s._id)}
                    onChange={e => {
                      const {ids,price,dur} = toggleService(addForm.serviceIds, s._id, e.target.checked);
                      setAddForm({...addForm, serviceIds:ids, totalPrice:price, totalDuration:dur});
                    }}/>
                  <span>{s.name}</span>
                  <span className="ml-auto text-ink-muted text-xs">${s.price} · {s.duration}{t('services.minutes')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('appointments.duration')}</label>
              <input type="number" className="field-input"
                value={addForm.totalDuration} onChange={e => setAddForm({...addForm, totalDuration:Number(e.target.value)})}/>
            </div>
            <div>
              <label className="field-label">{t('appointments.price')}</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">{t('appointments.client')}</label>
                <select className="field-input"
                  value={editForm.clientId} onChange={e => setEditForm({...editForm, clientId:e.target.value})}>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">{t('appointments.master')}</label>
                <select className="field-input"
                  value={editForm.employeeId} onChange={e => setEditForm({...editForm, employeeId:e.target.value})}>
                  {editBarbers.map(e => (
                    <option key={e._id} value={e._id}>{e.name}{e.isActive === false ? ` (${t('employees.deactivated')})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">{t('appointments.services')}</label>
              <div className="border border-line rounded-sm p-2 max-h-56 overflow-y-auto space-y-1">
                {services.filter(s=>s.isAvailable).map(s => (
                  <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-canvas-soft p-1 rounded-xs">
                    <input type="checkbox" className="rounded border-line text-brand focus:ring-brand"
                      checked={(editForm.serviceIds||[]).includes(s._id)}
                      onChange={e => {
                        const {ids,price,dur} = toggleService(editForm.serviceIds||[], s._id, e.target.checked);
                        setEditForm({...editForm, serviceIds:ids, totalPrice:price, totalDuration:dur});
                      }}/>
                    <span>{s.name}</span>
                    <span className="ml-auto text-ink-muted text-xs">${s.price} · {s.duration}{t('services.minutes')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('appointments.duration')}</label>
                <input type="number" className="field-input"
                  value={editForm.totalDuration} onChange={e => setEditForm({...editForm, totalDuration:Number(e.target.value)})}/>
              </div>
              <div>
                <label className="field-label">{t('appointments.price')}</label>
                <input type="number" className="field-input"
                  value={editForm.totalPrice} onChange={e => setEditForm({...editForm, totalPrice:Number(e.target.value)})}/>
              </div>
            </div>
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
              <button onClick={() => handleDelete(editAppt._id)}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
                {t('appointments.deleteAction')}
              </button>
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