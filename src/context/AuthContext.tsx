import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { salonApi } from '../api';
import { getSalonSlug, setSalonSlug, clearSalonSlug } from '../utils/tenant';
import type { RegisterSalonDto } from '../api/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'client';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  salonSlug: string | null;
  login: (salonSlug: string, email: string, password: string) => Promise<User>;
  registerSalon: (data: RegisterSalonDto) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [salonSlug, setSalonSlugState] = useState<string | null>(getSalonSlug());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedSlug = getSalonSlug();
      if (!savedToken || !savedSlug) {
        localStorage.removeItem('token');
        clearSalonSlug();
        setToken(null);
        setSalonSlugState(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        setToken(savedToken);
        setSalonSlugState(savedSlug);
      } catch {
        localStorage.removeItem('token');
        clearSalonSlug();
        setToken(null);
        setSalonSlugState(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (slug: string, email: string, password: string): Promise<User> => {
    setSalonSlug(slug);
    setSalonSlugState(slug);
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const registerSalon = async (data: RegisterSalonDto): Promise<User> => {
    const res = await salonApi.register(data);
    localStorage.setItem('token', res.token);
    setSalonSlug(res.salon.slug);
    setSalonSlugState(res.salon.slug);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    clearSalonSlug();
    setToken(null);
    setSalonSlugState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, salonSlug, login, registerSalon, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
