import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';
import { DEFAULT_CURRENCY } from '../constants/currencies';

interface SettingsContextType {
  currency: string;
  serviceRangesEnabled: boolean;
}

const SettingsContext = createContext<SettingsContextType>({ currency: DEFAULT_CURRENCY, serviceRangesEnabled: false });

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [serviceRangesEnabled, setServiceRangesEnabled] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(r => {
        setCurrency(r.data.currency || DEFAULT_CURRENCY);
        setServiceRangesEnabled(!!r.data.serviceRangesEnabled);
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ currency, serviceRangesEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useShopCurrency = () => useContext(SettingsContext).currency;
export const useShopServiceRangesEnabled = () => useContext(SettingsContext).serviceRangesEnabled;
