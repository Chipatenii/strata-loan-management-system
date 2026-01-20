/**
 * Application configuration constants
 * Centralizes domain and app-level settings
 */

export const APP_CONFIG = {
    PRODUCTION_URL: 'https://strata-loan-management-system.vercel.app',
    APP_NAME: 'Strata LMS',
} as const

/**
 * Get the application origin URL
 * In production: always returns the configured production URL
 * In development: allows localhost or custom URL
 */
export function getAppOrigin(): string {
    // In production, always use the configured URL
    if (process.env.NODE_ENV === 'production') {
        return APP_CONFIG.PRODUCTION_URL
    }

    // In development, allow custom URL or default to localhost
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}
