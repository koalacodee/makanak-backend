export class NotFoundError extends Error {
  status = 404;

  constructor(protected details: Array<{ path: string; message: string }>) {
    super("Resource not found");
    this.name = "NotFoundError";
  }

  toResponse() {
    return {
      error: "Not Found",
      status: this.status,
      details: this.details,
    };
  }
}

export class BadRequestError extends Error {
  status = 400;

  constructor(protected details: Array<{ path: string; message: string }>) {
    super("Bad request");
    this.name = "BadRequestError";
  }

  toResponse() {
    return {
      error: "Bad Request",
      status: this.status,
      details: this.details,
    };
  }
}

export class UnauthorizedError extends Error {
  status = 401;

  constructor(protected details: Array<{ path: string; message: string }>) {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }

  toResponse() {
    return {
      error: "Unauthorized",
      status: this.status,
      details: this.details,
    };
  }
}

export class ValidationError extends BadRequestError {
  status = 400;

  constructor(details: Array<{ path: string; message: string }>) {
    super(details);
    this.name = "ValidationError";
  }

  toResponse() {
    return {
      error: "Bad Request",
      status: this.status,
      details: this.details,
    };
  }
}
