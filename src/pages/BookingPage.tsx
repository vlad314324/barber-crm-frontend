import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle, ChevronLeft, ChevronRight,
  User, CalendarDays, ListChecks, Info, MapPin, Phone, Globe, Copy, Check,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { API_BASE_URL } from '../api';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from '../components/LanguageToggle';
import LocationMap from '../components/LocationMap';
import { getErrorMessage } from '../utils/errors';
import { PublicBookingSettings } from '../api/types';

interface Service { _id: string; name: string; price: number; duration: number; category: string; }
interface Employee { _id: string; name: string; role: string; services?: string[]; }

const HEX_COLOR_RE = /^#([0-9a-f]{3}){1,2}$/i;

type Screen = 'menu' | 'about' | 'services' | 'master' | 'datetime' | 'contacts' | 'confirm';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_SHORT: Record<'uk' | 'en', Record<typeof DAY_ORDER[number], string>> = {
  uk: { monday: 'Пн', tuesday: 'Вт', wednesday: 'Ср', thursday: 'Чт', friday: 'Пт', saturday: 'Сб', sunday: 'Нд' },
  en: { monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th', friday: 'Fr', saturday: 'Sa', sunday: 'Su' },
};

const ScreenHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="flex items-center gap-2 mb-5">
    <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-canvas-soft text-ink-secondary">
      <ChevronLeft size={22}/>
    </button>
    <h2 className="text-xl font-bold text-ink tracking-tight">{title}</h2>
  </div>
);

const MenuRow = ({ icon, title, subtitle, disabled, disabledHint, onClick }: {
  icon: ReactNode; title: string; subtitle?: string; disabled?: boolean; disabledHint?: string; onClick: () => void;
}) => (
  <div
    onClick={disabled ? undefined : onClick}
    className={`flex items-center gap-3 px-4 py-3.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-canvas-soft'}`}>
    <div className="w-9 h-9 rounded-full bg-canvas-soft flex items-center justify-center flex-shrink-0 text-ink-secondary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-ink">{title}</p>
      {subtitle && <p className="text-xs text-brand-dark truncate mt-0.5">{subtitle}</p>}
      {disabled && disabledHint && <p className="text-xs text-ink-muted mt-0.5">{disabledHint}</p>}
    </div>
    {!disabled && <ChevronRight size={18} className="text-ink-muted flex-shrink-0"/>}
  </div>
);

