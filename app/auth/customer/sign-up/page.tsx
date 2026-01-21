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
import { useSearchParams } from "next/navigation"
import { Suspense, useState, useTransition } from "react"
import { signUpCustomer } from "@/lib/actions/auth"
import { Loader2 } from "lucide-react"

function SignUpForm() {
    const searchParams = useSearchParams()
    const codeParam = searchParams.get('code') || ''

    const [pending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        businessCode: codeParam,
        fullName: '',
        phone: '',
        address: ''
    })


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            showErrorToast("Passwords do not match")
            return
        }

        startTransition(async () => {
            const result = await signUpCustomer(formData)
            if (result?.error) {
                showErrorToast(result.error, result.requestId)
            } else {
                showSuccessToast("Account created! Redirecting to portal...")
            }
        })
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Customer Signup</CardTitle>
                <CardDescription>
                    Join a lending business with an invite code.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessCode">Business Invite Code</Label>
                        <Input
                            id="businessCode"
                            placeholder="e.g. BIZ123456"
                            required
                            value={formData.businessCode}
                            onChange={handleChange}
                            disabled={pending || !!codeParam}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            placeholder="John Doe"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            placeholder="+260..."
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Physical Address</Label>
                        <Input
                            id="address"
                            placeholder="Plot 123, Street Name, City"
                            required
                            value={formData.address}
                            onChange={handleChange}
                            disabled={pending}
                        />

                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
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
                            required
                            value={formData.password}
                            onChange={handleChange}
                            disabled={pending}
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={pending}
                            minLength={6}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button className="w-full" type="submit" disabled={pending}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                    </Button>
                    <div className="text-sm text-center text-muted-foreground">
                        Already have an account? <Link href="/auth/customer/login" className="underline hover:text-primary">Sign in</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}

export default function CustomerRegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignUpForm />
        </Suspense>
    )
}
