import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface UptimeDataPoint {
  timestamp: string;
  uptimePercentage: number;
}

interface UptimeChartProps {
  data?: UptimeDataPoint[];
  currentUptime?: number;
}

export function UptimeChart({ data, currentUptime = 100 }: UptimeChartProps) {
  const chartData =
    data && data.length > 0
      ? data
      : [
          { timestamp: "00:00", uptimePercentage: 100 },
          { timestamp: "04:00", uptimePercentage: 100 },
          { timestamp: "08:00", uptimePercentage: currentUptime < 100 ? currentUptime : 99.8 },
          { timestamp: "12:00", uptimePercentage: 100 },
          { timestamp: "16:00", uptimePercentage: 100 },
          { timestamp: "20:00", uptimePercentage: currentUptime },
        ];

  return (
    <div className="h-[320px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(52, 211, 153, 0.15)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="rgba(255, 255, 255, 0.6)"
            className="text-[11px] font-mono"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[90, 100]}
            stroke="rgba(255, 255, 255, 0.6)"
            className="text-[11px] font-mono"
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(6, 78, 59, 0.95)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(52, 211, 153, 0.3)",
              borderRadius: "1rem",
              color: "#fff",
              fontSize: "12px",
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5)",
              padding: "10px 14px",
            }}
            formatter={(value: any) => [`${value ?? 0}%`, "Uptime SLA"]}
          />
          <Area
            type="monotone"
            dataKey="uptimePercentage"
            stroke="#34d399"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#uptimeGradient)"
            activeDot={{ r: 6, fill: "#a3e635", stroke: "#064e3b", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
