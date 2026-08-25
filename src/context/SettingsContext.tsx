import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';
import { DEFAULT_CURRENCY } from '../constants/currencies';

interface SettingsContextType {
  currency: string;
}

const SettingsContext = createContext<SettingsContextType>({ currency: DEFAULT_CURRENCY });

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    api.get('/settings')
      .then(r => setCurrency(r.data.currency || DEFAULT_CURRENCY))
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ currency }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useShopCurrency = () => useContext(SettingsContext).currency;
