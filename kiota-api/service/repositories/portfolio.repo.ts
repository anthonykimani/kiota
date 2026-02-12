import { Repository } from "typeorm";
import dotenv from "dotenv";
import { Portfolio } from "../models/portfolio.entity";
import AppDataSource from "../configs/ormconfig";


export class PortfolioRepository {
    private repo: Repository<Portfolio>;

    constructor() {
        this.repo = AppDataSource.getRepository(Portfolio);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // Create portfolio after wallet creation
    async createPortfolio(userId: string): Promise<Portfolio> {
        try {
            const portfolio = this.repo.create({
                userId,
                totalValueUsd: 0,
                totalValueKes: 0,
                stableYieldsValueUsd: 0,
                tokenizedGoldValueUsd: 0,
                defiYieldValueUsd: 0,
                bluechipCryptoValueUsd: 0,
                stableYieldsPercent: 0,
                tokenizedGoldPercent: 0,
                defiYieldPercent: 0,
                bluechipCryptoPercent: 0,
                totalDeposited: 0,
                totalWithdrawn: 0,
                totalGainsUsd: 0,
                allTimeReturnPercent: 0
            });

            return await this.repo.save(portfolio);
        } catch (error) {
            throw error;
        }
    }

    // Screen 9: Get portfolio for dashboard
    async getByUserId(userId: string): Promise<Portfolio | null> {
        try {
            return await this.repo.findOne({
                where: { userId }
            });
        } catch (error) {
            throw error;
        }
    }

    // Update portfolio values after deposit/swap
    async updateValues(userId: string, values: {
        stableYieldsValueUsd: number;
        tokenizedGoldValueUsd: number;
        defiYieldValueUsd: number;
        bluechipCryptoValueUsd: number;
        kesUsdRate: number;
    }): Promise<Portfolio | null> {
        try {
            const portfolio = await this.getByUserId(userId);
            if (!portfolio) return null;

            const totalUsd =
                values.stableYieldsValueUsd +
                values.tokenizedGoldValueUsd +
                values.defiYieldValueUsd +
                values.bluechipCryptoValueUsd;

            portfolio.stableYieldsValueUsd = values.stableYieldsValueUsd;
            portfolio.tokenizedGoldValueUsd = values.tokenizedGoldValueUsd;
            portfolio.defiYieldValueUsd = values.defiYieldValueUsd;
            portfolio.bluechipCryptoValueUsd = values.bluechipCryptoValueUsd;
            portfolio.totalValueUsd = totalUsd;
            portfolio.totalValueKes = totalUsd * values.kesUsdRate;

            // Calculate percentages
            if (totalUsd > 0) {
                portfolio.stableYieldsPercent = (values.stableYieldsValueUsd / totalUsd) * 100;
                portfolio.tokenizedGoldPercent = (values.tokenizedGoldValueUsd / totalUsd) * 100;
                portfolio.defiYieldPercent = (values.defiYieldValueUsd / totalUsd) * 100;
                portfolio.bluechipCryptoPercent = (values.bluechipCryptoValueUsd / totalUsd) * 100;
            }

            return await this.repo.save(portfolio);
        } catch (error) {
            throw error;
        }
    }

    // Increment portfolio values (for deposits)
    async incrementValues(userId: string, values: {
        stableYieldsValueUsd: number;
        tokenizedGoldValueUsd: number;
        defiYieldValueUsd: number;
        bluechipCryptoValueUsd: number;
        kesUsdRate: number;
    }): Promise<Portfolio | null> {
        try {
            const portfolio = await this.getByUserId(userId);
            if (!portfolio) return null;

            const nextStable = Number(portfolio.stableYieldsValueUsd) + values.stableYieldsValueUsd;
            const nextGold = Number(portfolio.tokenizedGoldValueUsd) + values.tokenizedGoldValueUsd;
            const nextDefiYield = Number(portfolio.defiYieldValueUsd) + values.defiYieldValueUsd;
            const nextCrypto = Number(portfolio.bluechipCryptoValueUsd) + values.bluechipCryptoValueUsd;
            const totalUsd = nextStable + nextGold + nextDefiYield + nextCrypto;

            portfolio.stableYieldsValueUsd = nextStable;
            portfolio.tokenizedGoldValueUsd = nextGold;
            portfolio.defiYieldValueUsd = nextDefiYield;
            portfolio.bluechipCryptoValueUsd = nextCrypto;
            portfolio.totalValueUsd = totalUsd;
            portfolio.totalValueKes = totalUsd * values.kesUsdRate;

            if (totalUsd > 0) {
                portfolio.stableYieldsPercent = (nextStable / totalUsd) * 100;
                portfolio.tokenizedGoldPercent = (nextGold / totalUsd) * 100;
                portfolio.defiYieldPercent = (nextDefiYield / totalUsd) * 100;
                portfolio.bluechipCryptoPercent = (nextCrypto / totalUsd) * 100;
            }

            return await this.repo.save(portfolio);
        } catch (error) {
            throw error;
        }
    }

    // Screen 10e: Record deposit amount
    async recordDeposit(userId: string, amountUsd: number): Promise<Portfolio | null> {
        try {
            const portfolio = await this.getByUserId(userId);
            if (!portfolio) return null;

            portfolio.totalDeposited = Number(portfolio.totalDeposited) + amountUsd;

            return await this.repo.save(portfolio);
        } catch (error) {
            throw error;
        }
    }

    // Screen 11: Calculate returns for portfolio detail
    async calculateReturns(userId: string): Promise<Portfolio | null> {
        try {
            const portfolio = await this.getByUserId(userId);
            if (!portfolio) return null;

            const netInvested = Number(portfolio.totalDeposited) - Number(portfolio.totalWithdrawn);
            const currentValue = Number(portfolio.totalValueUsd);

            portfolio.totalGainsUsd = currentValue - netInvested;
            portfolio.allTimeReturnPercent = netInvested > 0 
                ? (portfolio.totalGainsUsd / netInvested) * 100 
                : 0;

            return await this.repo.save(portfolio);
        } catch (error) {
            throw error;
        }
    }
}
