import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      title={t('header.toggleTheme')}
      aria-label={t('header.toggleTheme')}
      className={`relative inline-flex items-center h-7 w-13 shrink-0 rounded-full border transition-colors duration-200
        ${isDark ? 'bg-ink border-line-medium' : 'bg-canvas-soft border-line'}`}
      style={{ width: '3.25rem' }}
    >
      <span
        className={`inline-flex items-center justify-center h-5 w-5 rounded-full bg-surface shadow transform transition-transform duration-200
          ${isDark ? 'translate-x-6' : 'translate-x-1'}`}
      >
        {isDark ? <Moon size={12} className="text-ink" /> : <Sun size={12} className="text-brand" />}
      </span>
    </button>
  );
};

export default ThemeToggle;
