export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  email: string;
}

export interface IAuthState {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
}
