import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from '../components/LanguageToggle';
import { resolveErrorMessage, getErrorCode } from '../utils/errors';

const ResetPassword = () => {
  const { t } = useLocale();
  const { salonSlug: slugParam, token } = useParams<{ salonSlug: string; token: string }>();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [invalidToken,    setInvalidToken]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugParam || !token) return;
    if (password.length < 6) { setError(t('resetPassword.passwordTooShort')); return; }
    if (password !== confirmPassword) { setError(t('resetPassword.passwordMismatch')); return; }

    setLoading(true); setError('');
    try {
      await resetPassword(slugParam, token, password);
      navigate(`/login/${slugParam}?reason=password_reset`);
    } catch (err) {
      if (getErrorCode(err) === 'RESET_TOKEN_INVALID') setInvalidToken(true);
      setError(resolveErrorMessage(err, t, t('resetPassword.invalidToken')));
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-lg mb-4 shadow-brand">
            <Scissors size={32} className="text-white"/>
          </div>
          <h1 className="text-3xl font-extrabold text-white inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
            hirnix
            <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1.5" />
          </h1>
          <p className="text-canvas/60 mt-2">{t('resetPassword.title')}</p>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-8">
          {invalidToken ? (
            <div className="space-y-5 text-center">
              <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                <p className="text-sm text-red-600">{t('resetPassword.invalidToken')}</p>
              </div>
              <Link to={`/forgot-password/${slugParam}`} className="text-brand hover:text-brand-dark font-semibold text-sm">
                {t('resetPassword.requestNewLink')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-ink-secondary">{t('resetPassword.subtitle')}</p>

              <div>
                <label className="field-label">{t('resetPassword.newPasswordLabel')}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="field-input py-3 pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary">
                    {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              <div>
                <label className="field-label">{t('resetPassword.confirmPasswordLabel')}</label>
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

              <button type="submit" disabled={loading || !password || !confirmPassword} className="btn btn-primary w-full py-3">
                {loading ? t('resetPassword.saving') : t('resetPassword.submit')}
              </button>

              <div className="text-center">
                <Link to={`/login/${slugParam}`} className="text-sm text-brand hover:text-brand-dark font-medium">
                  {t('resetPassword.backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