const BookingPage = () => {
  const { t, lang } = useLocale();
  const { salonSlug } = useParams<{ salonSlug?: string }>();
  // Standalone client, scoped to this salon's slug — deliberately not the
  // shared authenticated `api` instance, so this public page never touches
  // (or gets touched by) an admin session's tenant in another tab.
  const api = useMemo(() => axios.create({
    baseURL: `${API_BASE_URL}/${salonSlug}`,
    headers: { 'Content-Type': 'application/json' },
  }), [salonSlug]);

  const [screen, setScreen] = useState<Screen>('menu');

  const [services, setServices]   = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branding, setBranding]   = useState<PublicBookingSettings | null>(null);
  const [slots, setSlots]         = useState<string[]>([]);
  const [isClosed, setIsClosed]   = useState(false);

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedTime, setSelectedTime]         = useState('');
  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);
  const [emailError, setEmailError] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError(t('booking.invalidEmail'));
      return false;
    }
    setEmailError('');
    return true;
  };

  useEffect(() => {
    if (!salonSlug) return;
    api.get('/booking/services').then(r => setServices(r.data));
    api.get('/booking/employees').then(r => setEmployees(r.data));
    api.get('/booking/settings').then(r => setBranding(r.data)).catch(() => setBranding(null));
  }, [api, salonSlug]);

  const accentColor = branding?.accentColor && HEX_COLOR_RE.test(branding.accentColor) ? branding.accentColor : null;
  const accentStyle = accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : undefined;

  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      api.get(`/booking/available-slots?employeeId=${selectedEmployee._id}&date=${selectedDate}`)
        .then(r => {
          setIsClosed(r.data.closed || false);
          let available = r.data.availableSlots;

          const todayStr = new Date().toISOString().split('T')[0];
          if (selectedDate === todayStr) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            available = available.filter((slot: string) => {
              const [h, m] = slot.split(':').map(Number);
              return h * 60 + m > currentMinutes;
            });
          }

          setSlots(available);
        });
    }
  }, [selectedEmployee, selectedDate, api]);

  const toggleService = (s: Service) => {
    setSelectedServices(prev =>
      prev.find(x => x._id === s._id) ? prev.filter(x => x._id !== s._id) : [...prev, s]
    );
  };

  const totalPrice    = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  // Порожній/невизначений selectedEmployee.services означає "без обмежень".
  const availableServices = !selectedEmployee || !selectedEmployee.services || selectedEmployee.services.length === 0
    ? services
    : services.filter(s => selectedEmployee.services!.includes(s._id));

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCopyAddress = async () => {
    if (!branding?.address) return;
    try {
      await navigator.clipboard.writeText(branding.address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      // clipboard API недоступний — не критично
    }
  };

  const handleSubmit = async () => {
    if (!clientName || !clientPhone || !clientEmail) { setError(t('booking.fillAll')); return; }
    if (!validateEmail(clientEmail)) return;
    setLoading(true); setError('');
    try {
      await api.post('/booking', {
        employeeId: selectedEmployee!._id,
        serviceIds: selectedServices.map(s => s._id),
        date: selectedDate,
        startTime: selectedTime,
        clientName,
        clientPhone,
        clientEmail,
      });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err) || t('booking.bookingError'));
    } finally {
      setLoading(false);
    }
  };

  if (!salonSlug) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold text-ink mb-2">{t('booking.noSalonTitle')}</h2>
        <p className="text-ink-secondary text-sm">{t('booking.noSalonSubtitle')}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-brand"/>
        </div>
        <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">{t('booking.confirmed')}</h2>
        <p className="text-ink-secondary mb-1">{t('booking.masterLabel')}: <strong className="text-ink">{selectedEmployee?.name}</strong></p>
        <p className="text-ink-secondary mb-1">{t('booking.dateLabel')}: <strong className="text-ink">{selectedDate}</strong> {t('booking.at')} <strong className="text-ink">{selectedTime}</strong></p>
        <p className="text-ink-secondary mb-6">{t('booking.sumLabel')}: <strong className="text-ink">{totalPrice} {t('common.currency')}</strong></p>
        <button
          onClick={() => {
            setDone(false); setScreen('menu');
            setSelectedServices([]); setSelectedEmployee(null);
            setSelectedDate(''); setSelectedTime('');
            setClientName(''); setClientPhone(''); setClientEmail('');
          }}
          className="btn btn-primary">
          {t('booking.bookAgain')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {screen === 'menu' ? (
        <div className="bg-ink text-white py-6 px-4 text-center relative"
          style={branding?.coverImageUrl ? {
            backgroundImage: `linear-gradient(rgba(15,15,20,.6), rgba(15,15,20,.6)), url(${branding.coverImageUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          } : undefined}>
          <div className="absolute top-4 right-4">
            <LanguageToggle variant="dark" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            {branding?.logoUrl
              ? <img src={branding.logoUrl} alt={branding.shopName} className="h-8 max-w-[140px] object-contain"/>
              : <img src="/icon.png" alt="hirnix" className="w-8 h-8 rounded-md"/>}
            <h1 className="text-2xl font-extrabold inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
              {branding?.shopName || 'hirnix'}
              <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1" />
            </h1>
          </div>
          <p className="text-canvas/60 text-sm">{branding?.tagline || t('booking.onlineBooking')}</p>
        </div>
      ) : (
        <div className="px-4 pt-4 flex justify-end">
          <LanguageToggle />
        </div>
      )}

      {/* Хаб — головне меню */}
      {screen === 'menu' && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {branding?.address && (
            <div className="ds-card p-4">
              <p className="text-sm text-ink-secondary flex items-center gap-2">
                <MapPin size={15} className="text-ink-muted flex-shrink-0"/> {branding.address}
              </p>
            </div>
          )}

          <div className="ds-card overflow-hidden divide-y divide-line">
            <MenuRow
              icon={<User size={18}/>}
              title={t('booking.menuMaster')}
              subtitle={selectedEmployee?.name}
              onClick={() => setScreen('master')}
            />
            <MenuRow
              icon={<ListChecks size={18}/>}
              title={t('booking.menuServices')}
              subtitle={selectedServices.length > 0 ? `${selectedServices.length} · ${totalPrice} ${t('common.currency')}` : undefined}
              onClick={() => setScreen('services')}
            />
            <MenuRow
              icon={<CalendarDays size={18}/>}
              title={t('booking.menuDateTime')}
              subtitle={selectedDate && selectedTime ? `${selectedDate} ${t('booking.at')} ${selectedTime}` : undefined}
              disabled={!selectedEmployee}
              disabledHint={t('booking.chooseMasterFirst')}
              onClick={() => setScreen('datetime')}
            />
            <MenuRow
              icon={<Info size={18}/>}
              title={t('booking.menuAbout')}
              onClick={() => setScreen('about')}
            />
          </div>

          <button
            disabled={!selectedEmployee || !selectedDate || !selectedTime || selectedServices.length === 0}
            onClick={() => setScreen('contacts')}
            style={accentStyle}
            className="btn btn-primary w-full py-3">
            {t('booking.bookNow')}
          </button>
        </div>
      )}

      {/* Про заклад */}
      {screen === 'about' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.aboutTitle')} onBack={() => setScreen('menu')} />

          <div className="ds-card p-5 space-y-3 mb-4">
            <div className="flex items-center gap-3">
              {branding?.logoUrl
                ? <img src={branding.logoUrl} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0"/>
                : <img src="/icon.png" alt="hirnix" className="w-11 h-11 rounded-full object-cover flex-shrink-0"/>}
              <h3 className="text-lg font-bold text-ink">{branding?.shopName || 'hirnix'}</h3>
            </div>
            {branding?.address && (
              <p className="flex items-center gap-2 text-sm text-ink-secondary">
                <MapPin size={16} className="text-ink-muted flex-shrink-0"/> {branding.address}
              </p>
            )}
            {branding?.phone && (
              <a href={`tel:${branding.phone}`} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-brand w-fit">
                <Phone size={16} className="text-ink-muted flex-shrink-0"/> {branding.phone}
              </a>
            )}
            {branding?.websiteUrl && (
              <a href={branding.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-ink-secondary hover:text-brand w-fit truncate">
                <Globe size={16} className="text-ink-muted flex-shrink-0"/> <span className="truncate">{branding.websiteUrl}</span>
              </a>
            )}
          </div>

          {branding?.workingHours && (
            <div className="ds-card p-5 mb-4">
              <h4 className="text-sm font-semibold text-ink mb-3">{t('booking.workingHoursTitle')}</h4>
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAY_ORDER.map(day => {
                  const d = branding.workingHours?.[day];
                  const off = !d || !d.isOpen;
                  return (
                    <div key={day}>
                      <p className="text-[11px] font-medium text-ink-muted">{DAY_SHORT[lang][day]}</p>
                      <div className={`mt-0.5 py-1 rounded-xs text-[10px] leading-tight ${off ? 'bg-red-50 text-red-500' : 'bg-brand-soft text-brand-dark'}`}>
                        {off ? '×' : `${d.from}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ds-card p-5">
            <h4 className="text-sm font-semibold text-ink mb-3">{t('booking.locationTitle')}</h4>
            {branding?.address && (
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-sm text-ink-secondary">{branding.address}</span>
                <button onClick={handleCopyAddress} className="text-ink-muted hover:text-ink flex-shrink-0" title={t('settings.bookingLink.copyBtn')}>
                  {addressCopied ? <Check size={15}/> : <Copy size={15}/>}
                </button>
              </div>
            )}
            {branding?.latitude != null && branding?.longitude != null ? (
              <LocationMap lat={branding.latitude} lng={branding.longitude} label={branding.shopName}/>
            ) : (
              <p className="text-sm text-ink-muted">{t('booking.noCoordinates')}</p>
            )}
          </div>
        </div>
      )}

      {/* Майстер */}
      {screen === 'master' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.chooseMaster')} onBack={() => setScreen('menu')} />
          <div className="space-y-3">
            {employees.map(e => {
              const initials = e.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={e._id}
                  onClick={() => {
                    const allowedIds = !e.services || e.services.length === 0 ? null : new Set(e.services);
                    setSelectedServices(prev => allowedIds ? prev.filter(s => allowedIds.has(s._id)) : prev);
                    setSelectedEmployee(e);
                    setScreen('menu');
                  }}
                  className={`p-4 rounded-md border-2 cursor-pointer transition-colors flex items-center gap-4
                    ${selectedEmployee?._id === e._id
                      ? 'border-brand bg-brand-extra-soft'
                      : 'border-line bg-surface hover:border-line-medium'}`}>
                  <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">{initials}</span>
                  </div>
                  <div>
                    <p className="font-medium text-ink">{e.name}</p>
                    <p className="text-sm text-ink-muted">{t(`roles.${e.role}`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Дата і час */}
      {screen === 'datetime' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.chooseDateTime')} onBack={() => setScreen('menu')} />
          <div className="mb-4">
            <label className="field-label">{t('booking.dateLabel')}</label>
            <input type="date" min={todayStr} value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); setIsClosed(false); }}
              className="field-input py-3"/>
          </div>
          {selectedDate && (
            <div>
              <label className="field-label">{t('booking.availableTimeLabel')}</label>
              {isClosed ? (
                <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                  <p className="text-sm text-amber-700">{t('booking.closedMessage')}</p>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-ink-muted text-sm">{t('booking.noSlots')}</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button key={slot}
                      onClick={() => setSelectedTime(slot)}
                      style={selectedTime === slot ? accentStyle : undefined}
                      className={`py-2 rounded-sm text-sm font-medium border transition-colors
                        ${selectedTime === slot
                          ? 'bg-brand text-white border-brand'
                          : 'border-line text-ink-secondary hover:border-brand/50'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            disabled={!selectedDate || !selectedTime || isClosed}
            onClick={() => setScreen('menu')}
            className="btn btn-primary w-full mt-6 py-3">
            {t('booking.confirmSelection')}
          </button>
        </div>
      )}

      {/* Послуги */}
      {screen === 'services' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.chooseService')} onBack={() => setScreen('menu')} />
          <div className="space-y-3">
            {availableServices.map(s => (
              <div key={s._id}
                onClick={() => toggleService(s)}
                className={`p-4 rounded-md border-2 cursor-pointer transition-colors
                  ${selectedServices.find(x => x._id === s._id)
                    ? 'border-brand bg-brand-extra-soft'
                    : 'border-line bg-surface hover:border-line-medium'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-sm text-ink-muted">{s.duration} {t('booking.minutes')}</p>
                  </div>
                  <p className="font-semibold text-brand-dark">{s.price} {t('common.currency')}</p>
                </div>
              </div>
            ))}
          </div>
          {selectedServices.length > 0 && (
            <div className="mt-4 p-3 bg-brand-extra-soft rounded-sm flex justify-between items-center">
              <span className="text-sm text-ink-secondary">{t('booking.selectedCount', { count: selectedServices.length, duration: totalDuration })}</span>
              <span className="font-semibold text-brand-dark">{totalPrice} {t('common.currency')}</span>
            </div>
          )}
          <button
            disabled={selectedServices.length === 0}
            onClick={() => setScreen('menu')}
            className="btn btn-primary w-full mt-6 py-3">
            {t('booking.confirmSelection')}
          </button>
        </div>
      )}

      {/* Контакти */}
      {screen === 'contacts' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.contactsTitle')} onBack={() => setScreen('menu')} />
          <div className="space-y-4">
            <div>
              <label className="field-label">{t('booking.nameLabel')}</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                placeholder={t('booking.namePlaceholder')}
                className="field-input py-3"/>
            </div>
            <div>
              <label className="field-label">{t('booking.phoneLabel')}</label>
              <PhoneInput
                international
                defaultCountry="UA"
                value={clientPhone}
                onChange={(val) => setClientPhone(val || '')}
                className="phone-input"
              />
            </div>
            <div>
              <label className="field-label">{t('booking.emailLabel')}</label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => {
                  setClientEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => clientEmail && validateEmail(clientEmail)}
                placeholder="ivan@gmail.com"
                className={`field-input py-3 ${emailError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15' : ''}`}
              />
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>
          </div>
          <button
            disabled={!clientName || !clientPhone || !clientEmail}
            onClick={() => { if (!validateEmail(clientEmail)) return; setScreen('confirm'); }}
            className="btn btn-primary w-full mt-6 py-3">
            {t('booking.next')}
          </button>
        </div>
      )}

      {/* Підтвердження */}
      {screen === 'confirm' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.confirmTitle')} onBack={() => setScreen('contacts')} />
          <div className="ds-card p-5 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.masterLabel')}</span>
              <span className="font-medium text-ink">{selectedEmployee?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.servicesLabel')}</span>
              <span className="font-medium text-ink text-right">{selectedServices.map(s => s.name).join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.dateTimeLabel')}</span>
              <span className="font-medium text-ink">{selectedDate} {t('booking.at')} {selectedTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.durationLabel')}</span>
              <span className="font-medium text-ink">{totalDuration} {t('booking.minutes')}</span>
            </div>
            <div className="border-t border-line pt-3 flex justify-between">
              <span className="font-semibold text-ink">{t('booking.sumLabel')}</span>
              <span className="font-bold text-brand-dark text-lg">{totalPrice} {t('common.currency')}</span>
            </div>
            <div className="border-t border-line pt-3 text-sm text-ink-muted">
              <p>{clientName} • {clientPhone}</p>
              {clientEmail && <p>{clientEmail}</p>}
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading} style={accentStyle} className="btn btn-primary w-full py-3">
            {loading ? t('booking.booking') : t('booking.confirmBtn')}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
