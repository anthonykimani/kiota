import { Repository } from 'typeorm';
import AppDataSource from '../configs/ormconfig';
import { PortfolioHolding } from '../models/portfolio-holding.entity';

export class PortfolioHoldingRepository {
  private repo: Repository<PortfolioHolding>;

  constructor() {
    this.repo = AppDataSource.getRepository(PortfolioHolding);
  }

  async getByPortfolioAndSymbol(portfolioId: string, symbol: string): Promise<PortfolioHolding | null> {
    return this.repo.findOne({ where: { portfolioId, assetSymbol: symbol } });
  }

  async getByPortfolio(portfolioId: string): Promise<PortfolioHolding[]> {
    return this.repo.find({ where: { portfolioId }, order: { valueUsd: 'DESC' } });
  }

  async upsert(params: {
    portfolioId: string;
    assetSymbol: string;
    assetCategory: string | null;
    balanceDelta: number;
    valueDelta: number;
  }): Promise<PortfolioHolding> {
    const existing = await this.getByPortfolioAndSymbol(params.portfolioId, params.assetSymbol);
    const updated = existing
      ? Object.assign(existing, {
          assetCategory: params.assetCategory ?? existing.assetCategory,
          balance: Number(existing.balance) + params.balanceDelta,
          valueUsd: Number(existing.valueUsd) + params.valueDelta,
          lastUpdated: new Date(),
        })
      : this.repo.create({
          portfolioId: params.portfolioId,
          assetSymbol: params.assetSymbol,
          assetCategory: params.assetCategory ?? 'unknown',
          balance: params.balanceDelta,
          valueUsd: params.valueDelta,
          costBasisUsd: 0,
          lastUpdated: new Date(),
        });

    return this.repo.save(updated);
  }
}
