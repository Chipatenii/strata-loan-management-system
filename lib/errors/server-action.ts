import { generateRequestId, normalizeUnknownError } from './helpers'
import { logError } from './logger'
import { isAppError } from './AppError'

/**
 * Standard server action return type
 */
export type ServerActionResult<T = any> = {
    data?: T
    error?: string
    requestId?: string
}

/**
 * Wraps a server action with automatic error handling and requestId tracking
 * 
 * Usage:
 * export const myAction = withServerAction(
 *   async (requestId, ...args) => {
 *     // Your action logic
 *     return { data: result }
 *   },
 *   'actions/myAction'
 * )
 */
export function withServerAction<TArgs extends any[], TReturn>(
    action: (requestId: string, ...args: TArgs) => Promise<ServerActionResult<TReturn>>,
    location: string
) {
    return async function (...args: TArgs): Promise<ServerActionResult<TReturn>> {
        const requestId = generateRequestId()

        try {
            const result = await action(requestId, ...args)

            // If result has an error, log it
            if (result.error) {
                const appError = normalizeUnknownError(
                    new Error(result.error),
                    location,
                    requestId
                )
                logError(appError)
            }

            // Return result with requestId
            return {
                ...result,
                requestId
            }

        } catch (err: any) {
            // Re-throw Next.js Redirect errors
            if (err?.digest?.startsWith?.('NEXT_REDIRECT')) {
                throw err
            }

            // Normalize and log the error
            const appError = normalizeUnknownError(err, location, requestId)
            logError(appError)

            // Return user-safe error message
            return {
                error: appError.message,
                requestId
            }
        }
    }
}

/**
 * Simplified version for actions that throw instead of returning errors
 * 
 * Usage:
 * export const myAction = withServerActionThrows(
 *   async (requestId, ...args) => {
 *     const result = await db.query(...)
 *     if (error) throw error
 *     return result
 *   },
 *   'actions/myAction'
 * )
 */
export function withServerActionThrows<TArgs extends any[], TReturn>(
    action: (requestId: string, ...args: TArgs) => Promise<TReturn>,
    location: string
) {
    return async function (...args: TArgs): Promise<ServerActionResult<TReturn>> {
        const requestId = generateRequestId()

        try {
            const data = await action(requestId, ...args)
            return { data, requestId }

        } catch (err: any) {
            // Re-throw Next.js Redirect errors
            if (err?.digest?.startsWith?.('NEXT_REDIRECT')) {
                throw err
            }

            // Normalize and log the error
            const appError = normalizeUnknownError(err, location, requestId)
            logError(appError)

            // Return user-safe error message
            return {
                error: appError.message,
                requestId
            }
        }
    }
}
