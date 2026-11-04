import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { historicalData } from "@/components/Data/demoData";
import { useWaterData } from "@/context/WaterDataContext";
import { TrendingUp } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type TimeRange = "24h" | "7d" | "30d";

interface DataPoint {
  time: string;
  campusAvg: number;
  ph?: number;
  [stationId: string]: number | string | undefined;
}

// ─── Station colours ───────────────────────────────────────────────────────────
const STATION_COLORS = [
  "hsl(186 100% 55%)",
  "hsl(270 70% 65%)",
  "hsl(35 90% 55%)",
  "hsl(340 70% 60%)",
  "hsl(150 60% 50%)",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Clamp a value to [0, 100] */
const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) / 10));

/** Sinusoidal variation around a base value with a unique phase per station */
function sinVariant(base: number, amplitude: number, step: number, phase: number): number {
  return clamp(base + amplitude * Math.sin((step / 4) * Math.PI + phase));
}

/** Generate 7d data: 7 days × 4 time-slots = 28 points */
function generate7dData(campusAvg: number): DataPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = ["06:00", "12:00", "18:00", "24:00"];
  const data: DataPoint[] = [];
  let idx = 0;
  for (const day of days) {
    for (const slot of slots) {
      const drift = (idx / 28) * 6 - 3; // slow upward drift ±3
      data.push({
        time: `${day} ${slot}`,
        campusAvg: clamp(campusAvg + drift + (Math.random() * 4 - 2)),
      });
      idx++;
    }
  }
  return data;
}

