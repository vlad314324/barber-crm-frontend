import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, Lock, Save, Check } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { ShopSettings, WorkingDay } from '../api/types';
import { getErrorMessage } from '../utils/errors';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const Settings = () => {
  const { user } = useAuth();
  const { t } = useLocale();
  const DAYS = DAY_KEYS.map(key => ({ key, label: t(`settings.days.${key}`) }));

  const [settings, setSettings] = useState<ShopSettings>({
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
      alert(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setErrorPass('');
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setErrorPass(t('settings.fillAll')); return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorPass(t('settings.passwordsMismatch')); return;
    }
    if (passwords.newPassword.length < 6) {
      setErrorPass(t('settings.passwordTooShort')); return;
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
    } catch (err) {
      setErrorPass(getErrorMessage(err) || t('settings.changePasswordError'));
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

  if (loading) return <div className="text-center py-12 text-ink-muted">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
        <SettingsIcon size={24} className="text-brand" />
        {t('settings.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ліва колонка */}
        <div className="space-y-6">

          {/* Загальна інформація */}
          <div className="ds-card overflow-hidden">
            <div className="ds-card-header">
              <div>
                <h2 className="text-base font-semibold text-ink">{t('settings.generalInfo')}</h2>
                <p className="text-sm text-ink-muted mt-0.5">{t('settings.generalInfoDesc')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: t('settings.fieldShopName'), key: 'shopName' as const,  type: 'text',  placeholder: 'BarberShop' },
                { label: t('settings.fieldAddress'),        key: 'address' as const,   type: 'text',  placeholder: 'вул. Франка 10, Львів' },
                { label: t('settings.fieldPhone'),       key: 'phone' as const,     type: 'tel',   placeholder: '+380671234567' },
                { label: t('settings.fieldEmail'),         key: 'email' as const,     type: 'email', placeholder: 'shop@gmail.com' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input
                    type={type}
                    value={settings[key]}
                    onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="field-input"
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button onClick={handleInfoSave} disabled={saving} className="btn btn-primary">
                  {savedInfo ? <><Check size={16}/> {t('settings.saved')}</> : <><Save size={16}/> {t('common.save')}</>}
                </button>
              </div>
            </div>
          </div>

          {/* Зміна пароля */}
          <div className="ds-card overflow-hidden">
            <div className="ds-card-header">
              <div>
                <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                  <Lock size={18} className="text-brand" /> {t('settings.changePassword')}
                </h2>
                <p className="text-sm text-ink-muted mt-0.5">{t('settings.changePasswordDesc')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: t('settings.fieldCurrentPassword'),          key: 'currentPassword' as const },
                { label: t('settings.fieldNewPassword'),              key: 'newPassword' as const },
                { label: t('settings.fieldConfirmPassword'),  key: 'confirmPassword' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input
                    type="password"
                    value={passwords[key]}
                    onChange={e => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="field-input"
                  />
                </div>
              ))}
              {errorPass && (
                <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                  <p className="text-sm text-red-600">{errorPass}</p>
                </div>
              )}
              {savedPass && (
                <div className="bg-brand-soft border border-brand/20 rounded-sm px-4 py-3">
                  <p className="text-sm text-brand-dark">{t('settings.passwordChanged')}</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={handlePasswordSave} disabled={savingPass} className="btn btn-primary">
                  {savedPass ? <><Check size={16}/> {t('settings.changed')}</> : <><Lock size={16}/> {t('settings.changePasswordBtn')}</>}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Права колонка — Години роботи */}
        <div className="ds-card overflow-hidden h-fit">
          <div className="ds-card-header">
            <div>
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <Clock size={18} className="text-brand" /> {t('settings.workingHours')}
              </h2>
              <p className="text-sm text-ink-muted mt-0.5">{t('settings.workingHoursDesc')}</p>
            </div>
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
                    className="w-4 h-4 text-brand rounded flex-shrink-0 focus:ring-brand"
                  />
                  <span className={`text-sm font-medium w-24 flex-shrink-0 ${day.isOpen ? 'text-ink-secondary' : 'text-ink-muted'}`}>
                    {label}
                  </span>
                  {day.isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.from}
                        onChange={e => updateWorkingHour(key, 'from', e.target.value)}
                        className="field-input flex-1 py-1.5"
                      />
                      <span className="text-ink-muted text-sm">—</span>
                      <input
                        type="time"
                        value={day.to}
                        onChange={e => updateWorkingHour(key, 'to', e.target.value)}
                        className="field-input flex-1 py-1.5"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-ink-muted italic">{t('settings.dayOff')}</span>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end pt-4 border-t border-line">
              <button onClick={handleInfoSave} disabled={saving} className="btn btn-primary">
                {savedInfo ? <><Check size={16}/> {t('settings.saved')}</> : <><Save size={16}/> {t('common.save')}</>}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;