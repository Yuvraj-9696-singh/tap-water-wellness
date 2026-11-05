import { useState, useMemo, useEffect, useCallback } from "react";
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
} from "recharts";
import { useWaterData, EnhancedTapLocation } from "@/context/WaterDataContext";
import { TrendingUp, Play, Pause, Plus, Radio } from "lucide-react";

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

/** Generate 5-minute interval baseline telemetry (72 points = past 6 hours) */
function generate5MinBaseline(taps: EnhancedTapLocation[]): DataPoint[] {
  const pointsCount = 72; // 6 hours at 5-minute intervals
  const startMinute = 8 * 60; // 08:00
  const data: DataPoint[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const totalMinutes = startMinute + i * 5;
    const hh = Math.floor((totalMinutes % 1440) / 60).toString().padStart(2, "0");
    const mm = (totalMinutes % 60).toString().padStart(2, "0");
    const time = `${hh}:${mm}`;

    const dp: DataPoint = { time, campusAvg: 0 };
    let sumWqi = 0;

    taps.forEach((tap, tapIdx) => {
      // Natural sensor micro-variance: macro diurnal variation + high-frequency telemetry jitter
      const diurnal = Math.sin((i / 36) * Math.PI + tapIdx * 1.3) * 2.8;
      const microJitter = (Math.random() - 0.5) * 2.4; // ±1.2 WQI natural sensor noise
      const stepVal = clamp(tap.wqi + diurnal + microJitter);
      dp[tap.id] = stepVal;
      sumWqi += stepVal;
    });

    dp.campusAvg = Math.round((sumWqi / (taps.length || 1)) * 10) / 10;
    // pH with realistic micro-fluctuations around 7.1
    dp.ph = Math.round((7.1 + Math.sin(i / 15) * 0.2 + (Math.random() - 0.5) * 0.12) * 100) / 100;

    data.push(dp);
  }

  return data;
}

/** Generate 7d data with realistic linear fluctuations */
function generate7dData(campusAvg: number): DataPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
  const data: DataPoint[] = [];
  let idx = 0;
  for (const day of days) {
    for (const slot of slots) {
      const diurnal = Math.sin((idx / 6) * Math.PI) * 3;
      const jitter = (Math.random() - 0.5) * 2.8;
      data.push({
        time: `${day} ${slot}`,
        campusAvg: clamp(campusAvg + diurnal + jitter),
      });
      idx++;
    }
  }
  return data;
}

/** Generate 30d data with realistic linear fluctuations */
function generate30dData(campusAvg: number): DataPoint[] {
  const data: DataPoint[] = [];
  for (let d = 1; d <= 30; d++) {
    const drift = Math.sin((d / 15) * Math.PI) * 4;
    const jitter = (Math.random() - 0.5) * 3.5;
    data.push({
      time: `Day ${d}`,
      campusAvg: clamp(campusAvg + drift + jitter),
    });
  }
  return data;
}

// ─── Custom Active Dot with On-Node Value Label ────────────────────────────────
const renderNodeDot = (color: string) => (props: any) => {
  const { cx, cy, key } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={2.5}
      fill={color}
      stroke="#0b1120"
      strokeWidth={1}
    />
  );
};

