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
class AuthController extends Controller {
    /**
     * Request OTP for phone verification (Screen 3)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async requestOTP(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const otpRepo: OTPRepository = new OTPRepository();
            
            const { phoneNumber, googleId, email } = req.body;

            // Validate phone number
            if (!phoneNumber || !phoneNumber.match(/^\+254\d{9}$/)) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Invalid phone number format. Use +254XXXXXXXXX']
                    )
                );
            }

            // Check if user exists
            let user = await userRepo.getByPhoneNumber(phoneNumber);

            // Link Google account if exists
            if (googleId && user) {
                const updated = await userRepo.saveQuizAnswers(user.id, {});
                if (updated) {
                    updated.googleId = googleId;
                    updated.email = email || updated.email;
                }
            }

            // Check rate limiting
            const canResend = await otpRepo.canResendOTP(phoneNumber);
            if (!canResend.allowed) {
                return res.send(
                    super.response(
                        super._429,
                        { waitSeconds: canResend.waitSeconds },
                        [`Please wait ${canResend.waitSeconds} seconds before requesting another OTP`]
                    )
                );
            }

            // Create OTP
            const otp = await otpRepo.createOTP({
                phoneNumber,
                purpose: OTPPurpose.LOGIN
            });

            // TODO: Send OTP via SMS
            console.log(`OTP for ${phoneNumber}: ${otp.code}`);

            return res.send(
                super.response(
                    super._200,
                    {
                        phoneNumber,
                        expiresAt: otp.expiresAt,
                        ...(process.env.NODE_ENV === 'development' && { code: otp.code })
                    }
                )
            );

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Verify OTP and login/signup (Screen 4)
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async verifyOTP(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const otpRepo: OTPRepository = new OTPRepository();
            
            const { phoneNumber, code, googleId, email } = req.body;

            if (!phoneNumber || !code) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Phone number and OTP code are required']
                    )
                );
            }

            if (code.length !== 6) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['OTP code must be 6 digits']
                    )
                );
            }

            // Verify OTP
            const verification = await otpRepo.verifyOTP(
                phoneNumber,
                code,
                OTPPurpose.LOGIN
            );

            if (!verification.success) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        [verification.message]
                    )
                );
            }

            // Check if user exists
            let user = await userRepo.getByPhoneNumber(phoneNumber);

            if (!user) {
                // Create new user
                user = await userRepo.createUser({
                    phoneNumber,
                    email,
                    googleId
                });
            } else {
                // Update last login
                user.lastLoginAt = new Date();
                // Note: Need to add save method to UserRepository
            }

            const token = AuthController.generateToken(user.id);

            return res.send(
                super.response(
                    super._200,
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

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Google Sign In
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async googleSignIn(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            
            const { googleId, email, phoneNumber } = req.body;

            if (!googleId || !email) {
                return res.send(
                    super.response(
                        super._400,
                        null,
                        ['Google ID and email are required']
                    )
                );
            }

            // Check by Google ID
            let user = await userRepo.getByGoogleId(googleId);

            if (!user && phoneNumber) {
                // Check by phone number
                user = await userRepo.getByPhoneNumber(phoneNumber);
            }

            if (user) {
                user.googleId = googleId;
                user.email = email;
                user.lastLoginAt = new Date();
                // Note: Need to add save method to UserRepository

                const token = AuthController.generateToken(user.id);

                return res.send(
                    super.response(
                        super._200,
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
                return res.send(
                    super.response(
                        super._200,
                        {
                            needsPhoneNumber: true,
                            googleId,
                            email
                        }
                    )
                );
            }

            // Create new user
            user = await userRepo.createUser({
                phoneNumber,
                email,
                googleId
            });

            const token = AuthController.generateToken(user.id);

            return res.send(
                super.response(
                    super._201,
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

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Get current authenticated user
     * @param req Express Request
     * @param res Express Response
     * @returns Json Object
     */
    public static async getCurrentUser(req: Request, res: Response) {
        try {
            const userRepo: UserRepository = new UserRepository();
            const userId = (req as any).userId;

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
                            hasCompletedOnboarding: user.hasCompletedOnboarding,
                            hasCompletedQuiz: user.hasCompletedQuiz,
                            totalPoints: user.totalPoints,
                            level: user.level
                        }
                    }
                )
            );

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Generate session token
     * @param userId User ID
     * @returns Token string
     */
    private static generateToken(userId: string): string {
        return Buffer.from(JSON.stringify({ 
            userId, 
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
        })).toString('base64');
    }
}

export default AuthController;