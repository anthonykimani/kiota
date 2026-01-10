export enum OTPPurpose {
  REGISTRATION = 'registration',
  LOGIN = 'login',
  TRANSACTION = 'transaction',
  PASSWORD_RESET = 'password_reset',
  WITHDRAWAL = 'withdrawal',
}

export enum OTPStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  FAILED = 'failed',
}