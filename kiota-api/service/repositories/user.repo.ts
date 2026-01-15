import { Repository } from "typeorm";
import dotenv from "dotenv";
import AppDataSource from "../configs/ormconfig";
import { User } from "../models/user.entity";
import { AuthMethod } from "../enums/AuthMethod";


export class UserRepository {
    private repo: Repository<User>;

    constructor() {
        this.repo = AppDataSource.getRepository(User);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // General: Save user entity
    async save(user: User): Promise<User> {
        try {
            return await this.repo.save(user);
        } catch (error) {
            throw error;
        }
    }

    // Screen 3: Sign Up / Login - check if phone exists
    async getByPhoneNumber(phoneNumber: string): Promise<User | null> {
        try {
            return await this.repo.findOne({
                where: { phoneNumber, isActive: true }
            });
        } catch (error) {
            throw error;
        }
    }

    // Screen 3: Sign Up - create new user
    async createUser(data: {
        phoneNumber: string;
        email?: string;
        googleId?: string;
    }): Promise<User> {
        try {
            const user = this.repo.create({
                phoneNumber: data.phoneNumber,
                email: data.email,
                googleId: data.googleId,
                isActive: true,
                hasCompletedOnboarding: false,
                hasCompletedQuiz: false
            });
            return await this.repo.save(user);
        } catch (error) {
            throw error;
        }
    }

    // Screen 3: Google login lookup
    async getByGoogleId(googleId: string): Promise<User | null> {
        try {
            return await this.repo.findOne({
                where: { googleId, isActive: true }
            });
        } catch (error) {
            throw error;
        }
    }

    // Screen 5: Investment Quiz - save answers
    async saveQuizAnswers(userId: string, answers: {
        primaryGoal?: string;
        investmentTimeline?: string;
        riskTolerance?: string;
        investmentExperience?: string;
        currentSavingsRange?: string;
        monthlySavingsRange?: string;
        comfortableWithDollars?: boolean;
        investmentPriorities?: string[];
    }): Promise<User | null> {
        try {
            const user = await this.repo.findOne({ where: { id: userId } });
            if (!user) return null;

            if (answers.primaryGoal !== undefined) user.primaryGoal = answers.primaryGoal;
            if (answers.investmentTimeline !== undefined) user.investmentTimeline = answers.investmentTimeline;
            if (answers.currentSavingsRange !== undefined) user.currentSavingsRange = answers.currentSavingsRange;
            if (answers.monthlySavingsRange !== undefined) user.monthlySavingsRange = answers.monthlySavingsRange;
            if (answers.comfortableWithDollars !== undefined) user.comfortableWithDollars = answers.comfortableWithDollars;
            if (answers.investmentPriorities !== undefined) user.investmentPriorities = answers.investmentPriorities;
            user.hasCompletedQuiz = true;

            return await this.repo.save(user);
        } catch (error) {
            throw error;
        }
    }

    // Screen 6 & 7: Save AI strategy recommendation
    async saveStrategy(userId: string, strategy: {
        targetStableYieldsPercent: number;
        targetTokenizedStocksPercent: number;
        targetTokenizedGoldPercent: number;
        strategyName: string;
    }): Promise<User | null> {
        try {
            const user = await this.repo.findOne({ where: { id: userId } });
            if (!user) return null;

            user.targetStableYieldsPercent = strategy.targetStableYieldsPercent;
            user.targetTokenizedStocksPercent = strategy.targetTokenizedStocksPercent;
            user.targetTokenizedGoldPercent = strategy.targetTokenizedGoldPercent;
            user.strategyName = strategy.strategyName;

            return await this.repo.save(user);
        } catch (error) {
            throw error;
        }
    }

    // Screen 8: Mark onboarding complete after wallet creation
    async completeOnboarding(userId: string): Promise<User | null> {
        try {
            const user = await this.repo.findOne({ where: { id: userId } });
            if (!user) return null;

            user.hasCompletedOnboarding = true;
            return await this.repo.save(user);
        } catch (error) {
            throw error;
        }
    }

    // Screen 9: Dashboard - get user with wallet and portfolio
    async getWithWalletAndPortfolio(userId: string): Promise<User | null> {
        try {
            return await this.repo.findOne({
                where: { id: userId, isActive: true },
                relations: ['wallet', 'portfolio']
            });
        } catch (error) {
            throw error;
        }
    }

    // General: Get user by ID
    async getById(id: string): Promise<User | null> {
        try {
            return await this.repo.findOne({
                where: { id, isActive: true }
            });
        } catch (error) {
            throw error;
        }
    }

    async getByPrivyUserId(privyUserId: string): Promise<User | null> {
        return await this.repo.findOne({
            where: { privyUserId, isActive: true }
        });
    }

    async createFromPrivy(data: {
        privyUserId: string;
        phoneNumber?: string;
        email?: string;
        primaryAuthMethod: AuthMethod;
    }): Promise<User> {
        const user = this.repo.create({
            privyUserId: data.privyUserId,
            phoneNumber: data.phoneNumber,
            email: data.email,
            primaryAuthMethod: data.primaryAuthMethod,
            isActive: true,
            hasCompletedOnboarding: false,
            hasCompletedQuiz: false
        });

        return await this.repo.save(user);
    }

    async linkPrivyAccount(userId: string, privyUserId: string): Promise<User | null> {
        const user = await this.getById(userId);
        if (!user) return null;

        user.privyUserId = privyUserId;
        return await this.repo.save(user);
    }
}