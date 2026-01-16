"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ResolutionTimeChartProps {
  data: { name: string; value: number }[]
}

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  const hasData = data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No resolved complaints in the selected period
      </div>
    )
  }

  // Color scale from green (fast) to orange (slow)
  const colors = [
    "hsl(142, 76%, 36%)", // < 1 hour - green
    "hsl(90, 60%, 45%)", // 1-4 hours
    "hsl(45, 93%, 47%)", // 4-24 hours - yellow
    "hsl(25, 95%, 53%)", // 1-3 days - orange
    "hsl(0, 84%, 60%)", // > 3 days - red
  ]

  return (
    <ChartContainer
      config={{
        value: {
          label: "Complaints",
          color: "hsl(var(--primary))",
        },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Complaints">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