/** Generate 30d data: one point per day */
function generate30dData(campusAvg: number): DataPoint[] {
  const data: DataPoint[] = [];
  for (let d = 1; d <= 30; d++) {
    const drift = (d / 30) * 8 - 4;
    data.push({
      time: `D${d}`,
      campusAvg: clamp(campusAvg + drift + (Math.random() * 6 - 3)),
    });
  }
  return data;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({
  active,
  payload,
  label,
  stationNames,
  showPh,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  stationNames: Record<string, string>;
  showPh: boolean;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const getStatus = (wqi: number) => {
    if (wqi >= 90) return { label: "Excellent", color: "#22c55e" };
    if (wqi >= 70) return { label: "Good", color: "#22c55e" };
    if (wqi >= 50) return { label: "Fair", color: "#f59e0b" };
    if (wqi >= 25) return { label: "Poor", color: "#f97316" };
    return { label: "Very Poor", color: "#ef4444" };
  };

  return (
    <div className="glass-card rounded-xl p-3 border border-border/50 text-xs space-y-1 max-w-[200px]">
      <p className="text-muted-foreground font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => {
        if (entry.value == null) return null;
        const isCampus = entry.dataKey === "campusAvg";
        const isPh = entry.dataKey === "ph";
        const stationLabel = isCampus
          ? "Campus Avg"
          : isPh
          ? "pH"
          : stationNames[entry.dataKey] ?? entry.dataKey;
        const status = !isPh ? getStatus(entry.value) : null;
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            <span style={{ color: entry.color }} className="font-semibold truncate">
              {stationLabel}
            </span>
            <span className="font-mono text-foreground">
              {isPh ? entry.value : `${entry.value}`}
              {!isPh && status && (
                <span
                  className="ml-1 text-[9px] font-bold uppercase px-1 rounded"
                  style={{ color: status.color }}
                >
                  {status.label}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────
const TrendChart = () => {
  const { campusAvgWqi, taps } = useWaterData();
  const [range, setRange] = useState<TimeRange>("24h");
  const [enabledStations, setEnabledStations] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(taps.map((t) => [t.id, true]))
  );
  const [showPh, setShowPh] = useState(false);

  // ── Generate per-station 24h data inline ──────────────────────────────────
  const data24h: DataPoint[] = useMemo(() => {
    return historicalData.map((point, stepIdx) => {
      const dp: DataPoint = {
        time: point.time,
        campusAvg: point.wqi,
        ph: point.ph,
      };
      taps.forEach((tap, tapIdx) => {
        dp[tap.id] = sinVariant(tap.wqi, 8, stepIdx, tapIdx * 1.2);
      });
      return dp;
    });
  }, [taps]);

  const data7d = useMemo(() => generate7dData(campusAvgWqi), [campusAvgWqi]);
  const data30d = useMemo(() => generate30dData(campusAvgWqi), [campusAvgWqi]);

  const chartData = range === "24h" ? data24h : range === "7d" ? data7d : data30d;
  const is24h = range === "24h";

  const stationNames: Record<string, string> = useMemo(
    () => Object.fromEntries(taps.map((t) => [t.id, t.name])),
    [taps]
  );

  const toggleStation = (id: string) =>
    setEnabledStations((prev) => ({ ...prev, [id]: !prev[id] }));

  const xLabel = is24h ? "Time" : range === "7d" ? "Day / Time" : "Day";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6 mb-8"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">WQI Trend</h3>
            <p className="text-xs text-muted-foreground">
              Avg WQI: {campusAvgWqi} — Campus average
            </p>
          </div>
        </div>

        {/* Time-range pills */}
        <div className="flex items-center gap-1.5">
          {(["24h", "7d", "30d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Station toggles (24h only) ── */}
      {is24h && (
        <div className="flex flex-wrap gap-2 mb-4">
          {taps.map((tap, idx) => (
            <button
              key={tap.id}
              onClick={() => toggleStation(tap.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                enabledStations[tap.id]
                  ? "border-transparent text-background shadow-sm"
                  : "border-border text-muted-foreground bg-transparent"
              }`}
              style={
                enabledStations[tap.id]
                  ? { backgroundColor: STATION_COLORS[idx % STATION_COLORS.length] }
                  : {}
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATION_COLORS[idx % STATION_COLORS.length] }}
              />
              {tap.name}
            </button>
          ))}
          <button
            onClick={() => setShowPh((p) => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              showPh
                ? "bg-blue-500 border-transparent text-white shadow-sm"
                : "border-border text-muted-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            Show pH
          </button>
        </div>
      )}

      {/* ── Main WQI Chart ── */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 55, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="campusGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(186 100% 42%)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="hsl(186 100% 42%)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 18%)" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(200 20% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: xLabel, position: "insideBottomRight", offset: -4, fill: "hsl(200 20% 55%)", fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: "hsl(200 20% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              label={{ value: "WQI (0–100)", angle: -90, position: "insideLeft", offset: 18, fill: "hsl(200 20% 55%)", fontSize: 10 }}
            />

            <Tooltip
              content={
                <CustomTooltip stationNames={stationNames} showPh={showPh && is24h} />
              }
            />

            {/* Safe threshold reference line */}
            <ReferenceLine
              y={70}
              stroke="hsl(152 69% 40%)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: "Safe Threshold (WQI 70)",
                position: "right",
                fill: "hsl(152 69% 40%)",
                fontSize: 9,
                fontWeight: 600,
              }}
            />

            {/* Campus average — dashed cyan area + thick line, always visible */}
            <Area
              type="monotone"
              dataKey="campusAvg"
              stroke="hsl(186 100% 55%)"
              strokeWidth={3}
              strokeDasharray="6 3"
              fill="url(#campusGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "hsl(186 100% 55%)" }}
              name="Campus Avg"
            />

            {/* Per-station lines (24h only) */}
            {is24h &&
              taps.map((tap, idx) =>
                enabledStations[tap.id] ? (
                  <Line
                    key={tap.id}
                    type="monotone"
                    dataKey={tap.id}
                    stroke={STATION_COLORS[idx % STATION_COLORS.length]}
                    strokeWidth={1.8}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name={tap.name}
                  />
                ) : null
              )}

            {/* pH line (24h + toggle) */}
            {is24h && showPh && (
              <Line
                type="monotone"
                dataKey="ph"
                stroke="#60a5fa"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4, fill: "#60a5fa" }}
                name="pH"
                yAxisId={0}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Mini pH chart (24h + toggle) ── */}
      {is24h && showPh && (
        <div className="mt-3" style={{ height: 80 }}>
          <p className="text-xs text-muted-foreground mb-1 pl-4">pH (0–14)</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data24h} margin={{ top: 0, right: 55, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 18%)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "hsl(200 20% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 14]} tick={{ fill: "hsl(200 20% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(210 40% 15%)", border: "1px solid hsl(210 30% 30%)", borderRadius: 8, fontSize: 11, color: "#fff" }}
                formatter={(v: any) => [`pH: ${v}`, ""]}
                labelFormatter={(l) => l}
              />
              <ReferenceLine y={6.5} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.6} />
              <ReferenceLine y={8.5} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.6} />
              <Line type="monotone" dataKey="ph" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Legend row ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block"
            style={{
              width: 20,
              height: 2,
              background: "hsl(186 100% 55%)",
              borderTop: "2px dashed hsl(186 100% 55%)",
              borderRadius: 2,
            }}
          />
          Campus Avg
        </span>
        {is24h &&
          taps.map((tap, idx) => (
            <span
              key={tap.id}
              className={`flex items-center gap-1.5 transition-opacity ${
                enabledStations[tap.id] ? "opacity-100" : "opacity-30"
              }`}
            >
              <span
                className="inline-block h-0.5 w-5 rounded"
                style={{ backgroundColor: STATION_COLORS[idx % STATION_COLORS.length] }}
              />
              {tap.name}
            </span>
          ))}
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: "hsl(152 69% 40%)" }} />
          Safe Threshold
        </span>
      </div>
    </motion.div>
  );
};

export default TrendChart;
