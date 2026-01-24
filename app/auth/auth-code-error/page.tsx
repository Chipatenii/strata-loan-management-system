import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm border-t-4 border-t-destructive">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2 text-destructive">
                        <AlertCircle className="h-6 w-6" />
                        <span className="font-bold text-lg">Authentication Error</span>
                    </div>
                    <CardTitle>Link Expired or Invalid</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        The link you used is invalid or has expired. This often happens if:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                        <li>The link was already used</li>
                        <li>The link has expired (links are valid for a short time)</li>
                        <li>The link logic was copied incorrectly</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Link href="/auth/customer/login" className="w-full">
                        <Button className="w-full">Back to Login</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
