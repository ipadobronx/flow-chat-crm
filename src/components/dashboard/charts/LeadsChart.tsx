import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const chartData = [
  { day: "Mon", leads: 120, qualified: 89 },
  { day: "Tue", leads: 200, qualified: 145 },
  { day: "Wed", leads: 180, qualified: 132 },
  { day: "Thu", leads: 250, qualified: 187 },
  { day: "Fri", leads: 320, qualified: 234 },
  { day: "Sat", leads: 280, qualified: 198 },
  { day: "Sun", leads: 190, qualified: 142 }
];

const chartConfig = {
  leads: {
    label: "Total Leads",
    color: "hsl(var(--chart-1))",
  },
  qualified: {
    label: "Qualified Leads", 
    color: "hsl(var(--chart-2))",
  },
};

export function LeadsChart() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Leads Over Time</CardTitle>
        <CardDescription>
          Daily lead generation and qualification rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="var(--color-leads)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-leads)" }}
                activeDot={{ r: 6, fill: "var(--color-leads)" }}
              />
              <Line 
                type="monotone" 
                dataKey="qualified" 
                stroke="var(--color-qualified)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-qualified)" }}
                activeDot={{ r: 6, fill: "var(--color-qualified)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}