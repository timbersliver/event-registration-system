import axios from 'axios';
import type { IApiResponse, IPaginatedResponse, IEventReport, IOverviewReport, IRegistrationAnalytics } from '../types/api';
import type { IEventWithRegistrationCount } from '../types/event';
import type { IVerificationResponse } from '../types/registration';
import type { ILoginResponse } from '../types/auth';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API
export const eventApi = {
  getEvents: (params?: { page?: number; limit?: number; search?: string; upcoming?: boolean }) =>
    api.get<IPaginatedResponse<IEventWithRegistrationCount>>('/api/events', { params }).then((r) => r.data),

  getEvent: (eventId: number) =>
    api.get<IApiResponse<IEventWithRegistrationCount>>(`/api/events/${eventId}`).then((r) => r.data),
};

export const registrationApi = {
  sendVerificationCode: (eventId: number, email: string) =>
    api.post<IApiResponse<IVerificationResponse>>(`/api/events/${eventId}/register/send-code`, { email }).then((r) => r.data),

  verifyAndRegister: (eventId: number, email: string, code: string) =>
    api.post<IApiResponse<void>>(`/api/events/${eventId}/register/verify`, { email, code }).then((r) => r.data),
};

// Admin API
export const adminApi = {
  login: (email: string, password: string) =>
    api.post<IApiResponse<ILoginResponse>>('/admin/login/api', { email, password }).then((r) => r.data),

  getEvents: (token: string) =>
    api.get<IPaginatedResponse<IEventWithRegistrationCount>>('/admin/api/events', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  createEvent: (token: string, data: Record<string, unknown>) =>
    api.post<IApiResponse<unknown>>('/admin/api/events', data, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  updateEvent: (token: string, eventId: number, data: Record<string, unknown>) =>
    api.put<IApiResponse<unknown>>(`/admin/api/events/${eventId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  deleteEvent: (token: string, eventId: number) =>
    api.delete<IApiResponse<unknown>>(`/admin/api/events/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  getEventReport: (token: string, eventId: number) =>
    api.get<IApiResponse<IEventReport>>(`/admin/api/events/${eventId}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  getOverviewReport: (token: string) =>
    api.get<IApiResponse<IOverviewReport[]>>('/admin/api/reports/overview', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  getRegistrationAnalytics: (token: string, period: string, eventId?: number) => {
    const params: Record<string, string> = { period };
    if (eventId !== undefined) params.eventId = String(eventId);
    return api.get<IApiResponse<IRegistrationAnalytics>>('/admin/api/reports/analytics', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }).then((r) => r.data);
  },
};

export default api;
