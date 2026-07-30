import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from '../components/LanguageToggle';
import { defaultRouteForRole } from '../utils/roleRoutes';
import { resolveErrorMessage } from '../utils/errors';
import { getSalonSlug } from '../utils/tenant';

const DEFAULT_SLUG = 'barbershop';

const Login = () => {
  const { t } = useLocale();
  const { salonSlug: slugParam } = useParams<{ salonSlug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [slugInput, setSlugInput] = useState(slugParam || getSalonSlug() || DEFAULT_SLUG);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const reason = searchParams.get('reason');
  const notice = !slugParam && reason === 'tenant_mismatch' ? t('login.tenantMismatchNotice')
    : !slugParam && reason === 'session_expired' ? t('login.sessionExpired')
    : '';

  const handleSlugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugInput.trim()) return;
    navigate(`/login/${slugInput.trim()}`, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !slugParam) { setError(t('login.fillAll')); return; }
    setLoading(true); setError('');
    try {
      const loggedInUser = await login(slugParam, email, password);
      navigate(defaultRouteForRole(loggedInUser.role));
    } catch (err) {
      setError(resolveErrorMessage(err, t, t('login.invalidCredentials')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle variant="dark" />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-lg mb-4 shadow-brand">
            <Scissors size={32} className="text-white"/>
          </div>
          <h1 className="text-3xl font-extrabold text-white inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
            hirnix
            <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1.5" />
          </h1>
          <p className="text-canvas/60 mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-lg shadow-lg p-8">
          {notice && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 mb-5">
              <p className="text-sm text-amber-700">{notice}</p>
            </div>
          )}

          {!slugParam ? (
            <form onSubmit={handleSlugSubmit} className="space-y-5">
              <div>
                <label className="field-label">{t('login.salonLabel')}</label>
                <input
                  type="text"
                  className="field-input py-3"
                  placeholder={t('login.salonPlaceholder')}
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-ink-muted mt-1.5">{t('login.salonHint')}</p>
              </div>
              <button type="submit" disabled={!slugInput.trim()} className="btn btn-primary w-full py-3">
                {t('login.continue')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between text-sm">
                <span className="badge badge-neutral">{t('login.salonBadge')}: {slugParam}</span>
                <Link to="/login" className="text-brand hover:text-brand-dark font-medium">
                  {t('login.changeSalon')}
                </Link>
              </div>

              <div>
                <label className="field-label">{t('login.email')}</label>
                <input
                  type="email"
                  className="field-input py-3"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div>
                <label className="field-label">{t('login.password')}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="field-input py-3 pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary">
                    {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
                {loading ? t('login.loggingIn') : t('login.submit')}
              </button>
            </form>
          )}

          {/* Demo credentials — dev-only, never shipped in a production build */}
          {import.meta.env.DEV && slugParam && (
            <div className="mt-6 pt-5 border-t border-line">
              <p className="text-xs text-ink-muted text-center mb-3">{t('login.demoAccounts')}</p>
              <div className="space-y-2">
                {[
                  { role: 'Admin', email: 'admin@barbershop.com', pass: 'admin123' },
                  { role: 'Barber', email: 'barber@barbershop.com', pass: 'barber123' },
                ].map(acc => (
                  <button key={acc.role}
                    type="button"
                    onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                    className="w-full text-left px-3 py-2 rounded-sm border border-line bg-canvas-soft text-ink-secondary text-xs hover:bg-brand-extra-soft hover:border-brand/30 transition-colors">
                    <span className="font-semibold text-ink">{acc.role}:</span> {acc.email} / {acc.pass}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-line text-center text-sm text-ink-secondary">
            {t('login.noSalonYet')}{' '}
            <Link to="/register-salon" className="text-brand hover:text-brand-dark font-semibold">
              {t('login.createSalon')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
