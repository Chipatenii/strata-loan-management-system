import { NextResponse } from 'next/server'
import { generateRequestId, normalizeUnknownError } from './helpers'
import { logError } from './logger'

/**
 * Wraps an API route handler with automatic error handling and requestId tracking
 * 
 * Usage:
 * export const GET = withApiHandler(
 *   async (request, requestId) => {
 *     // Your handler logic
 *     const data = await fetchData()
 *     return data
 *   },
 *   'api/my-route'
 * )
 */
export function withApiHandler<T>(
    handler: (request: Request, requestId: string) => Promise<T>,
    location: string
) {
    return async function (request: Request): Promise<Response> {
        const requestId = generateRequestId()

        try {
            const result = await handler(request, requestId)

            // Return successful response with requestId
            return NextResponse.json({
                data: result,
                requestId
            })

        } catch (err) {
            // Normalize and log the error
            const appError = normalizeUnknownError(err, location, requestId)
            logError(appError)

            // Return error response
            return NextResponse.json({
                error: {
                    code: appError.code,
                    message: appError.message,  // User-safe message
                    requestId: appError.requestId,
                    location: appError.location
                }
            }, {
                status: appError.httpStatus
            })
        }
    }
}

/**
 * Response type for API errors
 */
export type ApiErrorResponse = {
    error: {
        code: string
        message: string
        requestId: string
        location: string
    }
}

/**
 * Type guard for API error responses
 */
export function isApiErrorResponse(response: any): response is ApiErrorResponse {
    return (
        response &&
        typeof response === 'object' &&
        'error' in response &&
        typeof response.error === 'object' &&
        'code' in response.error &&
        'message' in response.error &&
        'requestId' in response.error
    )
}
