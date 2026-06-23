export interface IAdminUser {
  email: string;
  password: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  email: string;
}

export interface IJwtPayload {
  email: string;
  iat?: number;
  exp?: number;
}
