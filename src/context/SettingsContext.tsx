import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api';
import { DEFAULT_CURRENCY } from '../constants/currencies';
import { DurationUnit } from '../utils/duration';
import { BookingLang, BOOKING_LANGS } from '../i18n/bookingTranslations';

const DEFAULT_DURATION_UNIT: DurationUnit = 'min';
const DEFAULT_BOOKING_LANGUAGES: BookingLang[] = ['uk', 'en'];
const DEFAULT_BOOKING_LANGUAGE: BookingLang = 'uk';

interface SettingsContextType {
  currency: string;
  serviceRangesEnabled: boolean;
  // Одиниця, в якій адмінка показує/приймає тривалість послуг і записів —
  // керується налаштуванням закладу durationDisplayUnit (Settings > Загальні).
  durationUnit: DurationUnit;
  // Мови сторінки бронювання, увімкнені в Налаштуваннях, і мова за
  // замовчуванням — потрібні формам послуг/співробітників, щоб показувати
  // поля перекладу лише для реально увімкнених мов.
  bookingLanguages: BookingLang[];
  defaultBookingLanguage: BookingLang;
  // Дозволяє будь-якому компоненту (напр. сторінці Налаштувань після
  // збереження) примусово перечитати /settings, щоб решта застосунку
  // (уже змонтована — контекст ініціалізується лише раз при старті) одразу
  // побачила нове значення без перезавантаження сторінки.
  refresh: () => Promise<void>;
}

const noopRefresh = async () => {};

const SettingsContext = createContext<SettingsContextType>({
  currency: DEFAULT_CURRENCY, serviceRangesEnabled: false, durationUnit: DEFAULT_DURATION_UNIT,
  bookingLanguages: DEFAULT_BOOKING_LANGUAGES, defaultBookingLanguage: DEFAULT_BOOKING_LANGUAGE,
  refresh: noopRefresh,
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [serviceRangesEnabled, setServiceRangesEnabled] = useState(false);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(DEFAULT_DURATION_UNIT);
  const [bookingLanguages, setBookingLanguages] = useState<BookingLang[]>(DEFAULT_BOOKING_LANGUAGES);
  const [defaultBookingLanguage, setDefaultBookingLanguage] = useState<BookingLang>(DEFAULT_BOOKING_LANGUAGE);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/settings');
      setCurrency(r.data.currency || DEFAULT_CURRENCY);
      setServiceRangesEnabled(!!r.data.serviceRangesEnabled);
      setDurationUnit(r.data.durationDisplayUnit === 'hours' ? 'hour' : DEFAULT_DURATION_UNIT);
      const langs = (Array.isArray(r.data.bookingLanguages) ? r.data.bookingLanguages : [])
        .filter((l: string): l is BookingLang => (BOOKING_LANGS as readonly string[]).includes(l));
      setBookingLanguages(langs.length > 0 ? langs : DEFAULT_BOOKING_LANGUAGES);
      setDefaultBookingLanguage(
        (BOOKING_LANGS as readonly string[]).includes(r.data.defaultBookingLanguage)
          ? r.data.defaultBookingLanguage
          : DEFAULT_BOOKING_LANGUAGE
      );
    } catch {
      // мережева помилка — лишаємо попередні значення, не критично
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SettingsContext.Provider value={{ currency, serviceRangesEnabled, durationUnit, bookingLanguages, defaultBookingLanguage, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useShopCurrency = () => useContext(SettingsContext).currency;
export const useShopServiceRangesEnabled = () => useContext(SettingsContext).serviceRangesEnabled;
export const useShopDurationUnit = () => useContext(SettingsContext).durationUnit;
export const useShopBookingLanguages = () => useContext(SettingsContext).bookingLanguages;
export const useShopDefaultBookingLanguage = () => useContext(SettingsContext).defaultBookingLanguage;
export const useRefreshShopSettings = () => useContext(SettingsContext).refresh;
