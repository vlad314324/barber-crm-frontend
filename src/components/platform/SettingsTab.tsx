import { useEffect, useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformAdminListItem } from '../../api/platformApi';
import { getErrorMessage } from '../../utils/errors';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';

const SettingsTab = () => {
  const { t, lang } = useLocale();

  const [colleagues, setColleagues] = useState<PlatformAdminListItem[] | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchColleagues = () => {
    platformAuthApi.getAdmins().then(setColleagues).catch(() => setColleagues([]));
  };

  useEffect(() => {
    fetchColleagues();
  }, []);

  const handleAddColleague = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await platformAuthApi.createAdmin({ name, email: email.trim(), password });
      setSuccess(t('platformAdmin.colleagueAdded', { name: res.admin.name, email: res.admin.email }));
      setName(''); setEmail(''); setPassword('');
      fetchColleagues();
    } catch (err) {
      setError(getErrorMessage(err) || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ds-card p-6">
        <h2 className="text-lg font-bold text-ink mb-5">{t('platformAdmin.settingsTitle')}</h2>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-secondary">{t('platformAdmin.languageLabel')}</span>
            <LanguageToggle />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-secondary">{t('platformAdmin.themeLabel')}</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="ds-card p-6">
        <h2 className="text-lg font-bold text-ink mb-5">{t('platformAdmin.addColleagueTitle')}</h2>
        <form onSubmit={handleAddColleague} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="field-label">{t('platformAdmin.colleagueNameLabel')}</label>
            <input type="text" className="field-input py-2.5" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t('platformAdmin.colleagueEmailLabel')}</label>
            <input type="email" className="field-input py-2.5" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t('platformAdmin.colleaguePasswordLabel')}</label>
            <input type="password" className="field-input py-2.5" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={loading} className="btn btn-secondary py-2.5">
              {loading ? t('platformAdmin.creating') : t('platformAdmin.addColleagueBtn')}
            </button>
          </div>
        </form>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 mt-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && <p className="text-sm text-brand-dark mt-3">{success}</p>}

        <div className="mt-6 pt-5 border-t border-line">
          <h3 className="text-sm font-semibold text-ink mb-3">{t('platformAdmin.colleaguesListTitle')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted border-b border-line">
                  <th className="pb-2 font-medium">{t('platformAdmin.colleagueNameLabel')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.colleagueEmailLabel')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.tableColleagueStatus')}</th>
                  <th className="pb-2 font-medium">{t('platformAdmin.tableColleagueCreated')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(colleagues || []).map(c => (
                  <tr key={c.id}>
                    <td className="py-2 text-ink">{c.name}</td>
                    <td className="py-2 text-ink-secondary">{c.email}</td>
                    <td className="py-2">
                      <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {c.isActive ? t('platformAdmin.statusActive') : t('platformAdmin.statusInactive')}
                      </span>
                    </td>
                    <td className="py-2 text-ink-muted">{new Date(c.createdAt).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US')}</td>
                  </tr>
                ))}
                {colleagues && colleagues.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-ink-muted">{t('platformAdmin.noColleagues')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
