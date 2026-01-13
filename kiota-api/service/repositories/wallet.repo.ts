import { Repository } from "typeorm";
import dotenv from "dotenv";
import { Wallet, WalletChain, WalletProvider } from "../models/wallet.entity";
import AppDataSource from "../configs/ormconfig";

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
                usdmBalance: 0,
                bcspxBalance: 0,
                paxgBalance: 0,
                ethBalance: 0
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
        usdmBalance?: number;
        bcspxBalance?: number;
        paxgBalance?: number;
        ethBalance?: number;
    }): Promise<Wallet | null> {
        try {
            const wallet = await this.getByUserId(userId);
            if (!wallet) return null;

            if (balances.usdcBalance !== undefined) wallet.usdcBalance = balances.usdcBalance;
            if (balances.usdmBalance !== undefined) wallet.usdmBalance = balances.usdmBalance;
            if (balances.bcspxBalance !== undefined) wallet.bcspxBalance = balances.bcspxBalance;
            if (balances.paxgBalance !== undefined) wallet.paxgBalance = balances.paxgBalance;
            if (balances.ethBalance !== undefined) wallet.ethBalance = balances.ethBalance;
            wallet.balancesLastUpdated = new Date();

            return await this.repo.save(wallet);
        } catch (error) {
            throw error;
        }
    }
}