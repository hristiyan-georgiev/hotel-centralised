"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DepartmentChartProps {
  data: { name: string; value: number }[]
}

export function DepartmentChart({ data }: DepartmentChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for the selected period
      </div>
    )
  }

  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  // Generate colors for each bar
  const colors = [
    "hsl(var(--primary))",
    "hsl(215, 60%, 50%)",
    "hsl(215, 50%, 60%)",
    "hsl(215, 40%, 70%)",
    "hsl(215, 30%, 75%)",
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
        <BarChart data={sortedData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            width={100}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Complaints">
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
