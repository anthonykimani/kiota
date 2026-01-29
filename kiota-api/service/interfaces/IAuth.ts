import { Request } from 'express';

/**
 * JWT Token Payload
 */
export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Authenticated Request - extends Express Request with userId
 */
export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Token Configuration
 */
export interface TokenConfig {
  secret: string;
  expiresIn: string;
}
