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
          <Link href="/auth/customer/login">
            <Button size="lg" className="w-full sm:w-auto">Customer Login</Button>
          </Link>
          <Link href="/auth/customer/sign-up">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Use Invite Code</Button>
          </Link>
        </div>
        <div className="pt-8">
          <p className="text-sm text-muted-foreground mb-2">For Lending Businesses</p>
          <div className="flex gap-4 justify-center text-sm">
            <Link href="/auth/admin/login" className="hover:text-primary underline">Admin Login</Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/auth/admin/sign-up" className="hover:text-primary underline">Register Business</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
