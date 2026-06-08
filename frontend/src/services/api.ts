import axios from 'axios';
import type { User, Resident, Household, Certificate, Blotter, Business, Appointment, Notification, Payment, DashboardStats, PublicCertificateResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Token from LocalStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bmis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  auth: {
    login: (data: any) => client.post<{ token: string; user: User }>('/auth/login', data).then(r => r.data),
    register: (data: any) => client.post('/auth/register', data).then(r => r.data),
    verifyOtp: (data: any) => client.post('/auth/verify-otp', data).then(r => r.data),
    getMe: () => client.get<User>('/auth/me').then(r => r.data),
    forgotPassword: (data: { email: string }) => client.post<{ message: string; otp?: string }>('/auth/forgot-password', data).then(r => r.data),
    resetPassword: (data: any) => client.post<{ message: string }>('/auth/reset-password', data).then(r => r.data),
  },
  residents: {
    list: (params?: any) => client.get<{ data: Resident[]; total: number; page: number; limit: number }>('/residents', { params }).then(r => r.data),
    get: (id: string) => client.get<Resident>(`/residents/${id}`).then(r => r.data),
    create: (data: Partial<Resident>) => client.post<Resident>('/residents', data).then(r => r.data),
    update: (id: string, data: Partial<Resident>) => client.put<Resident>(`/residents/${id}`, data).then(r => r.data),
    delete: (id: string) => client.delete(`/residents/${id}`).then(r => r.data),
    uploadPhoto: (formData: FormData) => client.post<{ photo_url: string }>('/residents/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
  },
  households: {
    list: (params?: any) => client.get<Household[]>('/households', { params }).then(r => r.data),
    get: (id: string) => client.get<Household>(`/households/${id}`).then(r => r.data),
    create: (data: Partial<Household>) => client.post<Household>('/households', data).then(r => r.data),
    update: (id: string, data: Partial<Household>) => client.put<Household>(`/households/${id}`, data).then(r => r.data),
    delete: (id: string) => client.delete(`/households/${id}`).then(r => r.data),
    assignMember: (data: { household_id: string; resident_id: string; is_head: boolean }) => client.post('/households/assign-member', data).then(r => r.data),
  },
  certificates: {
    list: (params?: any) => client.get<Certificate[]>('/certificates', { params }).then(r => r.data),
    request: (data: { resident_id: string; type: string; purpose: string; fee?: number }) => client.post<Certificate>('/certificates', data).then(r => r.data),
    publicRequest: (data: { first_name: string; last_name: string; type: string; purpose: string; fee?: number }) => client.post<PublicCertificateResponse>('/public/certificates/request', data).then(r => r.data),
    get: (id: string) => client.get<Certificate>(`/certificates/${id}`).then(r => r.data),
    approve: (id: string) => client.post<Certificate>(`/certificates/${id}/approve`).then(r => r.data),
    reject: (id: string) => client.post<Certificate>(`/certificates/${id}/reject`).then(r => r.data),
    verifyQR: (hash: string) => client.get<{ valid: boolean; message: string; document?: string; type?: string; recipient?: string; issued_on?: string; purpose?: string }>(`/verify/document/${hash}`).then(r => r.data),
  },
  blotters: {
    list: (params?: any) => client.get<Blotter[]>('/blotters', { params }).then(r => r.data),
    get: (id: string) => client.get<Blotter>(`/blotters/${id}`).then(r => r.data),
    create: (data: Partial<Blotter>) => client.post<Blotter>('/blotters', data).then(r => r.data),
    update: (id: string, data: Partial<Blotter>) => client.put<Blotter>(`/blotters/${id}`, data).then(r => r.data),
    delete: (id: string) => client.delete(`/blotters/${id}`).then(r => r.data),
    summarize: (id: string) => client.post<{ summary: string }>(`/blotters/${id}/summarize`).then(r => r.data),
  },
  businesses: {
    list: (params?: any) => client.get<Business[]>('/businesses', { params }).then(r => r.data),
    get: (id: string) => client.get<Business>(`/businesses/${id}`).then(r => r.data),
    create: (data: Partial<Business>) => client.post<Business>('/businesses', data).then(r => r.data),
    update: (id: string, data: Partial<Business>) => client.put<Business>(`/businesses/${id}`, data).then(r => r.data),
    delete: (id: string) => client.delete(`/businesses/${id}`).then(r => r.data),
  },
  appointments: {
    list: (params?: any) => client.get<Appointment[]>('/appointments', { params }).then(r => r.data),
    book: (data: { resident_id: string; purpose: string; appointment_date: string; time_slot: string }) => client.post<Appointment>('/appointments', data).then(r => r.data),
    updateStatus: (id: string, status: string) => client.put<Appointment>(`/appointments/${id}/status`, { status }).then(r => r.data),
    getCongestion: () => client.get<{ date: string; bookings_count: number; congestion_risk: string }[]>('/appointments/congestion').then(r => r.data),
  },
  notifications: {
    list: () => client.get<Notification[]>('/notifications').then(r => r.data),
    read: (id: string) => client.patch(`/notifications/${id}/read`).then(r => r.data),
    broadcastAnnouncement: (data: { title: string; content: string; type?: string }) => client.post<Notification>('/announcements', data).then(r => r.data),
  },
  payments: {
    list: (params?: any) => client.get<Payment[]>('/payments', { params }).then(r => r.data),
    get: (id: string) => client.get<Payment>(`/payments/${id}`).then(r => r.data),
  },
  analytics: {
    dashboard: () => client.get<DashboardStats>('/analytics/dashboard').then(r => r.data),
  },
  ai: {
    chat: (prompt: string) => client.post<{ response: string }>('/ai/chat', { prompt }).then(r => r.data),
  }
};
export default client;
