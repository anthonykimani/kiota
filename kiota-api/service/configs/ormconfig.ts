import dotenv from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";
import { User } from "../models/user.entity";
import { Wallet } from "../models/wallet.entity";
import { Transaction } from "../models/transaction.entity";
import { Quiz } from "../models/quiz.entity";
import { Portfolio } from "../models/portfolio.entity";
import { PortfolioSnapshot } from "../models/portfolio-snapshot.entity";
import { PortfolioHolding } from "../models/portfolio-holding.entity";
import { Lesson } from "../models/lesson.entity";
import { LessonProgress } from "../models/lesson-progress.entity";
import { LearningModule } from "../models/learning-module.entity";
import { LearningTrack } from "../models/learning-track.entity";
import { AssetClass } from "../models/asset-class.entity";
import { Asset } from "../models/asset.entity";
import { Goal } from "../models/goal.entity";
import { GoalContribution } from "../models/goal-contribution.entity";
import { GoalMilestone } from "../models/goal-milestone.entity";
import { AIAdvisorSession } from "../models/ai-advisor-session.entity";
import { AutoSaveExecution } from "../models/autosave-execution.entity";
import { AutoSaveRule } from "../models/autosave-rule.entity";
import { Badge } from "../models/badge.entity";
import { Chama } from "../models/chama.entity";
import { ChamaMembership } from "../models/chama-membership.entity";
import { ExchangeRate, MarketData } from "../models/market-data.entity";
import { Notification } from "../models/notification.entity";
import { RoundupTracker } from "../models/roundup-tracker.entity";
import { SavingsCommitment } from "../models/savings-commitment.entity";
import { UserBadge } from "../models/user-badge.entity";
import { ChamaActivity } from "../models/chama-activity.entity";
import { DepositSession } from "../models/deposit-session.entity";
import { OnchainProcessedEvent } from "../models/onchain-processed-event.entity";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: Number(process.env.DB_SSL) ? true : false,
};

const AppDataSource = new DataSource({
    type: "postgres",
    host: config.host,
    port: 5432,
    username: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? {
        rejectUnauthorized: false,
        //ca: "",
        //key: "",
        //cert: "",
    } : config.ssl,
    entities: [
        AssetClass,
        Asset,
        AIAdvisorSession,
        AutoSaveExecution,
        AutoSaveRule,
        Badge,
        Chama,
        ChamaActivity,
        ChamaMembership,
        DepositSession,
        Goal,
        GoalContribution,
        GoalMilestone,
        Lesson,
        LessonProgress,
        LearningModule,
        LearningTrack,
        MarketData,
        ExchangeRate,
        Notification,
        OnchainProcessedEvent,
        Portfolio,
        PortfolioSnapshot,
        PortfolioHolding,
        Quiz,
        RoundupTracker,
        SavingsCommitment,
        Transaction,
        User,
        UserBadge,
        Wallet,
    ],
    synchronize: true,
    dropSchema: false,
    migrationsRun: true,
    logging: false,
    logger: "debug",
    migrations: [join(__dirname, "service/migration/**/*.ts")]
});

export default AppDataSource;
