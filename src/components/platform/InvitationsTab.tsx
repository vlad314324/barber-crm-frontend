import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformInvitation, CreatedInvitation } from '../../api/platformApi';
import { getErrorMessage } from '../../utils/errors';

const InvitationsTab = () => {
  const { t, lang } = useLocale();

  const [invitations, setInvitations] = useState<PlatformInvitation[] | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CreatedInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    platformAuthApi.getInvitations().then(setInvitations).catch(() => setInvitations([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await platformAuthApi.createInvitation(email.trim());
      setResult(res);
      setEmail('');
      setInvitations(prev => [
        { id: res.token.slice(0, 24), email: res.email, used: false, expiresAt: res.expiresAt, createdAt: new Date().toISOString() },
        ...(prev || []),
      ]);
    } catch (err) {
      setError(getErrorMessage(err) || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API недоступний — поле й так readonly з видимим текстом
    }
  };

  const invitationStatus = (inv: PlatformInvitation): string => {
    if (inv.used) return t('platformAdmin.statusUsed');
    if (new Date(inv.expiresAt) < new Date()) return t('platformAdmin.statusExpired');
    return t('platformAdmin.statusValid');
  };

  return (
    <div className="ds-card p-6">
      <h2 className="text-lg font-bold text-ink mb-5">{t('platformAdmin.invitationsTitle')}</h2>
      <form onSubmit={handleCreate} className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <label className="field-label">{t('platformAdmin.inviteEmailLabel')}</label>
          <input
            type="email"
            className="field-input py-3"
            placeholder={t('platformAdmin.inviteEmailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary py-3">
          {loading ? t('platformAdmin.creating') : t('platformAdmin.createBtn')}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mb-6 space-y-2">
          <p className="text-sm text-ink-secondary">
            {t('platformAdmin.inviteValidUntil', { email: result.email, date: new Date(result.expiresAt).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US') })}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={result.registrationUrl}
              className="field-input flex-1 min-w-0 truncate"
              onFocus={e => e.target.select()}
            />
            <button onClick={handleCopy} className="btn btn-secondary flex-shrink-0" title={t('platformAdmin.copyBtn')}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          {copied && <p className="text-xs text-brand-dark">{t('platformAdmin.copiedLabel')}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-line">
              <th className="pb-2 font-medium">{t('platformAdmin.tableEmail')}</th>
              <th className="pb-2 font-medium">{t('platformAdmin.tableStatus')}</th>
              <th className="pb-2 font-medium">{t('platformAdmin.tableCreated')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(invitations || []).map(inv => (
              <tr key={inv.id}>
                <td className="py-2 text-ink">{inv.email}</td>
                <td className="py-2 text-ink-secondary">{invitationStatus(inv)}</td>
                <td className="py-2 text-ink-muted">{new Date(inv.createdAt).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US')}</td>
              </tr>
            ))}
            {invitations && invitations.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-center text-ink-muted">{t('platformAdmin.noInvitations')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvitationsTab;
