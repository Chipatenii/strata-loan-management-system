'use client'

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showErrorToast, showSuccessToast } from "@/lib/errors"
import Link from "next/link"
import { useTransition, useState } from "react"
import { login } from "@/lib/actions/auth"
import { Loader2, ArrowLeft, Building2 } from "lucide-react"

export default function CustomerLoginPage() {
    const [pending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const result = await login(formData, 'customer')
            if (result?.error) {
                showErrorToast(result.error, result.requestId)
            } else {
                showSuccessToast("Welcome back!")
            }
        })
    }

    return (
        <div className="w-full space-y-4">
            <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to landing page
                </Button>
            </Link>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Customer Login</CardTitle>
                    <CardDescription>
                        Access your loan portal.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={pending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                disabled={pending}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={pending}>
                            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                        </Button>
                        <div className="flex flex-col gap-2 text-center text-sm w-full">
                            <Link href="/auth/customer/forgot-password" className="text-muted-foreground hover:text-primary">
                                Forgot password?
                            </Link>
                            <span className="text-muted-foreground">
                                Need an account? <Link href="/auth/customer/sign-up" className="underline hover:text-primary">Sign up</Link>
                            </span>
                        </div>

                        {/* Wrong Portal Helper */}
                        <div className="w-full pt-4 border-t">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <span>Business user?</span>
                                <Link href="/auth/admin/login" className="font-medium text-primary hover:underline">
                                    Go to Business Portal
                                </Link>
                            </div>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
