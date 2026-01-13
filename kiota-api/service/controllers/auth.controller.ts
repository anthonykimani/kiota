import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import { OTPRepository } from '../repositories/otp.repo';
import { OTPPurpose } from '../enums/Otp';
import Controller from './controller';

/**
 * Auth Controller
 * Handles user authentication for Phase 1 MVP
 * Screens: 3 (Sign Up/Login), 4 (OTP Verification)
 */
export class AuthController extends Controller {
    private userRepo: UserRepository;
    private otpRepo: OTPRepository;

    constructor() {
        super();
        this.userRepo = new UserRepository();
        this.otpRepo = new OTPRepository();
    }

    /**
     * Request OTP for phone verification (Screen 3)
     * @param req Express Request
     * @param res Express Response
     */
    async requestOTP(req: Request, res: Response) {
        try {
            const { phoneNumber, googleId, email } = req.body;

            // Validate phone number
            if (!phoneNumber || !phoneNumber.match(/^\+254\d{9}$/)) {
                return res.json(
                    AuthController.response(
                        AuthController._400,
                        null,
                        ['Invalid phone number format. Use +254XXXXXXXXX']
                    )
                );
            }

            // Check if user exists (from user.repo.ts)
            let user = await this.userRepo.getByPhoneNumber(phoneNumber);

            // Link Google account if exists
            if (googleId && user) {
                // Update user with Google credentials
                const updated = await this.userRepo.saveQuizAnswers(user.id, {});
                if (updated) {
                    updated.googleId = googleId;
                    updated.email = email || updated.email;
                    // Note: Need to add updateUser method to UserRepository
                }
            }

            // Check rate limiting (from otp.repo.ts)
            const canResend = await this.otpRepo.canResendOTP(phoneNumber);
            if (!canResend.allowed) {
                return res.json(
                    AuthController.response(
                        AuthController._429,
                        { waitSeconds: canResend.waitSeconds },
                        [`Please wait ${canResend.waitSeconds} seconds before requesting another OTP`]
                    )
                );
            }

            // Create OTP (from otp.repo.ts)
            const otp = await this.otpRepo.createOTP({
                phoneNumber,
                purpose: OTPPurpose.LOGIN
            });

            // TODO: Send OTP via SMS
            console.log(`OTP for ${phoneNumber}: ${otp.code}`);

            return res.json(
                AuthController.response(
                    AuthController._200,
                    {
                        phoneNumber,
                        expiresAt: otp.expiresAt,
                        ...(process.env.NODE_ENV === 'development' && { code: otp.code })
                    }
                )
            );

        } catch (error: any) {
            console.error('Request OTP error:', error);
            return res.json(
                AuthController.response(
                    AuthController._500,
                    null,
                    AuthController.ex(error)
                )
            );
        }
    }

    /**
     * Verify OTP and login/signup (Screen 4)
     * @param req Express Request
     * @param res Express Response
     */
    async verifyOTP(req: Request, res: Response) {
        try {
            const { phoneNumber, code, googleId, email } = req.body;

            if (!phoneNumber || !code) {
                return res.json(
                    AuthController.response(
                        AuthController._400,
                        null,
                        ['Phone number and OTP code are required']
                    )
                );
            }

            if (code.length !== 6) {
                return res.json(
                    AuthController.response(
                        AuthController._400,
                        null,
                        ['OTP code must be 6 digits']
                    )
                );
            }

            // Verify OTP (from otp.repo.ts)
            const verification = await this.otpRepo.verifyOTP(
                phoneNumber,
                code,
                OTPPurpose.LOGIN
            );

            if (!verification.success) {
                return res.json(
                    AuthController.response(
                        AuthController._400,
                        null,
                        [verification.message]
                    )
                );
            }

            // Check if user exists (from user.repo.ts)
            let user = await this.userRepo.getByPhoneNumber(phoneNumber);

            if (!user) {
                // Create new user (from user.repo.ts)
                user = await this.userRepo.createUser({
                    phoneNumber,
                    email,
                    googleId
                });
            } else {
                // Update last login
                user.lastLoginAt = new Date();
                await this.userRepo.save(user);
            }

            const token = this.generateToken(user.id);

            return res.json(
                AuthController.response(
                    AuthController._200,
                    {
                        user: {
                            id: user.id,
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                            hasCompletedOnboarding: user.hasCompletedOnboarding,
                            hasCompletedQuiz: user.hasCompletedQuiz
                        },
                        token
                    }
                )
            );

        } catch (error: any) {
            console.error('Verify OTP error:', error);
            return res.json(
                AuthController.response(
                    AuthController._500,
                    null,
                    AuthController.ex(error)
                )
            );
        }
    }

