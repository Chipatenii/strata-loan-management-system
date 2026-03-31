import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function KycLoading() {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-56" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-36" />
                                    <Skeleton className="h-3 w-44" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
