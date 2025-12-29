export class NotFoundError extends Error {
  status = 404

  constructor(public details: Array<{ path: string; message: string }>) {
    super('Resource not found')
    this.name = 'NotFoundError'
  }

  toResponse() {
    return Response.json(
      {
        error: 'Not Found',
        status: this.status,
        details: this.details,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: this.status,
      },
    )
  }
}

export class BadRequestError extends Error {
  status = 400

  constructor(public details: Array<{ path: string; message: string }>) {
    super('Bad request')
    this.name = 'BadRequestError'
  }

  toResponse() {
    return Response.json(
      {
        error: 'Bad Request',
        status: this.status,
        details: this.details,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: this.status,
      },
    )
  }
}

export class UnauthorizedError extends Error {
  status = 401

  constructor(protected details: Array<{ path: string; message: string }>) {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }

  toResponse() {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        status: this.status,
        details: this.details,
      }),
      {
        status: this.status,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

export class ValidationError extends BadRequestError {
  status = 400

  constructor(details: Array<{ path: string; message: string }>) {
    super(details)
    this.name = 'ValidationError'
  }

  toResponse() {
    return Response.json({
      error: 'Bad Request',
      status: this.status,
      details: this.details,
    })
  }
}

export class ForbiddenError extends Error {
  status = 403

  constructor(protected details: Array<{ path: string; message: string }>) {
    super('Forbidden')
    this.name = 'ForbiddenError'
  }

  toResponse() {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        status: this.status,
        details: this.details,
      }),
      {
        status: this.status,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}

export class TooManyRequestsError extends Error {
  status = 429

  constructor(protected details: Array<{ path: string; message: string }>) {
    super('Too many requests')
    this.name = 'TooManyRequestsError'
  }

  toResponse() {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        status: this.status,
        details: this.details,
      }),
      {
        status: this.status,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
