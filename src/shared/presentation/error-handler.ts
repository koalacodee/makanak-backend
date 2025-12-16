import { Elysia } from "elysia";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

export const errorHandler = new Elysia({ name: "errorHandler" }).onError(
  ({ code, error, set }) => {
    // Handle custom application errors
    if (error instanceof NotFoundError) {
      set.status = 404;
      return {
        error: "Not Found",
        message: error.message,
      };
    }

    if (error instanceof BadRequestError || error instanceof ValidationError) {
      set.status = 400;
      return {
        error: "Bad Request",
        message: error.message,
        ...(error instanceof ValidationError && error.details
          ? { details: error.details }
          : {}),
      };
    }

    if (error instanceof UnauthorizedError) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: error.message,
      };
    }

    // Handle Elysia validation errors
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Bad Request",
        message: "Validation failed",
        details: error,
      };
    }

    // Handle unknown errors
    console.error("Unhandled error:", error);
    set.status = 500;
    return {
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "An unexpected error occurred",
    };
  }
);
