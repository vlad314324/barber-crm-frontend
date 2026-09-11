import { Menu } from 'lucide-react';
import { useLocation } from 'react-router';
import { useLocale } from '../i18n/LocaleContext';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import NotificationsMenu from './NotificationsMenu';

interface HeaderProps { onToggleSidebar: () => void; }

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { t, lang } = useLocale();
  const { pathname } = useLocation();
  const isSettingsPage = pathname === '/settings';

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

        <div className="flex items-center space-x-2 sm:space-x-4">
          {isSettingsPage && (
            <>
              <LanguageToggle />

              <div className="h-8 w-px bg-line"></div>

              <ThemeToggle />

              <div className="h-8 w-px bg-line"></div>
            </>
          )}

          <NotificationsMenu />

          {/* Дата — суто інформативний блок, ховаємо на вузьких екранах, щоб
              не витісняти важливіші елементи (сповіщення, перемикачі) за межі видимості. */}
          <div className="hidden sm:block h-8 w-px bg-line"></div>

          <div className="hidden sm:flex items-center">
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