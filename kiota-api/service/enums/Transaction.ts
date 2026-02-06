
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  SWAP = 'swap',
  REBALANCE = 'rebalance',
  YIELD = 'yield',
  FEE = 'fee',
  SUBSIDY = 'subsidy',
  REBATE = 'rebate',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  CARD = 'card',
  CRYPTO = 'crypto',
  INTERNAL = 'internal',
}

export enum AssetType {
  KES = 'kes',
  USDC = 'usdc',
  USDT = 'usdt',
  USDE = 'usde',
  PYUSD = 'pyusd',
  USDM = 'usdm',
  PAXG = 'paxg',
  XAUT = 'xaut',
  BTC = 'btc',
  ETH = 'eth',
  WBTC = 'wbtc',
  WETH = 'weth',
}
