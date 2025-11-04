// Global Error Handler Middleware - Catches all errors in the application
import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error Interface
 * Extends standard Error with HTTP status code
 */
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Global Error Handler
 * 
 * What it does:
 * - Catches all errors thrown in routes/controllers
 * - Formats error responses consistently
 * - Logs errors for debugging
 * - Returns appropriate HTTP status codes
 * 
 * How Express error handling works:
 * - Middleware with 4 parameters is treated as error handler
 * - Express automatically calls this when next(error) is invoked
 * - Or when an error is thrown in async function
 */
export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error details for debugging
    console.error('=== ERROR OCCURRED ===');
    console.error('Time:', new Date().toISOString());
    console.error('Path:', req.method, req.path);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('======================');

    // Determine HTTP status code
    const statusCode = err.statusCode || 500;

    // Determine error message (hide internal errors in production)
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    // Send error response
    res.status(statusCode).json({
        error: true,
        statusCode,
        message,
        code: err.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path
    });
};

/**
 * 404 Not Found Handler
 * 
 * Catches requests to undefined routes
 * Should be added after all valid routes
 */
export const notFoundHandler = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const error: ApiError = new Error(`Route not found: ${req.method} ${req.path}`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

/**
 * Async Error Wrapper
 * 
 * Utility function to catch errors in async route handlers
 * Usage: router.get('/', asyncHandler(myAsyncFunction))
 * 
 * Why needed?
 * - Express doesn't automatically catch errors in async functions
 * - Without this, unhandled promise rejections crash the server
 */
export const asyncHandler = (fn: Function) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
