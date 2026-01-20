'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyProviders({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID??""
    const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID??""

    return (
        <PrivyProvider
            appId={appId}
            config={{
                // Create embedded wallets for users who don't have a wallet
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets'
                    }
                }
            }}
        >
            {children}
        </PrivyProvider>
    );
}