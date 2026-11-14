import { X } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

interface BirthdayInputProps {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  className?: string;
}

// Дата народження: до заповнення показує підпис у самому полі (нативний
// date-input показує лише маску або нічого), а заповнену дату можна стерти
// хрестиком — нативне поле окремої кнопки очищення не має.
const BirthdayInput = ({ value, onChange, id, className = '' }: BirthdayInputProps) => {
  const { t } = useLocale();
  const label = t('clients.birthday');
  const empty = !value;
  return (
    <div className={`relative min-w-0 ${className}`}>
      <input
        id={id}
        type="date"
        aria-label={label}
        title={label}
        className={`peer field-input w-full min-w-0 dark:[color-scheme:dark] ${empty ? 'text-transparent focus:text-ink' : 'pr-14'}`}
        value={value}
        max={new Date().toISOString().slice(0, 10)}
        onChange={e => onChange(e.target.value)}
      />
      {empty && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 right-9 flex items-center truncate text-sm text-ink-muted dark:text-ink-secondary peer-focus:hidden">
          {label}
        </span>
      )}
      {!empty && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('common.clearDate')}
          title={t('common.clearDate')}
          className="absolute inset-y-0 right-8 my-auto h-6 w-6 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default BirthdayInput;
