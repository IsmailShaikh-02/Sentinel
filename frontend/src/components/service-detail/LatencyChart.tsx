import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface LatencyDataPoint {
  timestamp: string;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

interface LatencyChartProps {
  data?: LatencyDataPoint[];
  avgMs?: number;
  p50Ms?: number;
  p95Ms?: number;
  p99Ms?: number;
}

export function LatencyChart({
  data,
  avgMs = 0,
  p50Ms = 0,
  p95Ms = 0,
  p99Ms = 0,
}: LatencyChartProps) {
  const chartData =
    data && data.length > 0
      ? data
      : [
          { timestamp: "00:00", avgMs, p50Ms, p95Ms, p99Ms },
          { timestamp: "04:00", avgMs: avgMs * 0.95, p50Ms: p50Ms * 0.95, p95Ms: p95Ms * 1.02, p99Ms: p99Ms * 1.01 },
          { timestamp: "08:00", avgMs: avgMs * 1.05, p50Ms: p50Ms * 1.02, p95Ms: p95Ms * 1.1, p99Ms: p99Ms * 1.15 },
          { timestamp: "12:00", avgMs: avgMs * 0.98, p50Ms: p50Ms * 0.97, p95Ms: p95Ms * 0.99, p99Ms: p99Ms * 1.02 },
          { timestamp: "16:00", avgMs: avgMs * 1.02, p50Ms: p50Ms * 1.01, p95Ms: p95Ms * 1.05, p99Ms: p99Ms * 1.08 },
          { timestamp: "20:00", avgMs: avgMs, p50Ms: p50Ms, p95Ms: p95Ms, p99Ms: p99Ms },
        ];

  return (
    <div className="h-[320px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-border/20" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="currentColor"
            className="text-[11px] font-mono text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="currentColor"
            className="text-[11px] font-mono text-muted-foreground"
            tickLine={false}
            axisLine={false}
            unit="ms"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(8px)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "0.75rem",
              color: "#fff",
              fontSize: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
            itemStyle={{ padding: "2px 0" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "16px", fontSize: "11px" }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="avgMs"
            name="Avg Latency"
            stroke="#38bdf8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="p50Ms"
            name="p50"
            stroke="#34d399"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="p95Ms"
            name="p95"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="p99Ms"
            name="p99"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
