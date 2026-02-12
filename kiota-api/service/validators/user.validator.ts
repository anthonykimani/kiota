/**
 * User Validation Schemas
 *
 * Runtime validation for user-related operations
 */

import { z } from 'zod';
import { emailSchema, phoneNumberSchema, uuidSchema, allocationSchema } from './common.validator';

/**
 * Create user schema
 */
export const createUserSchema = z.object({
  phoneNumber: phoneNumberSchema.optional(),
  email: emailSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  targetStableYieldsPercent: z.number().min(0).max(100).default(80),
  targetTokenizedGoldPercent: z.number().min(0).max(100).default(5),
  targetBluechipCryptoPercent: z.number().min(0).max(100).default(15),
}).refine(
  (data) => data.phoneNumber || data.email,
  {
    message: 'Either phone number or email must be provided',
  }
).refine(
  (data) => {
    const total =
      data.targetStableYieldsPercent +
      data.targetTokenizedGoldPercent +
      data.targetBluechipCryptoPercent;
    return Math.abs(total - 100) < 0.01;
  },
  {
    message: 'Target allocation percentages must add up to 100%',
  }
);

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  targetStableYieldsPercent: z.number().min(0).max(100).optional(),
  targetTokenizedGoldPercent: z.number().min(0).max(100).optional(),
  targetBluechipCryptoPercent: z.number().min(0).max(100).optional(),
}).refine(
  (data) => {
    // Only validate if all allocation fields are provided
    const allocationFields = [
      data.targetStableYieldsPercent,
      data.targetTokenizedGoldPercent,
      data.targetBluechipCryptoPercent,
    ];

    const allProvided = allocationFields.every((field) => field !== undefined);
    if (!allProvided) return true;

    const total = allocationFields.reduce((sum, val) => sum + (val || 0), 0);
    return Math.abs(total - 100) < 0.01;
  },
  {
    message: 'If updating allocation, all percentages must add up to 100%',
  }
);

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Update user allocation schema
 */
export const updateUserAllocationSchema = allocationSchema.extend({
  userId: uuidSchema.optional(), // Optional because it comes from auth context
});

export type UpdateUserAllocationInput = z.infer<typeof updateUserAllocationSchema>;

/**
 * Complete onboarding schema
 */
export const completeOnboardingSchema = z.object({
  hasCompletedQuiz: z.boolean().default(true),
  targetAllocation: allocationSchema,
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

/**
 * User profile response schema (for validation of API responses)
 */
export const userProfileSchema = z.object({
  id: uuidSchema,
  phoneNumber: phoneNumberSchema.nullable(),
  email: emailSchema.nullable(),
  firstName: z.string(),
  lastName: z.string(),
  primaryAuthMethod: z.enum(['PHONE', 'EMAIL', 'GOOGLE', 'WALLET']),
  targetStableYieldsPercent: z.number(),
  targetTokenizedGoldPercent: z.number(),
  targetBluechipCryptoPercent: z.number(),
  firstDepositSubsidyUsed: z.boolean(),
  hasCompletedOnboarding: z.boolean(),
  hasCompletedQuiz: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
