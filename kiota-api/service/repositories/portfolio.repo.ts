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

    // Screen 8: Create portfolio after wallet creation
    async createPortfolio(userId: string): Promise<Portfolio> {
        try {
            const portfolio = this.repo.create({
                userId,
                totalValueUsd: 0,
                totalValueKes: 0,
                usdmValueUsd: 0,
                bcspxValueUsd: 0,
                paxgValueUsd: 0,
                usdmPercent: 0,
                bcspxPercent: 0,
                paxgPercent: 0,
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

    // Screen 10e & 11: Update portfolio values after deposit
    async updateValues(userId: string, values: {
        usdmValueUsd: number;
        bcspxValueUsd: number;
        paxgValueUsd: number;
        kesUsdRate: number;
    }): Promise<Portfolio | null> {
        try {
            const portfolio = await this.getByUserId(userId);
            if (!portfolio) return null;

            const totalUsd = values.usdmValueUsd + values.bcspxValueUsd + values.paxgValueUsd;

            portfolio.usdmValueUsd = values.usdmValueUsd;
            portfolio.bcspxValueUsd = values.bcspxValueUsd;
            portfolio.paxgValueUsd = values.paxgValueUsd;
            portfolio.totalValueUsd = totalUsd;
            portfolio.totalValueKes = totalUsd * values.kesUsdRate;

            // Calculate percentages
            if (totalUsd > 0) {
                portfolio.usdmPercent = (values.usdmValueUsd / totalUsd) * 100;
                portfolio.bcspxPercent = (values.bcspxValueUsd / totalUsd) * 100;
                portfolio.paxgPercent = (values.paxgValueUsd / totalUsd) * 100;
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