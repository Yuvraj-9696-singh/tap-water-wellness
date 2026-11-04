import { motion } from "framer-motion";
import { Droplets, MapPin, Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { TapLocation } from "@/components/Data/demoData";


interface TapCardProps {
  tap: TapLocation;
  onClick: (tap: TapLocation) => void;
  index: number;
}

const STATUS_CONFIG = {
  safe: {
    icon: CheckCircle2,
    label: "Safe",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    glow: "hover:glow-success",
    arcColor: "#22c55e",
    badgeBg: "bg-success/20 text-success",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    glow: "hover:glow-warning",
    arcColor: "#f59e0b",
    badgeBg: "bg-warning/20 text-warning",
  },
  danger: {
    icon: XCircle,
    label: "Danger",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    glow: "hover:glow-danger",
    arcColor: "#ef4444",
    badgeBg: "bg-destructive/20 text-destructive",
  },
};

const WQI_LABELS: Record<string, string> = {
  Excellent: "#22c55e",
  Good: "#22c55e",
  Fair: "#f59e0b",
  Poor: "#ef4444",
  "Very Poor": "#ef4444",
};

function getWQILabel(wqi: number) {
  if (wqi >= 90) return "Excellent";
  if (wqi >= 70) return "Good";
  if (wqi >= 50) return "Fair";
  if (wqi >= 25) return "Poor";
  return "Very Poor";
}

const CircularGauge = ({ wqi, color }: { wqi: number; color: string }) => {
  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (wqi / 100) * circumference;
  const label = getWQILabel(wqi);
  const labelColor = WQI_LABELS[label];

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
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
          stroke={color}
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
            filter: `drop-shadow(0 0 6px ${color}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-heading text-foreground leading-none">{wqi}</span>
        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">WQI</span>
        <span className="text-[10px] font-medium leading-none mt-0.5" style={{ color: labelColor }}>
          {label}
        </span>
      </div>
    </div>
  );
};

const TapCard = ({ tap, onClick, index }: TapCardProps) => {
  const cfg = STATUS_CONFIG[tap.status];
  const StatusIcon = cfg.icon;
  const timeAgo = tap.lastUpdated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 80, damping: 15 }}
      className={`glass-card rounded-2xl p-5 cursor-pointer border ${cfg.border} transition-all duration-300 hover:scale-[1.02] hover:border-opacity-60 group`}
      onClick={() => onClick(tap)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
            <Droplets className={`h-4 w-4 ${cfg.color}`} />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground text-sm leading-tight">{tap.name}</h3>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.badgeBg}`}>
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </div>
      </div>

      {/* Location & time */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{tap.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Updated {timeAgo}</span>
        </div>
      </div>

      {/* Gauge + prediction */}
      <div className="flex items-center gap-4">
        <CircularGauge wqi={tap.wqi} color={cfg.arcColor} />
        <div className="flex-1">
          <div
            className={`px-3 py-2 rounded-xl text-center text-xs font-semibold ${
              tap.prediction === "Fit for Drinking"
                ? "bg-success/20 text-success border border-success/30"
                : "bg-destructive/20 text-destructive border border-destructive/30"
            }`}
          >
            {tap.prediction}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Click for detailed analysis
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TapCard;
