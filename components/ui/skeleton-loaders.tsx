import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-md border bg-white">
            <div className="p-4 space-y-3">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start  justify-between gap-3">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-[180px]" />
                                <Skeleton className="h-3 w-[150px]" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function DashboardMetricsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(count)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[120px]" />
                        <Skeleton className="h-3 w-[80px] mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
