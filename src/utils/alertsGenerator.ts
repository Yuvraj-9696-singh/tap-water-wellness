import { EnhancedTapLocation } from "@/context/WaterDataContext";
import { AlertItem } from "@/types/alerts";
import { IS_10500_STANDARDS } from "@/components/Data/isStandards";

/**
 * Deterministically generates system alerts from station evaluation records.
 * Avoids duplicate alerts by using consistent unique IDs per condition.
 */
export function generateAlerts(taps: EnhancedTapLocation[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  taps.forEach((tap) => {
    const { evaluation } = tap;

    // 1. Critical parameter exceedances
    evaluation.exceedingParams.forEach((paramName) => {
      const p = tap.parameters.find((item) => item.name === paramName);
      const std = IS_10500_STANDARDS[paramName.replace(" ", "_")] || IS_10500_STANDARDS[paramName];
      const limit = std?.is10500Permissible ?? std?.maxAllowed ?? 0;

      alerts.push({
        id: `alert-${tap.id}-${paramName}-exceed`,
        stationId: tap.id,
        stationName: tap.name,
        parameter: paramName,
        value: p?.value,
        unit: p?.unit,
        limit,
        severity: "critical",
        title: `${tap.name}: ${paramName} Exceeded Permissible Limit`,
        message: `${paramName} recorded ${p?.value} ${p?.unit} (exceeds IS 10500 limit of ${limit} ${p?.unit}). Water not potable.`,
        timestamp: "14:20",
        acknowledged: false,
      });
    });

    // 2. Warning parameter near-limit breaches
    evaluation.nearLimitParams.forEach((paramName) => {
      const p = tap.parameters.find((item) => item.name === paramName);
      const std = IS_10500_STANDARDS[paramName.replace(" ", "_")] || IS_10500_STANDARDS[paramName];
      const limit = std?.is10500Desirable ?? std?.minAllowed ?? 0;

      alerts.push({
        id: `alert-${tap.id}-${paramName}-near`,
        stationId: tap.id,
        stationName: tap.name,
        parameter: paramName,
        value: p?.value,
        unit: p?.unit,
        limit,
        severity: "warning",
        title: `${tap.name}: ${paramName} Approaching Threshold`,
        message: `${paramName} reading is ${p?.value} ${p?.unit}, exceeding standard desirable threshold (${limit} ${p?.unit}).`,
        timestamp: "13:45",
        acknowledged: false,
      });
    });

    // 3. Stale telemetry alerts
    if (evaluation.isStale) {
      alerts.push({
        id: `alert-${tap.id}-stale`,
        stationId: tap.id,
        stationName: tap.name,
        severity: "warning",
        title: `${tap.name}: Sensor Offline / Stale Telemetry`,
        message: `No telemetry packets received for ${evaluation.minutesAgo} mins (last update: ${tap.lastUpdated}).`,
        timestamp: tap.lastUpdated,
        acknowledged: false,
      });
    }

    // 4. Sensor hardware faults
    if (tap.sensorStatus === "faulty" && tap.faultyParams && tap.faultyParams.length > 0) {
      alerts.push({
        id: `alert-${tap.id}-sensor-fault`,
        stationId: tap.id,
        stationName: tap.name,
        severity: "critical",
        title: `${tap.name}: Hardware Sensor Disconnect`,
        message: `Probes for [${tap.faultyParams.join(", ")}] reporting hardware faults. AI synthetic fallback active.`,
        timestamp: "12:10",
        acknowledged: false,
      });
    }
  });

  return alerts;
}
