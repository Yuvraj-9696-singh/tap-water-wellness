import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  CheckCheck,
  Filter,
  Send,
  Radio,
} from "lucide-react";
import { useWaterData } from "@/context/WaterDataContext";
import { generateAlerts } from "@/utils/alertsGenerator";
import { AlertItem, AlertSeverity } from "@/types/alerts";

export default function AlertsPanel() {
  const { taps, setSelectedTap } = useWaterData();
  const [isOpen, setIsOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<"all" | AlertSeverity>("all");
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Generate deterministic base alerts from live taps
  const initialAlerts = useMemo(() => generateAlerts(taps), [taps]);

  // Combine with acknowledgment state
  const alerts: AlertItem[] = useMemo(() => {
    return initialAlerts.map((a) => ({
      ...a,
      acknowledged: acknowledgedIds.has(a.id),
    }));
  }, [initialAlerts, acknowledgedIds]);

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAllAsRead = () => {
    setAcknowledgedIds(new Set(alerts.map((a) => a.id)));
  };

  // Filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (stationFilter !== "all" && a.stationId !== stationFilter) return false;
    return true;
  });

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const webhookConfigured = Boolean(import.meta.env.VITE_ALERT_WEBHOOK_URL);

  return (
    <>
      {/* Header Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground transition-colors border border-border/60 hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`View system alerts (${unreadCount} unread)`}
        title="Campus Water Alerts"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Drawer Backdrop & Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Water Quality Alerts Panel"
            >
              {/* Header */}
              <div className="p-5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground leading-tight">
                      Campus Alerts & Breaches
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {unreadCount} unread • {alerts.length} total active incidents
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Close alerts panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 border-b border-border/50 bg-background/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" /> Filter Incidents
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                {/* Severity Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "critical", "warning", "info"] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                        severityFilter === sev
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                {/* Station Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={stationFilter}
                    onChange={(e) => setStationFilter(e.target.value)}
                    className="w-full text-xs bg-secondary border border-border/60 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                    aria-label="Filter alerts by station"
                  >
                    <option value="all">All Stations ({alerts.length})</option>
                    {taps.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Alerts List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-success/10 text-success mx-auto flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-foreground">All Stations Nominal</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                        No threshold breaches or sensor faults match the selected criteria.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => toggleAcknowledge(alert.id)}
                      className={`rounded-2xl p-4 border transition-all cursor-pointer select-none relative group ${
                        alert.acknowledged
                          ? "opacity-60 bg-secondary/20 border-border/40"
                          : alert.severity === "critical"
                          ? "bg-destructive/10 border-destructive/40 hover:border-destructive/60"
                          : alert.severity === "warning"
                          ? "bg-warning/10 border-warning/40 hover:border-warning/60"
                          : "bg-secondary/40 border-border/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {alert.severity === "critical" ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : alert.severity === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          ) : (
                            <Info className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-heading font-bold text-xs text-foreground leading-tight">
                              {alert.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {alert.timestamp}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 leading-snug">
                            {alert.message}
                          </p>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-[11px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const tap = taps.find((t) => t.id === alert.stationId);
                                if (tap) {
                                  setSelectedTap(tap);
                                  setIsOpen(false);
                                }
                              }}
                              className="text-primary hover:underline font-semibold"
                            >
                              Inspect Station →
                            </button>

                            <span className="text-muted-foreground text-[10px]">
                              {alert.acknowledged ? "✓ Acknowledged" : "Click to dismiss"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer: Notification Hook Status */}
              <div className="p-4 border-t border-border/60 bg-secondary/20 text-xs text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className={`h-3.5 w-3.5 ${webhookConfigured ? "text-success" : "text-muted-foreground"}`} />
                  Telegram / Email Webhook:
                </span>
                <span className="font-semibold text-foreground/80">
                  {webhookConfigured ? "Connected" : "Disabled (Local only)"}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

