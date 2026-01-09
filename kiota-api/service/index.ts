import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import corsOptions, { allowedOrigins } from "./configs/corsconfig";
import AppDataSource from "./configs/ormconfig";

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

// Routes

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        service: process.env.SERVICE_NAME,
        timestamp: new Date().toISOString()
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
        console.log(`🔌 WebSocket: Enabled`);
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