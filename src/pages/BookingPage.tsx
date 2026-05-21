import { useState, useEffect } from 'react';
import { Scissors, CheckCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import api from '../api';

interface Service { _id: string; name: string; price: number; duration: number; category: string; }
interface Employee { _id: string; name: string; role: string; }

type Step = 1 | 2 | 3 | 4 | 5;

const BookingPage = () => {
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
      setEmailError('Введіть коректний email (наприклад: ivan@gmail.com)');
      return false;
    }
    setEmailError('');
    return true;
  };

  useEffect(() => {
    api.get('/booking/services').then(r => setServices(r.data));
    api.get('/booking/employees').then(r => setEmployees(r.data));
  }, []);

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
  }, [selectedEmployee, selectedDate]);

  const toggleService = (s: Service) => {
    setSelectedServices(prev =>
      prev.find(x => x._id === s._id) ? prev.filter(x => x._id !== s._id) : [...prev, s]
    );
  };

  const totalPrice    = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!clientName || !clientPhone || !clientEmail) { setError('Заповніть всі поля'); return; }
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
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Помилка при бронюванні');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500"/>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Запис підтверджено!</h2>
        <p className="text-gray-500 mb-1">Майстер: <strong>{selectedEmployee?.name}</strong></p>
        <p className="text-gray-500 mb-1">Дата: <strong>{selectedDate}</strong> о <strong>{selectedTime}</strong></p>
        <p className="text-gray-500 mb-6">Сума: <strong>{totalPrice} грн</strong></p>
        <button
          onClick={() => {
            setDone(false); setStep(1);
            setSelectedServices([]); setSelectedEmployee(null);
            setSelectedDate(''); setSelectedTime('');
            setClientName(''); setClientPhone(''); setClientEmail('');
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
          Записатись ще раз
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Scissors size={24}/>
          <h1 className="text-2xl font-bold">BarberCRM</h1>
        </div>
        <p className="text-gray-400 text-sm">Онлайн-запис</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {[
            { n: 1, label: 'Послуга' },
            { n: 2, label: 'Майстер' },
            { n: 3, label: 'Час' },
            { n: 4, label: 'Контакти' },
            { n: 5, label: 'Підтвердження' },
          ].map(({ n, label }) => (
            <div key={n} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${step === n ? 'bg-indigo-600 text-white' : step > n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > n ? '✓' : n}
              </div>
              <span className="text-xs mt-1 text-gray-500 hidden sm:block">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — Послуги */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Оберіть послугу</h2>
            <div className="space-y-3">
              {services.map(s => (
                <div key={s._id}
                  onClick={() => toggleService(s)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition
                    ${selectedServices.find(x => x._id === s._id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.duration} хв</p>
                    </div>
                    <p className="font-semibold text-indigo-600">{s.price} грн</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex justify-between items-center">
                <span className="text-sm text-gray-600">Обрано: {selectedServices.length} послуг • {totalDuration} хв</span>
                <span className="font-semibold text-indigo-600">{totalPrice} грн</span>
              </div>
            )}
            <button
              disabled={selectedServices.length === 0}
              onClick={() => setStep(2)}
              className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40">
              Далі
            </button>
          </div>
        )}

        {/* Step 2 — Майстер */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Оберіть майстра</h2>
            <div className="space-y-3">
              {employees.map(e => {
                const initials = e.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div key={e._id}
                    onClick={() => setSelectedEmployee(e)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-4
                      ${selectedEmployee?._id === e._id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">{initials}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{e.name}</p>
                      <p className="text-sm text-gray-500">{e.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                Назад
              </button>
              <button disabled={!selectedEmployee} onClick={() => setStep(3)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40">
                Далі
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Дата і час */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Оберіть дату та час</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
              <input type="date" min={todayStr} value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); setIsClosed(false); }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Вільний час</label>
                {isClosed ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-orange-600">🚫 Заклад не працює в цей день</p>
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-gray-500 text-sm">Немає вільних слотів на цю дату</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 rounded-lg text-sm font-medium border transition
                          ${selectedTime === slot
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-200 text-gray-700 hover:border-indigo-300'}`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                Назад
              </button>
              <button disabled={!selectedDate || !selectedTime || isClosed} onClick={() => setStep(4)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40">
                Далі
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Контакти */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ваші контакти</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Імʼя *</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="Іван Петренко"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон *</label>
                <PhoneInput
                  international
                  defaultCountry="UA"
                  value={clientPhone}
                  onChange={(val) => setClientPhone(val || '')}
                  className="phone-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => {
                    setClientEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => clientEmail && validateEmail(clientEmail)}
                  placeholder="ivan@gmail.com"
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition
                    ${emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500'}`}
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(3)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                Назад
              </button>
              <button
                disabled={!clientName || !clientPhone || !clientEmail}
                onClick={() => { if (!validateEmail(clientEmail)) return; setStep(5); }}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40">
                Далі
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Підтвердження */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Підтвердження запису</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Майстер</span>
                <span className="font-medium">{selectedEmployee?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Послуги</span>
                <span className="font-medium text-right">{selectedServices.map(s => s.name).join(', ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Дата і час</span>
                <span className="font-medium">{selectedDate} о {selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Тривалість</span>
                <span className="font-medium">{totalDuration} хв</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Сума</span>
                <span className="font-bold text-indigo-600 text-lg">{totalPrice} грн</span>
              </div>
              <div className="border-t pt-3 text-sm text-gray-500">
                <p>{clientName} • {clientPhone}</p>
                {clientEmail && <p>{clientEmail}</p>}
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(4)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                Назад
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                {loading ? 'Бронюємо...' : 'Підтвердити запис'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;