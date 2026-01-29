import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';
import Controller from './controller';
import { generateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../interfaces/IAuth';

/**
 * Auth Controller
 * Handles user authentication for Phase 1 MVP
 * Screens: 3 (Sign Up/Login), 4 (OTP Verification)
 */
class AuthController extends Controller {

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
                await userRepo.save(user);

                const token = generateToken(user.id);

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

            const token = generateToken(user.id);

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
}

export default AuthController;