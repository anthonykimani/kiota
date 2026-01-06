/**
 * Mock User Data
 */

import {
  User,
  InvestmentExperience,
  RiskTolerance,
  MembershipTier,
  KYCStatus,
  InvestmentStrategy,
} from '@/types/models/user';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'sarah.kamau@example.com',
    phone: '+254712345678',
    name: 'Sarah Kamau',
    profilePhoto: null,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e8A3f29D123',
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2026-01-05'),

    monthlyIncome: 120000, // KES
    currentSavings: 2885, // USD
    investmentExperience: InvestmentExperience.KNOW_BASICS,
    riskTolerance: RiskTolerance.SOMEWHAT_CONSERVATIVE,

    investmentStrategy: {
      name: 'Conservative Grower',
      allocation: {
        USDM: 80,
        bCSPX: 15,
        PAXG: 5,
      },
      expectedReturn: 6.25,
      riskLevel: 'low-medium',
      createdAt: new Date('2025-10-15'),
      updatedAt: new Date('2025-10-15'),
    },

    level: 2,
    points: 840,
    badges: ['first_100', 'streak_30', 'foundation_graduate'],
    streak: 43,
    lastActivityDate: new Date('2026-01-05'),

    membershipTier: MembershipTier.FREE,
    kycStatus: KYCStatus.NOT_STARTED,
    kycCompletedAt: null,

    preferredCurrency: 'KES',
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
  },
  {
    id: 'user-2',
    email: 'john.mwangi@example.com',
    phone: '+254723456789',
    name: 'John Mwangi',
    profilePhoto: null,
    walletAddress: '0x8b3e9C1f2A4D5E6F7890abcdef123456789ABCDE',
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2026-01-05'),

    monthlyIncome: 85000,
    currentSavings: 1450,
    investmentExperience: InvestmentExperience.SOMEWHAT_EXPERIENCED,
    riskTolerance: RiskTolerance.MODERATE,

    investmentStrategy: {
      name: 'Balanced Growth',
      allocation: {
        USDM: 70,
        bCSPX: 20,
        PAXG: 10,
      },
      expectedReturn: 6.75,
      riskLevel: 'medium',
      createdAt: new Date('2025-11-01'),
      updatedAt: new Date('2025-11-01'),
    },

    level: 2,
    points: 980,
    badges: ['first_100', 'first_1000'],
    streak: 38,
    lastActivityDate: new Date('2026-01-04'),

    membershipTier: MembershipTier.PREMIUM,
    kycStatus: KYCStatus.APPROVED,
    kycCompletedAt: new Date('2025-11-15'),

    preferredCurrency: 'USD',
    notificationsEnabled: true,
    emailNotificationsEnabled: false,
  },
];

export const mockCurrentUser = mockUsers[0];

export function getMockUser(id: string): User | null {
  return mockUsers.find((u) => u.id === id) || null;
}

export function getMockUserByWallet(address: string): User | null {
  return mockUsers.find((u) => u.walletAddress === address) || null;
}
