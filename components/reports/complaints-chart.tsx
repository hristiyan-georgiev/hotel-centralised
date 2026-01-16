"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ComplaintsChartProps {
  data: { date: string; total: number; resolved: number; open: number }[]
}

export function ComplaintsChart({ data }: ComplaintsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for the selected period
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        total: {
          label: "Total",
          color: "hsl(var(--primary))",
        },
        resolved: {
          label: "Resolved",
          color: "hsl(142, 76%, 36%)",
        },
        open: {
          label: "Open",
          color: "hsl(25, 95%, 53%)",
        },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            fill="url(#totalGradient)"
            strokeWidth={2}
            name="Total"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke="hsl(142, 76%, 36%)"
            fill="url(#resolvedGradient)"
            strokeWidth={2}
            name="Resolved"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}