import { PrivyClient } from '@privy-io/node';
import { AuthMethod } from '../../enums/AuthMethod';

export class PrivyService {
    private client: PrivyClient;

    constructor() {
        if (!process.env.PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
            throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET must be set');
        }

        this.client = new PrivyClient({
            appId: process.env.PRIVY_APP_ID,
            appSecret: process.env.PRIVY_APP_SECRET
        });
    }

    async verifyAccessToken(accessToken: string) {
        try {
            const verifiedClaims = await this.client.utils().auth().verifyAccessToken(accessToken);
            return { success: true, claims: verifiedClaims };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Invalid access token'
            };
        }
    }

    async getUserByIdToken(idToken: string) {
        try {
            const user = await this.client.users().get({ id_token: idToken });
            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get user'
            };
        }
    }

    async createWalletForUser(userId: string, chainType: 'ethereum' | 'solana' = 'ethereum') {
        try {
            const wallet = await this.client.wallets().create({
                chain_type: chainType,
                owner: { user_id: userId }
            });
            return {
                success: true,
                wallet: { id: wallet.id, address: wallet.address, chainType: wallet.chain_type }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create wallet'
            };
        }
    }

    async getWallet(walletId: string) {
        try {
            const wallet = await this.client.wallets().get(walletId);
            return { success: true, wallet };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get wallet'
            };
        }
    }

    async signMessage(walletId: string, message: string) {
        try {
            const response = await this.client.wallets().ethereum().signMessage(walletId, { message });
            return { success: true, signature: response.signature };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign message'
            };
        }
    }

    async sendTransaction(walletId: string, tx: { to: string; value?: string; data?: string; chainId: number; }) {
        try {
            const response = await this.client.wallets().ethereum().sendTransaction(walletId, {
                caip2: `eip155:${tx.chainId}`,
                params: {
                    transaction: {
                        to: tx.to,
                        value: tx.value || '0x0',
                        data: tx.data,
                        chain_id: tx.chainId
                    }
                }
            });
            return { success: true, hash: response.hash };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send transaction'
            };
        }
    }

    async signTransaction(walletId: string, tx: { to: string; value?: string; data?: string; chainId: number; }) {
        try {
            const response = await this.client.wallets().ethereum().signTransaction(walletId, {
                params: {
                    transaction: {
                        to: tx.to,
                        value: tx.value || '0x0',
                        data: tx.data,
                        chain_id: tx.chainId
                    }
                }
            });
            return { success: true, signedTransaction: response.signed_transaction };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign transaction'
            };
        }
    }

    extractPrimaryAuth(privyUser: any): { method: AuthMethod; phoneNumber?: string; email?: string; } {
        const phoneAccount = privyUser.linked_accounts.find((acc: any) => acc.type === 'phone');
        if (phoneAccount) return { method: AuthMethod.PHONE, phoneNumber: phoneAccount.number };

        const emailAccount = privyUser.linked_accounts.find((acc: any) => acc.type === 'email');
        if (emailAccount) return { method: AuthMethod.EMAIL, email: emailAccount.address };

        return { method: AuthMethod.WALLET };
    }

    extractWallet(privyUser: any): { id: string; address: string; chainType: string; } | null {
        const wallet = privyUser.linked_accounts.find((acc: any) => acc.type === 'wallet');
        if (!wallet) return null;
        
        return {
            id: wallet.wallet_index?.toString() || wallet.address,
            address: wallet.address,
            chainType: wallet.chain_type || 'ethereum'
        };
    }

    async createUserWithPhone(phoneNumber: string) {
        try {
            const user = await this.client.users().create({
                linked_accounts: [{ type: 'phone', number: phoneNumber }]
            });
            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create user'
            };
        }
    }

    async createUserWithEmail(email: string) {
        try {
            const user = await this.client.users().create({
                linked_accounts: [{ type: 'email', address: email }]
            });
            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create user'
            };
        }
    }

    async createUserAndWallet(phoneNumber: string, chainType: 'ethereum' | 'solana' = 'ethereum') {
        try {
            // Step 1: Create user
            const user = await this.client.users().create({
                linked_accounts: [{ type: 'phone', number: phoneNumber }]
            });
            
            // Step 2: Create wallet for user
            const wallet = await this.client.wallets().create({
                chain_type: chainType,
                owner: { user_id: user.id }
            });
            
            return { 
                success: true, 
                user, 
                wallet: {
                    id: wallet.id,
                    address: wallet.address,
                    chainType: wallet.chain_type
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    }
}

export const privyService = new PrivyService();