const renderActiveNodeDot = (color: string) => (props: any) => {
  const { cx, cy, value, dataKey } = props;
  if (cx == null || cy == null || value == null) return null;
  const numVal = typeof value === "number" ? Math.round(value * 10) / 10 : value;

  return (
    <g key={`act-${dataKey}-${cx}-${cy}`} className="pointer-events-none">
      {/* Outer pulsing ping halo */}
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Prominent highlighted dot marker */}
      <circle
        cx={cx}
        cy={cy}
        r={5.5}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
      />
      {/* Node label pinned directly above the data point */}
      <g transform={`translate(${cx}, ${cy - 14})`}>
        <rect
          x={-22}
          y={-17}
          width={44}
          height={17}
          rx={5}
          fill="#090d16"
          stroke={color}
          strokeWidth={1.5}
        />
        <polygon points="-4,-1 4,-1 0,3" fill={color} />
        <text
          x={0}
          y={-5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={10}
          fontWeight={700}
          fontFamily="Space Grotesk, sans-serif"
        >
          {numVal}
        </text>
      </g>
    </g>
  );
};

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
    <div className="glass-card rounded-xl p-3 border border-border/60 text-xs space-y-1.5 shadow-2xl backdrop-blur-xl bg-background/95 min-w-[210px] pointer-events-none">
      <div className="flex items-center justify-between border-b border-border/40 pb-1 mb-1">
        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {label} (5m sample)
        </span>
        <span className="text-[10px] font-mono text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10">
          Telemetry
        </span>
      </div>
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
            <span style={{ color: entry.color }} className="font-semibold truncate flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {stationLabel}
            </span>
            <span className="font-mono text-foreground font-bold">
              {isPh ? entry.value : `${Math.round(entry.value * 10) / 10}`}
              {!isPh && status && (
                <span
                  className="ml-1.5 text-[9px] font-bold uppercase px-1 rounded"
                  style={{ color: status.color, backgroundColor: `${status.color}15` }}
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

  // 5-minute sampling state & live update generator
  const [live24hData, setLive24hData] = useState<DataPoint[]>(() => generate5MinBaseline(taps));
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  // Re-sync stations when taps list changes
  useEffect(() => {
    setEnabledStations((prev) => {
      const next = { ...prev };
      taps.forEach((t) => {
        if (next[t.id] === undefined) next[t.id] = true;
      });
      return next;
    });
  }, [taps]);

  // Append new 5-minute telemetry point with realistic sensor variance
  const appendNext5MinPoint = useCallback(() => {
    setLive24hData((prev) => {
      if (prev.length === 0) return generate5MinBaseline(taps);
      const lastPoint = prev[prev.length - 1];
      const [hh, mm] = lastPoint.time.split(":").map(Number);
      const nextTotalMinutes = (hh * 60 + mm + 5) % 1440;
      const nextHh = Math.floor(nextTotalMinutes / 60).toString().padStart(2, "0");
      const nextMm = (nextTotalMinutes % 60).toString().padStart(2, "0");
      const nextTime = `${nextHh}:${nextMm}`;

      const newPoint: DataPoint = { time: nextTime, campusAvg: 0 };
      let sumWqi = 0;

      taps.forEach((tap) => {
        const prevVal =
          typeof lastPoint[tap.id] === "number" ? (lastPoint[tap.id] as number) : tap.wqi;
        // Natural random walk with mild mean-reverting pull toward base tap.wqi
        const pullToBase = (tap.wqi - prevVal) * 0.12;
        const microJitter = (Math.random() - 0.5) * 2.4;
        const nextVal = clamp(prevVal + pullToBase + microJitter);
        newPoint[tap.id] = nextVal;
        sumWqi += nextVal;
      });

      newPoint.campusAvg = Math.round((sumWqi / (taps.length || 1)) * 10) / 10;
      const prevPh = typeof lastPoint.ph === "number" ? lastPoint.ph : 7.1;
      const nextPh =
        Math.round((prevPh + (7.1 - prevPh) * 0.15 + (Math.random() - 0.5) * 0.08) * 100) / 100;
      newPoint.ph = nextPh;

      // Keep rolling window up to 144 points (12 hours of 5-min intervals)
      const updated = [...prev, newPoint];
      if (updated.length > 144) {
        return updated.slice(updated.length - 144);
      }
      return updated;
    });
  }, [taps]);

  // Live timer: simulate real-time sensor updates every 3.5 seconds
  useEffect(() => {
    if (!isLiveStreaming || range !== "24h") return;

    const interval = setInterval(() => {
      appendNext5MinPoint();
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, range, appendNext5MinPoint]);

  const data7d = useMemo(() => generate7dData(campusAvgWqi), [campusAvgWqi]);
  const data30d = useMemo(() => generate30dData(campusAvgWqi), [campusAvgWqi]);

  const chartData = range === "24h" ? live24hData : range === "7d" ? data7d : data30d;
  const is24h = range === "24h";

  const stationNames: Record<string, string> = useMemo(
    () => Object.fromEntries(taps.map((t) => [t.id, t.name])),
    [taps]
  );

  const toggleStation = (id: string) =>
    setEnabledStations((prev) => ({ ...prev, [id]: !prev[id] }));

  // Dynamic X-axis interval to ensure labels don't collide while keeping every 5-min point interactive
  const tickInterval = useMemo(() => {
    if (chartData.length > 100) return 12; // Ticks spaced by ~1 hour (12 * 5m)
    if (chartData.length > 50) return 6;   // Ticks spaced by ~30 mins (6 * 5m)
    return 2;
  }, [chartData.length]);

  const xLabel = is24h ? "Time (5-min intervals)" : range === "7d" ? "Day / Time" : "Day";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6 mb-8 border border-primary/20 shadow-2xl"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-foreground text-base">
                WQI Telemetry Trend
              </h3>
              {is24h && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span
                    className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${
                      isLiveStreaming ? "animate-pulse" : "opacity-40"
                    }`}
                  />
                  {isLiveStreaming ? "Streaming 5m Live" : "Stream Paused"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg WQI: <span className="text-foreground font-semibold">{campusAvgWqi}</span> • Linear
              5-min telemetry interval
            </p>
          </div>
        </div>

        {/* Live Controls & Time-range pills */}
        <div className="flex flex-wrap items-center gap-2">
          {is24h && (
            <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setIsLiveStreaming((p) => !p)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isLiveStreaming
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={isLiveStreaming ? "Pause live telemetry" : "Resume live telemetry stream"}
              >
                {isLiveStreaming ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isLiveStreaming ? "Live" : "Paused"}
              </button>
              <button
                onClick={appendNext5MinPoint}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                title="Manually append next 5-min sample"
              >
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">5m Sample</span>
              </button>
            </div>
          )}

          {/* Time range switcher */}
          <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/40">
            {(["24h", "7d", "30d"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  range === r
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Station toggles (24h only) ── */}
      {is24h && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Radio className="h-3 w-3 text-primary" /> Stations:
          </span>
          {taps.map((tap, idx) => (
            <button
              key={tap.id}
              onClick={() => toggleStation(tap.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                enabledStations[tap.id]
                  ? "border-transparent text-slate-900 shadow-sm"
                  : "border-border text-muted-foreground bg-transparent hover:border-slate-700"
              }`}
              style={
                enabledStations[tap.id]
                  ? { backgroundColor: STATION_COLORS[idx % STATION_COLORS.length] }
                  : {}
              }
            >
              <span
                className="h-2 w-2 rounded-full border border-black/30"
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
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            Show pH
          </button>
        </div>
      )}

      {/* ── Main WQI Chart (Linear & Jagged Realism) ── */}
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 18, right: 65, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="campusGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(186 100% 42%)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="hsl(186 100% 42%)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 18%)" vertical={false} />

            <XAxis
              dataKey="time"
              interval={tickInterval}
              tick={{ fill: "hsl(200 20% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: xLabel,
                position: "insideBottomRight",
                offset: -4,
                fill: "hsl(200 20% 55%)",
                fontSize: 10,
              }}
            />
            <YAxis
              tick={{ fill: "hsl(200 20% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              label={{
                value: "WQI (0–100)",
                angle: -90,
                position: "insideLeft",
                offset: 18,
                fill: "hsl(200 20% 55%)",
                fontSize: 10,
              }}
            />

            <Tooltip
              content={<CustomTooltip stationNames={stationNames} showPh={showPh && is24h} />}
            />

            {/* Safe threshold reference line (WQI 70) */}
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

            {/* Campus average — linear jagged area + thick dashed cyan line */}
            <Area
              type="linear"
              dataKey="campusAvg"
              stroke="hsl(186 100% 55%)"
              strokeWidth={2.8}
              strokeDasharray="6 3"
              fill="url(#campusGrad)"
              dot={renderNodeDot("hsl(186 100% 55%)")}
              activeDot={renderActiveNodeDot("hsl(186 100% 55%)")}
              name="Campus Avg"
            />

            {/* Per-station lines (Linear jagged segments with visible node dots & hover badges) */}
            {is24h &&
              taps.map((tap, idx) => {
                const color = STATION_COLORS[idx % STATION_COLORS.length];
                return enabledStations[tap.id] ? (
                  <Line
                    key={tap.id}
                    type="linear"
                    dataKey={tap.id}
                    stroke={color}
                    strokeWidth={1.8}
                    dot={renderNodeDot(color)}
                    activeDot={renderActiveNodeDot(color)}
                    name={tap.name}
                  />
                ) : null;
              })}

            {/* Optional pH line (Linear) */}
            {is24h && showPh && (
              <Line
                type="linear"
                dataKey="ph"
                stroke="#60a5fa"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={renderNodeDot("#60a5fa")}
                activeDot={renderActiveNodeDot("#60a5fa")}
                name="pH"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Mini pH chart (24h + toggle, Linear) ── */}
      {is24h && showPh && (
        <div className="mt-4 p-3 rounded-xl bg-background/50 border border-border/40" style={{ height: 100 }}>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 pl-2">
            <span>pH Telemetry (0–14)</span>
            <span className="text-[10px] text-amber-400 font-semibold">Safe: 6.5 – 8.5</span>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={live24hData} margin={{ top: 4, right: 65, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 18%)" vertical={false} />
              <XAxis dataKey="time" interval={tickInterval} tick={{ fill: "hsl(200 20% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[5.5, 9.0]} tick={{ fill: "hsl(200 20% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(210 40% 15%)",
                  border: "1px solid hsl(210 30% 30%)",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#fff",
                }}
                formatter={(v: any) => [`pH: ${v}`, ""]}
                labelFormatter={(l) => `${l} (5m)`}
              />
              <ReferenceLine y={6.5} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.6} />
              <ReferenceLine y={8.5} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.6} />
              <Line
                type="linear"
                dataKey="ph"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={renderNodeDot("#60a5fa")}
                activeDot={renderActiveNodeDot("#60a5fa")}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Legend row ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className="inline-block"
            style={{
              width: 18,
              height: 2,
              background: "hsl(186 100% 55%)",
              borderTop: "2px dashed hsl(186 100% 55%)",
              borderRadius: 2,
            }}
          />
          Campus Avg (Dashed Area)
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
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: STATION_COLORS[idx % STATION_COLORS.length] }}
              />
              {tap.name}
            </span>
          ))}
        <span className="flex items-center gap-1.5 ml-auto font-medium">
          <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: "hsl(152 69% 40%)" }} />
          Safe Threshold (70)
        </span>
      </div>
    </motion.div>
  );
};

export default TrendChart;
