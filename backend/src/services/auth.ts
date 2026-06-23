import jwt from 'jsonwebtoken';
import type { IAdminUser, IJwtPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = '24h';

// Hardcoded mock admin user
const MOCK_ADMIN: IAdminUser = {
  email: 'admin@erm.com',
  password: '12345678',
};

export function validateAdminCredentials(email: string, password: string): boolean {
  return email === MOCK_ADMIN.email && password === MOCK_ADMIN.password;
}

export function generateToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): IJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as IJwtPayload;
  } catch {
    return null;
  }
}

export function getAdminEmail(): string {
  return MOCK_ADMIN.email;
}
