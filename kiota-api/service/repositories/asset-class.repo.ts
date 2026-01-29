import { Repository } from 'typeorm';
import AppDataSource from '../configs/ormconfig';
import { AssetClass } from '../models/asset-class.entity';

export class AssetClassRepository {
  private repo: Repository<AssetClass>;

  constructor() {
    this.repo = AppDataSource.getRepository(AssetClass);
  }

  async getByKey(key: string): Promise<AssetClass | null> {
    return this.repo.findOne({ where: { key } });
  }

  async getAllActive(): Promise<AssetClass[]> {
    return this.repo.find({ where: { isActive: true }, order: { displayOrder: 'ASC' } });
  }

  async upsert(data: Partial<AssetClass> & { key: string; name: string }): Promise<AssetClass> {
    const existing = await this.getByKey(data.key);
    const entity = existing ? Object.assign(existing, data) : this.repo.create(data);
    return this.repo.save(entity);
  }
}
