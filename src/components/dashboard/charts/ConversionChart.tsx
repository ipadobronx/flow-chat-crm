import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const funnelData = [
  { stage: "Leads", value: 1200, conversion: 100 },
  { stage: "Contacted", value: 860, conversion: 72 },
  { stage: "Qualified", value: 520, conversion: 43 },
  { stage: "Proposal", value: 320, conversion: 27 },
  { stage: "Negotiation", value: 180, conversion: 15 },
  { stage: "Closed Won", value: 95, conversion: 8 }
];

const chartConfig = {
  value: {
    label: "Count",
    color: "hsl(var(--chart-2))",
  },
  conversion: {
    label: "Conversion %",
    color: "hsl(var(--chart-1))",
  },
};

export function ConversionChart() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Sales Funnel</CardTitle>
        <CardDescription>
          Conversion rates through the sales pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={funnelData}>
              <defs>
                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="url(#fillGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}