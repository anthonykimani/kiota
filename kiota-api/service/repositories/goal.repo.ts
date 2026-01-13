import { Repository } from "typeorm";
import dotenv from "dotenv";
import { Goal } from "../models/goal.entity";
import AppDataSource from "../configs/ormconfig";
import { GoalCategory, GoalStatus } from "../enums/Goal";


export class GoalRepository {
    private repo: Repository<Goal>;

    constructor() {
        this.repo = AppDataSource.getRepository(Goal);
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    }

    // Screen 9: Get active goals for dashboard
    async getActiveByUser(userId: string, limit: number = 3): Promise<Goal[]> {
        try {
            return await this.repo.find({
                where: { userId, status: GoalStatus.ACTIVE },
                order: { targetDate: 'ASC' },
                take: limit
            });
        } catch (error) {
            throw error;
        }
    }

    // Screen 9: Create a goal (if goal creation is part of onboarding)
    async createGoal(data: {
        userId: string;
        title: string;
        category: GoalCategory;
        targetAmountUsd: number;
        targetAmountKes: number;
        targetDate: Date;
    }): Promise<Goal> {
        try {
            const goal = this.repo.create({
                userId: data.userId,
                title: data.title,
                category: data.category,
                emoji: this.getEmoji(data.category),
                targetAmountUsd: data.targetAmountUsd,
                targetAmountKes: data.targetAmountKes,
                targetDate: data.targetDate,
                currentAmountUsd: 0,
                progressPercent: 0,
                onTrack: true,
                status: GoalStatus.ACTIVE
            });

            return await this.repo.save(goal);
        } catch (error) {
            throw error;
        }
    }

    // Screen 9: Update goal progress after deposit
    async updateProgress(goalId: string, amountUsd: number): Promise<Goal | null> {
        try {
            const goal = await this.repo.findOne({ where: { id: goalId } });
            if (!goal) return null;

            goal.currentAmountUsd = Number(goal.currentAmountUsd) + amountUsd;
            goal.progressPercent = (Number(goal.currentAmountUsd) / Number(goal.targetAmountUsd)) * 100;

            // Check if completed
            if (goal.progressPercent >= 100) {
                goal.status = GoalStatus.COMPLETED;
                goal.completedAt = new Date();
            }

            return await this.repo.save(goal);
        } catch (error) {
            throw error;
        }
    }

    // Helper: Get emoji for category
    private getEmoji(category: GoalCategory): string {
        const emojis: Record<GoalCategory, string> = {
            [GoalCategory.HOUSE]: '🏠',
            [GoalCategory.CAR]: '🚗',
            [GoalCategory.EDUCATION]: '📚',
            [GoalCategory.WEDDING]: '💍',
            [GoalCategory.TRAVEL]: '🏖️',
            [GoalCategory.EMERGENCY]: '🚨',
            [GoalCategory.RETIREMENT]: '🌴',
            [GoalCategory.BUSINESS]: '💼',
            [GoalCategory.OTHER]: '🎯'
        };
        return emojis[category] || '🎯';
    }

    // General: Get goal by ID
    async getById(id: string): Promise<Goal | null> {
        try {
            return await this.repo.findOne({ where: { id } });
        } catch (error) {
            throw error;
        }
    }
}