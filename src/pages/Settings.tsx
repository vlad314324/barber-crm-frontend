import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, Lock, Save, Check } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DAYS = [
  { key: 'monday',    label: 'Понеділок' },
  { key: 'tuesday',   label: 'Вівторок' },
  { key: 'wednesday', label: 'Середа' },
  { key: 'thursday',  label: 'Четвер' },
  { key: 'friday',    label: 'П\'ятниця' },
  { key: 'saturday',  label: 'Субота' },
  { key: 'sunday',    label: 'Неділя' },
];

interface WorkingDay { isOpen: boolean; from: string; to: string; }
interface SettingsData {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  workingHours: Record<string, WorkingDay>;
}

const Settings = () => {
  const { user } = useAuth();

  const [settings, setSettings] = useState<SettingsData>({
    shopName: '', address: '', phone: '', email: '', workingHours: {},
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [savedInfo, setSavedInfo]   = useState(false);
  const [savedPass, setSavedPass]   = useState(false);
  const [errorPass, setErrorPass]   = useState('');

  useEffect(() => {
    api.get('/settings').then(r => {
      const data = r.data;
      setSettings({ ...data, workingHours: data.workingHours || {} });
      setLoading(false);
    });
  }, []);

  const handleInfoSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setSavedInfo(true);
      setTimeout(() => setSavedInfo(false), 3000);
    } catch {
      alert('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setErrorPass('');
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setErrorPass('Заповніть всі поля'); return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorPass('Паролі не співпадають'); return;
    }
    if (passwords.newPassword.length < 6) {
      setErrorPass('Мінімум 6 символів'); return;
    }
    setSavingPass(true);
    try {
      await api.put('/settings/change-password', {
        userId: user?.id,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setSavedPass(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSavedPass(false), 3000);
    } catch (err: any) {
      setErrorPass(err.response?.data?.msg || 'Помилка зміни пароля');
    } finally {
      setSavingPass(false);
    }
  };

  const updateWorkingHour = (day: string, field: keyof WorkingDay, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value },
      },
    }));
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <SettingsIcon size={24} className="text-indigo-600" />
        Налаштування
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ліва колонка */}
        <div className="space-y-6">

          {/* Загальна інформація */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Загальна інформація</h2>
              <p className="text-sm text-gray-500 mt-0.5">Дані вашого закладу</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Назва закладу', key: 'shopName',  type: 'text',  placeholder: 'BarberShop' },
                { label: 'Адреса',        key: 'address',   type: 'text',  placeholder: 'вул. Франка 10, Львів' },
                { label: 'Телефон',       key: 'phone',     type: 'tel',   placeholder: '+380671234567' },
                { label: 'Email',         key: 'email',     type: 'email', placeholder: 'shop@gmail.com' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(settings as any)[key]}
                    onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button onClick={handleInfoSave} disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {savedInfo ? <><Check size={16}/> Збережено</> : <><Save size={16}/> Зберегти</>}
                </button>
              </div>
            </div>
          </div>

          {/* Зміна пароля */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Lock size={18} className="text-indigo-600" /> Зміна пароля
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Оновіть пароль вашого акаунту</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Поточний пароль',          key: 'currentPassword' },
                { label: 'Новий пароль',              key: 'newPassword' },
                { label: 'Підтвердіть новий пароль',  key: 'confirmPassword' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type="password"
                    value={(passwords as any)[key]}
                    onChange={e => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              {errorPass && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{errorPass}</p>
                </div>
              )}
              {savedPass && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-green-600">Пароль успішно змінено!</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={handlePasswordSave} disabled={savingPass}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {savedPass ? <><Check size={16}/> Змінено</> : <><Lock size={16}/> Змінити пароль</>}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Права колонка — Години роботи */}
        <div className="bg-white shadow rounded-lg overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" /> Години роботи
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Розклад роботи закладу</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            {DAYS.map(({ key, label }) => {
              const day = settings.workingHours[key] || { isOpen: true, from: '09:00', to: '19:00' };
              return (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={e => updateWorkingHour(key, 'isOpen', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded flex-shrink-0"
                  />
                  <span className={`text-sm font-medium w-24 flex-shrink-0 ${day.isOpen ? 'text-gray-700' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {day.isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.from}
                        onChange={e => updateWorkingHour(key, 'from', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-gray-400 text-sm">—</span>
                      <input
                        type="time"
                        value={day.to}
                        onChange={e => updateWorkingHour(key, 'to', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Вихідний</span>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={handleInfoSave} disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                {savedInfo ? <><Check size={16}/> Збережено</> : <><Save size={16}/> Зберегти</>}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;