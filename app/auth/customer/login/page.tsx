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
import { toast } from "sonner"
import Link from "next/link"
import { useTransition, useState } from "react"
import { login } from "@/lib/actions/auth"
import { Loader2 } from "lucide-react"

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
                toast.error(result.error)
            } else {
                toast.success("Welcome back!")
            }
        })
    }

    return (
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
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button className="w-full" type="submit" disabled={pending}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                    </Button>
                    <div className="text-sm text-center text-muted-foreground">
                        Need an account? <Link href="/auth/customer/sign-up" className="underline hover:text-primary">Sign up</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
