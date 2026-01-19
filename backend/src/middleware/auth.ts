import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, LivelloAccesso, SezioneAbilitata } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, error: 'Token di accesso richiesto' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: 'Token non valido o scaduto' });
  }
}

export function requireModifica(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Autenticazione richiesta' });
    return;
  }

  if (req.user.livello_accesso !== 'modifica') {
    res.status(403).json({
      success: false,
      error: 'Permessi insufficienti. Richiesto livello di accesso "modifica"',
    });
    return;
  }

  next();
}

export function requireSezione(sezione: SezioneAbilitata) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Autenticazione richiesta' });
      return;
    }

    if (!req.user.sezioni_abilitate.includes(sezione)) {
      res.status(403).json({
        success: false,
        error: `Accesso alla sezione "${sezione}" non autorizzato`,
      });
      return;
    }

    next();
  };
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}
