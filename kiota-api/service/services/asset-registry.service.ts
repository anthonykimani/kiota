import { AssetClassRepository } from '../repositories/asset-class.repo';
import { AssetRepository } from '../repositories/asset.repo';
import { Asset } from '../models/asset.entity';
import { getTokenAddress, TOKEN_METADATA } from '../configs/tokens.config';

export type AssetClassKey =
  | 'stable_yields'
  | 'tokenized_stocks'
  | 'tokenized_gold'
  | 'blue_chip_crypto'
  | 'cash';

export class AssetRegistryService {
  private assetClassRepo = new AssetClassRepository();
  private assetRepo = new AssetRepository();

  async getAssetBySymbol(symbol: string): Promise<Asset | null> {
    return this.assetRepo.getBySymbol(symbol.toUpperCase());
  }

  async getPrimaryAssetByClassKey(classKey: AssetClassKey): Promise<Asset | null> {
    const assetClass = await this.assetClassRepo.getByKey(classKey);
    if (!assetClass) {
      return null;
    }

    return this.assetRepo.getPrimaryForClass(assetClass.id);
  }

  async getAssetClassKeyBySymbol(symbol: string): Promise<string | null> {
    const asset = await this.getAssetBySymbol(symbol);
    return asset?.assetClass?.key ?? null;
  }

  async resolveAssetAddress(asset: Asset, network: string): Promise<string> {
    if (asset.metadata?.addresses?.[network]) {
      return asset.metadata.addresses[network];
    }

    if (asset.address) {
      return asset.address;
    }

    if ((asset.symbol as keyof typeof TOKEN_METADATA) in TOKEN_METADATA) {
      return getTokenAddress(asset.symbol as keyof typeof TOKEN_METADATA, network);
    }

    throw new Error(`Missing address for asset ${asset.symbol} on ${network}`);
  }

  resolveAssetDecimals(asset: Asset): number {
    if (asset.decimals) {
      return asset.decimals;
    }

    if ((asset.symbol as keyof typeof TOKEN_METADATA) in TOKEN_METADATA) {
      return TOKEN_METADATA[asset.symbol as keyof typeof TOKEN_METADATA].decimals;
    }

    return 18;
  }
}

export const assetRegistry = new AssetRegistryService();
