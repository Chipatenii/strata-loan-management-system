'use client'

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar" // Assuming we have or need standard calendar
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { getBusinessReports, type ReportMetrics } from "@/lib/actions/report"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import { CalendarIcon, Download, Loader2, FileText, FileSpreadsheet } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
// Recharts
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

export default function ReportsPage() {
    const [businessId, setBusinessId] = useState<string>('')
    const [businessName, setBusinessName] = useState<string>('')
    const [dateRange, setDateRange] = useState<{ from: Date, to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    })
    const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
    const [pending, startTransition] = useTransition()
    const [rangeType, setRangeType] = useState('last30')

    // Fetch Business ID first
    useEffect(() => {
        const fetchBiz = async () => {
            const sb = createBrowserSupabaseClient()
            const { data: { user } } = await sb.auth.getUser()
            if (user) {
                const { data: profile } = await sb.from('users').select('business_id').eq('id', user.id).single()
                const { data: business } = await sb.from('businesses').select('name').eq('id', profile?.business_id).single()
                if (profile?.business_id) {
                    setBusinessId(profile.business_id)
                    setBusinessName(business?.name || 'My Business')
                }
            }
        }
        fetchBiz()
    }, [])

    // Fetch Reports when Business ID or Date Range changes
    useEffect(() => {
        if (!businessId) return

        startTransition(async () => {
            const result = await getBusinessReports(businessId, dateRange)
            if (result.data) {
                setMetrics(result.data)
            } else if (result.error) {
                console.error(result.error)
                toast.error("Failed to load reports")
            }
        })
    }, [businessId, dateRange])

    const handleRangeChange = (val: string) => {
        setRangeType(val)
        const now = new Date()
        if (val === 'last7') {
            setDateRange({ from: subDays(now, 7), to: now })
        } else if (val === 'last30') {
            setDateRange({ from: subDays(now, 30), to: now })
        } else if (val === 'thisMonth') {
            setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
        } else if (val === 'thisWeek') {
            setDateRange({ from: startOfWeek(now), to: endOfWeek(now) })
        }
    }

    const exportPDF = () => {
        if (!metrics) return
        const doc = new jsPDF()

        // Header
        doc.setFontSize(18)
        doc.text(`${businessName} - Performance Report`, 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Period: ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`, 14, 30)

        // Summary Table
        autoTable(doc, {
            startY: 40,
            head: [['Metric', 'Value']],
            body: [
                ['Loans Issued', metrics.period.loans_issued],
                ['Amount Disbursed', formatCurrency(metrics.period.amount_disbursed)],
                ['Payments Collected', formatCurrency(metrics.period.payments_collected)],
                ['Interest Expected', formatCurrency(metrics.period.interest_expected)],
                ['Active Loans', metrics.portfolio.total_active_loans],
                ['Outstanding Balance', formatCurrency(metrics.portfolio.total_outstanding)],
                ['Bad Loans (Ratio)', `${metrics.portfolio.total_bad_loans} (${metrics.portfolio.bad_loan_ratio.toFixed(1)}%)`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [66, 133, 244] } // Sky blueish
        })

        doc.save(`${businessName}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        toast.success("PDF Downloaded")
    }

    const exportCSV = () => {
        if (!metrics) return

        // Simple CSV construction
        const headers = ["Date", "Disbursed", "Collected"]
        const rows = metrics.chart_data.map(d => [d.date, d.disbursed, d.collected])

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `${businessName}_ChartData_${format(new Date(), 'yyyy-MM-dd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("CSV Downloaded")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Business Reports</h1>

                <div className="flex items-center gap-2">
                    <Select value={rangeType} onValueChange={handleRangeChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last7">Last 7 Days</SelectItem>
                            <SelectItem value="last30">Last 30 Days</SelectItem>
                            <SelectItem value="thisWeek">This Week</SelectItem>
                            <SelectItem value="thisMonth">This Month</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!metrics}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            CSV
                        </Button>
                        <Button variant="default" size="sm" onClick={exportPDF} disabled={!metrics}>
                            <FileText className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disbursed (Period)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics ? formatCurrency(metrics.period.amount_disbursed) : <Loader2 className="animate-spin" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{metrics?.period.loans_issued} new loans</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Collected (Period)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {metrics ? formatCurrency(metrics.period.payments_collected) : <Loader2 className="animate-spin" />}
                        </div>
                        <p className="text-xs text-muted-foreground">+ Profit</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {metrics ? formatCurrency(metrics.portfolio.total_outstanding) : <Loader2 className="animate-spin" />}
                        </div>
                        <p className="text-xs text-muted-foreground">Portfolio Risk</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bad Loans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics ? metrics.portfolio.total_bad_loans : <Loader2 className="animate-spin" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{metrics?.portfolio.bad_loan_ratio.toFixed(1)}% of Active</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Cash Flow Overview</CardTitle>
                    <CardDescription>Visualizing disbursement vs collection over the selected period.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full">
                        {metrics && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.chart_data}>
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `ZMW ${value}`} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Legend />
                                    <Bar dataKey="disbursed" name="Disbursed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="collected" name="Collected" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {!metrics && <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
