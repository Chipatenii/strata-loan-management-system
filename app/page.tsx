import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
          Strata LMS
        </h1>
        <p className="text-xl text-muted-foreground">
          The future of loan management. Fast, secure, and mobile-first.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Create Account</Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-8">
          Pilot Access Only. Invite code required.
        </p>
      </div>
    </main>
  )
}
