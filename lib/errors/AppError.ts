import { ErrorCode, ERROR_HTTP_STATUS, ERROR_MESSAGES } from './codes'

/**
 * Custom application error class with requestId tracking
 * Used throughout the application for consistent error handling
 */
export class AppError extends Error {
    readonly code: ErrorCode
    readonly httpStatus: number
    readonly location: string
    readonly requestId: string
    readonly severity: 'info' | 'warn' | 'error'
    readonly meta?: Record<string, any>
    readonly cause?: Error

    constructor(options: {
        code: ErrorCode
        message?: string
        location: string
        requestId: string
        severity?: 'info' | 'warn' | 'error'
        meta?: Record<string, any>
        cause?: Error
    }) {
        // Use provided message or default message for the error code
        super(options.message || ERROR_MESSAGES[options.code])

        this.name = 'AppError'
        this.code = options.code
        this.httpStatus = ERROR_HTTP_STATUS[options.code]
        this.location = options.location
        this.requestId = options.requestId
        this.severity = options.severity || 'error'
        this.meta = options.meta
        this.cause = options.cause

        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError)
        }
    }

    /**
     * Serializes error for logging (server-side only)
     */
    toLogObject() {
        return {
            level: this.severity,
            code: this.code,
            message: this.message,
            location: this.location,
            requestId: this.requestId,
            httpStatus: this.httpStatus,
            timestamp: new Date().toISOString(),
            stack: this.stack,
            meta: this.meta,
            cause: this.cause ? {
                message: this.cause.message,
                stack: this.cause.stack
            } : undefined
        }
    }

    /**
     * Serializes error for API response (safe for client)
     */
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            location: this.location,
            requestId: this.requestId,
            // Don't expose stack trace or internal meta to clients
        }
    }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError
}
