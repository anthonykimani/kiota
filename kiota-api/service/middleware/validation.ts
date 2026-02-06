import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Create validation middleware from Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 400,
          message: 'Validation Error',
          data: null,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      return res.status(400).json({
        status: 400,
        message: 'Validation Error',
        data: null,
        errors: ['Invalid request body']
      });
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 400,
          message: 'Validation Error',
          data: null,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      return res.status(400).json({
        status: 400,
        message: 'Validation Error',
        data: null,
        errors: ['Invalid query parameters']
      });
    }
  };
}

// ========================================
// Common Validation Schemas
// ========================================

/**
 * Deposit initiation schema
 */
export const depositInitiateSchema = z.object({
  amountKes: z.number()
    .min(100, 'Minimum deposit is KES 100')
    .max(1000000, 'Maximum deposit is KES 1,000,000'),
  mpesaPhoneNumber: z.string()
    .regex(/^\+254\d{9}$/, 'Invalid M-Pesa phone number format. Use +254XXXXXXXXX'),
  customAllocation: z.object({
    stableYields: z.number().min(10).max(100),
    tokenizedGold: z.number().min(0).max(100),
    defiYield: z.number().min(0).max(100),
    bluechipCrypto: z.number().min(0).max(100)
  }).optional().refine(
    (data) => {
      if (!data) return true;
      return Math.abs(data.stableYields + data.tokenizedGold + data.defiYield + data.bluechipCrypto - 100) < 0.01;
    },
    { message: 'Allocation must add up to 100%' }
  )
});

/**
 * Quiz submission schema
 */
export const quizSubmitSchema = z.object({
  answers: z.object({
    age: z.string().optional(),
    timeline: z.string().optional(),
    emergencyFund: z.string().optional(),
    marketDrop: z.string().optional(),
    volatility: z.string().optional(),
    cryptoComfort: z.string().optional(),
  }).optional(),
  // Also support flat structure for backwards compatibility
  age: z.string().optional(),
  timeline: z.string().optional(),
  emergencyFund: z.string().optional(),
  marketDrop: z.string().optional(),
  volatility: z.string().optional(),
  cryptoComfort: z.string().optional(),
}).refine(
  (data) => {
    // Either answers object or flat fields must have required values
    const hasAnswers =
      data.answers?.age &&
      data.answers?.timeline &&
      data.answers?.emergencyFund &&
      data.answers?.marketDrop &&
      data.answers?.volatility &&
      data.answers?.cryptoComfort;
    const hasFlat =
      data.age &&
      data.timeline &&
      data.emergencyFund &&
      data.marketDrop &&
      data.volatility &&
      data.cryptoComfort;
    return hasAnswers || hasFlat;
  },
  { message: 'All quiz answers are required' }
);

/**
 * Strategy acceptance schema
 */
export const acceptStrategySchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  accepted: z.boolean(),
  customAllocation: z.object({
    stableYields: z.number().min(10).max(100),
    tokenizedGold: z.number().min(0).max(100),
    defiYield: z.number().min(0).max(100),
    bluechipCrypto: z.number().min(0).max(100)
  }).optional().refine(
    (data) => {
      if (!data) return true;
      return Math.abs(data.stableYields + data.tokenizedGold + data.defiYield + data.bluechipCrypto - 100) < 0.01;
    },
    { message: 'Allocation must add up to 100%' }
  )
});

/**
 * Swap quote schema
 */
export const swapQuoteSchema = z.object({
  fromAsset: z.string().min(2).max(20),
  toAsset: z.string().min(2).max(20),
  amount: z.number().positive('Amount must be positive'),
  slippage: z.number().min(0.1).max(5.0).optional()
});

/**
 * Swap execution schema
 */
export const swapExecuteSchema = z.object({
  fromAsset: z.string().min(2).max(20),
  toAsset: z.string().min(2).max(20),
  amount: z.number().positive('Amount must be positive'),
  slippage: z.number().min(0.1).max(5.0).optional(),
  minReturn: z.number().positive().optional()
});

/**
 * Privy sync schema
 */
export const privySyncSchema = z.object({
  idToken: z.string().min(1, 'Identity token is required')
});

/**
 * Deposit intent schema
 */
export const depositIntentSchema = z.object({
  expectedAmount: z.number().positive().optional(),
  token: z.string().optional().default('USDC'),
  chain: z.string().optional().default('base')
});

/**
 * Confirm deposit schema
 */
export const confirmDepositSchema = z.object({
  depositSessionId: z.string().uuid('Invalid deposit session ID')
});
