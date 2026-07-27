import { useLocale } from '../i18n/LocaleContext';

interface LanguageToggleProps {
  variant?: 'light' | 'dark';
}

const LanguageToggle = ({ variant = 'light' }: LanguageToggleProps) => {
  const { lang, setLang } = useLocale();

  const track = variant === 'dark' ? 'bg-white/10 border-white/15' : 'bg-canvas-soft border-line';
  const inactive = variant === 'dark' ? 'text-white/60 hover:text-white' : 'text-ink-muted hover:text-ink';

  return (
    <div className={`inline-flex items-center gap-0.5 p-0.5 rounded-full border text-xs font-semibold ${track}`}>
      {(['uk', 'en'] as const).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-full transition-colors ${
            lang === l ? 'bg-brand text-white' : inactive
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
