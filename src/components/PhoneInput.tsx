import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

const DEFAULT_CODE = '+380';

const COUNTRIES = [
  { code: '+380', flag: '🇺🇦', name: 'Україна' },
  { code: '+1',   flag: '🇺🇸', name: 'США / Канада' },
  { code: '+44',  flag: '🇬🇧', name: 'Велика Британія' },
  { code: '+49',  flag: '🇩🇪', name: 'Німеччина' },
  { code: '+33',  flag: '🇫🇷', name: 'Франція' },
  { code: '+48',  flag: '🇵🇱', name: 'Польща' },
  { code: '+7',   flag: '🇰🇿', name: 'Казахстан' },
  { code: '+39',  flag: '🇮🇹', name: 'Італія' },
  { code: '+34',  flag: '🇪🇸', name: 'Іспанія' },
  { code: '+31',  flag: '🇳🇱', name: 'Нідерланди' },
  { code: '+41',  flag: '🇨🇭', name: 'Швейцарія' },
  { code: '+43',  flag: '🇦🇹', name: 'Австрія' },
  { code: '+46',  flag: '🇸🇪', name: 'Швеція' },
  { code: '+47',  flag: '🇳🇴', name: 'Норвегія' },
  { code: '+45',  flag: '🇩🇰', name: 'Данія' },
  { code: '+358', flag: '🇫🇮', name: 'Фінляндія' },
  { code: '+420', flag: '🇨🇿', name: 'Чехія' },
  { code: '+36',  flag: '🇭🇺', name: 'Угорщина' },
  { code: '+40',  flag: '🇷🇴', name: 'Румунія' },
  { code: '+359', flag: '🇧🇬', name: 'Болгарія' },
];

// Повний номер ("+420723016335") -> код країни + локальна частина.
// Найдовший збіг, щоб "+358" не сприймався як "+3…".
const splitPhone = (full: string) => {
  const v = (full || '').replace(/\s/g, '');
  const match = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length).find(c => v.startsWith(c.code));
  return match ? { code: match.code, local: v.slice(match.code.length) } : { code: DEFAULT_CODE, local: v.replace(/^\+/, '') };
};

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  id?: string;
}

// Телефон з вибором країни; віддає повний номер ("+420…").
const PhoneInput = ({ value, onChange, invalid, id }: PhoneInputProps) => {
  const { t } = useLocale();
  const [countryCode, setCountryCode] = useState(() => splitPhone(value).code);
  const [localNumber, setLocalNumber] = useState(() => splitPhone(value).local);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropdown(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value === '') { setLocalNumber(''); setCountryCode(DEFAULT_CODE); }
  }, [value]);

  const handleLocal = (v: string) => { setLocalNumber(v); onChange(countryCode + v); };
  const selectCountry = (code: string) => { setCountryCode(code); onChange(code + localNumber); setShowDropdown(false); setSearch(''); };
  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search));
  const current = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  return (
    <div className="flex gap-2 relative">
      <div ref={dropRef} className="relative">
        <button type="button" onClick={() => setShowDropdown(!showDropdown)}
          className="field-input w-auto flex items-center gap-1 px-2.5 whitespace-nowrap hover:bg-canvas-soft">
          <span>{current.flag}</span>
          <span className="text-ink-secondary">{current.code}</span>
          <ChevronDown size={12} className="text-ink-muted"/>
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded-md shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-line">
              <input autoFocus type="text" placeholder={t('appointments.searchCountryPlaceholder')}
                className="w-full px-2 py-1 text-sm border border-line rounded-xs focus:outline-none focus:ring-1 focus:ring-brand"
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map(c => (
                <button key={c.code} type="button" onClick={() => selectCountry(c.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-extra-soft text-left ${c.code === countryCode ? 'bg-brand-extra-soft text-brand-dark' : 'text-ink-secondary'}`}>
                  <span>{c.flag}</span><span className="flex-1">{c.name}</span><span className="text-ink-muted">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <input type="tel" id={id}
        className={`field-input flex-1 min-w-0 ${invalid ? 'border-red-400 focus:border-red-500' : ''}`}
        placeholder={t('appointments.phoneNumberPlaceholder')} value={localNumber} onChange={e => handleLocal(e.target.value)}/>
    </div>
  );
};

export default PhoneInput;
