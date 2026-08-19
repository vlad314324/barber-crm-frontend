import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from '../components/LanguageToggle';

const ForgotPassword = () => {
  const { t, lang } = useLocale();
  const { salonSlug: slugParam } = useParams<{ salonSlug: string }>();
  const { forgotPassword } = useAuth();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !slugParam) return;
    setLoading(true);
    try {
      await forgotPassword(slugParam, email, lang);
      setSent(true);
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <img src="/icon.png" alt="hirnix" className="w-12 h-12 rounded-lg shadow-brand"/>
            <h1 className="text-3xl font-extrabold text-white inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
              hirnix
              <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1.5" />
            </h1>
          </div>
          <p className="text-canvas/60 mt-2">{t('forgotPassword.title')}</p>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-8">
          {sent ? (
            <div className="space-y-5 text-center">
              <div className="bg-brand-soft border border-brand/30 rounded-sm px-4 py-3">
                <p className="text-sm text-brand-dark">{t('forgotPassword.successMsg', { email })}</p>
              </div>
              <Link to={`/login/${slugParam}`} className="text-brand hover:text-brand-dark font-semibold text-sm">
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-ink-secondary">{t('forgotPassword.subtitle')}</p>
              <div>
                <label className="field-label">{t('forgotPassword.emailLabel')}</label>
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
              <button type="submit" disabled={loading || !email} className="btn btn-primary w-full py-3">
                {loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
              </button>
              <div className="text-center">
                <Link to={`/login/${slugParam}`} className="text-sm text-brand hover:text-brand-dark font-medium">
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
