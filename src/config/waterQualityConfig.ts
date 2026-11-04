import { WaterParameter, TapLocation } from "@/components/Data/demoData";
import { IS_10500_STANDARDS } from "@/components/Data/isStandards";

export const STALE_THRESHOLD_MINUTES = 30;

export type WQIBand = "Excellent" | "Good" | "Fair" | "Poor";
export type StationStatus = "safe" | "warning" | "danger" | "stale";
export type FreshnessMode = "live" | "partial" | "offline";

export interface StatusEvaluation {
  status: StationStatus;
  baseStatus: "safe" | "warning" | "danger";
  isStale: boolean;
  minutesAgo: number;
  wqiBand: WQIBand;
  potability: "Fit for Drinking" | "Not Fit for Drinking";
  potabilityLabel: string;
  statusLabel: string;
  exceedingParams: string[];
  nearLimitParams: string[];
}

export const WQI_BANDS: Record<WQIBand, { min: number; max: number; label: string; color: string }> = {
  Excellent: { min: 90, max: 100, label: "Excellent", color: "#22c55e" },
  Good: { min: 70, max: 89, label: "Good", color: "#22c55e" },
  Fair: { min: 50, max: 69, label: "Fair", color: "#f59e0b" },
  Poor: { min: 0, max: 49, label: "Poor", color: "#ef4444" },
};

export const STATUS_THEME = {
  safe: {
    label: "Safe",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    glow: "glow-success",
    hex: "#22c55e",
    badgeBg: "bg-success/20 text-success",
  },
  warning: {
    label: "Warning",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    glow: "glow-warning",
    hex: "#f59e0b",
    badgeBg: "bg-warning/20 text-warning",
  },
  danger: {
    label: "Danger",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    glow: "glow-danger",
    hex: "#ef4444",
    badgeBg: "bg-destructive/20 text-destructive",
  },
  stale: {
    label: "Sensor Offline / Stale",
    color: "text-muted-foreground",
    bg: "bg-secondary/40",
    border: "border-border/60",
    glow: "",
    hex: "#94a3b8",
    badgeBg: "bg-secondary text-muted-foreground border border-border/50",
  },
};

/**
 * Parses time-ago strings like "Just now", "2 mins ago", "47 mins ago", "1 hour ago"
 * into numerical minutes.
 */
export function parseMinutesAgo(timeStr: string): number {
  if (!timeStr) return 0;
  const s = timeStr.toLowerCase().trim();
  if (s.includes("just now") || s.includes("now")) return 0;

  const hrMatch = s.match(/(\d+)\s*(?:hour|hr|h)/);
  if (hrMatch) {
    return parseInt(hrMatch[1], 10) * 60;
  }

  const minMatch = s.match(/(\d+)\s*(?:min|m)/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  const dayMatch = s.match(/(\d+)\s*(?:day|d)/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10) * 1440;
  }

  return 0;
}

/**
 * Checks if a parameter exceeds permissible limit (critical breach).
 */
export function isParamPermissibleExceeded(param: WaterParameter): boolean {
  const std = IS_10500_STANDARDS[param.name.replace(" ", "_")] || IS_10500_STANDARDS[param.name];
  if (!std) return param.value > param.maxSafe;

  if (std.name === "pH") return param.value < 6.5 || param.value > 8.5;
  if (std.name === "DO") return param.value < 6.0;

  const limit = std.is10500Permissible ?? std.maxAllowed;
  return param.value > limit;
}

/**
 * Checks if a parameter exceeds desirable limit or is near its limit (>80% of permissible).
 */
export function isParamNearLimit(param: WaterParameter): boolean {
  const std = IS_10500_STANDARDS[param.name.replace(" ", "_")] || IS_10500_STANDARDS[param.name];
  if (!std) return false;

  if (std.name === "pH") {
    // Desirable is 6.8 - 7.5; outside is near limit
    return param.value < 6.8 || param.value > 7.5;
  }
  if (std.name === "DO") {
    return param.value < 7.0;
  }

  const desirable = std.is10500Desirable;
  const permissible = std.is10500Permissible ?? std.maxAllowed;

  if (desirable && param.value > desirable) return true;
  if (permissible && param.value >= permissible * 0.8) return true;

  return false;
}

/**
 * Get WQI Band: Excellent 90-100, Good 70-89, Fair 50-69, Poor below 50
 */
export function getWQIBand(wqi: number): WQIBand {
  if (wqi >= 90) return "Excellent";
  if (wqi >= 70) return "Good";
  if (wqi >= 50) return "Fair";
  return "Poor";
}

/**
 * Unified station status evaluator:
 * - Safe: WQI >= 70 and all parameters within IS 10500:2012 acceptable limits
 * - Warning: WQI 50-69, or any parameter near limit
 * - Danger: WQI < 50, or any parameter outside its permissible limit
 * - Fit for Drinking ONLY when status is Safe.
 * - Stale: when lastUpdated > STALE_THRESHOLD_MINUTES (default 30m)
 */
export function getStationStatus(tap: TapLocation): StatusEvaluation {
  const minutesAgo = parseMinutesAgo(tap.lastUpdated);
  const isStale = minutesAgo > STALE_THRESHOLD_MINUTES;
  const wqiBand = getWQIBand(tap.wqi);

  const exceedingParams: string[] = [];
  const nearLimitParams: string[] = [];

  for (const p of tap.parameters || []) {
    if (isParamPermissibleExceeded(p)) {
      exceedingParams.push(p.name);
    } else if (isParamNearLimit(p)) {
      nearLimitParams.push(p.name);
    }
  }

  let baseStatus: "safe" | "warning" | "danger" = "safe";

  if (tap.wqi < 50 || exceedingParams.length > 0) {
    baseStatus = "danger";
  } else if (tap.wqi < 70 || nearLimitParams.length > 0 || tap.sensorStatus === "faulty") {
    baseStatus = "warning";
  } else {
    baseStatus = "safe";
  }

  // Final status accounts for staleness
  const status: StationStatus = isStale ? "stale" : baseStatus;

  // Fit for Drinking strictly requires base status === "safe"
  const potability: "Fit for Drinking" | "Not Fit for Drinking" =
    baseStatus === "safe" ? "Fit for Drinking" : "Not Fit for Drinking";

  let potabilityLabel = "Fit for Drinking";
  if (baseStatus === "warning") {
    potabilityLabel = "Not Fit (Treatment Needed)";
  } else if (baseStatus === "danger") {
    potabilityLabel = "Not Fit for Drinking";
  }

  let statusLabel = STATUS_THEME[baseStatus].label;
  if (isStale) {
    statusLabel = "Sensor Offline / Stale";
  }

  return {
    status,
    baseStatus,
    isStale,
    minutesAgo,
    wqiBand,
    potability,
    potabilityLabel,
    statusLabel,
    exceedingParams,
    nearLimitParams,
  };
}

