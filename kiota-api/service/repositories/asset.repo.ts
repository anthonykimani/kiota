import { Repository } from 'typeorm';
import AppDataSource from '../configs/ormconfig';
import { Asset } from '../models/asset.entity';

export class AssetRepository {
  private repo: Repository<Asset>;

  constructor() {
    this.repo = AppDataSource.getRepository(Asset);
  }

  async getBySymbol(symbol: string): Promise<Asset | null> {
    return this.repo.findOne({ where: { symbol }, relations: { assetClass: true } });
  }

  async getPrimaryForClass(assetClassId: string): Promise<Asset | null> {
    return this.repo.findOne({ where: { assetClassId, isPrimary: true, isActive: true } });
  }

  async getByClass(assetClassId: string): Promise<Asset[]> {
    return this.repo.find({ where: { assetClassId, isActive: true }, order: { symbol: 'ASC' } });
  }

  async upsert(data: Partial<Asset> & { symbol: string; name: string; assetClassId: string }): Promise<Asset> {
    const existing = await this.getBySymbol(data.symbol);
    const entity = existing ? Object.assign(existing, data) : this.repo.create(data);
    return this.repo.save(entity);
  }
}
