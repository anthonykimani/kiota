import { Repository } from "typeorm";
import dotenv from "dotenv";
import { ExchangeRate, MarketData } from "../models/market-data.entity";
import AppDataSource from "../configs/ormconfig";
import { AssetSymbol } from "../enums/MarketData";


export class MarketDataRepository {
    private marketRepo: Repository<MarketData>;
    private exchangeRepo: Repository<ExchangeRate>;

    constructor() {
        this.marketRepo = AppDataSource.getRepository(MarketData);
        this.exchangeRepo = AppDataSource.getRepository(ExchangeRate);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // Screen 9, 10, 11: Get latest KES/USD rate
    async getKesUsdRate(): Promise<number> {
        try {
            const rate = await this.exchangeRepo.findOne({
                where: { baseCurrency: 'KES', quoteCurrency: 'USD' },
                order: { timestamp: 'DESC' }
            });

            return rate ? Number(rate.rate) : 130; // Default fallback
        } catch (error) {
            throw error;
        }
    }

    // Background job: Update KES/USD rate
    async updateKesUsdRate(rate: number, source?: string): Promise<ExchangeRate> {
        try {
            const exchangeRate = this.exchangeRepo.create({
                baseCurrency: 'KES',
                quoteCurrency: 'USD',
                rate,
                source: source || 'api',
                timestamp: new Date()
            });

            return await this.exchangeRepo.save(exchangeRate);
        } catch (error) {
            throw error;
        }
    }

    // Screen 11, 12: Get asset price
    async getAssetPrice(symbol: AssetSymbol | string): Promise<number | null> {
        try {
            const normalizedSymbol = symbol.toString().toLowerCase() as AssetSymbol;
            const data = await this.marketRepo.findOne({
                where: { symbol: normalizedSymbol },
                order: { timestamp: 'DESC' }
            });

            return data ? Number(data.price) : null;
        } catch (error) {
            throw error;
        }
    }

    // Screen 12: Get asset details
    async getAssetData(symbol: AssetSymbol | string): Promise<MarketData | null> {
        try {
            const normalizedSymbol = symbol.toString().toLowerCase() as AssetSymbol;
            return await this.marketRepo.findOne({
                where: { symbol: normalizedSymbol },
                order: { timestamp: 'DESC' }
            });
        } catch (error) {
            throw error;
        }
    }

    // Background job: Update asset price
    async updateAssetPrice(data: {
        symbol: AssetSymbol;
        price: number;
        change24h?: number;
        changePercent24h?: number;
        currentApy?: number;
        source?: string;
    }): Promise<MarketData> {
        try {
            const marketData = this.marketRepo.create({
                symbol: data.symbol,
                price: data.price,
                change24h: data.change24h,
                changePercent24h: data.changePercent24h,
                currentApy: data.currentApy,
                source: data.source || 'api',
                timestamp: new Date()
            });

            return await this.marketRepo.save(marketData);
        } catch (error) {
            throw error;
        }
    }
}
