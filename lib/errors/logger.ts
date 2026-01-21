import { AppError } from './AppError'
import { sanitizeErrorMeta } from './sanitization'

/**
 * Structured logging utility for server-side error tracking
 * Logs are output as JSON for easy parsing and searching
 */

/**
 * Logs an AppError with sanitized details
 */
export function logError(error: AppError): void {
    const logEntry = {
        level: 'error',
        requestId: error.requestId,
        code: error.code,
        location: error.location,
        message: error.message,
        httpStatus: error.httpStatus,
        timestamp: new Date().toISOString(),
        stack: error.stack,
        meta: sanitizeErrorMeta(error.meta),
        cause: error.cause ? {
            message: error.cause.message,
            stack: error.cause.stack
        } : undefined
    }

    // Use console.error with structured JSON
    console.error(JSON.stringify(logEntry, null, 2))
}

/**
 * Logs informational message with context
 */
export function logInfo(message: string, meta?: Record<string, any>): void {
    const logEntry = {
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        meta: sanitizeErrorMeta(meta)
    }

    console.log(JSON.stringify(logEntry, null, 2))
}

/**
 * Logs warning message with context
 */
export function logWarn(message: string, meta?: Record<string, any>): void {
    const logEntry = {
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        meta: sanitizeErrorMeta(meta)
    }

    console.warn(JSON.stringify(logEntry, null, 2))
}
