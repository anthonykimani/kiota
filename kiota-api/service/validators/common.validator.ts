/**
 * Common Validation Schemas
 *
 * Shared validation schemas used across multiple modules
 */

import { z } from 'zod';

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email schema
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Phone number schema (International format)
 */
export const phoneNumberSchema = z
  .string()
  .regex(/^\+\d{10,15}$/, 'Phone number must be in international format (+XXX...)');

/**
 * Kenya phone number schema
 */
export const kenyaPhoneSchema = z
  .string()
  .regex(/^\+254\d{9}$/, 'Phone number must be in format +254XXXXXXXXX');

/**
 * Ethereum address schema
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
  .transform((val) => val.toLowerCase()); // Normalize to lowercase

/**
 * Transaction hash schema
 */
export const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format')
  .transform((val) => val.toLowerCase()); // Normalize to lowercase

/**
 * Positive decimal amount
 */
export const positiveAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .finite('Amount must be a finite number');

/**
 * Percentage (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage cannot exceed 100');

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .default(1),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
  }
);

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Blockchain chain enum
 */
export const chainSchema = z.enum(['base', 'ethereum', 'polygon', 'arbitrum', 'celo']);

export type Chain = z.infer<typeof chainSchema>;

/**
 * Token symbol enum
 */
export const tokenSymbolSchema = z.enum(['USDC', 'USDT', 'DAI', 'KES']);

export type TokenSymbol = z.infer<typeof tokenSymbolSchema>;

/**
 * Asset allocation schema
 */
export const allocationSchema = z.object({
  stableYields: percentageSchema.min(10, 'Minimum 10% stable yields required'),
  tokenizedGold: percentageSchema,
  defiYield: percentageSchema,
  bluechipCrypto: percentageSchema,
}).refine(
  (data) => {
    const total =
      data.stableYields +
      data.tokenizedGold +
      data.defiYield +
      data.bluechipCrypto;
    return Math.abs(total - 100) < 0.01; // Allow 0.01% rounding error
  },
  {
    message: 'Allocation percentages must add up to 100%',
  }
);

export type AllocationInput = z.infer<typeof allocationSchema>;

/**
 * Transaction type enum
 */
export const transactionTypeSchema = z.enum(['DEPOSIT', 'WITHDRAWAL', 'SWAP', 'REBALANCE']);

export type TransactionType = z.infer<typeof transactionTypeSchema>;

/**
 * Transaction status enum
 */
export const transactionStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

/**
 * Deposit session status enum
 */
export const depositSessionStatusSchema = z.enum([
  'AWAITING_TRANSFER',
  'RECEIVED',
  'CONFIRMED',
  'EXPIRED',
  'FAILED',
]);

export type DepositSessionStatus = z.infer<typeof depositSessionStatusSchema>;

/**
 * Helper: Validate and parse data
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Helper: Safe parse (doesn't throw)
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
