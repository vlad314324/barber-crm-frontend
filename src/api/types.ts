// types.ts
// Client types
export interface Client {
  _id: string;
  name: string;
  phone: string;
  email: string;
  // Додаємо нові поля, які використовуються на фронтенді:
  image?: string; // Зробимо необов'язковим, якщо зображення не завжди є
  visits?: number; // Зробимо необов'язковим, якщо це розрахункове поле або ще не реалізовано на бекенді
  lastVisit?: string; // Зробимо необов'язковим, якщо ще не реалізовано на бекенді
  createdAt?: string;
}

export interface Employee {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: 'Barber' | 'Receptionist' | 'Manager';
  hourlyRate: number;
  isAvailable: boolean;
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
  rating?: number;
  reviewCount?: number;
  joinDate?: string;
  bio?: string;
  image?: string;
  userId?: string | null;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: 'Haircut' | 'Beard Trim' | 'Shave' | 'Hair Wash' | 'Styling' | 'Other';
  isAvailable: boolean;
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
  comment?: string;
  date: string;
}

// Request DTOs (Data Transfer Objects)
export interface CreateClientDto {
  name: string;
  phone: string;
  email: string;
}

export interface CreateEmployeeDto {
  name: string;
  phone: string;
  email: string;
  role: 'Barber' | 'Receptionist' | 'Manager';
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
}

export interface CreateServiceDto {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'Haircut' | 'Beard Trim' | 'Shave' | 'Hair Wash' | 'Styling' | 'Other';
  isAvailable: boolean;
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
  comment?: string;
}

// Salon registration (multi-tenant onboarding)
export interface RegisterSalonDto {
  salonName: string;
  slug?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
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

// Shop settings
export interface WorkingDay { isOpen: boolean; from: string; to: string; }

export interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  workingHours: Record<string, WorkingDay>;
}