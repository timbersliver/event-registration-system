export interface IEvent {
  id: number;
  name: string;
  description: string;
  dateTime: Date;
  address: string;
  registrationDeadline: Date;
  handler: string;
  capacity: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface IEventWithRegistrationCount extends IEvent {
  registrationCount: number;
}
