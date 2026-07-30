import { Menu } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import NotificationsMenu from './NotificationsMenu';

interface HeaderProps { onToggleSidebar: () => void; }

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { t, lang } = useLocale();

  return (
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md border-b border-line">
      <div className="h-16 flex items-center justify-between px-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-sm text-ink-secondary hover:text-ink hover:bg-canvas-soft transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center space-x-4">
          <LanguageToggle />

          <div className="h-8 w-px bg-line"></div>

          <ThemeToggle />

          <div className="h-8 w-px bg-line"></div>

          <NotificationsMenu />

          <div className="h-8 w-px bg-line"></div>

          <div className="flex items-center">
            <span className="text-sm font-semibold text-ink mr-2">{t('header.today')} </span>
            <span className="text-sm text-ink-secondary">
              {new Date().toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;