import { Elysia, type HTTPHeaders, type StatusMap } from "elysia";
import type { ElysiaCookie } from "elysia/cookies";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

// Export error definitions for use in app
export const errorDefinitions = {
  NOTFOUND: NotFoundError,
  BADREQUEST: BadRequestError,
  UNAUTHORIZED: UnauthorizedError,
  VALIDATION_ERROR: ValidationError,
  FORBIDDEN: ForbiddenError,
  TOO_MANY_REQUESTS: TooManyRequestsError,
};

// Export the onError handler function to be used at root level
export const onErrorHandler = ({
  error,
  set,
  code,
}: {
  error: unknown;
  set: {
    headers: HTTPHeaders;
    status?: number | keyof StatusMap;
    redirect?: string;
    cookie?: Record<string, ElysiaCookie>;
  } & {
    headers: HTTPHeaders;
    status?: number | keyof StatusMap;
    redirect?: string;
    cookie?: Record<string, ElysiaCookie>;
  };
  code?:
    | number
    | "NOTFOUND"
    | "BADREQUEST"
    | "UNAUTHORIZED"
    | "VALIDATION_ERROR"
    | "FORBIDDEN"
    | "TOO_MANY_REQUESTS"
    | "VALIDATION"
    | "UNKNOWN"
    | "NOT_FOUND"
    | "PARSE"
    | "INTERNAL_SERVER_ERROR"
    | "INVALID_COOKIE_SIGNATURE"
    | "INVALID_FILE_TYPE";
}) => {
  // Handle custom errors (4xx)
  if (
    error instanceof NotFoundError ||
    error instanceof BadRequestError ||
    error instanceof UnauthorizedError ||
    error instanceof ValidationError ||
    error instanceof ForbiddenError ||
    error instanceof TooManyRequestsError ||
    code === "VALIDATION"
  ) {
    return error;
  }
  console.error(error);

  // Handle 500 errors
  set.status = 500;
  return Response.json({
    error: "Internal Server Error",
    status: 500,
  });
};

// Plugin for error definitions (can be used in plugins)
export const errorHandler = new Elysia({ name: "errorHandler" }).error(
  errorDefinitions
);
