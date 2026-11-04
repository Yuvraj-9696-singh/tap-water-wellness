import { motion } from "framer-motion";
import { Droplets, MapPin, Clock, CheckCircle2, AlertTriangle, XCircle, WifiOff } from "lucide-react";
import { TapLocation } from "@/components/Data/demoData";
import { EnhancedTapLocation } from "@/context/WaterDataContext";
import { getStationStatus, STATUS_THEME, WQI_BANDS } from "@/config/waterQualityConfig";

interface TapCardProps {
  tap: EnhancedTapLocation | TapLocation;
  onClick: (tap: any) => void;
  index: number;
  searchTerm?: string;
}

const STATUS_ICONS = {
  safe: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  stale: WifiOff,
};

const CircularGauge = ({
  wqi,
  color,
  isStale = false,
  wqiBand,
}: {
  wqi: number;
  color: string;
  isStale?: boolean;
  wqiBand: string;
}) => {
  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (wqi / 100) * circumference;
  const labelColor = isStale ? "#94a3b8" : color;

  return (
    <div
      className={`relative flex items-center justify-center ${isStale ? "opacity-75" : ""}`}
      style={{ width: 96, height: 96 }}
      aria-label={`Water Quality Index: ${wqi}, Rating: ${wqiBand}${isStale ? ", Sensor Offline" : ""}`}
    >
      <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
        {/* Background track */}
        <circle
          stroke="hsl(210 40% 16%)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={48}
          cy={48}
        />
        {/* Progress arc */}
        <circle
          stroke={labelColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={48}
          cy={48}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset,
            transition: "stroke-dashoffset 1s ease",
            filter: isStale ? "none" : `drop-shadow(0 0 6px ${labelColor}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-heading text-foreground leading-none">{wqi}</span>
        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">WQI</span>
        <span className="text-[10px] font-medium leading-none mt-0.5" style={{ color: labelColor }}>
          {wqiBand}
        </span>
      </div>
    </div>
  );
};

const TapCard = ({ tap, onClick, index, searchTerm: _searchTerm }: TapCardProps) => {
  const evaluation = (tap as EnhancedTapLocation).evaluation ?? getStationStatus(tap);
  const cfg = STATUS_THEME[evaluation.baseStatus];
  const StatusIcon = STATUS_ICONS[evaluation.baseStatus];
  const isStale = evaluation.isStale;
  const timeAgo = tap.lastUpdated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 80, damping: 15 }}
      className={`glass-card rounded-2xl p-5 cursor-pointer border transition-all duration-300 hover:scale-[1.02] group ${
        isStale ? "border-border/60 hover:border-border" : `${cfg.border} hover:border-opacity-60`
      }`}
      onClick={() => onClick(tap)}
      role="button"
      tabIndex={0}
      aria-label={`${tap.name} — ${evaluation.statusLabel} — WQI ${tap.wqi}. Click for detailed analysis`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(tap);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isStale ? "bg-secondary" : cfg.bg}`}>
            <Droplets className={`h-4 w-4 ${isStale ? "text-muted-foreground" : cfg.color}`} />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground text-sm leading-tight">{tap.name}</h3>
          </div>
        </div>

        {/* Status Badge */}
        {isStale ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border/60">
            <WifiOff className="h-3 w-3 text-muted-foreground" />
            Sensor Offline
          </div>
        ) : (
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cfg.badgeBg}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </div>
        )}
      </div>

      {/* Location & time */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate capitalize">{tap.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Clock className="h-3 w-3 shrink-0" />
          <span className={isStale ? "text-amber-400/90 font-medium" : ""}>
            Updated {timeAgo} {isStale && "(Stale)"}
          </span>
        </div>
      </div>

      {/* Gauge + prediction */}
      <div className="flex items-center gap-4">
        <CircularGauge
          wqi={tap.wqi}
          color={cfg.hex}
          isStale={isStale}
          wqiBand={evaluation.wqiBand}
        />
        <div className="flex-1">
          <div
            className={`px-3 py-2 rounded-xl text-center text-xs font-semibold ${
              evaluation.baseStatus === "safe"
                ? "bg-success/20 text-success border border-success/30"
                : evaluation.baseStatus === "warning"
                ? "bg-warning/20 text-warning border border-warning/30"
                : "bg-destructive/20 text-destructive border border-destructive/30"
            }`}
          >
            {evaluation.potabilityLabel}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 group-hover:text-primary transition-colors">
            Click for detailed analysis →
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TapCard;
