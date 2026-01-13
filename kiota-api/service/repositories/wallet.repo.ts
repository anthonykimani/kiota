import { Repository } from "typeorm";
import dotenv from "dotenv";
import { Wallet } from "../models/wallet.entity";
import AppDataSource from "../configs/ormconfig";
import { WalletChain, WalletProvider } from "../enums/Wallet";

export class WalletRepository {
    private repo: Repository<Wallet>;

    constructor() {
        this.repo = AppDataSource.getRepository(Wallet);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // Screen 8: Create wallet after strategy selection
    async createWallet(data: {
        userId: string;
        address: string;
        privyUserId?: string;
    }): Promise<Wallet> {
        try {
            const wallet = this.repo.create({
                userId: data.userId,
                address: data.address.toLowerCase(),
                provider: WalletProvider.PRIVY,
                primaryChain: WalletChain.BASE,
                privyUserId: data.privyUserId,
                isActive: true,
                usdcBalance: 0,
                stableYieldBalance: 0,
                tokenizedStocksBalance: 0,
                tokenizedGoldBalance: 0,
                gasBalance: 0
            });

            return await this.repo.save(wallet);
        } catch (error) {
            throw error;
        }
    }

    // Screen 8: Check if wallet already exists for user
    async getByUserId(userId: string): Promise<Wallet | null> {
        try {
            return await this.repo.findOne({
                where: { userId, isActive: true }
            });
        } catch (error) {
            throw error;
        }
    }

    // Screen 9: Get wallet for dashboard display
    async getByAddress(address: string): Promise<Wallet | null> {
        try {
            return await this.repo.findOne({
                where: { address: address.toLowerCase(), isActive: true }
            });
        } catch (error) {
            throw error;
        }
    }

    // Screen 10e: Update balances after deposit
    async updateBalances(userId: string, balances: {
        usdcBalance?: number;
        stableYieldBalance?: number;
        tokenizedStocksBalance?: number;
        tokenizedGoldBalance?: number;
        gasBalance?: number;
    }): Promise<Wallet | null> {
        try {
            const wallet = await this.getByUserId(userId);
            if (!wallet) return null;

            if (balances.usdcBalance !== undefined) wallet.usdcBalance = balances.usdcBalance;
            if (balances.stableYieldBalance !== undefined) wallet.stableYieldBalance = balances.stableYieldBalance;
            if (balances.tokenizedStocksBalance !== undefined) wallet.tokenizedStocksBalance = balances.tokenizedStocksBalance;
            if (balances.tokenizedGoldBalance !== undefined) wallet.tokenizedGoldBalance = balances.tokenizedGoldBalance;
            if (balances.gasBalance !== undefined) wallet.gasBalance = balances.gasBalance;
            wallet.balancesLastUpdated = new Date();

            return await this.repo.save(wallet);
        } catch (error) {
            throw error;
        }
    }
}