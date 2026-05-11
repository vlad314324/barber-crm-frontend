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
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
  specialties: string[];
  rating?: number;
  reviewCount?: number;
  joinDate?: string;
  bio?: string;
  image?: string;
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
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
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