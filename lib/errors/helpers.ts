import { customAlphabet } from 'nanoid'
import { AppError, isAppError } from './AppError'
import { ErrorCode } from './codes'

/**
 * Generates a unique requestId for tracking
 * Format: req_YYYY-MM-DD_<random>
 */
export function generateRequestId(): string {
    const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)
    const date = new Date().toISOString().split('T')[0]
    return `req_${date}_${nanoid()}`
}

/**
 * Creates an AppError with all required fields
 */
export function createAppError(options: {
    code: ErrorCode
    message?: string
    location: string
    requestId?: string
    severity?: 'info' | 'warn' | 'error'
    meta?: Record<string, any>
    cause?: Error
}): AppError {
    return new AppError({
        ...options,
        requestId: options.requestId || generateRequestId()
    })
}

/**
 * Normalizes unknown error into AppError
 * Handles: AppError, Error, string, unknown
 */
export function normalizeUnknownError(
    error: unknown,
    location: string,
    requestId?: string
): AppError {
    // Already an AppError
    if (isAppError(error)) {
        return error
    }

    const rid = requestId || generateRequestId()

    // Standard Error object
    if (error instanceof Error) {
        return new AppError({
            code: ErrorCode.INTERNAL_ERROR,
            message: error.message,
            location,
            requestId: rid,
            cause: error
        })
    }

    // String error
    if (typeof error === 'string') {
        return new AppError({
            code: ErrorCode.INTERNAL_ERROR,
            message: error,
            location,
            requestId: rid
        })
    }

    // Unknown type
    return new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        location,
        requestId: rid,
        meta: { originalError: String(error) }
    })
}

/**
 * Normalizes Supabase error into AppError
 */
export function normalizeSupabaseError(
    error: any,
    location: string,
    requestId?: string
): AppError {
    const rid = requestId || generateRequestId()

    // Extract Supabase error details
    const code = error?.code || 'UNKNOWN'
    const message = error?.message || 'Database query failed'
    const details = error?.details
    const hint = error?.hint

    // Customize message for known auth errors
    let finalMessage = 'A database error occurred. Please try again.'
    let finalCode = ErrorCode.SUPABASE_QUERY_FAILED

    if (code === 'invalid_credentials') {
        finalMessage = 'Invalid email or password'
        finalCode = ErrorCode.AUTH_REQUIRED
    }

    return new AppError({
        code: finalCode,
        message: finalMessage,
        location,
        requestId: rid,
        meta: {
            supabaseCode: code,
            supabaseMessage: message,
            details: details,
            hint: hint
        },
        cause: error instanceof Error ? error : undefined
    })
}
