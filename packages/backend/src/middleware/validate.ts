import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic middleware that validates req.body against a zod schema.
 * Returns 400 with formatted zod errors on failure.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: 'Dati non validi',
          details: err.errors.map(e => ({
            campo: e.path.join('.'),
            messaggio: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
