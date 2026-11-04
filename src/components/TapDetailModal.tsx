import { motion, AnimatePresence } from "framer-motion";
import { X, Droplets, MapPin, Clock, AlertTriangle, CheckCircle2, XCircle, FileDown } from "lucide-react";
import { TapLocation, WaterParameter } from "@/components/Data/demoData";
import { IS_10500_STANDARDS } from "@/components/Data/isStandards";
import { isParameterExceeding, isParameterAboveDesirable } from "@/components/utils/wqiCalculator";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { generateWaterQualityReport } from "@/components/utils/reportGenerator";

interface TapDetailModalProps {
  tap: TapLocation | null;
  onClose: () => void;
}


function getParamColor(param: WaterParameter) {
  if (isParameterExceeding(param)) return { text: "text-destructive", bg: "bg-destructive/20", border: "border-destructive/40" };
  if (isParameterAboveDesirable(param)) return { text: "text-warning", bg: "bg-warning/20", border: "border-warning/40" };
  return { text: "text-success", bg: "bg-success/20", border: "border-success/40" };
}

const TapDetailModal = ({ tap, onClose }: TapDetailModalProps) => {
  if (!tap) return null;

  const wqiLabel = tap.wqi >= 90 ? "Excellent" : tap.wqi >= 70 ? "Good" : tap.wqi >= 50 ? "Fair" : tap.wqi >= 25 ? "Poor" : "Very Poor";
  const exceeding = tap.parameters.filter(isParameterExceeding);
  const timeAgo = tap.lastUpdated;

  // Radar data
  const radarData = tap.parameters.slice(0, 8).map((p) => {
    const std = IS_10500_STANDARDS[p.name];
    const limit = std?.is10500Permissible ?? std?.maxAllowed ?? 100;
    const score = Math.min(100, Math.round((1 - Math.min(1, p.value / (limit || 1))) * 100));
    return { parameter: p.name, score: isNaN(score) ? 80 : score };
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass-card rounded-2xl w-full max-w-3xl border border-border/50"
        >
          {/* Modal header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 glow-primary">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">{tap.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {tap.location}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Updated {timeAgo}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateWaterQualityReport(tap)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* WQI Summary */}
            <div className="mt-4 flex items-center gap-4">
              <div className={`flex-1 p-3 rounded-xl border text-center ${
                tap.status === "safe" ? "bg-success/10 border-success/30" :
                tap.status === "warning" ? "bg-warning/10 border-warning/30" :
                "bg-destructive/10 border-destructive/30"
              }`}>
                <div className={`text-3xl font-bold font-heading ${
                  tap.status === "safe" ? "text-success" :
                  tap.status === "warning" ? "text-warning" : "text-destructive"
                }`}>{tap.wqi}</div>
                <div className="text-xs text-muted-foreground">Water Quality Index</div>
                <div className={`text-sm font-semibold mt-0.5 ${
                  tap.status === "safe" ? "text-success" :
                  tap.status === "warning" ? "text-warning" : "text-destructive"
                }`}>{wqiLabel}</div>
              </div>
              <div className={`flex-1 p-3 rounded-xl border text-center ${
                tap.prediction === "Fit for Drinking"
                  ? "bg-success/10 border-success/30"
                  : "bg-destructive/10 border-destructive/30"
              }`}>
                <div className="mb-1">
                  {tap.prediction === "Fit for Drinking"
                    ? <CheckCircle2 className="h-7 w-7 text-success mx-auto" />
                    : <XCircle className="h-7 w-7 text-destructive mx-auto" />
                  }
                </div>
                <div className={`text-sm font-semibold ${
                  tap.prediction === "Fit for Drinking" ? "text-success" : "text-destructive"
                }`}>{tap.prediction}</div>
                <div className="text-xs text-muted-foreground mt-0.5">ML Prediction</div>
              </div>
              {exceeding.length > 0 && (
                <div className="flex-1 p-3 rounded-xl border bg-destructive/10 border-destructive/30 text-center">
                  <AlertTriangle className="h-7 w-7 text-destructive mx-auto mb-1" />
                  <div className="text-destructive font-semibold text-sm">{exceeding.length} Exceeded</div>
                  <div className="text-xs text-muted-foreground mt-0.5">IS 10500 Limits</div>
                </div>
              )}
            </div>
          </div>

          {/* Parameters table */}
          <div className="p-6">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Parameter Analysis (IS 10500:2012 / WHO 2022)</h3>
            <div className="space-y-2">
              {tap.parameters.map((param) => {
                const std = IS_10500_STANDARDS[param.name];
                const colors = getParamColor(param);
                const exceeds = isParameterExceeding(param);
                const aboveDesirable = isParameterAboveDesirable(param);
                const limit = std?.is10500Permissible ?? std?.whoGuideline ?? param.maxSafe;
                const desirable = std?.is10500Desirable ?? std?.whoGuideline;
                const pct = limit ? Math.min(100, (param.value / limit) * 100) : 0;

                return (
                  <div
                    key={param.name}
                    className={`rounded-xl p-3 border ${colors.border} ${colors.bg} transition-all`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${colors.text}`}>{param.name}</span>
                        {exceeds ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/30 text-destructive font-medium">EXCEEDS IS 10500</span>
                        ) : aboveDesirable ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/30 text-warning font-medium">ABOVE DESIRABLE</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/30 text-success font-medium">WITHIN LIMITS</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold font-heading ${colors.text}`}>
                          {param.value} {param.unit}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          IS Limit: {limit ?? "N/A"} | Desirable: {desirable ?? "N/A"}
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background: exceeds ? "hsl(0 72% 51%)" : aboveDesirable ? "hsl(38 92% 50%)" : "hsl(152 69% 40%)",
                        }}
                      />
                    </div>
                    {exceeds && std?.remediation && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                        💊 {std.remediation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar chart */}
          <div className="px-6 pb-6">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Parameter Health Radar</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(210 30% 18%)" />
                  <PolarAngleAxis
                    dataKey="parameter"
                    tick={{ fill: "hsl(200 20% 55%)", fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(186 100% 42%)"
                    fill="hsl(186 100% 42%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ background: "hsl(210 40% 10%)", border: "1px solid hsl(210 30% 18%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(200 100% 95%)" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TapDetailModal;
