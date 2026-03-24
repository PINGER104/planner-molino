import type { ApiErrorCode } from '@planner-molino/shared';

/**
 * Base error class for all application errors.
 * Thrown by controllers and caught by the centralized Express error handler.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} non trovato`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Operazione non consentita') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BUSINESS_RULE');
  }
}
