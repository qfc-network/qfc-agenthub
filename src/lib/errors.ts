export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(msg: string): AppError {
  return new AppError(msg, 404);
}

export function badRequest(msg: string): AppError {
  return new AppError(msg, 400);
}

export function conflict(msg: string): AppError {
  return new AppError(msg, 409);
}
