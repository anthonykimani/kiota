/**
 * Deposit Validation Schemas
 *
 * Runtime validation using Zod for deposit-related endpoints
 */

import { z } from 'zod';

/**
 * Phone number validation (Kenya format)
 */
export const kenyaPhoneNumberSchema = z
  .string()
  .regex(/^\+254\d{9}$/, 'Phone number must be in format +254XXXXXXXXX');

/**
 * Ethereum address validation
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

/**
 * Transaction hash validation
 */
export const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format');

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Positive number validation
 */
export const positiveNumberSchema = z
  .number()
  .positive('Amount must be positive');

/**
 * Allocation schema (must add up to 100%)
 */
export const allocationSchema = z.object({
  stableYields: z.number().min(0).max(100),
  tokenizedStocks: z.number().min(0).max(100),
  tokenizedGold: z.number().min(0).max(100),
  blueChipCrypto: z.number().min(0).max(100).optional().default(0),
}).refine(
  (data) => {
    const total = data.stableYields + data.tokenizedStocks + data.tokenizedGold + (data.blueChipCrypto || 0);
    return Math.abs(total - 100) < 0.01; // Allow 0.01% rounding error
  },
  {
    message: 'Allocation percentages must add up to 100%',
  }
);

/**
 * M-Pesa deposit initiation
 */
export const initiateMpesaDepositSchema = z.object({
  amountKes: z
    .number()
    .min(100, 'Minimum deposit is KES 100')
    .max(1000000, 'Maximum deposit is KES 1,000,000'),
  mpesaPhoneNumber: kenyaPhoneNumberSchema,
  customAllocation: allocationSchema.optional(),
});

export type InitiateMpesaDepositInput = z.infer<typeof initiateMpesaDepositSchema>;

/**
 * M-Pesa STK push trigger
 */
export const triggerMpesaPushSchema = z.object({
  transactionId: uuidSchema,
});

export type TriggerMpesaPushInput = z.infer<typeof triggerMpesaPushSchema>;

/**
 * M-Pesa callback validation
 */
export const mpesaCallbackSchema = z.object({
  CheckoutRequestID: z.string().min(1),
  ResultCode: z.number(),
  ResultDesc: z.string(),
  CallbackMetadata: z.object({
    MpesaReceiptNumber: z.string().optional(),
    Amount: z.number().optional(),
    TransactionDate: z.number().optional(),
    PhoneNumber: z.string().optional(),
  }).optional(),
});

export type MpesaCallbackInput = z.infer<typeof mpesaCallbackSchema>;

/**
 * Onchain deposit intent creation
 */
export const createDepositIntentSchema = z.object({
  expectedAmount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000, 'Maximum deposit is 1,000,000 USDC')
    .optional(),
  token: z
    .string()
    .toUpperCase()
    .refine((val) => val === 'USDC', {
      message: 'Only USDC is supported in MVP',
    })
    .optional()
    .default('USDC'),
  chain: z
    .string()
    .toLowerCase()
    .refine((val) => val === 'base', {
      message: 'Only Base chain is supported in MVP',
    })
    .optional()
    .default('base'),
});

export type CreateDepositIntentInput = z.infer<typeof createDepositIntentSchema>;

/**
 * Confirm deposit (onchain)
 */
export const confirmDepositSchema = z.object({
  depositSessionId: uuidSchema,
});

export type ConfirmDepositInput = z.infer<typeof confirmDepositSchema>;

/**
 * Complete deposit (called by worker)
 */
export const completeDepositSchema = z.object({
  transactionId: uuidSchema,
  txHash: txHashSchema,
  blockchainData: z.object({
    chain: z.string().min(1),
    blockNumber: z.number().positive().optional(),
  }).optional(),
});

export type CompleteDepositInput = z.infer<typeof completeDepositSchema>;

/**
 * Transaction status check
 */
export const transactionStatusSchema = z.object({
  transactionId: uuidSchema,
});

export type TransactionStatusInput = z.infer<typeof transactionStatusSchema>;

/**
 * Helper: Validate request body
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Express middleware: Validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validateRequestBody(schema, req.body);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        errors: result.errors,
      });
    }

    // Attach validated data to request
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Express middleware: Validate query params
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validateRequestBody(schema, req.query);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        errors: result.errors,
      });
    }

    // Attach validated data to request
    req.validatedQuery = result.data;
    next();
  };
}

/**
 * Express middleware: Validate route params
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validateRequestBody(schema, req.params);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        errors: result.errors,
      });
    }

    // Attach validated data to request
    req.validatedParams = result.data;
    next();
  };
}
