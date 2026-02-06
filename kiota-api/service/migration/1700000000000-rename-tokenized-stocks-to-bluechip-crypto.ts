import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RenameTokenizedStocksToBluechipCrypto1700000000000 implements MigrationInterface {
  name = 'RenameTokenizedStocksToBluechipCrypto1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users: rename target allocation column
    const hasTargetStocks = await queryRunner.hasColumn('users', 'targetTokenizedStocksPercent');
    if (hasTargetStocks) {
      await queryRunner.renameColumn(
        'users',
        'targetTokenizedStocksPercent',
        'targetBluechipCryptoPercent'
      );
    }

    // Users: add riskScore if missing
    const hasRiskScore = await queryRunner.hasColumn('users', 'riskScore');
    if (!hasRiskScore) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'riskScore',
          type: 'int',
          isNullable: true,
        })
      );
    }

    // Wallets: rename balance column
    const hasStocksBalance = await queryRunner.hasColumn('wallets', 'tokenizedStocksBalance');
    if (hasStocksBalance) {
      await queryRunner.renameColumn(
        'wallets',
        'tokenizedStocksBalance',
        'bluechipCryptoBalance'
      );
    }

    // Portfolios: rename value + percent columns
    const hasStocksValue = await queryRunner.hasColumn('portfolios', 'tokenizedStocksValueUsd');
    if (hasStocksValue) {
      await queryRunner.renameColumn(
        'portfolios',
        'tokenizedStocksValueUsd',
        'bluechipCryptoValueUsd'
      );
    }
    const hasStocksPercent = await queryRunner.hasColumn('portfolios', 'tokenizedStocksPercent');
    if (hasStocksPercent) {
      await queryRunner.renameColumn(
        'portfolios',
        'tokenizedStocksPercent',
        'bluechipCryptoPercent'
      );
    }

    // Portfolio snapshots: rename tokenized stocks value
    const hasTokenizedStocksSnapshot = await queryRunner.hasColumn(
      'portfolio_snapshots',
      'tokenizedStocksValueUsd'
    );
    if (hasTokenizedStocksSnapshot) {
      await queryRunner.renameColumn(
        'portfolio_snapshots',
        'tokenizedStocksValueUsd',
        'bluechipCryptoValueUsd'
      );
    }

    // If legacy column with different casing exists, drop it to avoid duplicates
    const hasBlueChipCryptoSnapshot = await queryRunner.hasColumn(
      'portfolio_snapshots',
      'blueChipCryptoValueUsd'
    );
    if (hasBlueChipCryptoSnapshot) {
      await queryRunner.dropColumn('portfolio_snapshots', 'blueChipCryptoValueUsd');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert portfolio snapshot changes
    const hasBluechipSnapshot = await queryRunner.hasColumn(
      'portfolio_snapshots',
      'bluechipCryptoValueUsd'
    );
    if (hasBluechipSnapshot) {
      await queryRunner.renameColumn(
        'portfolio_snapshots',
        'bluechipCryptoValueUsd',
        'tokenizedStocksValueUsd'
      );
    }

    // Revert portfolios
    const hasCryptoValue = await queryRunner.hasColumn('portfolios', 'bluechipCryptoValueUsd');
    if (hasCryptoValue) {
      await queryRunner.renameColumn(
        'portfolios',
        'bluechipCryptoValueUsd',
        'tokenizedStocksValueUsd'
      );
    }
    const hasCryptoPercent = await queryRunner.hasColumn('portfolios', 'bluechipCryptoPercent');
    if (hasCryptoPercent) {
      await queryRunner.renameColumn(
        'portfolios',
        'bluechipCryptoPercent',
        'tokenizedStocksPercent'
      );
    }

    // Revert wallets
    const hasCryptoBalance = await queryRunner.hasColumn('wallets', 'bluechipCryptoBalance');
    if (hasCryptoBalance) {
      await queryRunner.renameColumn(
        'wallets',
        'bluechipCryptoBalance',
        'tokenizedStocksBalance'
      );
    }

    // Revert users
    const hasTargetCrypto = await queryRunner.hasColumn('users', 'targetBluechipCryptoPercent');
    if (hasTargetCrypto) {
      await queryRunner.renameColumn(
        'users',
        'targetBluechipCryptoPercent',
        'targetTokenizedStocksPercent'
      );
    }

    const hasRiskScore = await queryRunner.hasColumn('users', 'riskScore');
    if (hasRiskScore) {
      await queryRunner.dropColumn('users', 'riskScore');
    }
  }
}
