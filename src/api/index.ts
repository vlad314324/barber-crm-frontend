import axios from 'axios';
import type {
  Client, Employee, Service, Appointment, Review,
  CreateClientDto, CreateEmployeeDto, CreateServiceDto,
  CreateAppointmentDto, CreateReviewDto,
  RegisterSalonDto, RegisterSalonResponse,
  CreateStaffLoginDto, CreateStaffLoginResponse,
  UpdateStaffLoginDto, UpdateStaffLoginResponse
} from './types';
import { getSalonSlug, clearSalonSlug } from '../utils/tenant';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Endpoints that live outside the salon-slug namespace.
const TENANT_LESS_PREFIXES = ['/salons/register'];

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const isTenantLess = TENANT_LESS_PREFIXES.some(p => config.url?.startsWith(p));
  if (!isTenantLess) {
    const slug = getSalonSlug();
    if (slug && config.url) config.url = `/${slug}${config.url}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response && !TENANT_LESS_PREFIXES.some(p => error.config?.url?.includes(p))) {
      const code = (error.response.data as { code?: string } | undefined)?.code;
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (code === 'TENANT_MISMATCH' && !isLoginRequest) {
        localStorage.removeItem('token');
        clearSalonSlug();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?reason=tenant_mismatch';
        }
      } else if (error.response.status === 401 && !isLoginRequest) {
        localStorage.removeItem('token');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?reason=session_expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const salonApi = {
  register: async (data: RegisterSalonDto): Promise<RegisterSalonResponse> =>
    (await api.post('/salons/register', data)).data,
};

export const authApi = {
  createStaffLogin: async (data: CreateStaffLoginDto): Promise<CreateStaffLoginResponse> =>
    (await api.post('/auth/register', data)).data,
  updateStaffLogin: async (employeeId: string, data: UpdateStaffLoginDto): Promise<UpdateStaffLoginResponse> =>
    (await api.put(`/auth/staff/${employeeId}`, data)).data,
};

export const clientApi = {
  getAll: async (): Promise<Client[]> => (await api.get('/clients')).data,
  getById: async (id: string): Promise<Client> => (await api.get(`/clients/${id}`)).data,
  create: async (data: CreateClientDto): Promise<Client> => (await api.post('/clients', data)).data,
  update: async (id: string, data: Partial<CreateClientDto>): Promise<Client> => (await api.put(`/clients/${id}`, data)).data,
  delete: async (id: string): Promise<void> => { await api.delete(`/clients/${id}`); },
};

export const employeeApi = {
  getAll: async (): Promise<Employee[]> => (await api.get('/employees')).data,
  getById: async (id: string): Promise<Employee> => (await api.get(`/employees/${id}`)).data,
  create: async (data: CreateEmployeeDto): Promise<Employee> => (await api.post('/employees', data)).data,
  update: async (id: string, data: Partial<CreateEmployeeDto>): Promise<Employee> => (await api.put(`/employees/${id}`, data)).data,
  delete: async (id: string): Promise<void> => { await api.delete(`/employees/${id}`); },
};

export const appointmentApi = {
  getAll: async (): Promise<Appointment[]> => (await api.get('/appointments')).data,
  getById: async (id: string): Promise<Appointment> => (await api.get(`/appointments/${id}`)).data,
  create: async (data: CreateAppointmentDto): Promise<Appointment> => (await api.post('/appointments', data)).data,
  update: async (id: string, data: Partial<CreateAppointmentDto>): Promise<Appointment> => (await api.put(`/appointments/${id}`, data)).data,
  delete: async (id: string): Promise<void> => { await api.delete(`/appointments/${id}`); },
};

export const serviceApi = {
  getAll: async (): Promise<Service[]> => (await api.get('/services')).data,
  getById: async (id: string): Promise<Service> => (await api.get(`/services/${id}`)).data,
  create: async (data: CreateServiceDto): Promise<Service> => (await api.post('/services', data)).data,
  update: async (id: string, data: Partial<CreateServiceDto>): Promise<Service> => (await api.put(`/services/${id}`, data)).data,
  delete: async (id: string): Promise<void> => { await api.delete(`/services/${id}`); },
};

export const reviewApi = {
  getAll: async (): Promise<Review[]> => (await api.get('/reviews')).data,
  getByEmployee: async (employeeId: string): Promise<Review[]> => (await api.get(`/reviews/employee/${employeeId}`)).data,
  getById: async (id: string): Promise<Review> => (await api.get(`/reviews/${id}`)).data,
  create: async (data: CreateReviewDto): Promise<Review> => (await api.post('/reviews', data)).data,
  update: async (id: string, data: Partial<CreateReviewDto>): Promise<Review> => (await api.put(`/reviews/${id}`, data)).data,
  delete: async (id: string): Promise<void> => { await api.delete(`/reviews/${id}`); },
};

export default api;