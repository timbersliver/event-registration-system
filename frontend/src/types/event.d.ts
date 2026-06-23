export interface IEvent {
  id: number;
  name: string;
  description: string;
  dateTime: string;
  address: string;
  registrationDeadline: string;
  handler: string;
  capacity: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IEventWithRegistrationCount extends IEvent {
  registrationCount: number;
}

export interface ICreateEventInput {
  name: string;
  description: string;
  dateTime: string;
  address: string;
  registrationDeadline: string;
  handler: string;
  capacity: number;
}

export interface IUpdateEventInput extends Partial<ICreateEventInput> {}
