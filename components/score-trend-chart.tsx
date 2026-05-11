"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendDataPoint {
  timeLabel: string;
  overallScore: number | null;
  attitude: number | null;
  content: number | null;
  method: number | null;
  effect: number | null;
  interaction: number | null;
  resource: number | null;
  improve: number | null;
}

type Granularity = "semester" | "year" | "month" | "day";

const GRANULARITY_OPTIONS: { key: Granularity; label: string }[] = [
  { key: "semester", label: "学期" },
  { key: "year", label: "年" },
  { key: "month", label: "月" },
  { key: "day", label: "日" },
];

interface ScoreTrendChartProps {
  /** Base API URL without granularity param (e.g. /api/courses/xxx/score-history) */
  fetchUrl?: string;
  data?: TrendDataPoint[];
  compact?: boolean;
  className?: string;
}

function formatTimeLabel(label: string, granularity: Granularity): string {
  const semMatch = label.match(/^(\d{4})-(\d{4})-(\d)$/);
  if (semMatch) {
    return `${semMatch[1].slice(2)}-${semMatch[2].slice(2)}-${semMatch[3]}`;
  }
  if (granularity === "month" && /^\d{4}-\d{2}$/.test(label)) return label;
  if (granularity === "year" && /^\d{4}$/.test(label)) return label;
  if (granularity === "day" && /^\d{4}-\d{2}-\d{2}$/.test(label)) return label.slice(5);
  return label;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  return (
    <div className="rounded-lg border-2 border-border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        综合评分: {typeof score === "number" ? score.toFixed(1) : "—"}
      </p>
    </div>
  );
}

export default function ScoreTrendChart({
  fetchUrl,
  data: initialData,
  compact = false,
  className,
}: ScoreTrendChartProps) {
  const [data, setData] = useState<TrendDataPoint[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData && !!fetchUrl);
  const [error, setError] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>("semester");

  const buildUrl = useCallback(
    (g: Granularity) => {
      if (!fetchUrl) return "";
      // Strip existing query params — we fully control granularity & limit
      const base = fetchUrl.split("?")[0]!;
      return `${base}?granularity=${g}&limit=12`;
    },
    [fetchUrl],
  );

  useEffect(() => {
    const url = buildUrl(granularity);
    if (!url || initialData) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (!cancelled) {
          const items = (json.items ?? []) as TrendDataPoint[];
          setData(items.slice().reverse());
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [buildUrl, granularity, initialData]);

  const chartData = useMemo(() => {
    return data
      .filter((d) => d.overallScore !== null)
      .map((d) => ({ ...d, label: formatTimeLabel(d.timeLabel, granularity) }));
  }, [data, granularity]);

  if (compact) {
    if (chartData.length < 2) {
      return (
        <div className={`flex items-center justify-center text-xs text-muted-foreground h-16 ${className ?? ""}`}>
          数据不足
        </div>
      );
    }
    return (
      <div className={className} style={{ width: "100%", height: 64 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(30 80% 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(30 80% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="overallScore"
              stroke="hsl(30 70% 45%)"
              strokeWidth={2}
              fill="url(#sparklineGrad)"
              dot={false}
              activeDot={{ r: 3, fill: "hsl(30 80% 50%)", stroke: "none" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">评分趋势</CardTitle>
          <GranularitySelector value={granularity} onChange={setGranularity} />
        </CardHeader>
        <CardContent><Skeleton className="h-52 w-full" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">评分趋势</CardTitle>
          <GranularitySelector value={granularity} onChange={setGranularity} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">暂无趋势数据</div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length < 2) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">评分趋势</CardTitle>
          <GranularitySelector value={granularity} onChange={setGranularity} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
            数据不足，无法生成趋势图
          </div>
        </CardContent>
      </Card>
    );
  }

  const scores = chartData.map((d) => d.overallScore as number);
  const minScore = Number((Math.max(1, Math.min(...scores) - 0.3)).toFixed(1));
  const maxScore = Number((Math.min(5, Math.max(...scores) + 0.3)).toFixed(1));

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">评分趋势</CardTitle>
        <GranularitySelector value={granularity} onChange={setGranularity} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 10% 85%)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(30 5% 45%)" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(30 10% 80%)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minScore, maxScore]}
              tick={{ fontSize: 11, fill: "hsl(30 5% 45%)" }}
              tickLine={false}
              axisLine={false}
              tickCount={5}
              tickFormatter={(v: number) => v.toFixed(1)}
              width={36}
              label={{
                value: "综合评分",
                position: "insideLeft",
                angle: -90,
                offset: 0,
                style: { fontSize: 10, fill: "hsl(30 5% 40%)" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="overallScore"
              stroke="hsl(30 70% 45%)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(30 80% 55%)", stroke: "hsl(30 70% 45%)", strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: "hsl(30 80% 50%)", stroke: "hsl(30 70% 40%)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function GranularitySelector({
  value,
  onChange,
}: {
  value: Granularity;
  onChange: (g: Granularity) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-md border bg-muted/50 p-0.5">
      {GRANULARITY_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-1.5 py-0.5 text-[11px] rounded-sm transition-colors ${
            value === opt.key
              ? "bg-background text-foreground shadow-sm font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
