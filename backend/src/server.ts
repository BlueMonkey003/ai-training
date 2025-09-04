import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

// Routes importeren
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import restaurantRoutes from "./routes/restaurant.routes";
import orderRoutes from "./routes/order.routes";
import notificationRoutes from "./routes/notification.routes";
import uploadRoutes from "./routes/upload.routes";
import healthRoutes from "./routes/health.routes";

// Socket handlers
import { setupSocketHandlers } from "./sockets/socketHandlers";

// Error middleware
import { errorHandler } from "./middleware/error.middleware";

// Set default NODE_ENV if not specified
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env.development";
dotenv.config({ path: envFile });

console.log("Loading environment from:", envFile);
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);
console.log("Node environment:", process.env.NODE_ENV);

const app = express();
const httpServer = createServer(app);

// Origins per omgeving
const allowedOrigins =
    process.env.NODE_ENV === "production"
        ? ["https://lunchmonkeys.bluemonkeysaapp.nl"]
        : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

// Swagger configuratie
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "LunchMonkeys API",
            version: "1.0.0",
            description: "API documentatie voor LunchMonkeys applicatie",
        },
        servers: [
            {
                url:
                    process.env.NODE_ENV === "production"
                        ? "https://api.lunchmonkeys.bluemonkeysaapp.nl"
                        : `http://localhost:${process.env.PORT || 10000}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Pad naar de route en controller bestanden
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuten
    max: process.env.NODE_ENV === "development" ? 1000 : 100,
    skip: (req) => req.path === "/api/health", // Health check overslaan
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/", limiter);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/health", healthRoutes);

// Socket.IO handlers
setupSocketHandlers(io);

// Error handling middleware
app.use(errorHandler);

// MongoDB connectie
const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI!;

        // In productie, gebruik lunchmonkeys-prod database
        if (process.env.NODE_ENV === 'production' && mongoUri.includes('/lunchmonkeys')) {
            mongoUri = mongoUri.replace('/lunchmonkeys', '/lunchmonkeys-prod');
            console.log("🏭 Using production database: lunchmonkeys-prod");
        } else {
            console.log("🔧 Using development database: lunchmonkeys");
        }

        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB verbonden");
    } catch (error) {
        console.error("❌ MongoDB connectie fout:", error);
        process.exit(1);
    }
};

// Server starten
const PORT = process.env.PORT || 10000;

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server draait op poort ${PORT}`);

        if (process.env.NODE_ENV === "production") {
            console.log(
                `🌍 Swagger docs beschikbaar op https://api.lunchmonkeys.bluemonkeysaapp.nl/api-docs`
            );
        } else {
            console.log(
                `📚 Swagger docs beschikbaar op http://localhost:${PORT}/api-docs`
            );
        }
    });
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM ontvangen. Server wordt afgesloten...");
    httpServer.close(() => {
        mongoose.connection.close();
    });
});

export { io };
