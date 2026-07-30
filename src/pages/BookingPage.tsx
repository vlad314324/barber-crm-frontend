import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Scissors, CheckCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { API_BASE_URL } from '../api';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from '../components/LanguageToggle';
import { getErrorMessage } from '../utils/errors';

interface Service { _id: string; name: string; price: number; duration: number; category: string; }
interface Employee { _id: string; name: string; role: string; }

type Step = 1 | 2 | 3 | 4 | 5;

const DEFAULT_SALON_SLUG = 'barbershop';

const BookingPage = () => {
  const { t } = useLocale();
  const { salonSlug } = useParams<{ salonSlug?: string }>();
  // Standalone client, scoped to this salon's slug — deliberately not the
  // shared authenticated `api` instance, so this public page never touches
  // (or gets touched by) an admin session's tenant in another tab.
  const api = useMemo(() => axios.create({
    baseURL: `${API_BASE_URL}/${salonSlug || DEFAULT_SALON_SLUG}`,
    headers: { 'Content-Type': 'application/json' },
  }), [salonSlug]);

  const [step, setStep] = useState<Step>(1);

  const [services, setServices]   = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    api.get('/booking/services').then(r => setServices(r.data));
    api.get('/booking/employees').then(r => setEmployees(r.data));
  }, [api]);

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

  const todayStr = new Date().toISOString().split('T')[0];

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
        <p className="text-ink-secondary mb-1">{t('booking.dateLabel')}: <strong className="text-ink">{selectedDate}</strong> о <strong className="text-ink">{selectedTime}</strong></p>
        <p className="text-ink-secondary mb-6">{t('booking.sumLabel')}: <strong className="text-ink">{totalPrice} грн</strong></p>
        <button
          onClick={() => {
            setDone(false); setStep(1);
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
      <div className="bg-ink text-white py-6 px-4 text-center relative">
        <div className="absolute top-4 right-4">
          <LanguageToggle variant="dark" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Scissors size={24}/>
          <h1 className="text-2xl font-extrabold inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
            hirnix
            <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1" />
          </h1>
        </div>
        <p className="text-canvas/60 text-sm">{t('booking.onlineBooking')}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {[
            { n: 1, label: t('booking.stepService') },
            { n: 2, label: t('booking.stepMaster') },
            { n: 3, label: t('booking.stepTime') },
            { n: 4, label: t('booking.stepContacts') },
            { n: 5, label: t('booking.stepConfirm') },
          ].map(({ n, label }) => (
            <div key={n} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${step === n ? 'bg-brand text-white' : step > n ? 'bg-brand-dark text-white' : 'bg-canvas-soft text-ink-muted'}`}>
                {step > n ? '✓' : n}
              </div>
              <span className="text-xs mt-1 text-ink-muted hidden sm:block">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — Послуги */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-ink tracking-tight mb-4">{t('booking.chooseService')}</h2>
            <div className="space-y-3">
              {services.map(s => (
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
                    <p className="font-semibold text-brand-dark">{s.price} грн</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-4 p-3 bg-brand-extra-soft rounded-sm flex justify-between items-center">
                <span className="text-sm text-ink-secondary">{t('booking.selectedCount', { count: selectedServices.length, duration: totalDuration })}</span>
                <span className="font-semibold text-brand-dark">{totalPrice} грн</span>
              </div>
            )}
            <button
              disabled={selectedServices.length === 0}
              onClick={() => setStep(2)}
              className="btn btn-primary w-full mt-6 py-3">
              {t('booking.next')}
            </button>
          </div>
        )}

        {/* Step 2 — Майстер */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-ink tracking-tight mb-4">{t('booking.chooseMaster')}</h2>
            <div className="space-y-3">
              {employees.map(e => {
                const initials = e.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div key={e._id}
                    onClick={() => setSelectedEmployee(e)}
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
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn btn-secondary flex-1 py-3">
                {t('booking.back')}
              </button>
              <button disabled={!selectedEmployee} onClick={() => setStep(3)} className="btn btn-primary flex-1 py-3">
                {t('booking.next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Дата і час */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-ink tracking-tight mb-4">{t('booking.chooseDateTime')}</h2>
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
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="btn btn-secondary flex-1 py-3">
                {t('booking.back')}
              </button>
              <button disabled={!selectedDate || !selectedTime || isClosed} onClick={() => setStep(4)} className="btn btn-primary flex-1 py-3">
                {t('booking.next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Контакти */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-ink tracking-tight mb-4">{t('booking.contactsTitle')}</h2>
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
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(3)} className="btn btn-secondary flex-1 py-3">
                {t('booking.back')}
              </button>
              <button
                disabled={!clientName || !clientPhone || !clientEmail}
                onClick={() => { if (!validateEmail(clientEmail)) return; setStep(5); }}
                className="btn btn-primary flex-1 py-3">
                {t('booking.next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Підтвердження */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-ink tracking-tight mb-4">{t('booking.confirmTitle')}</h2>
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
                <span className="font-medium text-ink">{selectedDate} о {selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">{t('booking.durationLabel')}</span>
                <span className="font-medium text-ink">{totalDuration} {t('booking.minutes')}</span>
              </div>
              <div className="border-t border-line pt-3 flex justify-between">
                <span className="font-semibold text-ink">{t('booking.sumLabel')}</span>
                <span className="font-bold text-brand-dark text-lg">{totalPrice} грн</span>
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
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="btn btn-secondary flex-1 py-3">
                {t('booking.back')}
              </button>
              <button onClick={handleSubmit} disabled={loading} className="btn btn-primary flex-1 py-3">
                {loading ? t('booking.booking') : t('booking.confirmBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;