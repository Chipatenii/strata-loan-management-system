/**
 * Error codes used throughout the application
 * Each code maps to an HTTP status and user-friendly message
 */

export enum ErrorCode {
    // Authentication & Authorization (4xx)
    AUTH_REQUIRED = 'AUTH_REQUIRED',
    FORBIDDEN = 'FORBIDDEN',
    ROLE_MISMATCH = 'ROLE_MISMATCH',
    BUSINESS_SCOPE_MISSING = 'BUSINESS_SCOPE_MISSING',

    // Validation & Client Errors (4xx)
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    NOT_FOUND = 'NOT_FOUND',

    // Database & Supabase Errors (5xx)
    SUPABASE_QUERY_FAILED = 'SUPABASE_QUERY_FAILED',

    // Storage Errors (5xx)
    STORAGE_UPLOAD_FAILED = 'STORAGE_UPLOAD_FAILED',
    STORAGE_SIGNED_URL_FAILED = 'STORAGE_SIGNED_URL_FAILED',

    // Generic Server Errors (5xx)
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Maps error codes to HTTP status codes
 */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
    [ErrorCode.AUTH_REQUIRED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.ROLE_MISMATCH]: 403,
    [ErrorCode.BUSINESS_SCOPE_MISSING]: 403,
    [ErrorCode.VALIDATION_FAILED]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.SUPABASE_QUERY_FAILED]: 500,
    [ErrorCode.STORAGE_UPLOAD_FAILED]: 500,
    [ErrorCode.STORAGE_SIGNED_URL_FAILED]: 500,
    [ErrorCode.INTERNAL_ERROR]: 500,
}

/**
 * Maps error codes to user-friendly messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    [ErrorCode.AUTH_REQUIRED]: 'Authentication required. Please log in.',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
    [ErrorCode.ROLE_MISMATCH]: 'Your account role does not allow this action.',
    [ErrorCode.BUSINESS_SCOPE_MISSING]: 'Business context is missing. Please contact support.',
    [ErrorCode.VALIDATION_FAILED]: 'The provided information is invalid. Please check and try again.',
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.SUPABASE_QUERY_FAILED]: 'A database error occurred. Please try again.',
    [ErrorCode.STORAGE_UPLOAD_FAILED]: 'Failed to upload file. Please try again.',
    [ErrorCode.STORAGE_SIGNED_URL_FAILED]: 'Failed to access file. Please try again.',
    [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
}
