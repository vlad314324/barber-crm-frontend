import { Link } from 'react-router';
import { ArrowLeft, Check } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { ONBOARDING_STEPS } from '../config/onboardingSteps';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';

const OnboardingGuide = () => {
  const { t } = useLocale();
  const { loading, done, doneCount, totalRequired } = useOnboardingStatus();

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-brand hover:text-brand-dark">
        <ArrowLeft size={16} className="mr-1" />
        {t('common.back')}
      </Link>

      <div className="ds-card px-6 py-6">
        <h1 className="text-2xl font-bold text-ink tracking-tight">{t('onboarding.title')}</h1>
        <p className="mt-2 text-sm text-ink-secondary leading-relaxed">{t('onboarding.pageSubtitle')}</p>
        {done && (
          <p className="mt-3 text-sm font-semibold text-brand">
            {t('onboarding.progress', { done: doneCount, total: totalRequired })}
          </p>
        )}
      </div>

      {loading && <p className="text-sm text-ink-muted">{t('onboarding.loading')}</p>}

      {!loading && done && (
        <div className="space-y-4">
          {ONBOARDING_STEPS.map(step => {
            const isDone = done[step.key];
            const Icon = step.icon;
            return (
              <div key={step.key} className="ds-card px-6 py-5">
                <div className="flex items-start gap-4">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-soft text-brand'
                    }`}
                  >
                    {isDone ? <Check size={18} /> : <Icon size={18} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-ink">
                        {t(step.titleKey)}
                        {step.optional && (
                          <span className="ml-2 text-xs font-normal text-ink-muted">({t('onboarding.optional')})</span>
                        )}
                      </h2>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-canvas-soft text-ink-muted'
                        }`}
                      >
                        {isDone ? t('onboarding.doneLabel') : t('onboarding.todoLabel')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink-secondary">{t(step.descKey)}</p>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed">{t(step.whyKey)}</p>
                    <a href={step.route} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-4 inline-flex">
                      {t('onboarding.openStep')}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OnboardingGuide;
