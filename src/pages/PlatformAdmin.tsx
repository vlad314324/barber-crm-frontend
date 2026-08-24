import { useState } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { getErrorMessage } from '../utils/errors';
import InvitationsTab from '../components/platform/InvitationsTab';
import SalonsTab from '../components/platform/SalonsTab';
import SettingsTab from '../components/platform/SettingsTab';

type Tab = 'invitations' | 'salons' | 'settings';

// Службова панель лише для оператора платформи та колег — керування
// салонами й запрошеннями. Не пов'язана з salon-логіном (окремий контекст,
// окремий JWT-секрет, окремий бекенд-namespace `/api/platform`).
// Екран логіну/bootstrap лишається хардкодженим українською (фіксований
// темний стиль, як у Login.tsx/RegisterSalon.tsx) — вкладки "Налаштування"
// з перемикачами мови/теми ще не існує до входу. Після входу весь текст
// іде через t() з блоком `platformAdmin.*`.
const PlatformAdmin = () => {
  const { admin, login, createAdmin, logout } = usePlatformAuth();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('invitations');

  // --- логін ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- bootstrap (перший акаунт) ---
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bootstrapName, setBootstrapName] = useState('');
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [bootstrapPassword, setBootstrapPassword] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [bootstrapError, setBootstrapError] = useState('');
  const [bootstrapLoading, setBootstrapLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      setLoginError(getErrorMessage(err) || 'Не вдалося увійти');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBootstrapLoading(true);
    setBootstrapError('');
    try {
      await createAdmin({ name: bootstrapName, email: bootstrapEmail.trim(), password: bootstrapPassword }, bootstrapSecret);
    } catch (err) {
      setBootstrapError(getErrorMessage(err) || 'Не вдалося створити акаунт');
    } finally {
      setBootstrapLoading(false);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'invitations', label: t('platformAdmin.tabInvitations') },
    { key: 'salons', label: t('platformAdmin.tabSalons') },
    { key: 'settings', label: t('platformAdmin.tabSettings') },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4 py-10">
      <div className={`w-full ${admin ? 'max-w-5xl' : 'max-w-md'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <img src="/icon.png" alt="hirnix" className="w-12 h-12 rounded-lg shadow-brand"/>
            <h1 className="text-3xl font-extrabold text-white inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
              hirnix
              <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1.5" />
            </h1>
          </div>
          <p className="text-white/60 mt-2">Службова панель платформи</p>
        </div>

        {!admin ? (
          <div className="bg-surface rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-ink mb-5">Вхід</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="field-input py-3"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="field-label">Пароль</label>
                <input
                  type="password"
                  className="field-input py-3"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}
              <button type="submit" disabled={loginLoading} className="btn btn-primary w-full py-3">
                {loginLoading ? 'Вхід...' : 'Увійти'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-line">
              <button onClick={() => setShowBootstrap(v => !v)} className="text-xs text-ink-muted hover:text-ink-secondary">
                Перший запуск? Створити акаунт
              </button>
              {showBootstrap && (
                <form onSubmit={handleBootstrap} className="space-y-4 mt-4">
                  <div>
                    <label className="field-label">Ім'я</label>
                    <input type="text" className="field-input py-2.5" value={bootstrapName} onChange={e => setBootstrapName(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Email</label>
                    <input type="email" className="field-input py-2.5" value={bootstrapEmail} onChange={e => setBootstrapEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Пароль</label>
                    <input type="password" className="field-input py-2.5" value={bootstrapPassword} onChange={e => setBootstrapPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Секретний ключ</label>
                    <input type="password" className="field-input py-2.5" value={bootstrapSecret} onChange={e => setBootstrapSecret(e.target.value)} />
                  </div>
                  {bootstrapError && (
                    <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                      <p className="text-sm text-red-600">{bootstrapError}</p>
                    </div>
                  )}
                  <button type="submit" disabled={bootstrapLoading} className="btn btn-secondary w-full py-2.5">
                    {bootstrapLoading ? 'Створення...' : 'Створити акаунт'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">{t('platformAdmin.loggedInAs', { name: admin.name, email: admin.email })}</p>
              <button onClick={logout} className="text-xs text-white/60 hover:text-white">{t('platformAdmin.logout')}</button>
            </div>

            <div className="flex gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeTab === tab.key ? 'bg-brand text-white' : 'bg-surface text-ink-secondary hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'invitations' && <InvitationsTab />}
            {activeTab === 'salons' && <SalonsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformAdmin;
