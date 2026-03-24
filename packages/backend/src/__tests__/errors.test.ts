import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  BusinessRuleError,
} from '../lib/errors';

describe('AppError', () => {
  it('sets message, statusCode, and code', () => {
    const err = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.name).toBe('AppError');
  });

  it('supports optional details', () => {
    const details = [{ campo: 'email', messaggio: 'Email non valida' }];
    const err = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
    expect(err.details).toEqual(details);
  });

  it('is an instance of Error', () => {
    const err = new AppError('test', 400, 'BUSINESS_RULE');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('NotFoundError', () => {
  it('sets 404 status and NOT_FOUND code', () => {
    const err = new NotFoundError('Cliente');
    expect(err.message).toBe('Cliente non trovato');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('is an instance of AppError', () => {
    const err = new NotFoundError('Utente');
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('sets 400 status and VALIDATION_ERROR code', () => {
    const err = new ValidationError('Dati non validi');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('passes through details', () => {
    const details = [{ campo: 'nome', messaggio: 'Obbligatorio' }];
    const err = new ValidationError('Invalid', details);
    expect(err.details).toEqual(details);
  });
});

describe('ForbiddenError', () => {
  it('sets 403 status with default message', () => {
    const err = new ForbiddenError();
    expect(err.message).toBe('Operazione non consentita');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('accepts custom message', () => {
    const err = new ForbiddenError('Accesso negato');
    expect(err.message).toBe('Accesso negato');
  });
});

describe('BusinessRuleError', () => {
  it('sets 400 status and BUSINESS_RULE code', () => {
    const err = new BusinessRuleError('Impossibile modificare in stato finale');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BUSINESS_RULE');
    expect(err.message).toBe('Impossibile modificare in stato finale');
  });
});
