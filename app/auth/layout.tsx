import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Authentication - Strata LMS',
    description: 'Login to Strata Loan Management System',
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-sm space-y-4">
                <div className="flex flex-col items-center space-y-2 text-center">
                    {/* Logo placeholder */}
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                        S
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Strata LMS</h1>
                    <p className="text-sm text-muted-foreground">
                        Loan Management Pilot Portal
                    </p>
                </div>
                {children}
            </div>
        </div>
    )
}
