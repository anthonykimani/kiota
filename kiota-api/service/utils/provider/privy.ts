import { PrivyClient } from '@privy-io/node';
import * as crypto from 'crypto';
import { AuthMethod } from '../../enums/AuthMethod';

/**
 * Parse the PRIVY_AUTH_KEY env var to extract the raw base64 PKCS8 private key.
 * The key format is "wallet-auth:<base64-pkcs8-key>"
 */
function getAuthorizationPrivateKey(): string | null {
    const raw = process.env.PRIVY_AUTH_KEY;
    if (!raw) return null;
    // Strip the "wallet-auth:" prefix if present
    return raw.startsWith('wallet-auth:') ? raw.slice('wallet-auth:'.length) : raw;
}

/**
 * Derive the P-256 public key from the authorization private key.
 * Returns base64-encoded DER (SPKI) format, as required by Privy's wallet creation API.
 */
function getAuthorizationPublicKey(): string | null {
    const privateKeyBase64 = getAuthorizationPrivateKey();
    if (!privateKeyBase64) return null;

    try {
        const privateKey = crypto.createPrivateKey({
            key: Buffer.from(privateKeyBase64, 'base64'),
            format: 'der',
            type: 'pkcs8',
        });
        const publicKey = crypto.createPublicKey(privateKey);
        return publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    } catch (error) {
        console.error('[PrivyService] Failed to derive public key from PRIVY_AUTH_KEY:', error);
        return null;
    }
}

/**
 * Build the authorization_context object for Privy wallet API calls.
 * This is required for server-created wallets that have authorization keys configured.
 */
function getAuthorizationContext(): { authorization_private_keys: string[] } | undefined {
    const privateKey = getAuthorizationPrivateKey();
    if (!privateKey) {
        console.warn('[PrivyService] No PRIVY_AUTH_KEY configured — wallet signing will fail for server-created wallets');
        return undefined;
    }
    return {
        authorization_private_keys: [privateKey],
    };
}

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
            // For server-side signing, create the wallet with the authorization key as owner.
            // This allows the server to sign transactions using the auth private key.
            // If no auth key is configured, fall back to user-owned wallet (requires user JWT to sign).
            const publicKey = getAuthorizationPublicKey();
            const ownerConfig = publicKey
                ? { owner: { public_key: publicKey } }
                : { owner: { user_id: userId } };

            const wallet = await this.client.wallets().create({
                chain_type: chainType,
                ...ownerConfig,
            });

            if (publicKey) {
                console.log(`[PrivyService] Created server-owned wallet ${wallet.id} for user ${userId}`);
            } else {
                console.warn(`[PrivyService] Created user-owned wallet ${wallet.id} — no PRIVY_AUTH_KEY configured, server-side signing will not work`);
            }

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
            const authContext = getAuthorizationContext();
            const response = await this.client.wallets().ethereum().signMessage(walletId, {
                message,
                ...(authContext ? { authorization_context: authContext } : {}),
            });
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
            const authContext = getAuthorizationContext();
            const response = await this.client.wallets().ethereum().sendTransaction(walletId, {
                caip2: `eip155:${tx.chainId}`,
                params: {
                    transaction: {
                        to: tx.to,
                        value: tx.value || '0x0',
                        data: tx.data,
                        chain_id: tx.chainId
                    }
                },
                ...(authContext ? { authorization_context: authContext } : {}),
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
            const authContext = getAuthorizationContext();
            const response = await this.client.wallets().ethereum().signTransaction(walletId, {
                params: {
                    transaction: {
                        to: tx.to,
                        value: tx.value || '0x0',
                        data: tx.data,
                        chain_id: tx.chainId
                    }
                },
                ...(authContext ? { authorization_context: authContext } : {}),
            });
            return { success: true, signedTransaction: response.signed_transaction };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign transaction'
            };
        }
    }

    async signTypedData(walletId: string, typedData: any) {
        try {
            const authContext = getAuthorizationContext();
            const normalizedTypedData = this.normalizeTypedData(typedData);
            const response = await this.client.wallets().ethereum().signTypedData(walletId, {
                params: {
                    typed_data: normalizedTypedData
                },
                ...(authContext ? { authorization_context: authContext } : {}),
            });

            return { success: true, signature: response.signature };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign typed data'
            };
        }
    }

    private normalizeTypedData(typedData: any): any {
        if (!typedData) {
            return typedData;
        }

        if (typeof typedData === 'string') {
            try {
                const parsed = JSON.parse(typedData);
                return this.normalizeTypedData(parsed);
            } catch {
                return typedData;
            }
        }

        if (typeof typedData !== 'object') {
            return typedData;
        }

        const normalized = { ...typedData } as Record<string, any>;

        if (!normalized.primary_type && normalized.primaryType) {
            normalized.primary_type = normalized.primaryType;
        }

        if (normalized.primaryType) {
            delete normalized.primaryType;
        }

        return normalized;
    }

    extractPrimaryAuth(privyUser: any): { method: AuthMethod; phoneNumber?: string; email?: string; } {
        const phoneAccount = privyUser.linked_accounts.find((acc: any) => acc.type === 'phone');
        if (phoneAccount) return { method: AuthMethod.PHONE, phoneNumber: phoneAccount.number };

        const emailAccount = privyUser.linked_accounts.find((acc: any) => acc.type === 'email');
        if (emailAccount) return { method: AuthMethod.EMAIL, email: emailAccount.address };

        return { method: AuthMethod.WALLET };
    }

    extractWallet(privyUser: any): { id: string | null; address: string; chainType: string; } | null {
        const wallet = privyUser.linked_accounts.find((acc: any) => acc.type === 'wallet');
        if (!wallet) return null;
        
        return {
            // wallet.id is the Privy wallet ID (e.g. "wl_...") — may be null for embedded wallets from linked_accounts
            // wallet_index is just a numeric index (0, 1, 2...) — NOT usable as a wallet ID for API calls
            id: wallet.id || null,
            address: wallet.address,
            chainType: wallet.chain_type || 'ethereum'
        };
    }

    /**
     * Look up wallets for a Privy user via the Wallets API.
     * This returns the actual wallet IDs needed for server-side signing operations.
     * Use this when extractWallet() returns null for the ID (common with embedded wallets).
     */
    async getWalletsForUser(privyUserId: string): Promise<{ id: string; address: string; chainType: string; }[]> {
        try {
            const wallets: { id: string; address: string; chainType: string; }[] = [];
            for await (const wallet of this.client.wallets().list({ user_id: privyUserId })) {
                wallets.push({
                    id: wallet.id,
                    address: wallet.address,
                    chainType: wallet.chain_type,
                });
            }
            return wallets;
        } catch (error) {
            console.error('Failed to get wallets for user:', error);
            return [];
        }
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
