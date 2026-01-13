import { Repository } from "typeorm";
import dotenv from "dotenv";
import AppDataSource from "../configs/ormconfig";
import { OTP } from "../models/otp.entity";
import { OTPPurpose, OTPStatus } from "../enums/Otp";


export class OTPRepository {
    private repo: Repository<OTP>;

    constructor() {
        this.repo = AppDataSource.getRepository(OTP);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // Screen 4: Create OTP for phone verification
    async createOTP(data: {
        phoneNumber: string;
        purpose: OTPPurpose;
    }): Promise<OTP> {
        try {
            // Expire any existing pending OTPs
            await this.repo.update(
                { phoneNumber: data.phoneNumber, purpose: data.purpose, status: OTPStatus.PENDING },
                { status: OTPStatus.EXPIRED }
            );

            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Expires in 10 minutes
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            const otp = this.repo.create({
                phoneNumber: data.phoneNumber,
                code,
                purpose: data.purpose,
                status: OTPStatus.PENDING,
                expiresAt,
                attempts: 0,
                maxAttempts: 3
            });

            return await this.repo.save(otp);
        } catch (error) {
            throw error;
        }
    }

    // Screen 4: Verify OTP code
    async verifyOTP(phoneNumber: string, code: string, purpose: OTPPurpose): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            const otp = await this.repo.findOne({
                where: {
                    phoneNumber,
                    purpose,
                    status: OTPStatus.PENDING
                },
                order: { createdAt: 'DESC' }
            });

            if (!otp) {
                return { success: false, message: 'No pending OTP found' };
            }

            // Check expiry
            if (new Date() > otp.expiresAt) {
                otp.status = OTPStatus.EXPIRED;
                await this.repo.save(otp);
                return { success: false, message: 'OTP has expired' };
            }

            // Check attempts
            if (otp.attempts >= otp.maxAttempts) {
                otp.status = OTPStatus.FAILED;
                await this.repo.save(otp);
                return { success: false, message: 'Maximum attempts exceeded' };
            }

            // Increment attempts
            otp.attempts += 1;

            // Verify code
            if (otp.code !== code) {
                await this.repo.save(otp);
                const remaining = otp.maxAttempts - otp.attempts;
                return { success: false, message: `Invalid code. ${remaining} attempts remaining` };
            }

            // Success
            otp.status = OTPStatus.VERIFIED;
            otp.verifiedAt = new Date();
            await this.repo.save(otp);

            return { success: true, message: 'OTP verified successfully' };
        } catch (error) {
            throw error;
        }
    }

    // Screen 4: Check if can resend (rate limiting)
    async canResendOTP(phoneNumber: string): Promise<{
        allowed: boolean;
        waitSeconds: number;
    }> {
        try {
            const recentOTP = await this.repo.findOne({
                where: { phoneNumber },
                order: { createdAt: 'DESC' }
            });

            if (!recentOTP) {
                return { allowed: true, waitSeconds: 0 };
            }

            const secondsSinceLastOTP = Math.floor(
                (Date.now() - new Date(recentOTP.createdAt).getTime()) / 1000
            );

            // Minimum 60 seconds between OTPs
            if (secondsSinceLastOTP < 60) {
                return { allowed: false, waitSeconds: 60 - secondsSinceLastOTP };
            }

            return { allowed: true, waitSeconds: 0 };
        } catch (error) {
            throw error;
        }
    }
}