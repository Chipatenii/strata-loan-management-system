/**
 * Central export for all error handling utilities
 * Import from this file instead of individual modules
 */

// Error types
export { AppError, isAppError } from './AppError'
export { ErrorCode, ERROR_HTTP_STATUS, ERROR_MESSAGES } from './codes'

// Helper functions
export {
    generateRequestId,
    createAppError,
    normalizeUnknownError,
    normalizeSupabaseError
} from './helpers'

// Logging
export { logError, logInfo, logWarn } from './logger'

// Sanitization
export { sanitizeForLogging, sanitizeErrorMeta } from './sanitization'

// Server-side wrappers
export {
    withServerAction,
    withServerActionThrows,
    type ServerActionResult
} from './server-action'

export {
    withApiHandler,
    isApiErrorResponse,
    type ApiErrorResponse
} from './api-handler'

// Client-side handlers
export {
    showErrorToast,
    showSuccessToast,
    handleFetchError,
    generateClientRequestId,
    type ErrorResponse
} from './client-handler'
