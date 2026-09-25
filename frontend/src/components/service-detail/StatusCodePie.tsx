import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { Check } from "@/schemas/check.schema";

interface StatusCodePieProps {
  checks?: Check[];
}

export function StatusCodePie({ checks = [] }: StatusCodePieProps) {
  // Aggregate checks into 2xx, 4xx, 5xx, and Timeouts/Errors
  const counts = {
    "2xx (OK)": 0,
    "4xx (Client Error)": 0,
    "5xx (Server Error)": 0,
    "Timeouts / Errors": 0,
  };

  if (checks.length > 0) {
    checks.forEach((c) => {
      if (!c.ok || c.status_code === null) {
        counts["Timeouts / Errors"]++;
      } else if (c.status_code >= 200 && c.status_code < 300) {
        counts["2xx (OK)"]++;
      } else if (c.status_code >= 400 && c.status_code < 500) {
        counts["4xx (Client Error)"]++;
      } else if (c.status_code >= 500) {
        counts["5xx (Server Error)"]++;
      } else {
        counts["Timeouts / Errors"]++;
      }
    });
  } else {
    counts["2xx (OK)"] = 95;
    counts["4xx (Client Error)"] = 3;
    counts["5xx (Server Error)"] = 1;
    counts["Timeouts / Errors"] = 1;
  }

  const data = [
    { name: "2xx (OK)", value: counts["2xx (OK)"], color: "#10b981" },
    { name: "4xx (Client)", value: counts["4xx (Client Error)"], color: "#f59e0b" },
    { name: "5xx (Server)", value: counts["5xx (Server Error)"], color: "#ef4444" },
    { name: "Timeouts / Errors", value: counts["Timeouts / Errors"], color: "#64748b" },
  ].filter((item) => item.value > 0);

  return (
    <div className="h-[320px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
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
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            iconType="circle"
            iconSize={8}
          />
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={5}
            cornerRadius={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
