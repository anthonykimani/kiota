import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload, AuthenticatedRequest } from "../interfaces/IAuth";

const JWT_SECRET = process.env.JWT_SECRET || 'kiota-development-secret-change-in-production';

/**
 * Authentication middleware using proper JWT tokens
 * 
 * Security improvements:
 * - Uses JWT with HMAC-SHA256 signing instead of base64 encoding
 * - Validates token signature to prevent tampering
 * - Properly handles token expiration
 */
export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      status: 401,
      message: "Unauthorized",
      data: null,
      errors: ["Authorization header required"],
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!payload?.userId) {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized",
        data: null,
        errors: ["Invalid token payload"],
      });
    }

    // Attach to request using proper typing
    (req as AuthenticatedRequest).userId = payload.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized",
        data: null,
        errors: ["Token expired"],
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized",
        data: null,
        errors: ["Invalid token"],
      });
    }

    return res.status(401).json({
      status: 401,
      message: "Unauthorized",
      data: null,
      errors: ["Token verification failed"],
    });
  }
}

/**
 * Admin authentication middleware for Bull Board
 * Requires admin credentials or special admin token
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  // Check for admin API key in production
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    // In development, allow access with warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('WARNING: Bull Board accessible without auth in development mode');
      return next();
    }
    return res.status(500).json({
      status: 500,
      message: "Server configuration error",
      data: null,
      errors: ["ADMIN_API_KEY not configured"],
    });
  }

  if (adminKey !== expectedKey) {
    return res.status(403).json({
      status: 403,
      message: "Forbidden",
      data: null,
      errors: ["Invalid admin credentials"],
    });
  }

  next();
}

/**
 * Generate JWT token for user
 * @param userId User's internal ID
 * @returns JWT token string
 */
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
