"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TagsChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
}

export function TagsChart({ data }: TagsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No complaint tags data available
      </div>
    )
  }

  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: item.color,
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          <LabelList dataKey="value" position="top" />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
