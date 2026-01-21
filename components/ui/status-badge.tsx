import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusBadgeProps = {
    status: string
    className?: string
}

/**
 * Semantic status badge with color coding
 * - Green: approved, active, disbursed
 * - Yellow: pending, submitted, under_review
 * - Red: rejected, defaulted, cancelled
 * - Blue: default
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
    const normalizedStatus = status?.toLowerCase() || ''

    const getVariant = () => {
        // Green - Success states
        if (['approved', 'active', 'disbursed'].includes(normalizedStatus)) {
            return 'default' // Will override with bg-green-600
        }
        // Yellow - Pending states
        if (['pending', 'submitted', 'under_review', 'pending_review'].includes(normalizedStatus)) {
            return 'secondary' // Will override with bg-yellow-600
        }
        // Red - Rejected/Failed states
        if (['rejected', 'defaulted', 'cancelled', 'closed'].includes(normalizedStatus)) {
            return 'destructive'
        }
        return 'outline'
    }

    const getColorClasses = () => {
        if (['approved', 'active', 'disbursed'].includes(normalizedStatus)) {
            return 'bg-green-600 hover:bg-green-700 text-white'
        }
        if (['pending', 'submitted', 'under_review', 'pending_review'].includes(normalizedStatus)) {
            return 'bg-yellow-600 hover:bg-yellow-700 text-white'
        }
        if (['rejected', 'defaulted', 'cancelled'].includes(normalizedStatus)) {
            return 'bg-red-600 hover:bg-red-700 text-white'
        }
        if (normalizedStatus === 'closed') {
            return 'bg-gray-600 hover:bg-gray-700 text-white'
        }
        return ''
    }

    const displayText = status
        ?.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

    return (
        <Badge
            variant={getVariant()}
            className={cn(getColorClasses(), className)}
        >
            {displayText}
        </Badge>
    )
}
