import React, { createContext, useContext, useMemo, useState } from "react";
import { demoTaps, TapLocation } from "@/components/Data/demoData";
import {
  getStationStatus,
  StatusEvaluation,
  StationStatus,
  FreshnessMode,
} from "@/config/waterQualityConfig";

export interface EnhancedTapLocation extends TapLocation {
  evaluation: StatusEvaluation;
}

export interface WaterStats {
  total: number;
  safe: number;
  warning: number;
  danger: number;
  stale: number;
  avgWqi: number;
}

export interface FreshnessStatus {
  mode: FreshnessMode;
  freshCount: number;
  staleCount: number;
  label: string;
}

interface WaterDataContextValue {
  taps: EnhancedTapLocation[];
  stats: WaterStats;
  freshness: FreshnessStatus;
  campusAvgWqi: number;
  filter: "all" | "safe" | "warning" | "danger" | "stale";
  setFilter: (filter: "all" | "safe" | "warning" | "danger" | "stale") => void;
  selectedTap: EnhancedTapLocation | null;
  setSelectedTap: (tap: EnhancedTapLocation | null) => void;
  getTapById: (id: string) => EnhancedTapLocation | undefined;
}

const WaterDataContext = createContext<WaterDataContextValue | undefined>(undefined);

export const WaterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filter, setFilter] = useState<"all" | "safe" | "warning" | "danger" | "stale">("all");
  const [selectedTap, setSelectedTap] = useState<EnhancedTapLocation | null>(null);

  // Single source of truth: enrich demoTaps with centralized status evaluation
  const taps: EnhancedTapLocation[] = useMemo(() => {
    return demoTaps.map((rawTap) => {
      const evaluation = getStationStatus(rawTap);
      return {
        ...rawTap,
        // Override any inconsistent manual flags with centralized evaluation
        status: evaluation.baseStatus,
        prediction: evaluation.potability,
        evaluation,
      };
    });
  }, []);

  // Compute campus metrics strictly from live station records
  const campusAvgWqi = useMemo(() => {
    if (taps.length === 0) return 0;
    const total = taps.reduce((acc, tap) => acc + tap.wqi, 0);
    return Math.round(total / taps.length);
  }, [taps]);

  const stats: WaterStats = useMemo(() => {
    const total = taps.length;
    const safe = taps.filter((t) => t.evaluation.baseStatus === "safe").length;
    const warning = taps.filter((t) => t.evaluation.baseStatus === "warning").length;
    const danger = taps.filter((t) => t.evaluation.baseStatus === "danger").length;
    const stale = taps.filter((t) => t.evaluation.isStale).length;

    return {
      total,
      safe,
      warning,
      danger,
      stale,
      avgWqi: campusAvgWqi,
    };
  }, [taps, campusAvgWqi]);

  const freshness: FreshnessStatus = useMemo(() => {
    const staleCount = taps.filter((t) => t.evaluation.isStale).length;
    const total = taps.length;
    const freshCount = total - staleCount;

    let mode: FreshnessMode = "live";
    let label = "Live Monitoring";

    if (staleCount === total && total > 0) {
      mode = "offline";
      label = "All Sensors Offline";
    } else if (staleCount > 0) {
      mode = "partial";
      label = `Partial (${staleCount} Stale)`;
    }

    return {
      mode,
      freshCount,
      staleCount,
      label,
    };
  }, [taps]);

  const getTapById = (id: string) => taps.find((t) => t.id === id);

  return (
    <WaterDataContext.Provider
      value={{
        taps,
        stats,
        freshness,
        campusAvgWqi,
        filter,
        setFilter,
        selectedTap,
        setSelectedTap,
        getTapById,
      }}
    >
      {children}
    </WaterDataContext.Provider>
  );
};

export const useWaterData = (): WaterDataContextValue => {
  const context = useContext(WaterDataContext);
  if (!context) {
    throw new Error("useWaterData must be used within a WaterDataProvider");
  }
  return context;
};

