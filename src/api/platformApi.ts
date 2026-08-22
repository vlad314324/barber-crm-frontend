import axios from 'axios';
import { API_BASE_URL } from './index';

// Повністю окремий axios-інстанс від tenant `api` (src/api/index.ts) —
// той має tenant-інтерцептори (slug-префіксація, редірект на /login при 401),
// які тут не мають спрацьовувати. Платформна сесія живе в іншому ключі
// localStorage (`platformToken`, не `token`), щоб ніколи не перетинатися
// зі звичайним salon-логіном у тій самій вкладці.
const platformApi = axios.create({
  baseURL: `${API_BASE_URL}/platform`,
  headers: { 'Content-Type': 'application/json' },
});

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('platformToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Протермінований чи невалідний платформний токен (напр. 7-денний JWT
// вигас) інакше тихо провалював би кожен запит — вкладки показували б
// порожні списки, а адмін і далі виглядав би "залогіненим" (це поле
// читається з localStorage при завантаженні й не звіряється з бекендом).
platformApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('platformToken');
        localStorage.removeItem('platformAdmin');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export interface PlatformAdminAccount {
  id: string;
  name: string;
  email: string;
}

export interface PlatformAuthResponse {
  token: string;
  admin: PlatformAdminAccount;
}

export interface PlatformSalonComment {
  text: string;
  authorName: string;
  createdAt: string;
}

export interface PlatformSalon {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  isActive: boolean;
  provisionedAt?: string;
  createdAt: string;
  subscriptionPaidAt?: string;
  subscriptionPeriodDays?: number;
  subscriptionExpiresAt?: string;
  comments: PlatformSalonComment[];
  deactivatedAt?: string;
  deactivationReason?: string;
}

export interface PlatformAdminListItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformInvitation {
  id: string;
  email: string;
  used: boolean;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreatedInvitation {
  token: string;
  email: string;
  expiresAt: string;
  registrationUrl: string;
}

export const platformAuthApi = {
  login: async (email: string, password: string): Promise<PlatformAuthResponse> =>
    (await platformApi.post('/auth/login', { email, password })).data,

  // secret — лише для bootstrap першого акаунту (коли акаунтів ще 0).
  // Коли вже є хоч один акаунт, бекенд вимагає авторизований запит замість
  // секрету — інтерцептор сам додасть Authorization, якщо він є в сховищі.
  createAdmin: async (data: { name: string; email: string; password: string }, secret?: string): Promise<PlatformAuthResponse> =>
    (await platformApi.post('/admins', data, secret ? { headers: { 'x-platform-secret': secret } } : undefined)).data,

  getSalons: async (): Promise<PlatformSalon[]> =>
    (await platformApi.get('/salons')).data,

  getInvitations: async (): Promise<PlatformInvitation[]> =>
    (await platformApi.get('/invitations')).data,

  createInvitation: async (email: string): Promise<CreatedInvitation> =>
    (await platformApi.post('/invitations', { email })).data,

  updateSubscription: async (id: string, data: { paidAt: string; periodDays: number }): Promise<PlatformSalon> =>
    (await platformApi.put(`/salons/${id}/subscription`, data)).data,

  addComment: async (id: string, text: string): Promise<PlatformSalon> =>
    (await platformApi.post(`/salons/${id}/comments`, { text })).data,

  deactivateSalon: async (id: string, reason?: string): Promise<PlatformSalon> =>
    (await platformApi.post(`/salons/${id}/deactivate`, { reason })).data,

  reactivateSalon: async (id: string): Promise<PlatformSalon> =>
    (await platformApi.post(`/salons/${id}/reactivate`)).data,

  getAdmins: async (): Promise<PlatformAdminListItem[]> =>
    (await platformApi.get('/admins')).data,
};

export default platformApi;
