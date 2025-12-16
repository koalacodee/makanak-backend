export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor(message: string = "Bad request") {
    super(message);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends BadRequestError {
  constructor(
    message: string = "Validation failed",
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
