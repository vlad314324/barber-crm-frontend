// types.ts
import type { BookingLang } from '../i18n/bookingTranslations';

// Client types
export interface Client {
  // Клієнт підписаний на Telegram-сповіщення в цьому салоні (лише GET /clients/:id).
  telegramLinked?: boolean;
  _id: string;
  name: string;
  phone: string;
  email: string;
  // Необовʼязкові: нік Instagram без "@" і дата народження "YYYY-MM-DD".
  instagram?: string;
  birthday?: string;
  // Додаємо нові поля, які використовуються на фронтенді:
  image?: string; // Зробимо необов'язковим, якщо зображення не завжди є
  visits?: number; // Зробимо необов'язковим, якщо це розрахункове поле або ще не реалізовано на бекенді
  lastVisit?: string; // Зробимо необов'язковим, якщо ще не реалізовано на бекенді
  createdAt?: string;
  // Коментарі персоналу до клієнта (лише в GET /clients/:id), нові зверху.
  notes?: ClientNote[];
}

export interface ClientNote {
  _id?: string;
  text: string;
  authorName: string;
  authorRole?: string;
  createdAt: string;
}

export interface ClientPageParams {
  page: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'visits' | 'lastVisit' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface ClientPageResult {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Employee {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: 'Barber' | 'Receptionist' | 'Manager';
  customRoleLabel?: string;
  hourlyRate: number;
  isAvailable: boolean;
  isActive?: boolean;
  schedule: {
    mon: WorkingDay;
    tue: WorkingDay;
    wed: WorkingDay;
    thu: WorkingDay;
    fri: WorkingDay;
    sat: WorkingDay;
    sun: WorkingDay;
  };
  specialties: string[];
  services?: string[];
  rating?: number;
  reviewCount?: number;
  joinDate?: string;
  bio?: string;
  image?: string;
  userId?: string | null;
  // Переклади bio/спеціалізацій для мов сторінки бронювання, крім мови за
  // замовчуванням салону (та лишається в базових полях name/bio/specialties).
  translations?: Partial<Record<BookingLang, { bio: string; specialties: string[]; customRoleLabel?: string }>>;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  priceMax?: number;
  duration: number; // in minutes
  durationMax?: number;
  category: string;
  isAvailable: boolean;
  // Переклади назви/опису для мов сторінки бронювання, крім мови за
  // замовчуванням салону (та лишається в базових полях name/description).
  translations?: Partial<Record<BookingLang, { name: string; description: string }>>;
  // Публічний URL фото послуги (R2). Змінюється лише через
  // serviceApi.uploadImage/deleteImage, не через create/update.
  imageUrl?: string;
}

// Перерва майстра на конкретну дату (обід тощо) — закриває час для запису.
export interface EmployeeBreak {
  _id: string;
  employee: string;
  date: string; // ISO, північ UTC календарного дня
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  comment: string;
}

export interface BreakInterval {
  startTime: string;
  endTime: string;
  comment: string;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  // Перекладені назви для мов сторінки бронювання (ключ — код мови)
  translations?: Partial<Record<BookingLang, string>>;
}

export interface Notification {
  _id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  appointmentId?: string;
  clientName?: string;
  employeeName?: string;
  date?: string;
  startTime?: string;
  // type: 'birthday'
  clientId?: string;
  daysUntil?: number;
}

// GET /clients/birthdays — найближчі дні народження клієнтів.
export interface UpcomingBirthday {
  _id: string;
  name: string;
  phone: string;
  instagram?: string;
  birthday: string;
  date: string; // найближче святкування, YYYY-MM-DD
  daysUntil: number;
  age: number;
  hasEmail: boolean;
  telegramLinked: boolean;
  // Привітання зі знижкою на цей ДН (без скасованих), якщо адмін його створив.
  greeting: BirthdayGreetingInfo | null;
}

export interface BirthdayGreetingInfo {
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'expired';
  sendAt: string;
  sendTime: string;
  discountPercent: number;
  validDays: number;
  message: string;
  channels?: { email: boolean; telegram: boolean };
  // Знижкою за посиланням уже скористались (є запис).
  promoUsed?: boolean;
}

export interface BirthdayGreetingInput {
  discountPercent: number;
  validDays: number;
  sendTime: string;
  message: string;
}


export interface AppointmentNote {
  _id?: string;
  text: string;
  authorName: string;
  authorRole?: string;
  createdAt: string;
}

// Тип, який використовуєш у фронтенді
export interface Appointment {
  _id: string;
  client: Client;
  employee: Employee;
  services: Service[];
  date: string;
  startTime: string;
  totalDuration: number;
  totalPrice: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';
  notes?: AppointmentNote[];
  // Знижка до дня народження (бронювання за посиланням з привітання).
  discountPercent?: number;
  priceBeforeDiscount?: number;
}

export interface EmployeeMonthlyEarning {
  month: string;
  amount: number;
  appointments: number;
}

export interface EmployeeClientSummary {
  id: string;
  name: string;
  phone: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
}

export interface EmployeeStats {
  totalEarnings: number;
  totalCompletedAppointments: number;
  monthlyEarnings: EmployeeMonthlyEarning[];
  clients: EmployeeClientSummary[];
}

export interface AppointmentResponse {
  _id: string;
  client: string;
  employee: string;
  services: string[];
  date: string;
  startTime: string;
  totalDuration: number;
  totalPrice: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';
}


export interface Review {
  _id: string;
  client: Client;
  appointment: Appointment;
  employee: Employee;
  rating: number;
  text?: string;
  createdAt: string;
}

// Request DTOs (Data Transfer Objects)
export interface CreateClientDto {
  name: string;
  phone: string;
  email: string;
  instagram?: string;
  birthday?: string;
}

export interface CreateEmployeeDto {
  name: string;
  phone: string;
  email: string;
  role: 'Barber' | 'Receptionist' | 'Manager';
  customRoleLabel?: string;
  hourlyRate: number;
  isAvailable: boolean;
  schedule?: {
    mon: WorkingDay;
    tue: WorkingDay;
    wed: WorkingDay;
    thu: WorkingDay;
    fri: WorkingDay;
    sat: WorkingDay;
    sun: WorkingDay;
  };
  specialties?: string[];
  services?: string[];
  translations?: Partial<Record<BookingLang, { bio: string; specialties: string[]; customRoleLabel?: string }>>;
}

export interface CreateServiceDto {
  name: string;
  description: string;
  price: number;
  priceMax?: number;
  duration: number;
  durationMax?: number;
  category: string;
  isAvailable: boolean;
  translations?: Partial<Record<BookingLang, { name: string; description: string }>>;
}

export interface CreateAppointmentDto {
  client: string; // client ID
  employee: string; // employee ID
  services: string[]; // array of service IDs
  date: string;
  startTime: string;
  totalDuration: number;
  totalPrice: number;
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';
}

export interface CreateReviewDto {
  client: string; // client ID
  appointment: string; // appointment ID
  employee: string; // employee ID
  rating: number;
  text?: string;
}

// Salon registration (multi-tenant onboarding)
export interface RegisterSalonDto {
  salonName: string;
  slug?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  token: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'client';
}

export interface RegisterSalonResponse {
  token: string;
  salon: { id: string; name: string; slug: string };
  user: AuthUser;
}

// Staff login accounts (created by an admin from the Employees page)
export interface CreateStaffLoginDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'barber';
  employeeId?: string;
}

export interface CreateStaffLoginResponse {
  token: string;
  user: AuthUser;
}

export interface UpdateStaffLoginDto {
  role?: 'admin' | 'barber';
  password?: string;
}

export interface UpdateStaffLoginResponse {
  user: AuthUser;
}

export interface TelegramLinkCodeResponse {
  code: string;
  deepLink: string | null;
}

export interface TelegramStatusResponse {
  linked: boolean;
}

// Excel import/export
export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: ImportRowError[];
}

