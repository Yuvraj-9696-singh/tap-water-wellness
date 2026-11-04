import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Droplets,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDown,
  Wifi,
  WifiOff,
  Activity,
  ArrowLeft,
  Calendar,
  Sparkles,
} from "lucide-react";
import { TapLocation, WaterParameter } from "@/components/Data/demoData";
import { EnhancedTapLocation } from "@/context/WaterDataContext";
import { IS_10500_STANDARDS } from "@/components/Data/isStandards";
import {
  getStationStatus,
  STATUS_THEME,
  isParamPermissibleExceeded,
  isParamNearLimit,
} from "@/config/waterQualityConfig";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
} from "recharts";
import { generateWaterQualityReport } from "@/components/utils/reportGenerator";

interface TapDetailModalProps {
  tap: EnhancedTapLocation | TapLocation | null;
  onClose: () => void;
}

// Generate mock 24-hour historical points for parameter sparklines
function generateSparkline(baseVal: number, paramIndex: number) {
  const times = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"];
  // Deterministic pseudo-random variation
  return times.map((t, i) => {
    const variance = Math.sin(paramIndex * 1.5 + i * 0.9) * 0.12 * baseVal;
    const value = Math.max(0, parseFloat((baseVal + variance).toFixed(2)));
    return { time: t, val: value };
  });
}

