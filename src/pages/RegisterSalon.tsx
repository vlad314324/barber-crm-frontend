import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { salonApi } from '../api';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from '../components/LanguageToggle';
import { defaultRouteForRole } from '../utils/roleRoutes';
import { resolveErrorMessage } from '../utils/errors';

// 32 символи — межа, зумовлена лімітом MongoDB Atlas на довжину назви бази
// даних (38 байт мінус префікс `salon_`, 6 символів). Див. routes/salonRoutes.js.
const MAX_SLUG_LEN = 32;

// Без обрізання — потрібно окремо, щоб визначити, чи довелось обрізати
// (для попередження користувачу), не втрачаючи саму інформацію про це.
const sanitizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const slugify = (value: string): string =>
  sanitizeSlug(value).slice(0, MAX_SLUG_LEN).replace(/-+$/, '');

const RegisterSalon = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { registerSalon } = useAuth();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token') || '';

  const [invitationStatus, setInvitationStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

  const [salonName, setSalonName] = useState('');
  const [slug, setSlug]           = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugTruncated, setSlugTruncated] = useState(false);
  const [ownerName, setOwnerName]   = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!invitationToken) {
      setInvitationStatus('invalid');
      return;
    }
    salonApi.validateInvitation(invitationToken)
      .then(res => {
        setOwnerEmail(res.email);
        setInvitationStatus('valid');
      })
      .catch(() => setInvitationStatus('invalid'));
  }, [invitationToken]);

  const handleSalonNameChange = (value: string) => {
    setSalonName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
      setSlugTruncated(sanitizeSlug(value).length > MAX_SLUG_LEN);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName || !ownerName || !ownerEmail || !ownerPassword) {
      setError(t('registerSalon.fillAll'));
      return;
    }
    if (ownerPassword !== confirmPassword) {
      setError(t('registerSalon.passwordMismatch'));
      return;
    }
    setLoading(true); setError('');
    try {
      const user = await registerSalon({
        salonName,
        slug: slug.trim() || undefined,
        ownerName,
        ownerEmail,
        ownerPassword,
        token: invitationToken,
      });
      navigate(defaultRouteForRole(user.role));
    } catch (err) {
      setError(resolveErrorMessage(err, t, t('registerSalon.fillAll')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <LanguageToggle variant="dark" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <img src="/icon.png" alt="hirnix" className="w-12 h-12 rounded-lg shadow-brand"/>
            <h1 className="text-3xl font-extrabold text-white inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
              hirnix
              <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1.5" />
            </h1>
          </div>
          <p className="text-white/60 mt-2">{t('registerSalon.subtitle')}</p>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-8">
          {invitationStatus === 'checking' && (
            <p className="text-center text-sm text-ink-secondary py-6">{t('registerSalon.invitationCheckingTitle')}</p>
          )}

          {invitationStatus === 'invalid' && (
            <div className="text-center py-4">
              <h2 className="text-lg font-bold text-ink mb-2">{t('registerSalon.invitationInvalidTitle')}</h2>
              <p className="text-sm text-ink-secondary">{t('registerSalon.invitationInvalidDesc')}</p>
            </div>
          )}

          {invitationStatus === 'valid' && (
          <>
          <h2 className="text-lg font-bold text-ink mb-5">{t('registerSalon.title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">{t('registerSalon.salonNameLabel')}</label>
              <input
                type="text"
                className="field-input py-3"
                placeholder={t('registerSalon.salonNamePlaceholder')}
                value={salonName}
                onChange={e => handleSalonNameChange(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="field-label">{t('registerSalon.slugLabel')}</label>
                <span className={`text-xs ${slug.length >= MAX_SLUG_LEN ? 'text-amber-500 font-medium' : 'text-ink-muted'}`}>
                  {slug.length}/{MAX_SLUG_LEN}
                </span>
              </div>
              <input
                type="text"
                className="field-input py-3"
                placeholder="barbershop"
                value={slug}
                onChange={e => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                  setSlugTruncated(sanitizeSlug(e.target.value).length > MAX_SLUG_LEN);
                }}
              />
              <p className="text-xs text-ink-muted mt-1.5">{t('registerSalon.slugHint')}</p>
              {slugTruncated && (
                <p className="text-xs text-amber-500 mt-1">{t('registerSalon.slugTruncated', { max: MAX_SLUG_LEN })}</p>
              )}
            </div>

            <div>
              <label className="field-label">{t('registerSalon.ownerNameLabel')}</label>
              <input
                type="text"
                className="field-input py-3"
                placeholder={t('registerSalon.ownerNamePlaceholder')}
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">{t('registerSalon.ownerEmailLabel')}</label>
              <input
                type="email"
                className="field-input py-3"
                placeholder="your@email.com"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                autoComplete="email"
                readOnly
              />
              <p className="text-xs text-ink-muted mt-1.5">{t('registerSalon.emailLockedHint')}</p>
            </div>

            <div>
              <label className="field-label">{t('registerSalon.ownerPasswordLabel')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="field-input py-3 pr-12"
                  placeholder="••••••••"
                  value={ownerPassword}
                  onChange={e => setOwnerPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary">
                  {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <div>
              <label className="field-label">{t('registerSalon.confirmPasswordLabel')}</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="field-input py-3"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              {loading ? t('registerSalon.submitting') : t('registerSalon.submit')}
            </button>
          </form>
          </>
          )}

          <div className="mt-6 pt-5 border-t border-line text-center text-sm text-ink-secondary">
            {t('registerSalon.haveSalon')}{' '}
            <Link to="/login" className="text-brand hover:text-brand-dark font-semibold">
              {t('registerSalon.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSalon;
