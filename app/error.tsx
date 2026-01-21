'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { generateClientRequestId } from '@/lib/errors'

/**
 * Global error boundary for Next.js app
 * Catches unhandled errors and displays user-friendly message with requestId
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const requestId = generateClientRequestId()

    useEffect(() => {
        // Log error to console with requestId for debugging
        console.error('Global error boundary caught error:', {
            requestId,
            message: error.message,
            stack: error.stack,
            digest: error.digest,
        })
    }, [error, requestId])

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="border-destructive max-w-md w-full">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <CardTitle>Something went wrong</CardTitle>
                    </div>
                    <CardDescription>
                        An unexpected error occurred. We've been notified and are working to fix it.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {requestId && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            <p>Request ID: <code className="select-all">{requestId}</code></p>
                            <p className="mt-1 text-[10px]">
                                Save this ID for support inquiries
                            </p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={reset}
                            className="flex-1"
                        >
                            Try again
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => window.location.href = '/'}
                            className="flex-1"
                        >
                            Go home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
