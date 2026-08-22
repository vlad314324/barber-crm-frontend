import { useLocale } from '../i18n/LocaleContext';

interface LanguageToggleProps {
  variant?: 'light' | 'dark';
  /** Language codes to show, and their display labels. Defaults to uk/en (admin UI). */
  langs?: readonly string[];
  labels?: Record<string, string>;
  /** Controlled mode — pass both to drive the toggle from outside the global app locale. */
  value?: string;
  onChange?: (lang: string) => void;
}

const LanguageToggle = ({ variant = 'light', langs, labels, value, onChange }: LanguageToggleProps) => {
  const { lang: globalLang, setLang: setGlobalLang } = useLocale();

  const activeLang = value ?? globalLang;
  const setActiveLang = onChange ?? setGlobalLang;
  const options = langs ?? (['uk', 'en'] as const);

  const track = variant === 'dark' ? 'bg-white/10 border-white/15' : 'bg-canvas-soft border-line';
  const inactive = variant === 'dark' ? 'text-white/60 hover:text-white' : 'text-ink-muted hover:text-ink';

  return (
    <div className={`inline-flex items-center gap-0.5 p-0.5 rounded-full border text-xs font-semibold ${track}`}>
      {options.map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setActiveLang(l)}
          className={`px-2.5 py-1 rounded-full transition-colors ${
            activeLang === l ? 'bg-brand text-white' : inactive
          }`}
        >
          {labels?.[l] ?? l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
