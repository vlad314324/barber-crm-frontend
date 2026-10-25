import { useState, useEffect, useMemo, useRef, ReactNode, CSSProperties } from 'react';
import { useParams, useSearchParams } from 'react-router';
import axios from 'axios';
import {
  CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  User, CalendarDays, ListChecks, Info, MapPin, Phone, Globe, Copy, Check,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { API_BASE_URL } from '../api';
import { BOOKING_LANG_LABELS, BookingLang, tBooking } from '../i18n/bookingTranslations';
import LanguageToggle from '../components/LanguageToggle';
import LocationMap from '../components/LocationMap';
import { getErrorMessage, getErrorCode } from '../utils/errors';
import { PublicBookingSettings } from '../api/types';
import { formatPriceRange, discounted } from '../utils/money';
import PriceTag from '../components/booking/PriceTag';

const BOOKING_LOCALES: Record<string, string> = { uk: 'uk-UA', en: 'en-US', cs: 'cs-CZ', pl: 'pl-PL' };
import { formatDurationRange } from '../utils/duration';
import { trackEvent } from '../utils/tracking';
import { useTheme } from '../context/ThemeContext';
import { effectiveServices, ServiceOverride } from '../utils/employeePricing';

interface Service {
  _id: string; name: string; description?: string; price: number; priceMax?: number; duration: number; durationMax?: number; category: string;
  translations?: Partial<Record<BookingLang, { name: string; description: string }>>;
  imageUrl?: string;
  // Додаткова послуга — лише разом з однією з addonFor.
  isAddon?: boolean; addonFor?: string[];
}
interface Employee {
  _id: string; name: string; role: string; customRoleLabel?: string; services?: string[]; specialties?: string[]; bio?: string;
  serviceOverrides?: ServiceOverride[];
  translations?: Partial<Record<BookingLang, { bio: string; specialties: string[]; customRoleLabel?: string }>>;
}

// Ім'я майстра свідомо не перекладається — лише опис послуги та bio/спеціалізації.
const serviceName = (s: Service, lang: BookingLang) => s.translations?.[lang]?.name?.trim() || s.name;
const serviceDescription = (s: Service, lang: BookingLang) => s.translations?.[lang]?.description?.trim() || s.description || '';
const employeeBio = (e: Employee, lang: BookingLang) => e.translations?.[lang]?.bio?.trim() || e.bio || '';
const employeeRoleLabel = (e: Employee, lang: BookingLang) =>
  e.translations?.[lang]?.customRoleLabel?.trim() || e.customRoleLabel?.trim() || '';
const employeeSpecialties = (e: Employee, lang: BookingLang) => {
  const translated = e.translations?.[lang]?.specialties;
  return translated && translated.length > 0 ? translated : (e.specialties || []);
};

const HEX_COLOR_RE = /^#([0-9a-f]{3}){1,2}$/i;

// Акцентний колір салону підміняє brand-палітру (CSS-змінні --color-brand*,
// на яких побудовані bg-brand/text-brand-dark/btn-primary тощо) у межах
// сторінки бронювання — так акцент отримують усі кнопки, ціни, вибрані
// картки й слоти, а не лише окремі елементи з inline-стилем.
type Rgb = [number, number, number];
const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as Rgb;
};
const mix = (a: Rgb, b: Rgb, weightB: number): string =>
  a.map((v, i) => Math.round(v * (1 - weightB) + b[i] * weightB)).join(' ');
const accentVars = (hex: string, dark: boolean): Record<string, string> => {
  const c = hexToRgb(hex);
  const white: Rgb = [255, 255, 255];
  const black: Rgb = [0, 0, 0];
  const darkBg: Rgb = [18, 20, 22];
  return dark ? {
    '--color-brand': c.join(' '),
    '--color-brand-dark': mix(c, white, 0.2),
    '--color-brand-soft': mix(c, darkBg, 0.78),
    '--color-brand-extra-soft': mix(c, darkBg, 0.86),
  } : {
    '--color-brand': c.join(' '),
    '--color-brand-dark': mix(c, black, 0.25),
    '--color-brand-soft': mix(c, white, 0.82),
    '--color-brand-extra-soft': mix(c, white, 0.9),
  };
};
// Довші описи послуг згортаються до 2 рядків з кнопкою "Читати далі".
// "YYYY-MM-DD" -> "DD.MM.YYYY" без Date (уникаємо зсуву дня через таймзону).
const formatCalendarDate = (iso: string) => iso.split('-').reverse().join('.');

const DESCRIPTION_CLAMP_CHARS = 110;

type Screen = 'menu' | 'about' | 'services' | 'master' | 'datetime' | 'contacts' | 'confirm';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DEFAULT_BOOKING_LANGS: BookingLang[] = ['uk', 'en'];

const ScreenHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="flex items-center gap-2 mb-5">
    <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-canvas-soft text-ink-secondary">
      <ChevronLeft size={22}/>
    </button>
    <h2 className="text-xl font-bold text-ink tracking-tight">{title}</h2>
  </div>
);

