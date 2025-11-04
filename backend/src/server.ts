// EdgeNet Backend API - Main server entry point
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';

// Import middleware
import corsMiddleware from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import telemetryRoutes from './routes/telemetry.js';
import devicesRoutes from './routes/devices.js';
import setupRoutes from './routes/setup.js';
import statisticsRoutes from './routes/statistics.js';

// Import utilities
import { testConnection } from './services/supabaseClient.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '4000', 10);

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Enable CORS - Allow frontend to call backend API
app.use(corsMiddleware);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (custom)
app.use((req: Request, _res: Response, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Root endpoint - API information
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: "EdgeNet Backend API",
        status: "running",
        version: "1.0.0",
        endpoints: {
            health: "/health",
            telemetry: "/api/telemetry",
            devices: "/api/devices",
            deviceStats: "/api/devices/stats",
            statistics: "/api/statistics"
        },
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint - Used to verify server is alive
app.get('/health', (_req: Request, res: Response) => {
    res.json({ 
        status: "ok", 
        uptime: process.uptime(),
        timestamp: new Date().toISOString() 
    });
});

// API Routes - Mount routers at /api prefix
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/statistics', statisticsRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - Must be after all valid routes
app.use(notFoundHandler);

// Global error handler - Must be last middleware
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

// Test database connection before starting server
testConnection();

// Start server and listen on specified port
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 EdgeNet Backend API Started');
    console.log('=================================');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`📊 API Docs: http://localhost:${PORT}/`);
    console.log('=================================');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Node Version: ${process.version}`);
    console.log('=================================');
});

// Export app for testing purposes
export default app;
