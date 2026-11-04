export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertItem {
  id: string;
  stationId: string;
  stationName: string;
  parameter?: string;
  value?: number;
  unit?: string;
  limit?: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}
