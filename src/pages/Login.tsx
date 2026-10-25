import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router';
import { Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from '../components/LanguageToggle';
import LoginShowcase from '../components/login/LoginShowcase';
import { defaultRouteForRole } from '../utils/roleRoutes';
import { resolveErrorMessage } from '../utils/errors';
import { getSalonSlug } from '../utils/tenant';

// Маркетинговий сайт — для тих, хто ще не з нами.
const MARKETING_URL = 'https://hirnix.studio/?utm_source=app&utm_medium=login';

const Login = () => {
  const { t } = useLocale();
  const { salonSlug: slugParam } = useParams<{ salonSlug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [slugInput, setSlugInput] = useState(slugParam || getSalonSlug() || '');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const reason = searchParams.get('reason');
  const notice = !slugParam && reason === 'tenant_mismatch' ? t('login.tenantMismatchNotice')
    : !slugParam && reason === 'session_expired' ? t('login.sessionExpired')
    : reason === 'password_reset' ? t('login.passwordResetNotice')
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

  const logo = (
    <div className="inline-flex items-center gap-2.5">
      <img src="/icon.png" alt="" className="w-9 h-9 rounded-md shadow-brand"/>
      <span className="text-2xl font-extrabold text-ink inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
        hirnix
        <span className="w-1.5 h-1.5 rounded-full bg-brand ml-0.5 self-end mb-1" />
      </span>
    </div>
  );

  return (
    // Як у Facebook: зліва — що таке hirnix (для тих, хто тут уперше), справа —
    // окрема панель на всю висоту з формою входу по центру. На телефоні —
    // спершу форма (салони заходять щодня), під нею пояснення.
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
      {/* Шапка для телефона */}
      <header className="lg:hidden px-4 sm:px-6 pt-5 flex items-center justify-between">
        {logo}
        <LanguageToggle />
      </header>

      <div className="order-2 lg:order-1 flex-1 min-w-0 flex flex-col">
        <header className="hidden lg:flex px-10 xl:px-16 pt-8">{logo}</header>
        <main className="flex-1 flex items-center px-4 sm:px-6 lg:px-10 xl:px-16 py-10 lg:py-12">
          <div className="w-full flex items-center justify-center gap-12 2xl:gap-16">

            {/* Що таке hirnix — для тих, хто потрапив сюди вперше */}
        <section className="max-w-xl">
          <h2 className="lg:hidden text-sm font-semibold text-ink-muted mb-3">{t('login.whatIs')}</h2>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />{t('login.heroEyebrow')}
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl xl:text-5xl font-extrabold text-ink leading-[1.08]" style={{ letterSpacing: '-0.03em' }}>
            {t('login.heroTitle')}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-secondary leading-relaxed">{t('login.heroSub')}</p>
          <ul className="mt-6 border-l-2 border-brand pl-4 space-y-2">
            {(['heroPoint1', 'heroPoint2', 'heroPoint3'] as const).map(k => (
              <li key={k} className="text-sm sm:text-[15px] font-medium text-ink">{t(`login.${k}`)}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={MARKETING_URL} target="_blank" rel="noopener" className="btn btn-primary !rounded-full px-7 py-3.5 text-base">
              {t('login.heroCta')} <ArrowUpRight size={18}/>
            </a>
            <span className="text-sm text-ink-muted">{t('login.heroOffer')}</span>
          </div>
          <div className="lg:hidden mt-10 pb-4 flex justify-center">
            <LoginShowcase compact />
          </div>
        </section>

        <div className="hidden 2xl:block shrink-0">
          <LoginShowcase />
        </div>
          </div>
        </main>
      </div>

      {/* Вхід — окрема панель праворуч */}
      <aside className="order-1 lg:order-2 lg:w-[460px] xl:w-[520px] shrink-0 lg:min-h-screen lg:bg-surface lg:border-l lg:border-line flex flex-col">
        <div className="hidden lg:flex justify-end px-10 pt-8"><LanguageToggle /></div>
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-16 py-6 lg:py-12">
        <div className="w-full max-w-md mx-auto lg:max-w-sm">
          <div className="bg-surface border border-line rounded-lg shadow-lg p-6 sm:p-8 lg:border-0 lg:shadow-none lg:p-0 lg:rounded-none">
            <div className="mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-ink">{t('login.cardTitle')}</h2>
              <p className="text-sm text-ink-muted mt-1">{t('login.subtitle')}</p>
            </div>
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
                    <div className="flex items-center justify-between">
                      <label className="field-label">{t('login.password')}</label>
                      <Link to={`/forgot-password/${slugParam}`} className="text-xs text-brand hover:text-brand-dark font-medium">
                        {t('login.forgotPassword')}
                      </Link>
                    </div>
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
          </div>
          <a href={MARKETING_URL} target="_blank" rel="noopener"
            className="mt-8 pt-6 border-t border-line hidden lg:flex items-center justify-center gap-1 text-sm text-ink-muted hover:text-brand-dark">
            {t('login.notWithUs')} <ArrowUpRight size={14}/>
          </a>
        </div>
        </div>
      </aside>
    </div>
  );
};

export default Login;
