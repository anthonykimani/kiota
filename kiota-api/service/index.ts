import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import corsOptions from "./configs/corsconfig";
import AppDataSource from "./configs/ormconfig";
import { serverAdapter } from "./configs/bull-board.config";
import { requireAdminAuth } from "./middleware/auth";

// Import routes
import authRoutes from "./routes/index.auth";
import quizRoutes from "./routes/index.quiz";
import walletRoutes from "./routes/index.wallet";
import dashboardRoutes from "./routes/index.dashboard";
import depositRoutes from "./routes/index.deposit";
import portfolioRoutes from "./routes/index.portfolio";
import swapRoutes from "./routes/index.swap";
import privyRoutes from "./routes/index.privy";
import goalRoutes from "./routes/index.goal";

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Create Express app
export const app = express();

// Create HTTP server
export const server = http.createServer(app);

// Express middleware
app.disable("x-powered-by");
app.enable("trust proxy");
app.use(cors(corsOptions));
app.use(express.json());

// Bull Board - Job monitoring dashboard with admin authentication
app.use('/admin/queues', requireAdminAuth, serverAdapter.getRouter());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/deposit", depositRoutes);
app.use("/api/v1/portfolio", portfolioRoutes);
app.use("/api/v1/swap", swapRoutes);
app.use("/api/v1/auth/privy", privyRoutes);
app.use("/api/v1/goals", goalRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        service: process.env.SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        service: process.env.SERVICE_NAME,
        version: "1.0.0",
        endpoints: {
            auth: "/api/v1/auth",
            quiz: "/api/v1/quiz",
            wallet: "/api/v1/wallet",
            dashboard: "/api/v1/dashboard",
            deposit: "/api/v1/deposit",
            portfolio: "/api/v1/portfolio",
            swap: "/api/v1/swap",
            privy: "/api/v1/auth/privy",
            goals: "/api/v1/goals"
        }
    });
});

// Initialize database and start server
AppDataSource.initialize()
    .then(() => {
        console.log("Database initialized successfully");
        
        if (require.main === module) {
            startServer();
        } else {
            module.exports = startServer;
        }
    })
    .catch((error) => {
        console.error("Error initializing database:", error);
        process.exit(1);
    });

async function startServer() {
    const PORT = process.env.PORT;
    
    server.listen(PORT, () => {
        console.log("═".repeat(50));
        console.log(`🚀 Server: ${process.env.SERVICE_NAME}`);
        console.log(`📍 Port: ${PORT}`);
        console.log(`🌍 Environment: ${app.get("env")}`);
        console.log(`🔗 URL: http://localhost:${PORT}`);
        console.log(`📊 Bull Board: http://localhost:${PORT}/admin/queues`);
        console.log(`🔌 WebSocket: Enabled`);
        console.log("═".repeat(50));
        console.log("\n📋 Available Routes:");
        console.log(`   • POST   /api/v1/auth/request-otp`);
        console.log(`   • POST   /api/v1/auth/verify-otp`);
        console.log(`   • POST   /api/v1/auth/google-login`);
        console.log(`   • POST   /api/v1/quiz/submit`);
        console.log(`   • POST   /api/v1/quiz/accept-strategy`);
        console.log(`   • POST   /api/v1/wallet/create`);
        console.log(`   • GET    /api/v1/dashboard`);
        console.log(`   • POST   /api/v1/deposit/initiate`);
        console.log(`   • POST   /api/v1/deposit/convert`);
        console.log(`   • GET    /api/v1/portfolio/detail`);
        console.log(`   • POST   /api/v1/portfolio/rebalance`);
        console.log(`   • GET    /api/v1/swap/quote`);
        console.log(`   • POST   /api/v1/swap/execute`);
        console.log(`   • GET    /api/v1/swap/status/:transactionId`);
        console.log(`   • GET    /api/v1/swap/history`);
        console.log("═".repeat(50));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            AppDataSource.destroy();
            process.exit(0);
        });
    });
}