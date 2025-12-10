import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  User,
  SoftwareAsset,
  Department,
  Notification,
  ImportJob,
  DashboardSummary,
  PaginatedResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Software Assets APIs
export const softwareAssetApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<SoftwareAsset>>('/software-assets', { params }),
  getById: (id: string) => api.get<SoftwareAsset>(`/software-assets/${id}`),
  create: (data: Partial<SoftwareAsset>) => api.post<SoftwareAsset>('/software-assets', data),
  update: (id: string, data: Partial<SoftwareAsset>) =>
    api.put<SoftwareAsset>(`/software-assets/${id}`, data),
  delete: (id: string) => api.delete(`/software-assets/${id}`),
  completeRenewal: (id: string, data: { newExpireDate: string; cost?: number; note?: string }) =>
    api.post(`/software-assets/${id}/complete-renewal`, data),
  sendReminder: (id: string) => api.post(`/software-assets/${id}/send-reminder`),
};

// Department APIs
export const departmentApi = {
  getAll: () => api.get<Department[]>('/departments'),
  getById: (id: string) => api.get<Department>(`/departments/${id}`),
  create: (data: Partial<Department>) => api.post<Department>('/departments', data),
  update: (id: string, data: Partial<Department>) => api.put<Department>(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

// User APIs
export const userApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<User>>('/users', { params }),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User> & { password: string }) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User> & { password?: string }) =>
    api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Upload/Import APIs
export const uploadApi = {
  downloadTemplate: () =>
    api.get('/upload/template', {
      responseType: 'blob',
    }),
  uploadExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getJobs: (params?: any) => api.get<PaginatedResponse<ImportJob>>('/upload/jobs', { params }),
  getJob: (id: string) => api.get<ImportJob>(`/upload/jobs/${id}`),
  exportExcel: (params?: any) =>
    api.get('/upload/export', {
      params,
      responseType: 'blob',
    }),
};

// Dashboard APIs
export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary'),
  getExpiring: (params?: { days?: number }) =>
    api.get<SoftwareAsset[]>('/dashboard/expiring', { params }),
};

// Notification APIs
export const notificationApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<Notification>>('/notifications', { params }),
  resend: (id: string) => api.post(`/notifications/${id}/resend`),
};

export default api;
