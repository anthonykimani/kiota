
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
  USDM = 'usdm',
  BCSPX = 'bcspx',
  PAXG = 'paxg',
  BTC = 'btc',
  ETH = 'eth',
}
