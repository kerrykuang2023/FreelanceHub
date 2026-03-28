import { StatusCodes } from "http-status-codes";
import { ApiError } from "./ApiError";

export class NotFoundError extends ApiError {
  constructor(message: string, errors?: string[]) {
    super(StatusCodes.NOT_FOUND, message, errors);
  }
}