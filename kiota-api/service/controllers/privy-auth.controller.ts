import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { WalletRepository } from '../repositories/wallet.repo';
import { PortfolioRepository } from '../repositories/portfolio.repo';
import Controller from './controller';
import { privyService } from '../utils/provider/privy';
import { AuthMethod } from '../enums/AuthMethod';
import { generateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../interfaces/IAuth';

/**
 * Privy Auth Controller
 * Handles authentication using Privy embedded wallets
 */
class PrivyAuthController extends Controller {
    /**
     * Sync user from Privy to our database
     * Frontend sends: { idToken: string }
     * The idToken is obtained from Privy's getIdentityToken() method
     * 
     * @param req Express Request
     * @param res Express Response
     */
    public static async syncUser(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const walletRepo: WalletRepository = new WalletRepository();
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();

            const { idToken } = req.body;

            if (!idToken) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Identity token is required']
                    )
                );
            }

            // Get user data from Privy using identity token
            const userResult = await privyService.getUserByIdToken(idToken);
            if (!userResult.success || !userResult.user) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Invalid identity token or user not found']
                    )
                );
            }

            const privyUser = userResult.user;

            // Extract authentication method and details
            const authDetails = privyService.extractPrimaryAuth(privyUser);

            // Extract wallet
            const walletDetails = privyService.extractWallet(privyUser);
            
            if (!walletDetails) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['No wallet found for user']
                    )
                );
            }

            // Check if user exists in our database
            let user = await userRepo.getByPrivyUserId(privyUser.id);
            let isNewUser = false;

            if (!user) {
                // Try to find existing user by phone/email (migration case)
                if (authDetails.phoneNumber) {
                    user = await userRepo.getByPhoneNumber(authDetails.phoneNumber);
                }

                if (user) {
                    // Link existing user to Privy
                    await userRepo.linkPrivyAccount(user.id, privyUser.id);
                } else {
                    // Create new user
                    user = await userRepo.createFromPrivy({
                        privyUserId: privyUser.id,
                        phoneNumber: authDetails.phoneNumber,
                        email: authDetails.email,
                        primaryAuthMethod: authDetails.method
                    });
                    isNewUser = true;
                }
            }

            // Update last login
            user.lastLoginAt = new Date();
            await userRepo.save(user);

            // Check if wallet exists in our database
            let wallet = await walletRepo.getByPrivyWalletId(walletDetails.id);

            if (!wallet) {
                // Create wallet record
                wallet = await walletRepo.createFromPrivy({
                    userId: user.id,
                    privyWalletId: walletDetails.id,
                    address: walletDetails.address
                });
            }

            // Check if portfolio exists
            let portfolio = await portfolioRepo.getByUserId(user.id);

            if (!portfolio) {
                portfolio = await portfolioRepo.createPortfolio(user.id);
            }

            // Generate our internal session token
            const token = generateToken(user.id);

            return res.send(
                super.response(
                    super._200,
                    {
                        user: {
                            id: user.id,
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                            primaryAuthMethod: user.primaryAuthMethod,
                            hasCompletedOnboarding: user.hasCompletedOnboarding,
                            hasCompletedQuiz: user.hasCompletedQuiz,
                            totalPoints: user.totalPoints,
                            level: user.level
                        },
                        wallet: {
                            address: wallet.address,
                            provider: wallet.provider
                        },
                        portfolio: {
                            id: portfolio.id,
                            totalValueUsd: portfolio.totalValueUsd
                        },
                        token,
                        isNewUser,
                        nextStep: !user.hasCompletedQuiz ? 'quiz' : 
                                 !user.hasCompletedOnboarding ? 'onboarding' : 
                                 'dashboard'
                    }
                )
            );

        } catch (error) {
            console.error('User sync error:', error);
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Verify access token and get user
     * Used for authenticated routes
     * 
     * @param req Express Request with Authorization header
     * @param res Express Response
     */
    public static async verifyToken(req: Request, res: Response) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Authorization header required']
                    )
                );
            }

            const accessToken = authHeader.substring(7);

            // Verify with Privy
            const verifyResult = await privyService.verifyAccessToken(accessToken);
            
            if (!verifyResult.success || !verifyResult.claims) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Invalid or expired access token']
                    )
                );
            }

            const userId = verifyResult.claims.user_id;

            return res.send(
                super.response(
                    super._200,
                    {
                        userId,
                        verified: true
                    }
                )
            );

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Create user from server side (for admin/bulk operations)
     * @param req Express Request
     * @param res Express Response
     */
    public static async createServerUser(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const walletRepo: WalletRepository = new WalletRepository();
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();

            const { phoneNumber, email } = req.body;

            if (!phoneNumber && !email) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Either phone number or email is required']
                    )
                );
            }

            // Create user in Privy
            let privyResult;
            if (phoneNumber) {
                privyResult = await privyService.createUserAndWallet(phoneNumber, 'ethereum');
            } else {
                const userResult = await privyService.createUserWithEmail(email!);
                if (!userResult.success) {
                    return res.send(
                        super.response(
                            super._500,
                            null,
                            ['Failed to create user in Privy']
                        )
                    );
                }
                
                // Create wallet for email user
                const walletResult = await privyService.createWalletForUser(
                    userResult.user!.id,
                    'ethereum'
                );

                if (!walletResult.success) {
                    return res.send(
                        super.response(
                            super._500,
                            null,
                            ['Failed to create wallet']
                        )
                    );
                }

                privyResult = {
                    success: true,
                    user: userResult.user,
                    wallet: walletResult.wallet
                };
            }

            if (!privyResult.success) {
                return res.send(
                    super.response(
                        super._500,
                        null,
                        ['Failed to create user in Privy']
                    )
                );
            }

            // Create user in our database
            const user = await userRepo.createFromPrivy({
                privyUserId: privyResult.user!.id,
                phoneNumber: phoneNumber,
                email: email,
                primaryAuthMethod: phoneNumber ? AuthMethod.PHONE : AuthMethod.EMAIL
            });

            // Create wallet record
            const wallet = await walletRepo.createFromPrivy({
                userId: user.id,
                privyWalletId: privyResult.wallet!.id,
                address: privyResult.wallet!.address
            });

            // Create portfolio
            const portfolio = await portfolioRepo.createPortfolio(user.id);

            // Generate token
            const token = generateToken(user.id);

            return res.send(
                super.response(
                    super._200,
                    {
                        user: {
                            id: user.id,
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                            privyUserId: privyResult.user!.id
                        },
                        wallet: {
                            address: wallet.address,
                            privyWalletId: wallet.privyUserId
                        },
                        portfolio: {
                            id: portfolio.id
                        },
                        token
                    }
                )
            );

        } catch (error) {
            console.error('Server user creation error:', error);
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get current authenticated user
     * @param req Express Request
     * @param res Express Response
     */
    public static async getCurrentUser(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const walletRepo: WalletRepository = new WalletRepository();
            const portfolioRepo: PortfolioRepository = new PortfolioRepository();

            const userId = (req as AuthenticatedRequest).userId;

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            const user = await userRepo.getById(userId);

            if (!user) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['User not found']
                    )
                );
            }

            const wallet = await walletRepo.getByUserId(userId);
            const portfolio = await portfolioRepo.getByUserId(userId);

            return res.send(
                super.response(
                    super._200,
                    {
                        user: {
                            id: user.id,
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            primaryAuthMethod: user.primaryAuthMethod,
                            hasCompletedOnboarding: user.hasCompletedOnboarding,
                            hasCompletedQuiz: user.hasCompletedQuiz,
                            totalPoints: user.totalPoints,
                            level: user.level
                        },
                        wallet: wallet ? {
                            address: wallet.address,
                            provider: wallet.provider
                        } : null,
                        portfolio: portfolio ? {
                            id: portfolio.id,
                            totalValueUsd: portfolio.totalValueUsd
                        } : null
                    }
                )
            );

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Refresh user data from Privy
     * Syncs latest changes from Privy to our database
     * @param req Express Request
     * @param res Express Response
     */
    public static async refreshFromPrivy(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const userId = (req as AuthenticatedRequest).userId;

            if (!userId) {
                return res.send(
                    super.response(
                        super._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            const user = await userRepo.getById(userId);

            if (!user || !user.privyUserId) {
                return res.send(
                    super.response(
                        super._404,
                        null,
                        ['User not found or not linked to Privy']
                    )
                );
            }

            // Get latest data from Privy using identity token
            const { idToken } = req.body;
            
            if (!idToken) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Identity token required to refresh data']
                    )
                );
            }

            const userResult = await privyService.getUserByIdToken(idToken);

            if (!userResult.success) {
                return res.send(
                    super.response(
                        super._500,
                        null,
                        ['Failed to fetch Privy user data']
                    )
                );
            }

            const privyUser = userResult.user!;
            const authDetails = privyService.extractPrimaryAuth(privyUser);
            const walletDetails = privyService.extractWallet(privyUser);

            // Update user if email was added
            let updated = false;
            if (authDetails.email && !user.email) {
                user.email = authDetails.email;
                updated = true;
                await userRepo.save(user);
            }

            return res.send(
                super.response(
                    super._200,
                    {
                        privyUser: {
                            id: privyUser.id,
                            createdAt: privyUser.created_at,
                            linkedAccounts: privyUser.linked_accounts.length,
                            hasWallet: !!walletDetails,
                            primaryAuth: authDetails.method
                        },
                        wallet: walletDetails,
                        updated: {
                            email: updated
                        }
                    }
                )
            );

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default PrivyAuthController;