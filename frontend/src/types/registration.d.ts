export interface IRegistration {
  id: number;
  eventId: number;
  email: string;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IVerificationResponse {
  sent: boolean;
  expiresIn: string;
  previewUrl?: string;
}
