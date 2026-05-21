import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, UserPlus, ChevronDown } from 'lucide-react';
import { appointmentApi, clientApi, employeeApi, serviceApi } from '../api';
import api from '../api';
import { Appointment, Client, Employee, Service } from '../api/types';
import Modal from '../components/Modal';

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

  const handleLocal = (v: string) => { setLocalNumber(v); onChange(countryCode + v); };
  const selectCountry = (code: string) => { setCountryCode(code); onChange(code + localNumber); setShowDropdown(false); setSearch(''); };
  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search));
  const current = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  return (
    <div className="flex gap-1 relative">
      <div ref={dropRef} className="relative">
        <button type="button" onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 whitespace-nowrap">
          <span>{current.flag}</span>
          <span className="text-gray-600">{current.code}</span>
          <ChevronDown size={12} className="text-gray-400"/>
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input autoFocus type="text" placeholder="Пошук країни або коду..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map(c => (
                <button key={c.code} type="button" onClick={() => selectCountry(c.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 text-left ${c.code === countryCode ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}>
                  <span>{c.flag}</span><span className="flex-1">{c.name}</span><span className="text-gray-400">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <input type="tel"
        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Номер телефону" value={localNumber} onChange={e => handleLocal(e.target.value)}/>
    </div>
  );
};

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-500 border-blue-600',
  Completed:  'bg-green-500 border-green-600',
  Cancelled:  'bg-red-400 border-red-500',
  'No-show':  'bg-gray-400 border-gray-500',
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

const timeToTop = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return ((h - START_HOUR) * 60 + m) / SLOT_MIN * PX_PER_SLOT;
};
const durToH = (min: number) => Math.max(min / SLOT_MIN * PX_PER_SLOT, PX_PER_SLOT);
const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const toUkrLong = (d: Date) =>
  d.toLocaleDateString('uk-UA', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

const MONTHS_UK = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const DAYS_UK   = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

const MiniCalendar = ({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) => {
  const [view, setView] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const year = view.getFullYear(); const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length:days},(_,i)=>i+1)];
  while (cells.length % 7) cells.push(null);
  const today = new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 w-56">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setView(new Date(year, month-1, 1))} className="p-1 rounded hover:bg-gray-100"><ChevronLeft size={14}/></button>
        <span className="text-xs font-semibold text-gray-700">{MONTHS_UK[month]} {year}</span>
        <button onClick={() => setView(new Date(year, month+1, 1))} className="p-1 rounded hover:bg-gray-100"><ChevronRight size={14}/></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_UK.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center">
            {d ? (
              <button onClick={() => onChange(new Date(year, month, d))}
                className={`w-7 h-7 rounded-full text-xs transition-colors
                  ${isSameDay(selected, new Date(year, month, d)) ? 'bg-indigo-600 text-white font-semibold'
                    : isSameDay(today, new Date(year, month, d)) ? 'border border-indigo-400 text-indigo-600 font-medium hover:bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-100'}`}>
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

const Appointments = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients,      setClients]      = useState<Client[]>([]);
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [services,     setServices]     = useState<Service[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [shopSettings, setShopSettings] = useState<any>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm,   setAddForm]   = useState(defaultAdd);
  const [saving,    setSaving]    = useState(false);
  const [addingNC,  setAddingNC]  = useState(false);
  const [newClient, setNewClient] = useState(defaultNC);
  const [phoneMatch,setPhoneMatch]= useState<Client|null>(null);

  const [editAppt,   setEditAppt]   = useState<Appointment|null>(null);
  const [editForm,   setEditForm]   = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

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

  const barbers = employees.filter(e => e.role === 'Barber');

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
  if (!val || val === 'Вихідний' || val === 'Off') return true;

  return false;
};

  const clientName = (ref: string | Client | null | undefined) => {
    if (!ref) return 'Клієнт';
    if (typeof ref === 'object') return ref.name || 'Клієнт';
    return clients.find(c => c._id === ref)?.name || 'Клієнт';
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
            alert('Заповніть дані клієнта'); setSaving(false); return;
          }
          const created = await clientApi.create(newClient);
          clientId = created._id;
          setClients(prev => [...prev, created]);
        }
      }
      if (!clientId || !addForm.employeeId || addForm.serviceIds.length === 0) {
        alert('Виберіть клієнта, майстра та послугу'); setSaving(false); return;
      }
      // перевірка вихідного дня
