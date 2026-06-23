export interface IRegistration {
  id: number;
  eventId: number;
  email: string;
  verificationCode: string;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegistrationWithEvent extends IRegistration {
  event: import('./event').IEvent;
}
