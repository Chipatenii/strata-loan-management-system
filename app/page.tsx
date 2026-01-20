import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Building2 } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
            Strata LMS
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The future of loan management. Fast, secure, and mobile-first.
          </p>
        </div>

        {/* Portal Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Portal Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Customer Portal</CardTitle>
              <CardDescription>
                Access your loan applications, track status, and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/auth/customer/login" className="block">
                <Button size="lg" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/auth/customer/sign-up" className="block">
                <Button size="lg" variant="outline" className="w-full">
                  Sign Up with Invite Code
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Business Portal Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Business Portal</CardTitle>
              <CardDescription>
                Manage your lending business, review applications, and track performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/auth/admin/login" className="block">
                <Button size="lg" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/auth/admin/sign-up" className="block">
                <Button size="lg" variant="outline" className="w-full">
                  Register Business
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
