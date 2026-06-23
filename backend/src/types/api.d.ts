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

export interface IVerificationCodeResponse {
  sent: boolean;
  expiresIn: string;
}
