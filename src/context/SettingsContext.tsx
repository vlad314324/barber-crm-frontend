import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../api';
import { DEFAULT_CURRENCY } from '../constants/currencies';

interface SettingsContextType {
  currency: string;
  serviceRangesEnabled: boolean;
  // Дозволяє будь-якому компоненту (напр. сторінці Налаштувань після
  // збереження) примусово перечитати /settings, щоб решта застосунку
  // (уже змонтована — контекст ініціалізується лише раз при старті) одразу
  // побачила нове значення без перезавантаження сторінки.
  refresh: () => Promise<void>;
}

const noopRefresh = async () => {};

const SettingsContext = createContext<SettingsContextType>({
  currency: DEFAULT_CURRENCY, serviceRangesEnabled: false, refresh: noopRefresh,
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [serviceRangesEnabled, setServiceRangesEnabled] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/settings');
      setCurrency(r.data.currency || DEFAULT_CURRENCY);
      setServiceRangesEnabled(!!r.data.serviceRangesEnabled);
    } catch {
      // мережева помилка — лишаємо попередні значення, не критично
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SettingsContext.Provider value={{ currency, serviceRangesEnabled, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useShopCurrency = () => useContext(SettingsContext).currency;
export const useShopServiceRangesEnabled = () => useContext(SettingsContext).serviceRangesEnabled;
export const useRefreshShopSettings = () => useContext(SettingsContext).refresh;
