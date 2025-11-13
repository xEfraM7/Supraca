"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useMemo } from "react"
import { useData } from "@/lib/data-context"

export function DashboardCharts() {
  const { dispatches } = useData()

  const dispatchData = useMemo(() => {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentDispatches = dispatches.filter((d) => new Date(d.dispatch_date) >= last7Days)

    // Group by date
    const grouped = recentDispatches.reduce((acc: any, curr) => {
      const date = new Date(curr.dispatch_date).toLocaleDateString("es", {
        month: "short",
        day: "numeric",
      })

      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 }
      }

      acc[date].total += Number(curr.quantity_m3)
      acc[date].count += 1

      return acc
    }, {})

    return Object.values(grouped)
  }, [dispatches])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Despachos por Día</CardTitle>
          <CardDescription>Últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total: {
                label: "Total m³",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dispatchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" name="Total m³" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Número de Despachos</CardTitle>
          <CardDescription>Últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Cantidad",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dispatchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-count)" name="Cantidad" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