const selectedBarber = barbers.find(e => e._id === addForm.employeeId);
if (selectedBarber) {
  const selectedDate = parseDateLocal(addForm.date);
  if (isDayOff(selectedBarber, selectedDate)) {
    alert('На жаль, у цього перукаря вихідний. Оберіть інший день або іншого майстра.');
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
    } catch(err:any){ alert(err.response?.data?.msg || 'Помилка'); }
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
  };

  const handleEditSave = async () => {
    if (!editAppt) return;
    if (isSlotBusy(editForm.employeeId, editForm.startTime, editAppt._id)) {
      alert('Цей часовий слот вже зайнятий іншим записом.'); return;
    }
    setEditSaving(true);
    try {
      await appointmentApi.update(editAppt._id, {
        client:editForm.clientId, employee:editForm.employeeId,
        services:editForm.serviceIds, date:editForm.date,
        startTime:editForm.startTime, totalDuration:editForm.totalDuration,
        totalPrice:editForm.totalPrice, status:editForm.status,
      } as any);
      setEditAppt(null);
      fetchAll();
    } catch(err:any){ alert(err.response?.data?.msg || 'Помилка'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id:string) => {
    if (!confirm('Видалити запис?')) return;
    try {
      await appointmentApi.delete(id);
      setAppointments(prev => prev.filter(a => a._id !== id));
      setEditAppt(null);
    } catch { alert('Помилка'); }
  };

  const toggleService = (ids: string[], svcId: string, isAdd: boolean) => {
    const next = isAdd ? [...ids, svcId] : ids.filter(id => id !== svcId);
    const price = next.reduce((s,id) => s + (services.find(sv=>sv._id===id)?.price||0), 0);
    const dur   = next.reduce((s,id) => s + (services.find(sv=>sv._id===id)?.duration||0), 0);
    return { ids: next, price, dur: dur || 30 };
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Завантаження...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar size={24} className="mr-2 text-indigo-600"/> Appointments
        </h1>
        <button
          onClick={() => { setAddForm({...defaultAdd, date:dateStr(currentDate)}); setAddingNC(false); setIsAddOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus size={16} className="mr-2"/> Add New Appointment
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Left panel */}
        <div className="flex-shrink-0 space-y-3">
          <MiniCalendar selected={currentDate} onChange={d => setCurrentDate(d)}/>
          <div className="space-y-1.5 pl-1">
            {Object.entries(STATUS_COLORS).map(([s,cls]) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${cls.split(' ')[0]}`}/>
                <span className="text-xs text-gray-500">{s}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-gray-200"/>
              <span className="text-xs text-gray-500">Вихідний</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 bg-white shadow rounded-lg overflow-hidden min-w-0">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <button onClick={() => setCurrentDate(d => { const n=new Date(d); n.setDate(n.getDate()-1); return n; })}
              className="p-1.5 rounded hover:bg-gray-100"><ChevronLeft size={18}/></button>
            <span className="text-base font-semibold text-gray-800 capitalize min-w-0 truncate">
              {toUkrLong(currentDate)}
            </span>
            <button onClick={() => setCurrentDate(d => { const n=new Date(d); n.setDate(n.getDate()+1); return n; })}
              className="p-1.5 rounded hover:bg-gray-100"><ChevronRight size={18}/></button>
            <button onClick={() => setCurrentDate(new Date())}
              className="ml-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
              Сьогодні
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-16 border-r border-gray-200"/>
                  {barbers.length === 0
                    ? <th className="py-4 text-sm text-gray-400 font-normal">Немає барберів</th>
                    : barbers.map(emp => {
                      const off = isDayOff(emp, currentDate);
                      return (
                        <th key={emp._id} className={`border-l border-gray-200 py-2 px-2 text-center font-normal ${off ? 'bg-gray-50' : ''}`}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=40`}
                            alt={emp.name}
                            className={`w-8 h-8 rounded-full mx-auto mb-1 ${off ? 'opacity-40 grayscale' : ''}`}/>
                          <p className={`text-xs font-semibold truncate ${off ? 'text-gray-400' : 'text-gray-800'}`}>{emp.name}</p>
                          <p className="text-xs text-gray-400">{off ? '😴 Вихідний' : emp.role}</p>
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot} className={slot.endsWith(':00') ? 'border-t border-gray-200' : 'border-t border-gray-100'}>
                    <td className="w-16 border-r border-gray-200 pr-2 text-right align-top pt-0.5"
                      style={{ height: PX_PER_SLOT }}>
                      {slot.endsWith(':00') && (
                        <span className="text-xs text-gray-400 leading-none">{slot}</span>
                      )}
                    </td>
                    {barbers.map(emp => {
                      const off = isDayOff(emp, currentDate);

                      // ── вихідний день ──────────────────────────────────────
                      if (off) {
                        const isFirstSlot = slot === SLOTS[0];
                        return (
                          <td key={emp._id}
                            style={{ height: PX_PER_SLOT, position:'relative', padding:0 }}
                            className="border-l border-gray-100 bg-gray-50 cursor-not-allowed select-none">
                            {isFirstSlot && (
                              <div style={{ position:'absolute', top:0, left:0, right:0, height:`${TOTAL_H}px`, zIndex:4 }}
                                className="flex items-center justify-center bg-gray-100 bg-opacity-70">
                                <span className="text-sm text-gray-400 font-medium">Вихідний</span>
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
                          className={`border-l border-gray-100 align-top
                            ${!busy && !covered ? 'cursor-pointer hover:bg-indigo-50 transition-colors' : ''}
                            ${busy && !apptHere && !covered ? 'bg-gray-50' : ''}`}
                          onClick={() => !busy && !covered && handleSlotClick(emp._id, slot)}>
                          {apptHere && (() => {
                            const height = durToH(apptHere.totalDuration);
                            const color  = STATUS_COLORS[apptHere.status] || 'bg-indigo-500 border-indigo-600';
                            return (
                              <div
                                onClick={e => { e.stopPropagation(); openEdit(apptHere); }}
                                style={{ height:`${height}px`, position:'absolute', top:0, left:4, right:4, zIndex:5 }}
                                className={`rounded border-l-4 px-1.5 py-0.5 text-white text-xs cursor-pointer hover:opacity-90 shadow-sm overflow-hidden ${color}`}>
                                <p className="font-semibold truncate leading-tight">{clientName(apptHere.client)}</p>
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Новий запис">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Клієнт</label>
              <button type="button" onClick={() => { setAddingNC(!addingNC); setPhoneMatch(null); setNewClient(defaultNC); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <UserPlus size={12}/> {addingNC ? 'Обрати існуючого' : 'Новий клієнт'}
              </button>
            </div>
            {addingNC ? (
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50 space-y-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Телефон</label>
                  <PhoneInput value={newClient.phone} onChange={handlePhoneChange}/>
                </div>
                {phoneMatch ? (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-green-700 text-sm font-medium">✓ Знайдено: {phoneMatch.name}</p>
                    <p className="text-green-600 text-xs">{phoneMatch.email}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Буде використано існуючий профіль</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Ім'я</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        placeholder="Ім'я клієнта" value={newClient.name}
                        onChange={e => setNewClient(p => ({...p, name:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Email</label>
                      <input type="email" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        placeholder="email@example.com" value={newClient.email}
                        onChange={e => setNewClient(p => ({...p, email:e.target.value}))}/>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={addForm.clientId} onChange={e => setAddForm({...addForm, clientId:e.target.value})}>
                <option value="">— Виберіть клієнта —</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Майстер</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={addForm.employeeId} onChange={e => setAddForm({...addForm, employeeId:e.target.value})}>
              <option value="">— Виберіть майстра —</option>
              {barbers.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Послуги</label>
            <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
              {services.filter(s=>s.isAvailable).map(s => (
                <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-600"
                    checked={addForm.serviceIds.includes(s._id)}
                    onChange={e => {
                      const {ids,price,dur} = toggleService(addForm.serviceIds, s._id, e.target.checked);
                      setAddForm({...addForm, serviceIds:ids, totalPrice:price, totalDuration:dur});
                    }}/>
                  <span>{s.name}</span>
                  <span className="ml-auto text-gray-400 text-xs">${s.price} · {s.duration}хв</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
              <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={addForm.date} onChange={e => setAddForm({...addForm, date:e.target.value})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Час</label>
              <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={addForm.startTime} onChange={e => setAddForm({...addForm, startTime:e.target.value})}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тривалість (хв)</label>
              <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={addForm.totalDuration} onChange={e => setAddForm({...addForm, totalDuration:Number(e.target.value)})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ціна ($)</label>
              <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={addForm.totalPrice} onChange={e => setAddForm({...addForm, totalPrice:Number(e.target.value)})}/>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Скасувати
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Збереження...' : 'Створити запис'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal isOpen={!!editAppt} onClose={() => setEditAppt(null)} title="Редагувати запис">
        {editAppt && (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Клієнт</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={editForm.clientId} onChange={e => setEditForm({...editForm, clientId:e.target.value})}>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Майстер</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={editForm.employeeId} onChange={e => setEditForm({...editForm, employeeId:e.target.value})}>
                {barbers.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Послуги</label>
              <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                {services.filter(s=>s.isAvailable).map(s => (
                  <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input type="checkbox" className="rounded border-gray-300 text-indigo-600"
                      checked={(editForm.serviceIds||[]).includes(s._id)}
                      onChange={e => {
                        const {ids,price,dur} = toggleService(editForm.serviceIds||[], s._id, e.target.checked);
                        setEditForm({...editForm, serviceIds:ids, totalPrice:price, totalDuration:dur});
                      }}/>
                    <span>{s.name}</span>
                    <span className="ml-auto text-gray-400 text-xs">${s.price} · {s.duration}хв</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={editForm.date} onChange={e => setEditForm({...editForm, date:e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Час</label>
                <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={editForm.startTime} onChange={e => setEditForm({...editForm, startTime:e.target.value})}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тривалість (хв)</label>
                <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={editForm.totalDuration} onChange={e => setEditForm({...editForm, totalDuration:Number(e.target.value)})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ціна ($)</label>
                <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={editForm.totalPrice} onChange={e => setEditForm({...editForm, totalPrice:Number(e.target.value)})}/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
              <div className="flex gap-2 flex-wrap">
                {['Scheduled','Completed','Cancelled','No-show'].map(s => (
                  <button key={s} onClick={() => setEditForm({...editForm, status:s})}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                      ${editForm.status===s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <button onClick={() => handleDelete(editAppt._id)}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 font-medium">
                Видалити
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditAppt(null)}
                  className="px-4 py-1.5 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
                  Скасувати
                </button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="px-4 py-1.5 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {editSaving ? 'Збереження...' : 'Зберегти'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Appointments;