export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface IEventReport {
  event: import('./event').IEvent;
  totalRegistrations: number;
  verifiedRegistrations: number;
  pendingRegistrations: number;
  capacityUtilization: number;
}

export interface IOverviewReport {
  id: number;
  name: string;
  dateTime: string;
  handler: string;
  capacity: number;
  verifiedRegistrations: number;
  pendingRegistrations: number;
  totalRegistrations: number;
  capacityUtilization: number;
}