    /**
     * Google Sign In
     * @param req Express Request
     * @param res Express Response
     */
    async googleSignIn(req: Request, res: Response) {
        try {
            const { googleId, email, phoneNumber } = req.body;

            if (!googleId || !email) {
                return res.json(
                    AuthController.response(
                        AuthController._400,
                        null,
                        ['Google ID and email are required']
                    )
                );
            }

            // Check by Google ID (from user.repo.ts)
            let user = await this.userRepo.getByGoogleId(googleId);

            if (!user && phoneNumber) {
                // Check by phone number (from user.repo.ts)
                user = await this.userRepo.getByPhoneNumber(phoneNumber);
            }

            if (user) {
                user.googleId = googleId;
                user.email = email;
                user.lastLoginAt = new Date();
                await this.userRepo.save(user);

                const token = this.generateToken(user.id);

                return res.json(
                    AuthController.response(
                        AuthController._200,
                        {
                            user: {
                                id: user.id,
                                phoneNumber: user.phoneNumber,
                                email: user.email,
                                hasCompletedOnboarding: user.hasCompletedOnboarding,
                                hasCompletedQuiz: user.hasCompletedQuiz
                            },
                            token
                        }
                    )
                );
            }

            if (!phoneNumber) {
                return res.json(
                    AuthController.response(
                        AuthController._200,
                        {
                            needsPhoneNumber: true,
                            googleId,
                            email
                        }
                    )
                );
            }

            // Create new user (from user.repo.ts)
            user = await this.userRepo.createUser({
                phoneNumber,
                email,
                googleId
            });

            const token = this.generateToken(user.id);

            return res.json(
                AuthController.response(
                    AuthController._201,
                    {
                        user: {
                            id: user.id,
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                            hasCompletedOnboarding: user.hasCompletedOnboarding,
                            hasCompletedQuiz: user.hasCompletedQuiz
                        },
                        token
                    }
                )
            );

        } catch (error: any) {
            console.error('Google sign in error:', error);
            return res.json(
                AuthController.response(
                    AuthController._500,
                    null,
                    AuthController.ex(error)
                )
            );
        }
    }

    /**
     * Get current authenticated user
     * @param req Express Request
     * @param res Express Response
     */
    async getCurrentUser(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;

            if (!userId) {
                return res.json(
                    AuthController.response(
                        AuthController._401,
                        null,
                        ['Not authenticated']
                    )
                );
            }

            // Get user by ID (from user.repo.ts)
            const user = await this.userRepo.getById(userId);

            if (!user) {
                return res.json(
                    AuthController.response(
                        AuthController._404,
                        null,
                        ['User not found']
                    )
                );
            }

            return res.json(
                AuthController.response(
                    AuthController._200,
                    {
                        user: {
                            id: user.id,
                            phoneNumber: user.phoneNumber,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            hasCompletedOnboarding: user.hasCompletedOnboarding,
                            hasCompletedQuiz: user.hasCompletedQuiz,
                            totalPoints: user.totalPoints,
                            level: user.level
                        }
                    }
                )
            );

        } catch (error: any) {
            console.error('Get current user error:', error);
            return res.json(
                AuthController.response(
                    AuthController._500,
                    null,
                    AuthController.ex(error)
                )
            );
        }
    }

    /**
     * Generate session token
     * @param userId User ID
     * @returns Token string
     */
    private generateToken(userId: string): string {
        return Buffer.from(JSON.stringify({ 
            userId, 
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
        })).toString('base64');
    }
}