// Shop settings
export interface WorkingDay { isOpen: boolean; from: string; to: string; }

export interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  coverImageUrl?: string;
  logoUrl?: string;
  tagline?: string;
  accentColor?: string;
  latitude?: number | null;
  longitude?: number | null;
  websiteUrl?: string;
  workingHours: Record<string, WorkingDay>;
  // Languages offered on the public booking page (subset of BookingLang) and which one loads by default
  bookingLanguages?: string[];
  defaultBookingLanguage?: string;
  currency?: string;
  timezone?: string;
  serviceRangesEnabled?: boolean;
  durationDisplayUnit?: 'minutes' | 'hours';
  // Групувати послуги за категоріями (розкривні секції) на сторінці бронювання
  bookingGroupByCategory?: boolean;
  // Останній день онлайн-запису "YYYY-MM-DD" ('' — без обмеження)
  bookingOpenUntil?: string;
}

// Публічний підмножина ShopSettings, яку віддає /booking/settings
export interface PublicBookingSettings {
  shopName: string;
  coverImageUrl?: string;
  logoUrl?: string;
  tagline?: string;
  accentColor?: string;
  address?: string;
  phone?: string;
  workingHours?: Record<string, WorkingDay>;
  latitude?: number | null;
  longitude?: number | null;
  websiteUrl?: string;
  bookingLanguages?: string[];
  defaultBookingLanguage?: string;
  currency?: string;
  bookingGroupByCategory?: boolean;
  // Назви категорій у порядку показу (лише коли bookingGroupByCategory)
  serviceCategories?: string[];
  // { [назва категорії]: { [мова]: переклад } }
  serviceCategoryTranslations?: Record<string, Partial<Record<string, string>>>;
  // Останній день онлайн-запису "YYYY-MM-DD" ('' — без обмеження)
  bookingOpenUntil?: string;
}