/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA configuration will be added later
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Base blockchain RPC endpoints (will use environment variables)
  env: {
    NEXT_PUBLIC_BASE_CHAIN_ID: '8453', // Base mainnet
    NEXT_PUBLIC_BASE_RPC_URL: 'https://mainnet.base.org',
  },
}

module.exports = nextConfig
