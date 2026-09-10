import { DurationUnit } from '../utils/duration';
import { useLocale } from '../i18n/LocaleContext';

interface DurationUnitToggleProps {
  unit: DurationUnit;
  onChange: (unit: DurationUnit) => void;
}

// Маленька пілюля-перемикач "хв"/"год" — візуально копіює недропдаун-варіант
// LanguageToggle (той самий inline-flex rounded-full border, активна кнопка
// bg-brand text-white), щоб виглядати як уже наявний патерн у застосунку.
const DurationUnitToggle = ({ unit, onChange }: DurationUnitToggleProps) => {
  const { t } = useLocale();
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-line bg-canvas-soft text-xs font-semibold flex-shrink-0">
      {(['min', 'hour'] as const).map(u => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`px-2.5 py-1 rounded-full transition-colors ${
            unit === u ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {u === 'min' ? t('services.minutes') : t('services.hours')}
        </button>
      ))}
    </div>
  );
};

export default DurationUnitToggle;
