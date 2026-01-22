/**
 * Swap Validation Schemas
 *
 * Runtime validation for swap-related operations
 */

import { z } from 'zod';
import { positiveAmountSchema } from './common.validator';

/**
 * Asset type enum (for swaps)
 */
export const swapAssetSchema = z.enum(['USDC', 'USDM', 'BCSPX', 'PAXG']);

export type SwapAsset = z.infer<typeof swapAssetSchema>;

/**
 * Get swap quote schema (query params)
 */
export const getSwapQuoteSchema = z.object({
  fromAsset: swapAssetSchema,
  toAsset: swapAssetSchema,
  amount: z
    .string()
    .transform((val) => Number(val))
    .pipe(positiveAmountSchema.max(1000000, 'Amount cannot exceed $1,000,000')),
}).refine((data) => data.fromAsset !== data.toAsset, {
  message: 'Cannot swap same asset',
  path: ['toAsset'],
});

export type GetSwapQuoteInput = z.infer<typeof getSwapQuoteSchema>;

/**
 * Execute swap schema (body)
 */
export const executeSwapSchema = z.object({
  fromAsset: swapAssetSchema,
  toAsset: swapAssetSchema,
  amount: positiveAmountSchema.max(1000000, 'Amount cannot exceed $1,000,000'),
  slippage: z
    .number()
    .min(0.1, 'Slippage must be at least 0.1%')
    .max(5, 'Slippage cannot exceed 5%')
    .optional()
    .default(1),
}).refine((data) => data.fromAsset !== data.toAsset, {
  message: 'Cannot swap same asset',
  path: ['toAsset'],
});

export type ExecuteSwapInput = z.infer<typeof executeSwapSchema>;

/**
 * Get swap status schema (params)
 */
export const getSwapStatusSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID format'),
});

export type GetSwapStatusInput = z.infer<typeof getSwapStatusSchema>;

/**
 * Get swap history schema (query params)
 */
export const getSwapHistorySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Number(val))
    .pipe(z.number().int().positive().max(100)),
});

export type GetSwapHistoryInput = z.infer<typeof getSwapHistorySchema>;

/**
 * Convert deposit schema (body)
 */
export const convertDepositSchema = z.object({
  depositSessionId: z.string().uuid('Invalid deposit session ID format'),
});

export type ConvertDepositInput = z.infer<typeof convertDepositSchema>;

/**
 * Rebalance portfolio schema (body)
 */
export const rebalancePortfolioSchema = z.object({
  force: z.boolean().optional().default(false), // Force rebalance even if drift < 5%
});

export type RebalancePortfolioInput = z.infer<typeof rebalancePortfolioSchema>;
