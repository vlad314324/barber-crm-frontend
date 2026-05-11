import axios from 'axios';
import type {
  Client, Employee, Service, Appointment, Review,
  CreateClientDto, CreateEmployeeDto, CreateServiceDto,
  CreateAppointmentDto, CreateReviewDto
} from './types';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client API functions
export const clientApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/clients');
    return response.data;
  },
  
  getById: async (id: string): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  
  create: async (clientData: CreateClientDto): Promise<Client> => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },
  
  update: async (id: string, clientData: Partial<CreateClientDto>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  }
};

// Employee API functions
export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    const response = await api.get('/employees');
    return response.data;
  },
  
  getById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  
  create: async (employeeData: CreateEmployeeDto): Promise<Employee> => {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },
  
  update: async (id: string, employeeData: Partial<CreateEmployeeDto>): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  }
};

// Appointment API functions
export const appointmentApi = {
  getAll: async (): Promise<Appointment[]> => {
    const response = await api.get('/appointments');
    return response.data;
  },
  
  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  
  create: async (appointmentData: CreateAppointmentDto): Promise<Appointment> => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  
  update: async (id: string, appointmentData: Partial<CreateAppointmentDto>): Promise<Appointment> => {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  }
};

// Service API functions
export const serviceApi = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get('/services');
    return response.data;
  },
  
  getById: async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
  
  create: async (serviceData: CreateServiceDto): Promise<Service> => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },
  
  update: async (id: string, serviceData: Partial<CreateServiceDto>): Promise<Service> => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  }
};

// Review API functions
export const reviewApi = {
  getAll: async (): Promise<Review[]> => {
    const response = await api.get('/reviews');
    return response.data;
  },
  
  getById: async (id: string): Promise<Review> => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },
  
  create: async (reviewData: CreateReviewDto): Promise<Review> => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },
  
  update: async (id: string, reviewData: Partial<CreateReviewDto>): Promise<Review> => {
    const response = await api.put(`/reviews/${id}`, reviewData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  }
};

export default api;