import { DEFAULT_ASSET_CLASSES, DEFAULT_ASSETS } from '../configs/assets.config';
import { AssetClassRepository } from '../repositories/asset-class.repo';
import { AssetRepository } from '../repositories/asset.repo';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('asset-bootstrap');

export async function bootstrapAssets(): Promise<void> {
  const assetClassRepo = new AssetClassRepository();
  const assetRepo = new AssetRepository();

  const classIdByKey: Record<string, string> = {};

  for (const assetClass of DEFAULT_ASSET_CLASSES) {
    const saved = await assetClassRepo.upsert({
      key: assetClass.key,
      name: assetClass.name,
      description: assetClass.description,
      displayOrder: assetClass.displayOrder,
      isActive: true,
    });

    classIdByKey[assetClass.key] = saved.id;
  }

  for (const asset of DEFAULT_ASSETS) {
    const assetClassId = classIdByKey[asset.classKey];
    if (!assetClassId) {
      continue;
    }

    await assetRepo.upsert({
      symbol: asset.symbol,
      name: asset.name,
      assetClassId,
      decimals: asset.decimals,
      isPrimary: asset.isPrimary,
      isActive: true,
    });
  }

  const legacyBcspx = await assetRepo.getBySymbol('BCSPX');
  if (legacyBcspx) {
    await assetRepo.upsert({
      symbol: legacyBcspx.symbol,
      name: legacyBcspx.name,
      assetClassId: legacyBcspx.assetClassId,
      decimals: legacyBcspx.decimals,
      isPrimary: false,
      isActive: false,
    });
  }

  logger.info('Asset bootstrap complete', {
    classes: DEFAULT_ASSET_CLASSES.length,
    assets: DEFAULT_ASSETS.length,
  });
}