const MenuRow = ({ icon, title, subtitle, disabled, disabledHint, onClick }: {
  icon: ReactNode; title: string; subtitle?: string; disabled?: boolean; disabledHint?: string; onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-canvas-soft'}`}>
    <div className="w-9 h-9 rounded-full bg-canvas-soft flex items-center justify-center flex-shrink-0 text-ink-secondary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-ink">{title}</p>
      {subtitle && <p className="text-xs text-brand-dark truncate mt-0.5">{subtitle}</p>}
      {disabled && disabledHint && <p className="text-xs text-ink-muted mt-0.5">{disabledHint}</p>}
    </div>
    {!disabled && <ChevronRight size={18} className="text-ink-muted flex-shrink-0"/>}
  </button>
);


// Логотип Telegram (паперовий літачок) — у lucide-react його немає.
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M21.94 4.34 18.7 19.6c-.24 1.08-.88 1.34-1.78.84l-4.93-3.63-2.38 2.29c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.62-.2L6.2 13.2l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57L20.55 2.8c.88-.32 1.65.21 1.39 1.54Z"/>
  </svg>
);

const BookingPage = () => {
  const { salonSlug } = useParams<{ salonSlug?: string }>();
  // ?gift=<token> — персональне посилання з привітання з днем народження.
  const [searchParams] = useSearchParams();
  const giftToken = searchParams.get('gift');
  const { theme } = useTheme();
  const [lang, setLangState] = useState<BookingLang>('uk');
  const [langTouched, setLangTouched] = useState(false);
  const t = (path: string, vars?: Record<string, string | number>) => tBooking(lang, path, vars);
  // Standalone client, scoped to this salon's slug — deliberately not the
  // shared authenticated `api` instance, so this public page never touches
  // (or gets touched by) an admin session's tenant in another tab.
  const api = useMemo(() => axios.create({
    baseURL: `${API_BASE_URL}/${salonSlug}`,
    headers: { 'Content-Type': 'application/json' },
  }), [salonSlug]);

  const [screen, setScreen] = useState<Screen>('menu');

  const [services, setServices]   = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branding, setBranding]   = useState<PublicBookingSettings | null>(null);
  const [slots, setSlots]         = useState<string[]>([]);
  const [isClosed, setIsClosed]   = useState(false);
  const [notOpenYet, setNotOpenYet] = useState(false);

  // Каталог (послуги/майстри) — без нього сторінка непридатна для
  // бронювання взагалі, тож збій тут показуємо як явну помилку з
  // повторною спробою, а не мовчазний порожній список (branding —
  // декоративний, лишає свій вже наявний тихий фолбек нижче).
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError]     = useState('');

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError]     = useState('');

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [openCategories, setOpenCategories]     = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedTime, setSelectedTime]         = useState('');
  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  // Знижка до дня народження: дані з GET /booking/gift/:token; promoError —
  // сервер відхилив знижку (телефон, термін, використана) — тоді пропонуємо
  // записатися без неї.
  const [gift, setGift] = useState<{ token: string; discountPercent: number; validFrom: string; validUntil: string; firstName: string; used: boolean } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [bookedDiscount, setBookedDiscount] = useState<number | null>(null);
  const [done, setDone]       = useState(false);
  // Telegram-сповіщення клієнту: deep link на підписку або позначка, що
  // клієнт уже підписаний у цьому салоні (з минулого бронювання).
  const [telegram, setTelegram] = useState<{ url: string | null; linked: boolean }>({ url: null, linked: false });
  const [emailError, setEmailError] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError(t('booking.invalidEmail'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const loadCatalog = () => {
    if (!salonSlug) return;
    setCatalogLoading(true);
    setCatalogError('');
    // branding/settings лишається з власним тихим фолбеком — це лише
    // оформлення сторінки, а не дані, без яких бронювання неможливе.
    api.get('/booking/settings').then(r => setBranding(r.data)).catch(() => setBranding(null));
    Promise.all([
      api.get('/booking/services'),
      api.get('/booking/employees'),
    ])
      .then(([servicesRes, employeesRes]) => {
        setServices(servicesRes.data);
        setEmployees(employeesRes.data);
      })
      .catch(err => setCatalogError(getErrorMessage(err) || t('booking.loadError')))
      .finally(() => setCatalogLoading(false));
  };

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, salonSlug]);

  // Фіксуємо факт відкриття сторінки для воронки бронювання (видно лише в
  // platform-admin) — раз на реальне завантаження, ref рятує від подвійного
  // виклику через React 18 StrictMode у дев-режимі.
  useEffect(() => {
    if (!salonSlug || !giftToken) return;
    api.get(`/booking/gift/${encodeURIComponent(giftToken)}`)
      .then((r) => setGift({ token: giftToken, ...r.data }))
      .catch(() => setGift(null));
  }, [api, salonSlug, giftToken]);

  const loggedVisit = useRef(false);
  useEffect(() => {
    if (!salonSlug || loggedVisit.current) return;
    loggedVisit.current = true;
    trackEvent(api, 'page_view');
  }, [api, salonSlug]);

  const accentColor = branding?.accentColor && HEX_COLOR_RE.test(branding.accentColor) ? branding.accentColor : null;
  const pageStyle = accentColor ? accentVars(accentColor, theme === 'dark') as CSSProperties : undefined;
  const categoryLabel = (category: string) =>
    branding?.serviceCategoryTranslations?.[category]?.[lang]?.trim() || category;

  const enabledLangs = (branding?.bookingLanguages?.length
    ? branding.bookingLanguages.filter((l): l is BookingLang => (DEFAULT_BOOKING_LANGS as string[]).includes(l) || l === 'cs' || l === 'pl')
    : DEFAULT_BOOKING_LANGS);

  // Початкова мова сторінки (нею ж прийде лист клієнту), за пріоритетом:
  // 1) мова, яку клієнт раніше сам обрав на сторінці цього салону;
  // 2) мова браузера, якщо салон її увімкнув (uk-UA -> uk, cs -> cs...);
  // 3) мова салону за замовчуванням.
  const langStorageKey = `bookingLang:${salonSlug}`;
  useEffect(() => {
    if (langTouched || !branding) return;
    let saved: string | null = null;
    try { saved = localStorage.getItem(langStorageKey); } catch { /* приватний режим тощо */ }
    const browserLangs = (navigator.languages?.length ? navigator.languages : [navigator.language])
      .map(l => (l || '').toLowerCase().split('-')[0]);
    const def = branding.defaultBookingLanguage;
    const pick = [saved, ...browserLangs, def].find((l): l is BookingLang => !!l && (enabledLangs as string[]).includes(l));
    if (pick) setLangState(pick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branding]);

  const setLang = (l: string) => {
    setLangTouched(true);
    setLangState(l as BookingLang);
    try { localStorage.setItem(langStorageKey, l); } catch { /* не критично */ }
  };

  // totalPrice — завжди база (мін.); totalPriceMax — лише для показу
  // діапазону, коли послуга має priceMax (сервер не віддає ці поля взагалі,
  // якщо опція діапазонів вимкнена в салоні — тоді formatPriceRange сама
  // згорне показ до одного числа).
  // Ціни й тривалість — обраного майстра (індивідуальні, якщо задані);
  // рахуються від базових послуг, тож зміна майстра одразу їх перераховує.
  const pricedServices   = effectiveServices(selectedServices.map(s => services.find(b => b._id === s._id) ?? s), selectedEmployee);
  const totalPrice       = pricedServices.reduce((sum, s) => sum + s.price, 0);
  const totalPriceMax    = pricedServices.reduce((sum, s) => sum + (s.priceMax ?? s.price), 0);
  // Знижка показується, поки дата не вибрана або вибрана в межах терміну.
  const giftInRange = !!gift && !gift.used && (!selectedDate || (selectedDate >= gift.validFrom && selectedDate <= gift.validUntil));
  const activePct = giftInRange ? gift!.discountPercent : null;
  const giftDateLabel = gift
    ? new Date(`${gift.validUntil}T00:00:00Z`).toLocaleDateString(BOOKING_LOCALES[lang] || 'uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' })
    : '';
  // totalDuration — сума МАКС тривалостей (саме це бронюється й шлеться як
  // durationMinutes для фільтрації слотів); totalDurationMin — лише для
  // показу діапазону.
  const totalDuration    = pricedServices.reduce((sum, s) => sum + (s.durationMax ?? s.duration), 0);
  const totalDurationMin = pricedServices.reduce((sum, s) => sum + s.duration, 0);
  const selectedServiceIdsKey = selectedServices.map(s => s._id).join(',');
  const bookingDurationLabels = { hour: t('booking.hours'), minute: t('booking.minutes') };

  // AbortController per запит: новий вибір дати/майстра скасовує ще не
  // завершений попередній запит — інакше відповідь на СТАРІШИЙ запит могла
  // дійти пізніше за новішу (мережа не гарантує порядок) і мовчки
  // перезаписати вже показані слоти застарілими даними.
  const slotsAbortRef = useRef<AbortController | null>(null);

  const loadSlots = () => {
    if (!selectedEmployee || !selectedDate) return;

    slotsAbortRef.current?.abort();
    const controller = new AbortController();
    slotsAbortRef.current = controller;

    setSlotsLoading(true);
    setSlotsError('');

    // serviceIds — щоб сервер врахував час майстра на підготовку після візиту.
    const durationParam = totalDuration > 0 ? `&durationMinutes=${totalDuration}&serviceIds=${selectedServiceIdsKey}` : '';
    api.get(`/booking/available-slots?employeeId=${selectedEmployee._id}&date=${selectedDate}${durationParam}`, { signal: controller.signal })
      .then(r => {
        setIsClosed(r.data.closed || false);
        setNotOpenYet(!!r.data.notOpenYet);
        let available = r.data.availableSlots;

        const todayStr = new Date().toISOString().split('T')[0];
        if (selectedDate === todayStr) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          available = available.filter((slot: string) => {
            const [h, m] = slot.split(':').map(Number);
            return h * 60 + m > currentMinutes;
          });
        }

        setSlots(available);
      })
      .catch(err => {
        if (axios.isCancel(err) || (err as { code?: string })?.code === 'ERR_CANCELED') return;
        setSlotsError(getErrorMessage(err) || t('booking.slotsLoadError'));
        setSlots([]);
      })
      .finally(() => {
        if (slotsAbortRef.current === controller) setSlotsLoading(false);
      });
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, selectedDate, totalDuration, selectedServiceIdsKey, api]);

  const toggleService = (s: Service) => {
    setSelectedServices(prev => {
      if (!prev.find(x => x._id === s._id)) return [...prev, s];
      const next = prev.filter(x => x._id !== s._id);
      // Знята основна забирає свої додаткові (якщо їх не тримає інша обрана основна).
      const mainIds = new Set(next.filter(x => !x.isAddon).map(x => x._id));
      return next.filter(x => !x.isAddon || (x.addonFor || []).some(id => mainIds.has(id)));
    });
  };

  // Для показу: кожна основна, одразу за нею — її додаткові ("Стрижка + Укладання").
  const selectedLabel = (() => {
    const mains = selectedServices.filter(s => !s.isAddon);
    const addons = selectedServices.filter(s => s.isAddon);
    const used = new Set<string>();
    return mains.map(m => {
      const own = addons.filter(a => !used.has(a._id) && a.addonFor?.includes(m._id));
      own.forEach(a => used.add(a._id));
      return [m, ...own].map(x => serviceName(x, lang)).join(' + ');
    }).join(', ');
  })();

  // Порожній/невизначений selectedEmployee.services означає "без обмежень".
  // Ціни в списку — обраного майстра.
  const employeeServices = effectiveServices(!selectedEmployee || !selectedEmployee.services || selectedEmployee.services.length === 0
    ? services
    : services.filter(s => selectedEmployee.services!.includes(s._id)), selectedEmployee);
  // Додаткові в списку окремо не показуються — лише під обраною основною.
  const availableServices = employeeServices.filter(s => !s.isAddon);
  const addonsFor = (mainId: string) => employeeServices.filter(s => s.isAddon && s.addonFor?.includes(mainId));

  // Групування за категоріями (Settings.bookingGroupByCategory): секції в
  // порядку serviceCategories з сервера; категорії, яких там немає, — у кінці
  // в порядку першої появи. Секції згорнуті, доки клієнт їх не розкриє.
  const groupByCategory = !!branding?.bookingGroupByCategory;
  const serviceGroups = (() => {
    if (!groupByCategory) return [];
    const order = branding?.serviceCategories || [];
    const groups = new Map<string, Service[]>();
    availableServices.forEach(s => {
      const list = groups.get(s.category);
      if (list) list.push(s); else groups.set(s.category, [s]);
    });
    const rank = (c: string) => { const i = order.indexOf(c); return i === -1 ? order.length : i; };
    return [...groups.entries()]
      .map(([category, items], i) => ({ category, items, i }))
      .sort((a, b) => rank(a.category) - rank(b.category) || a.i - b.i);
  })();

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Картка — div з role="button", а не <button>: всередині є власна кнопка
  // "Читати далі", а вкладені <button> — невалідний HTML.
  const renderServiceCard = (s: Service) => {
    const selected = !!selectedServices.find(x => x._id === s._id);
    const description = serviceDescription(s, lang);
    const collapsible = description.length > DESCRIPTION_CLAMP_CHARS;
    const expanded = expandedDescriptions.has(s._id);
    return (
      <div key={s._id} role="button" tabIndex={0}
        aria-pressed={selected}
        onClick={() => toggleService(s)}
        onKeyDown={e => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleService(s); }
        }}
        className={`w-full p-4 rounded-md border-2 cursor-pointer transition-colors text-left
          ${selected
            ? 'border-brand bg-brand-extra-soft'
            : 'border-line bg-surface hover:border-line-medium'}`}>
        <div className="flex justify-between items-center gap-3">
          {s.imageUrl && (
            <img src={s.imageUrl} alt="" loading="lazy"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0 self-start" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{serviceName(s, lang)}</p>
            {description && (
              <p className={`text-sm text-ink-muted mt-0.5 ${collapsible && !expanded ? 'line-clamp-2' : ''}`}>{description}</p>
            )}
            {collapsible && (
              <button type="button"
                aria-expanded={expanded}
                onClick={e => { e.stopPropagation(); toggleDescription(s._id); }}
                className="text-sm font-medium text-brand-dark hover:underline mt-0.5">
                {expanded ? t('booking.showLess') : t('booking.readMore')}
              </button>
            )}
            <p className="text-sm text-ink-muted">{formatDurationRange(s.duration, s.durationMax, bookingDurationLabels)}</p>
          </div>
          <PriceTag price={s.price} priceMax={s.priceMax} currency={branding?.currency} pct={activePct} className="font-semibold text-brand-dark whitespace-nowrap text-right" />
        </div>
        {selected && addonsFor(s._id).length > 0 && (
          <div className="mt-3 pt-3 border-t border-brand/20" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1.5">{t('booking.addToService')}</p>
            <div className="space-y-1.5">
              {addonsFor(s._id).map(a => {
                const on = selectedServices.some(x => x._id === a._id);
                return (
                  <button key={a._id} type="button" role="checkbox" aria-checked={on}
                    onClick={() => toggleService(a)}
                    className={`w-full flex items-center gap-3 rounded-sm border px-3 py-2 text-left transition-colors
                      ${on ? 'border-brand bg-surface' : 'border-line bg-surface/70 hover:border-line-medium'}`}>
                    <span className={`w-5 h-5 rounded-xs border-2 flex items-center justify-center shrink-0 ${on ? 'bg-brand border-brand text-white' : 'border-line-medium'}`}>
                      {on && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-ink">{serviceName(a, lang)}</span>
                      <span className="block text-xs text-ink-muted">+{formatDurationRange(a.duration, a.durationMax, bookingDurationLabels)}</span>
                    </span>
                    <span className="text-sm font-semibold text-brand-dark whitespace-nowrap flex items-center">
                      +<PriceTag price={a.price} priceMax={a.priceMax} currency={branding?.currency} pct={activePct} className="inline-flex" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Останній день онлайн-запису (Settings.bookingOpenUntil), '' — без обмеження.
  const bookingOpenUntil = branding?.bookingOpenUntil || '';

  const handleCopyAddress = async () => {
    if (!branding?.address) return;
    try {
      await navigator.clipboard.writeText(branding.address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      // clipboard API недоступний — не критично
    }
  };

  const handleSubmit = async (withoutGift = false) => {
    if (!clientName || !clientPhone || !clientEmail) { setError(t('booking.fillAll')); return; }
    if (!validateEmail(clientEmail)) return;
    const useGift = !withoutGift && giftInRange && gift ? gift.token : undefined;
    if (withoutGift) setGift(null);
    setLoading(true); setError(''); setPromoError('');
    try {
      const res = await api.post('/booking', {
        employeeId: selectedEmployee!._id,
        serviceIds: selectedServices.map(s => s._id),
        date: selectedDate,
        startTime: selectedTime,
        clientName,
        clientPhone,
        clientEmail,
        // Мова інтерфейсу сторінки — нею прийде лист-підтвердження й нагадування.
        lang,
        giftToken: useGift,
      });
      setBookedDiscount(res.data?.appointment?.discountPercent ?? null);
      setTelegram({ url: res.data?.telegramUrl || null, linked: !!res.data?.telegramLinked });
      setDone(true);
      trackEvent(api, 'submit_success', { appointmentId: res.data?.appointment?.id });
    } catch (err) {
      const code = getErrorCode(err);
      if (code && code.startsWith('PROMO_')) {
        setPromoError(t(`gift.errors.${code}`));
      } else {
        setError(getErrorMessage(err) || t('booking.bookingError'));
      }
      trackEvent(api, 'submit_failed', { failureReason: getErrorCode(err) });
    } finally {
      setLoading(false);
    }
  };

  if (!salonSlug) return (
    <div style={pageStyle} className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle langs={enabledLangs} labels={BOOKING_LANG_LABELS} value={lang} onChange={setLang} />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold text-ink mb-2">{t('booking.noSalonTitle')}</h2>
        <p className="text-ink-secondary text-sm">{t('booking.noSalonSubtitle')}</p>
      </div>
    </div>
  );

  if (catalogLoading || catalogError) return (
    <div style={pageStyle} className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle langs={enabledLangs} labels={BOOKING_LANG_LABELS} value={lang} onChange={setLang} />
      </div>
      <div className="text-center max-w-sm">
        {catalogError ? (
          <>
            <p className="text-ink-secondary text-sm mb-4">{catalogError}</p>
            <button onClick={loadCatalog} className="btn btn-primary">{t('booking.retry')}</button>
          </>
        ) : (
          <p className="text-ink-muted text-sm">{t('booking.loading')}</p>
        )}
      </div>
    </div>
  );

  if (done) return (
    <div style={pageStyle} className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle langs={enabledLangs} labels={BOOKING_LANG_LABELS} value={lang} onChange={setLang} />
      </div>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-brand"/>
        </div>
        <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">{t('booking.confirmed')}</h2>
        <p className="text-ink-secondary mb-1">{t('booking.masterLabel')}: <strong className="text-ink">{selectedEmployee?.name}</strong></p>
        <p className="text-ink-secondary mb-1">{t('booking.dateLabel')}: <strong className="text-ink">{selectedDate}</strong> {t('booking.at')} <strong className="text-ink">{selectedTime}</strong></p>
        <p className="text-ink-secondary mb-6 flex items-center justify-center gap-1.5 flex-wrap">{t('booking.sumLabel')}: <PriceTag price={totalPrice} priceMax={totalPriceMax} currency={branding?.currency} pct={bookedDiscount} className="font-bold text-ink" /></p>
        {telegram.linked ? (
          <p className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#1f8fd1]">
            <TelegramIcon className="w-4 h-4" /> {t('booking.telegramLinked')}
          </p>
        ) : telegram.url && (
          <div className="mb-6">
            <a href={telegram.url} target="_blank" rel="noreferrer"
              onClick={() => trackEvent(api, 'telegram_optin_click')}
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-5 py-3 rounded-md bg-[#229ED9] hover:bg-[#1c8cc2] text-white font-semibold shadow-sm transition-colors">
              <TelegramIcon className="w-5 h-5" /> {t('booking.telegramCta')}
            </a>
            <p className="text-xs text-ink-muted mt-2">{t('booking.telegramHint')}</p>
          </div>
        )}
        <button
          onClick={() => {
            setDone(false); setScreen('menu'); setTelegram({ url: null, linked: false }); setBookedDiscount(null);
            setSelectedServices([]); setSelectedEmployee(null);
            setSelectedDate(''); setSelectedTime('');
            setClientName(''); setClientPhone(''); setClientEmail('');
          }}
          className="btn btn-primary">
          {t('booking.bookAgain')}
        </button>
      </div>
    </div>
  );

  return (
    <div style={pageStyle} className="min-h-screen bg-canvas">
      {screen === 'menu' ? (
        <div className="bg-neutral-900 text-white py-6 px-4 text-center relative"
          style={branding?.coverImageUrl ? {
            backgroundImage: `linear-gradient(rgba(15,15,20,.6), rgba(15,15,20,.6)), url(${branding.coverImageUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          } : undefined}>
          <div className="absolute top-0 right-4 sm:top-4">
            <LanguageToggle variant="dark" langs={enabledLangs} labels={BOOKING_LANG_LABELS} value={lang} onChange={setLang} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            {branding?.logoUrl
              ? <img src={branding.logoUrl} alt={branding.shopName} className="h-8 max-w-[140px] object-contain"/>
              : <img src="/icon.png" alt="hirnix" className="w-8 h-8 rounded-md"/>}
            <h1 className="text-2xl font-extrabold inline-flex items-baseline" style={{ letterSpacing: '-0.03em' }}>
              {branding?.shopName || 'hirnix'}
              <span className="w-1.5 h-1.5 rounded-full bg-brand ml-1 self-end mb-1" />
            </h1>
          </div>
          <p className="text-white/60 text-sm">{branding?.tagline || t('booking.onlineBooking')}</p>
        </div>
      ) : (
        <div className="px-4 pt-4 flex justify-end">
          <LanguageToggle langs={enabledLangs} labels={BOOKING_LANG_LABELS} value={lang} onChange={setLang} />
        </div>
      )}

      {gift && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className={`rounded-md px-4 py-3 text-sm font-medium flex items-start gap-2 ${gift.used || !giftInRange
            ? 'bg-canvas-soft text-ink-secondary border border-line'
            : 'bg-gradient-to-r from-rose-50 to-amber-50 text-rose-800 border border-rose-200'}`}>
            <span aria-hidden>🎁</span>
            <span>
              {gift.used
                ? t('gift.used')
                : !giftInRange
                  ? t('gift.outOfRange', { pct: gift.discountPercent, date: giftDateLabel })
                  : gift.firstName
                    ? t('gift.banner', { name: gift.firstName, pct: gift.discountPercent, date: giftDateLabel })
                    : t('gift.bannerNoName', { pct: gift.discountPercent, date: giftDateLabel })}
            </span>
          </div>
        </div>
      )}

      {/* Хаб — головне меню */}
      {screen === 'menu' && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {branding?.address && (
            <div className="ds-card p-4">
              <p className="text-sm text-ink-secondary flex items-center gap-2">
                <MapPin size={15} className="text-ink-muted flex-shrink-0"/> {branding.address}
              </p>
            </div>
          )}

          <div className="ds-card overflow-hidden divide-y divide-line">
            <MenuRow
              icon={<User size={18}/>}
              title={t('booking.menuMaster')}
              subtitle={selectedEmployee?.name}
              onClick={() => setScreen('master')}
            />
            <MenuRow
              icon={<ListChecks size={18}/>}
              title={t('booking.menuServices')}
              subtitle={selectedServices.length > 0 ? `${selectedServices.length} · ${formatPriceRange(discounted(totalPrice, activePct), discounted(totalPriceMax, activePct), branding?.currency)}${activePct ? ` (−${activePct}%)` : ''}` : undefined}
              // Ціни й тривалість залежать від майстра — спершу майстер.
              disabled={!selectedEmployee}
              disabledHint={t('booking.chooseMasterFirst')}
              onClick={() => setScreen('services')}
            />
            <MenuRow
              icon={<CalendarDays size={18}/>}
              title={t('booking.menuDateTime')}
              subtitle={selectedDate && selectedTime ? `${selectedDate} ${t('booking.at')} ${selectedTime}` : undefined}
              disabled={!selectedEmployee}
              disabledHint={t('booking.chooseMasterFirst')}
              onClick={() => setScreen('datetime')}
            />
            <MenuRow
              icon={<Info size={18}/>}
              title={t('booking.menuAbout')}
              onClick={() => setScreen('about')}
            />
          </div>

          <button
            disabled={!selectedEmployee || !selectedDate || !selectedTime || selectedServices.length === 0}
            onClick={() => setScreen('contacts')}
            className="btn btn-primary w-full py-3">
            {t('booking.bookNow')}
          </button>
        </div>
      )}

      {/* Про заклад */}
      {screen === 'about' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.aboutTitle')} onBack={() => setScreen('menu')} />

          <div className="ds-card p-5 space-y-3 mb-4">
            <div className="flex items-center gap-3">
              {branding?.logoUrl
                ? <img src={branding.logoUrl} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0"/>
                : <img src="/icon.png" alt="hirnix" className="w-11 h-11 rounded-full object-cover flex-shrink-0"/>}
              <h3 className="text-lg font-bold text-ink">{branding?.shopName || 'hirnix'}</h3>
            </div>
            {branding?.address && (
              <p className="flex items-center gap-2 text-sm text-ink-secondary">
                <MapPin size={16} className="text-ink-muted flex-shrink-0"/> {branding.address}
              </p>
            )}
            {branding?.phone && (
              <a href={`tel:${branding.phone}`} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-brand w-fit">
                <Phone size={16} className="text-ink-muted flex-shrink-0"/> {branding.phone}
              </a>
            )}
            {branding?.websiteUrl && (
              <a href={branding.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-ink-secondary hover:text-brand w-fit truncate">
                <Globe size={16} className="text-ink-muted flex-shrink-0"/> <span className="truncate">{branding.websiteUrl}</span>
              </a>
            )}
          </div>

          {branding?.workingHours && (
            <div className="ds-card p-5 mb-4">
              <h4 className="text-sm font-semibold text-ink mb-3">{t('booking.workingHoursTitle')}</h4>
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAY_ORDER.map(day => {
                  const d = branding.workingHours?.[day];
                  const off = !d || !d.isOpen;
                  return (
                    <div key={day}>
                      <p className="text-[11px] font-medium text-ink-muted">{t(`days.${day}`)}</p>
                      <div className={`mt-0.5 py-1 rounded-xs text-[10px] leading-tight ${off ? 'bg-red-50 text-red-500' : 'bg-brand-soft text-brand-dark'}`}>
                        {off ? '×' : `${d.from}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ds-card p-5">
            <h4 className="text-sm font-semibold text-ink mb-3">{t('booking.locationTitle')}</h4>
            {branding?.address && (
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-sm text-ink-secondary">{branding.address}</span>
                <button onClick={handleCopyAddress} className="text-ink-muted hover:text-ink flex-shrink-0" title={t('booking.copyAddress')}>
                  {addressCopied ? <Check size={15}/> : <Copy size={15}/>}
                </button>
              </div>
            )}
            {branding?.latitude != null && branding?.longitude != null ? (
              <LocationMap lat={branding.latitude} lng={branding.longitude} label={branding.shopName}/>
            ) : (
              <p className="text-sm text-ink-muted">{t('booking.noCoordinates')}</p>
            )}
          </div>
        </div>
      )}

      {/* Майстер */}
      {screen === 'master' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.chooseMaster')} onBack={() => setScreen('menu')} />
          <div className="space-y-3">
            {employees.map(e => {
              const initials = e.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <button key={e._id} type="button"
                  aria-pressed={selectedEmployee?._id === e._id}
                  onClick={() => {
                    const allowedIds = !e.services || e.services.length === 0 ? null : new Set(e.services);
                    setSelectedServices(prev => {
                      const kept = allowedIds ? prev.filter(s => allowedIds.has(s._id)) : prev;
                      // Додаткова без своєї основної не лишається.
                      const mainIds = new Set(kept.filter(x => !x.isAddon).map(x => x._id));
                      return kept.filter(x => !x.isAddon || (x.addonFor || []).some(id => mainIds.has(id)));
                    });
                    setSelectedEmployee(e);
                    // Послуги ще не обрані — одразу до них (ціни вже цього майстра).
                    setScreen(selectedServices.length === 0 ? 'services' : 'menu');
                    trackEvent(api, 'master_selected', { employeeId: e._id });
                  }}
                  className={`w-full p-4 rounded-md border-2 cursor-pointer transition-colors flex items-center gap-4 text-left
                    ${selectedEmployee?._id === e._id
                      ? 'border-brand bg-brand-extra-soft'
                      : 'border-line bg-surface hover:border-line-medium'}`}>
                  <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{e.name}</p>
                    <p className="text-sm text-ink-muted">{employeeRoleLabel(e, lang) || t(`roles.${e.role}`)}</p>
                    {employeeSpecialties(e, lang).length > 0 && (
                      <p className="text-xs text-ink-muted mt-0.5">{employeeSpecialties(e, lang).join(', ')}</p>
                    )}
                    {employeeBio(e, lang) && <p className="text-sm text-ink-secondary mt-1">{employeeBio(e, lang)}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Дата і час */}
      {screen === 'datetime' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.chooseDateTime')} onBack={() => setScreen('menu')} />
          <div className="mb-4">
            <label className="field-label">{t('booking.dateLabel')}</label>
            <input type="date" min={todayStr} max={bookingOpenUntil || undefined} value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); setIsClosed(false); setNotOpenYet(false); }}
              className="field-input py-3"/>
            {bookingOpenUntil && (
              <p className="text-xs text-ink-muted mt-1.5">{t('booking.openUntilHint', { date: formatCalendarDate(bookingOpenUntil) })}</p>
            )}
          </div>
          {selectedDate && (
            <div>
              <label className="field-label">{t('booking.availableTimeLabel')}</label>
              {slotsLoading ? (
                <p className="text-ink-muted text-sm">{t('booking.loading')}</p>
              ) : slotsError ? (
                <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                  <p className="text-sm text-red-600 mb-2">{slotsError}</p>
                  <button onClick={loadSlots} className="btn btn-secondary">{t('booking.retry')}</button>
                </div>
              ) : isClosed ? (
                <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                  <p className="text-sm text-amber-700">
                    {notOpenYet && bookingOpenUntil
                      ? t('booking.notOpenYetMessage', { date: formatCalendarDate(bookingOpenUntil) })
                      : t('booking.closedMessage')}
                  </p>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-ink-muted text-sm">{t('booking.noSlots')}</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button key={slot}
                      onClick={() => { setSelectedTime(slot); trackEvent(api, 'slot_selected', { date: selectedDate, time: slot }); }}
                      className={`py-2 rounded-sm text-sm font-medium border transition-colors
                        ${selectedTime === slot
                          ? 'bg-brand text-white border-brand'
                          : 'border-line text-ink-secondary hover:border-brand/50'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            disabled={!selectedDate || !selectedTime || isClosed}
            onClick={() => setScreen('menu')}
            className="btn btn-primary w-full mt-6 py-3">
            {t('booking.confirmSelection')}
          </button>
        </div>
      )}

      {/* Послуги */}
      {screen === 'services' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.chooseService')} onBack={() => setScreen('menu')} />
          {groupByCategory ? (
            <div className="space-y-3">
              {serviceGroups.map(({ category, items }) => {
                const isOpen = openCategories.has(category);
                const selectedInGroup = items.filter(s => selectedServices.some(x => x._id === s._id)).length;
                return (
                  <div key={category} className="ds-card overflow-hidden">
                    <button type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-canvas-soft">
                      <span className="flex-1 min-w-0 font-semibold text-ink">{categoryLabel(category)}</span>
                      {selectedInGroup > 0 && (
                        <span className="badge bg-brand text-white flex-shrink-0">
                          {selectedInGroup}
                        </span>
                      )}
                      <span className="text-xs text-ink-muted flex-shrink-0">{items.length}</span>
                      <ChevronDown size={18} className={`text-ink-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-3">
                        {items.map(renderServiceCard)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {availableServices.map(renderServiceCard)}
            </div>
          )}
          {selectedServices.length > 0 && (
            <div className="mt-4 p-3 bg-brand-extra-soft rounded-sm flex justify-between items-center">
              <span className="text-sm text-ink-secondary">{t('booking.selectedCount', { count: selectedServices.length, duration: formatDurationRange(totalDurationMin, totalDuration, bookingDurationLabels) })}</span>
              <PriceTag price={totalPrice} priceMax={totalPriceMax} currency={branding?.currency} pct={activePct} className="font-semibold text-brand-dark" />
            </div>
          )}
          <button
            disabled={selectedServices.length === 0}
            onClick={() => {
              setScreen('menu');
              trackEvent(api, 'service_selected', { serviceIds: selectedServices.map(s => s._id) });
            }}
            className="btn btn-primary w-full mt-6 py-3">
            {t('booking.confirmSelection')}
          </button>
        </div>
      )}

      {/* Контакти */}
      {screen === 'contacts' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.contactsTitle')} onBack={() => setScreen('menu')} />
          <div className="space-y-4">
            <div>
              <label className="field-label">{t('booking.nameLabel')}</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                placeholder={t('booking.namePlaceholder')}
                className="field-input py-3"/>
            </div>
            <div>
              <label className="field-label">{t('booking.phoneLabel')}</label>
              <PhoneInput
                international
                defaultCountry="UA"
                value={clientPhone}
                onChange={(val) => setClientPhone(val || '')}
                className="phone-input"
              />
            </div>
            <div>
              <label className="field-label">{t('booking.emailLabel')}</label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => {
                  setClientEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => clientEmail && validateEmail(clientEmail)}
                placeholder="ivan@gmail.com"
                className={`field-input py-3 ${emailError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15' : ''}`}
              />
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>
          </div>
          <button
            disabled={!clientName || !clientPhone || !clientEmail}
            onClick={() => {
              if (!validateEmail(clientEmail)) return;
              setScreen('confirm');
              trackEvent(api, 'contacts_entered');
            }}
            className="btn btn-primary w-full mt-6 py-3">
            {t('booking.next')}
          </button>
        </div>
      )}

      {/* Підтвердження */}
      {screen === 'confirm' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ScreenHeader title={t('booking.confirmTitle')} onBack={() => setScreen('contacts')} />
          <div className="ds-card p-5 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.masterLabel')}</span>
              <span className="font-medium text-ink">{selectedEmployee?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.servicesLabel')}</span>
              <span className="font-medium text-ink text-right">{selectedLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.dateTimeLabel')}</span>
              <span className="font-medium text-ink">{selectedDate} {t('booking.at')} {selectedTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('booking.durationLabel')}</span>
              <span className="font-medium text-ink">{formatDurationRange(totalDurationMin, totalDuration, bookingDurationLabels)}</span>
            </div>
            <div className="border-t border-line pt-3 flex justify-between">
              <span className="font-semibold text-ink">{t('booking.sumLabel')}</span>
              <PriceTag price={totalPrice} priceMax={totalPriceMax} currency={branding?.currency} pct={activePct} className="font-bold text-brand-dark text-lg" />
            </div>
            <div className="border-t border-line pt-3 text-sm text-ink-muted">
              <p>{clientName} • {clientPhone}</p>
              {clientEmail && <p>{clientEmail}</p>}
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {promoError && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 mb-4">
              <p className="text-sm text-amber-800 mb-2">{promoError}</p>
              <button type="button" onClick={() => handleSubmit(true)} disabled={loading} className="btn btn-secondary w-full">
                {t('gift.withoutDiscount')}
              </button>
            </div>
          )}
          <button onClick={() => handleSubmit()} disabled={loading} className="btn btn-primary w-full py-3">
            {loading ? t('booking.booking') : t('booking.confirmBtn')}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
