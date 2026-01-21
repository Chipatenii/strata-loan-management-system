'use client'

import { toast } from 'sonner'
import { generateRequestId } from './helpers'

/**
 * Error response from server (API or server action)
 */
export type ErrorResponse = {
    message?: string
    error?: string
    requestId?: string
    code?: string
    location?: string
}

/**
 * Displays an error toast with user-friendly message and copyable requestId
 * 
 * Usage:
 * showErrorToast(result.error, result.requestId)
 * showErrorToast({ message: '...', requestId: '...' })
 */
export function showErrorToast(
    error: string | ErrorResponse | undefined,
    requestId?: string,
    fallbackMessage = 'An error occurred'
): void {
    // Handle undefined/null
    if (!error) {
        return
    }

    // Parse error object or string
    const errorObj: ErrorResponse = typeof error === 'string'
        ? { message: error, requestId }
        : error

    const message = errorObj.message || errorObj.error || fallbackMessage
    const rid = errorObj.requestId || requestId

    // Show toast with message and requestId
    if (rid) {
        toast.error(message, {
            duration: 5000,
            description: `Request ID: ${rid} (click to copy)`,
            action: {
                label: 'Copy ID',
                onClick: () => {
                    navigator.clipboard.writeText(rid)
                    toast.success('Request ID copied', { duration: 1000 })
                }
            }
        })
    } else {
        toast.error(message, {
            duration: 5000,
        })
    }
}

/**
 * Displays a success toast
 */
export function showSuccessToast(message: string): void {
    toast.success(message)
}

/**
 * Handles fetch errors and displays appropriate toast
 * Returns the requestId if available
 */
export function handleFetchError(error: any): string | undefined {
    if (error && typeof error === 'object') {
        const requestId = error.requestId
        const message = error.message || error.error

        showErrorToast({ message, requestId })
        return requestId
    }

    showErrorToast(String(error))
    return undefined
}

/**
 * Client-side request ID generator for errors that occur on the client
 */
export function generateClientRequestId(): string {
    return generateRequestId()
}
