export class BackendHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendHttpError";
    this.status = status;
  }
}

export function mapUnhandledErrorStatus(error: unknown): number {
  if (error instanceof BackendHttpError) {
    return error.status;
  }

  return 500;
}
