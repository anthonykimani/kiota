'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { AuthProvider } from '@/context/auth-context';

export default function Providers({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""
    const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? ""

    return (
        <PrivyProvider
            appId={appId}
            clientId={clientId}
            config={{
                // Create embedded wallets for users who don't have a wallet
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets'
                    }
                },
                appearance: {
                    theme: 'dark',
                    accentColor: '#7A5AF8',
                },
                loginMethods: ['sms', 'email', 'wallet'],
            }}
        >
            <AuthProvider>
                {children}
            </AuthProvider>
        </PrivyProvider>
    );
}