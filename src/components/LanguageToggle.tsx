import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeLang = value ?? globalLang;
  const setActiveLang = onChange ?? setGlobalLang;
  const options = langs ?? (['uk', 'en'] as const);
  const isDropdown = options.length > 2;

  useEffect(() => {
    if (!isDropdown) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdown]);

  const track = variant === 'dark' ? 'bg-white/10 border-white/15' : 'bg-canvas-soft border-line';
  const inactive = variant === 'dark' ? 'text-white/60 hover:text-white' : 'text-ink-muted hover:text-ink';

  // 3+ мови вже не влазять пілюлею на вузьких екранах — згортаємо в кнопку з випадним списком.
  if (isDropdown) {
    const activeLabel = labels?.[activeLang] ?? activeLang.toUpperCase();
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${track} ${variant === 'dark' ? 'text-white' : 'text-ink'}`}
        >
          {activeLabel}
          <ChevronDown size={12} className={variant === 'dark' ? 'text-white/60' : 'text-ink-muted'}/>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 min-w-[100px] bg-surface border border-line rounded-md shadow-lg z-50 overflow-hidden">
            {options.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => { setActiveLang(l); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeLang === l ? 'bg-brand-extra-soft text-brand-dark' : 'text-ink-secondary hover:bg-canvas-soft'
                }`}
              >
                {labels?.[l] ?? l.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

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
