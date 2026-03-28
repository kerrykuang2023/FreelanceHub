import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface IUser {
  _id: string;
  id: string;
  email: string;
  user_type?: string;
  role?: string;
  user_type_id?: string;
}

export type IAuthRequest = Request;