// Circular WQI Gauge (120px)
const LargeCircularGauge = ({
  wqi,
  color,
  label,
  isStale,
}: {
  wqi: number;
  color: string;
  label: string;
  isStale: boolean;
}) => {
  const radius = 52;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (wqi / 100) * circumference;
  const gaugeColor = isStale ? "#94a3b8" : color;

  return (
    <div
      className={`relative flex items-center justify-center ${isStale ? "opacity-75" : ""}`}
      style={{ width: 120, height: 120 }}
      aria-label={`Water Quality Index: ${wqi}, Rating: ${label}`}
    >
      <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
        <circle
          stroke="hsl(210 40% 16%)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={60}
          cy={60}
        />
        <circle
          stroke={gaugeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={60}
          cy={60}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset,
            transition: "stroke-dashoffset 1s ease",
            filter: isStale ? "none" : `drop-shadow(0 0 8px ${gaugeColor}aa)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold font-heading text-foreground leading-none">{wqi}</span>
        <span className="text-xs text-muted-foreground leading-none mt-1">WQI Score</span>
        <span className="text-xs font-semibold leading-none mt-1" style={{ color: gaugeColor }}>
          {label}
        </span>
      </div>
    </div>
  );
};

const TapDetailModal = ({ tap, onClose }: TapDetailModalProps) => {
  // Keyboard listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!tap) return null;

  const evaluation = (tap as EnhancedTapLocation).evaluation ?? getStationStatus(tap);
  const theme = STATUS_THEME[evaluation.baseStatus];
  const isStale = evaluation.isStale;

  // Radar data
  const radarData = tap.parameters.slice(0, 8).map((p) => {
    const std = IS_10500_STANDARDS[p.name.replace(" ", "_")] || IS_10500_STANDARDS[p.name];
    const limit = std?.is10500Permissible ?? std?.maxAllowed ?? 100;
    const score = Math.min(100, Math.round((1 - Math.min(1, p.value / (limit || 1))) * 100));
    return { parameter: p.name, score: isNaN(score) ? 80 : score };
  });

  // Recent events synthesized deterministically from station telemetry
  const events = useMemo(() => {
    const list: Array<{ id: string; time: string; type: "critical" | "warning" | "success" | "info"; title: string; desc: string }> = [];

    if (isStale) {
      list.push({
        id: "ev-stale",
        time: tap.lastUpdated,
        type: "warning",
        title: "Telemetry Signal Delayed",
        desc: `No sensor heartbeat received in the last ${evaluation.minutesAgo} minutes. Showing cached parameters.`,
      });
    }

    if (tap.sensorStatus === "faulty" && tap.faultyParams) {
      list.push({
        id: "ev-faulty",
        time: "Recent",
        type: "critical",
        title: "Sensor Hardware Fault",
        desc: `Electrodes for ${tap.faultyParams.join(", ")} reported noisy readings. ML fallback model active.`,
      });
    }

    evaluation.exceedingParams.forEach((paramName) => {
      const p = tap.parameters.find((item) => item.name === paramName);
      list.push({
        id: `ev-exc-${paramName}`,
        time: "14:20",
        type: "critical",
        title: `${paramName} Exceeded Permissible Limit`,
        desc: `Recorded ${p?.value} ${p?.unit}, exceeding IS 10500 maximum permissible limit.`,
      });
    });

    evaluation.nearLimitParams.forEach((paramName) => {
      const p = tap.parameters.find((item) => item.name === paramName);
      list.push({
        id: `ev-near-${paramName}`,
        time: "11:45",
        type: "warning",
        title: `${paramName} Approaching Threshold`,
        desc: `Current reading (${p?.value} ${p?.unit}) has exceeded standard desirable limit.`,
      });
    });

    if (evaluation.baseStatus === "safe") {
      list.push({
        id: "ev-safe",
        time: tap.lastUpdated,
        type: "success",
        title: "Full IS 10500 Compliance Verified",
        desc: "All physical and chemical parameters strictly satisfy safe drinking water standards.",
      });
      list.push({
        id: "ev-routine",
        time: "08:00",
        type: "info",
        title: "Automated Sensor Self-Calibration",
        desc: "IoT optical and pH probe zero-point baseline auto-calibrated successfully.",
      });
    }

    return list.slice(0, 5);
  }, [tap, evaluation, isStale]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-md overflow-y-auto py-6 px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="glass-card rounded-3xl w-full max-w-4xl border border-border/60 shadow-2xl overflow-hidden my-auto"
        >
          {/* Top banner when stale */}
          {isStale && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-2 font-medium">
                <Clock className="h-4 w-4" />
                Sensor Offline: Data was last updated {tap.lastUpdated} (&gt;30m ago). Readings may not reflect current water conditions.
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 font-bold uppercase tracking-wider text-[10px]">
                Stale
              </span>
            </div>
          )}

          {/* Modal Header */}
          <div className="p-6 md:p-8 border-b border-border/50 bg-background/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Station Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
                    aria-label="Back to dashboard"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                  </button>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs capitalize font-medium">
                    {tap.location} Zone
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${isStale ? "bg-secondary" : theme.bg}`}>
                    <Droplets className={`h-6 w-6 ${isStale ? "text-muted-foreground" : theme.color}`} />
                  </div>
                  <div>
                    <h2 id="modal-title" className="font-heading text-2xl font-bold text-foreground">
                      {tap.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> Campus Node: {tap.id}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Updated {tap.lastUpdated}
                      </span>
                      <span>•</span>
                      {/* Sensor Health Indicator */}
                      {tap.sensorStatus === "faulty" ? (
                        <span className="flex items-center gap-1 text-warning font-semibold">
                          <WifiOff className="h-3.5 w-3.5" /> Sensor Fault (AI Active)
                        </span>
                      ) : isStale ? (
                        <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                          <WifiOff className="h-3.5 w-3.5" /> Node Offline
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-success font-semibold">
                          <Wifi className="h-3.5 w-3.5" /> IoT Telemetry Healthy
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${theme.badgeBg}`}
                  >
                    {evaluation.baseStatus === "safe" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : evaluation.baseStatus === "warning" ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Status: {evaluation.statusLabel}
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      evaluation.baseStatus === "safe"
                        ? "bg-success/20 text-success border border-success/30"
                        : evaluation.baseStatus === "warning"
                        ? "bg-warning/20 text-warning border border-warning/30"
                        : "bg-destructive/20 text-destructive border border-destructive/30"
                    }`}
                  >
                    {evaluation.potabilityLabel}
                  </div>
                </div>
              </div>

              {/* Right Side: WQI Gauge & Action Buttons */}
              <div className="flex items-center gap-5 justify-between md:justify-end">
                <LargeCircularGauge
                  wqi={tap.wqi}
                  color={theme.hex}
                  label={evaluation.wqiBand}
                  isStale={isStale}
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => generateWaterQualityReport(tap)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 border border-primary/20 transition-all shadow-sm"
                  >
                    <FileDown className="h-4 w-4" /> Download PDF
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                    aria-label="Close detail view"
                  >
                    <X className="h-4 w-4" /> Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Parameters Grid with Sparklines & IS Limits */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Live Sensor Parameters & IS 10500:2012 Compliance
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Benchmarked against Bureau of Indian Standards acceptable & permissible thresholds
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {tap.parameters.map((param, idx) => {
                  const std = IS_10500_STANDARDS[param.name.replace(" ", "_")] || IS_10500_STANDARDS[param.name];
                  const exceeds = isParamPermissibleExceeded(param);
                  const nearLimit = !exceeds && isParamNearLimit(param);
                  const isFaulty = tap.faultyParams?.includes(param.name);
                  const acceptableLimit = std?.is10500Desirable ?? std?.minAllowed ?? "—";
                  const permissibleLimit = std?.is10500Permissible ?? std?.maxAllowed ?? "—";
                  const sparkData = generateSparkline(param.value, idx);

                  const cardBorder = exceeds
                    ? "border-destructive/40 bg-destructive/5"
                    : nearLimit
                    ? "border-warning/40 bg-warning/5"
                    : "border-border/60 bg-secondary/20";

                  const sparkColor = exceeds ? "#ef4444" : nearLimit ? "#f59e0b" : "#00bcd4";

                  return (
                    <div
                      key={param.name}
                      className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${cardBorder}`}
                    >
                      <div>
                        {/* Header: Name & Indicator */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-heading font-bold text-sm text-foreground block">
                              {param.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{param.category}</span>
                          </div>

                          {/* Compliance Status Badge: Icon + Text */}
                          {exceeds ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-destructive/20 text-destructive border border-destructive/30">
                              <XCircle className="h-3 w-3 shrink-0" />
                              Exceeds Limit
                            </span>
                          ) : nearLimit ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-warning/20 text-warning border border-warning/30">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              Near Limit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-success/20 text-success border border-success/30">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              Within Limits
                            </span>
                          )}
                        </div>

                        {/* Value Display */}
                        <div className="flex items-baseline gap-1.5 my-2">
                          <span
                            className={`text-2xl font-black font-heading ${
                              exceeds ? "text-destructive" : nearLimit ? "text-warning" : "text-foreground"
                            }`}
                          >
                            {param.value}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">{param.unit}</span>
                          {isFaulty && (
                            <span className="ml-auto text-[10px] text-warning font-bold bg-warning/20 px-1.5 py-0.5 rounded">
                              AI Fallback
                            </span>
                          )}
                        </div>

                        {/* Limits Info */}
                        <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/40">
                          <div className="flex justify-between">
                            <span>Acceptable (Desirable):</span>
                            <span className="font-semibold text-foreground/80">
                              {acceptableLimit} {param.unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Permissible Max:</span>
                            <span className="font-semibold text-foreground/80">
                              {permissibleLimit} {param.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 24-Hour Sparkline */}
                      <div className="mt-3 pt-2">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1">
                          <span>24h Trend</span>
                          <span>Now: {param.value}</span>
                        </div>
                        <div style={{ height: 42 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                              <defs>
                                <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={sparkColor} stopOpacity={0.4} />
                                  <stop offset="95%" stopColor={sparkColor} stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="val"
                                stroke={sparkColor}
                                strokeWidth={2}
                                fill={`url(#grad-${idx})`}
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Recent Events & Health Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Recent Events List */}
              <div className="glass-card rounded-2xl p-5 border border-border/60">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Recent Station Events & Audit Log
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Auto-generated</span>
                </div>

                <div className="space-y-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                        ev.type === "critical"
                          ? "bg-destructive/10 border-destructive/30"
                          : ev.type === "warning"
                          ? "bg-warning/10 border-warning/30"
                          : ev.type === "success"
                          ? "bg-success/10 border-success/30"
                          : "bg-secondary/40 border-border/50"
                      }`}
                    >
                      <div className="mt-0.5">
                        {ev.type === "critical" ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : ev.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        ) : ev.type === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">{ev.title}</span>
                          <span className="text-[10px] text-muted-foreground">{ev.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{ev.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parameter Health Radar */}
              <div className="glass-card rounded-2xl p-5 border border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Parameter Health Profile
                  </h4>
                  <span className="text-[10px] text-muted-foreground">IS 10500 Sub-Index</span>
                </div>

                <div style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(210 30% 20%)" />
                      <PolarAngleAxis
                        dataKey="parameter"
                        tick={{ fill: "hsl(200 20% 70%)", fontSize: 10, fontWeight: 500 }}
                      />
                      <Radar
                        name="Health Score"
                        dataKey="score"
                        stroke="hsl(186 100% 45%)"
                        fill="hsl(186 100% 42%)"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(210 40% 10%)",
                          border: "1px solid hsl(210 30% 25%)",
                          borderRadius: 10,
                          fontSize: 12,
                          color: "#fff",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TapDetailModal;
