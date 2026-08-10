import { createContext, useContext, useState, ReactNode } from 'react';
import { platformAuthApi, PlatformAdminAccount } from '../api/platformApi';

interface PlatformAuthContextType {
  admin: PlatformAdminAccount | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  createAdmin: (data: { name: string; email: string; password: string }, secret?: string) => Promise<void>;
  logout: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | null>(null);

// Незалежний від тенантного AuthContext.tsx — власний ключ localStorage
// (`platformToken`, не `token`), власний тип акаунту. Нуль спільного стану
// з salon-логіном, тож обидві сесії можуть співіснувати в одній вкладці.
export const PlatformAuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('platformToken'));
  const [admin, setAdmin] = useState<PlatformAdminAccount | null>(() => {
    const saved = localStorage.getItem('platformAdmin');
    return saved ? JSON.parse(saved) : null;
  });

  const applySession = (res: { token: string; admin: PlatformAdminAccount }) => {
    localStorage.setItem('platformToken', res.token);
    localStorage.setItem('platformAdmin', JSON.stringify(res.admin));
    setToken(res.token);
    setAdmin(res.admin);
  };

  const login = async (email: string, password: string): Promise<void> => {
    const res = await platformAuthApi.login(email, password);
    applySession(res);
  };

  const createAdmin = async (data: { name: string; email: string; password: string }, secret?: string): Promise<void> => {
    const res = await platformAuthApi.createAdmin(data, secret);
    applySession(res);
  };

  const logout = () => {
    localStorage.removeItem('platformToken');
    localStorage.removeItem('platformAdmin');
    setToken(null);
    setAdmin(null);
  };

  return (
    <PlatformAuthContext.Provider value={{ admin, token, login, createAdmin, logout }}>
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  return ctx;
};
