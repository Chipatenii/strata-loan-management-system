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
import { signUpAdmin } from "@/lib/actions/auth" // Corrected import
import { Loader2 } from "lucide-react"

export default function AdminRegisterPage() {
    const [pending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        businessName: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        startTransition(async () => {
            const result = await signUpAdmin(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Business created! Redirecting...")
            }
        })
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Create Business</CardTitle>
                <CardDescription>
                    Register your organization and become an Admin.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                            id="businessName"
                            placeholder="My Lending Corp"
                            required
                            value={formData.businessName}
                            onChange={handleChange}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
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
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Business"}
                    </Button>
                    <div className="text-sm text-center text-muted-foreground">
                        Already have a business? <Link href="/auth/admin/login" className="underline hover:text-primary">Sign in</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
