// CORS Middleware - Allows frontend to make requests to backend
import cors, { CorsOptions } from 'cors';

/**
 * CORS Configuration
 * 
 * What is CORS?
 * - Cross-Origin Resource Sharing
 * - Browser security feature that blocks requests from different origins
 * - Example: Frontend (localhost:3000) calling Backend (localhost:4000)
 * 
 * Why needed?
 * - Without CORS, browser blocks API calls between different ports
 * - We explicitly allow localhost:3000 (Next.js frontend) to access our API
 */

// Define allowed origins based on environment
const allowedOrigins = [
    'http://localhost:3000',           // Next.js dev server
    'http://localhost:4000',           // Backend (for testing)
    'https://edgenet.vercel.app',      // Production frontend (if deployed)
    process.env.FRONTEND_URL           // Custom frontend URL from .env
].filter(Boolean); // Remove undefined values

// CORS options configuration
const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) {
            callback(null, true);
            return;
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,                  // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

// Export configured CORS middleware
export default cors(corsOptions);
