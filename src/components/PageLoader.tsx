import { useLocale } from '../i18n/LocaleContext';

const PageLoader = () => {
  const { t } = useLocale();
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-ink-muted text-sm">{t('common.loading')}</div>
    </div>
  );
};

export default PageLoader;
