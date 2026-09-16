export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}
export class UnauthorizedError extends HttpError{
  constructor(message="You are not Authorized"){
    super(401,message)
  }
}
export class ForbiddenError extends HttpError{
  constructor(message="Forbidden"){
    super(403,message)
  }
}
export class ConflictError extends HttpError{
  constructor(message="Conflict"){
    super(409,message)
  }
}
export class UnprocessableEntityError extends HttpError{
  constructor(message="Unprocessable Entity"){
    super(422,message)
  }
}
