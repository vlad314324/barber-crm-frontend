import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api';
import { DEFAULT_CURRENCY } from '../constants/currencies';
import { DurationUnit } from '../utils/duration';

const DEFAULT_DURATION_UNIT: DurationUnit = 'min';

interface SettingsContextType {
  currency: string;
  serviceRangesEnabled: boolean;
  // Одиниця, в якій адмінка показує/приймає тривалість послуг і записів —
  // керується налаштуванням закладу durationDisplayUnit (Settings > Загальні).
  durationUnit: DurationUnit;
  // Дозволяє будь-якому компоненту (напр. сторінці Налаштувань після
  // збереження) примусово перечитати /settings, щоб решта застосунку
  // (уже змонтована — контекст ініціалізується лише раз при старті) одразу
  // побачила нове значення без перезавантаження сторінки.
  refresh: () => Promise<void>;
}

const noopRefresh = async () => {};

const SettingsContext = createContext<SettingsContextType>({
  currency: DEFAULT_CURRENCY, serviceRangesEnabled: false, durationUnit: DEFAULT_DURATION_UNIT, refresh: noopRefresh,
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [serviceRangesEnabled, setServiceRangesEnabled] = useState(false);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(DEFAULT_DURATION_UNIT);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/settings');
      setCurrency(r.data.currency || DEFAULT_CURRENCY);
      setServiceRangesEnabled(!!r.data.serviceRangesEnabled);
      setDurationUnit(r.data.durationDisplayUnit === 'hours' ? 'hour' : DEFAULT_DURATION_UNIT);
    } catch {
      // мережева помилка — лишаємо попередні значення, не критично
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SettingsContext.Provider value={{ currency, serviceRangesEnabled, durationUnit, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useShopCurrency = () => useContext(SettingsContext).currency;
export const useShopServiceRangesEnabled = () => useContext(SettingsContext).serviceRangesEnabled;
export const useShopDurationUnit = () => useContext(SettingsContext).durationUnit;
export const useRefreshShopSettings = () => useContext(SettingsContext).refresh;
