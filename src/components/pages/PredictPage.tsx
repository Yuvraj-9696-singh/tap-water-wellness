import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sliders, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Info, FileDown, Droplet, Factory } from "lucide-react";
import { IS_10500_STANDARDS, PARAMETER_NAMES } from "@/components/Data/isStandards";
import { predictWaterQuality, PredictionInput } from "@/components/utils/mlPredictor";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "react-router-dom";

// Default values — typical tap water scenario
const DEFAULT_VALUES: PredictionInput = {
  pH: 7.2,
  Hardness: 150,
  Solids: 300,
  Chloramines: 1.5,
  Sulfate: 120,
  Conductivity: 400,
  Organic_carbon: 2.0,
  Trihalomethanes: 40,
  Turbidity: 2.5,
};

const SLIDER_CONFIG: Record<
  keyof PredictionInput,
  { min: number; max: number; step: number; decimals: number }
> = {
  pH:              { min: 0,   max: 14,   step: 0.1,  decimals: 1 },
  Hardness:        { min: 0,   max: 1000, step: 10,   decimals: 0 },
  Solids:          { min: 0,   max: 5000, step: 10,   decimals: 0 },
  Chloramines:     { min: 0,   max: 10,   step: 0.1,  decimals: 1 },
  Sulfate:         { min: 0,   max: 1000, step: 10,   decimals: 0 },
  Conductivity:    { min: 0,   max: 3000, step: 10,   decimals: 0 },
  Organic_carbon:  { min: 0,   max: 30,   step: 0.1,  decimals: 1 },
  Trihalomethanes: { min: 0,   max: 200,  step: 1,    decimals: 0 },
  Turbidity:       { min: 0,   max: 50,   step: 0.1,  decimals: 1 },
};

const WQI_GAUGE_COLOR = (wqi: number) => {
  if (wqi >= 90) return "#22c55e";
  if (wqi >= 70) return "#4ade80";
  if (wqi >= 50) return "#f59e0b";
  if (wqi >= 25) return "#f97316";
  return "#ef4444";
};

const CircularWQIGauge = ({ wqi }: { wqi: number }) => {
  const radius = 70;
  const stroke = 10;
  const norm = radius - stroke / 2;
  const circumference = norm * 2 * Math.PI;
  const offset = circumference - (wqi / 100) * circumference;
  const color = WQI_GAUGE_COLOR(wqi);
  const label = wqi >= 90 ? "Excellent" : wqi >= 70 ? "Good" : wqi >= 50 ? "Fair" : wqi >= 25 ? "Poor" : "Very Poor";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width={160} height={160} style={{ transform: "rotate(-90deg)" }}>
          <circle stroke="hsl(210 40% 16%)" fill="transparent" strokeWidth={stroke} r={norm} cx={80} cy={80} />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            r={norm}
            cx={80}
            cy={80}
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)",
              filter: `drop-shadow(0 0 12px ${color}99)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold font-heading" style={{ color }}>{wqi}</span>
          <span className="text-sm text-muted-foreground">WQI Score</span>
          <span className="text-base font-semibold mt-1" style={{ color }}>{label}</span>
        </div>
      </div>
    </div>
  );
};

export function isParamCritical(name: string, value: number): boolean {
  const lim = IS_10500_STANDARDS[name.replace(" ", "_")] || IS_10500_STANDARDS[name];
  if (!lim) return false;
  if (name === "pH") return value < 6.5 || value > 8.5;
  return value > (lim.is10500Permissible ?? lim.maxAllowed);
}

export function isParamBeyondDesirable(name: string, value: number): boolean {
  const lim = IS_10500_STANDARDS[name.replace(" ", "_")] || IS_10500_STANDARDS[name];
  if (!lim) return false;
  if (name === "pH") return value < 6.8 || value > 7.5;
  return value > (lim.is10500Desirable ?? lim.maxAllowed);
}

function downloadPredictionReport(values: PredictionInput, result: ReturnType<typeof predictWaterQuality>) {
  const doc = new jsPDF();
  const darkBg: [number, number, number] = [10, 20, 35];
  const primaryColor: [number, number, number] = [0, 188, 212];

  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 210, 40, "F");
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("AquaWatch Assessment", 15, 18);
  doc.setFontSize(10);
  doc.setTextColor(180, 220, 240);
  doc.setFont("helvetica", "normal");
  doc.text("Water Quality Analysis Report", 15, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 33);

  const wqiColor: [number, number, number] = result.wqi >= 70 ? [34, 197, 94] : result.wqi >= 50 ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(...wqiColor);
  doc.roundedRect(148, 8, 50, 24, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(String(result.wqi), 160, 20);
  doc.setFontSize(8);
  doc.text(result.label, 161, 27);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Prediction Summary", 15, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Quality Suitability: ${result.potability}`, 15, 60);
  doc.text(`Alternative Industrial Uses: ${result.alternativeUses.join(", ") || "None"}`, 15, 66);
  doc.text(`Identified Risk Factors: ${result.riskFactors.join(", ") || "None"}`, 15, 72);

  autoTable(doc, {
    startY: 82,
    head: [["Parameter", "Input Value", "IS 10500 Limit", "Desirable Limit", "Status"]],
    body: PARAMETER_NAMES.map((name) => {
      const fieldName = name.replace(" ", "_") as keyof PredictionInput;
      const val = values[fieldName];
      const std = IS_10500_STANDARDS[name.replace(" ", "_")] || IS_10500_STANDARDS[name];
      const critical = isParamCritical(name, val);
      return [
        name,
        `${val} ${std?.unit ?? ""}`,
        `${std?.is10500Permissible ?? "—"} ${std?.unit ?? ""}`,
        `${std?.is10500Desirable ?? "—"} ${std?.unit ?? ""}`,
        critical ? "WARNING: TOXIC" : "OK",
      ];
    }),
    headStyles: { fillColor: darkBg, textColor: primaryColor, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        data.cell.styles.textColor = String(data.cell.text).includes("TOXIC") ? [239, 68, 68] : [34, 197, 94];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Recommendation", 15, finalY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(result.recommendation, 15, finalY + 8, { maxWidth: 180 });

  doc.save(`AquaWatch_WQI_Report_${Date.now()}.pdf`);
}

const PredictPage = () => {
  const location = useLocation();
  const prefillParams = location.state?.prefillParams;

  const initialValues = useMemo(() => {
    if (!prefillParams) return DEFAULT_VALUES;
    const mapped: any = { ...DEFAULT_VALUES };
    prefillParams.forEach((p: any) => {
       const key = (p.name === "pH" || p.name === "ph") ? "pH" : p.name.replace(" ", "_");
       if (key in mapped) mapped[key] = p.value;
    });
    return mapped as PredictionInput;
  }, [prefillParams]);

  const [values, setValues] = useState<PredictionInput>(initialValues);
  const [showInfo, setShowInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"treatment" | "alternative">("treatment");

  const result = useMemo(() => predictWaterQuality(values), [values]);

  const radarData = PARAMETER_NAMES.map((name) => {
    // Standardize key lookup
    const fieldName = (name === "pH" || name === "ph") ? "pH" : (name.replace(" ", "_") as keyof PredictionInput);
    const val = values[fieldName];
    const std = IS_10500_STANDARDS[name] || getParameterStandard(name);
    if (!std) return { parameter: name, score: 100 };
    
    const max = std.is10500Permissible ?? std.maxAllowed;
    // Normalize to 100 for radar
    const dev = std.name === "pH" ? Math.abs(val - 7.0) / 1.5 : (val / max);
    return {
      parameter: std.name,
      score: Math.max(0, 100 - (dev * 100)),
    };
  });

  const updateValue = (key: keyof PredictionInput, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const resetToDefaults = () => setValues(DEFAULT_VALUES);

  const setPreset = (preset: "clean" | "contaminated" | "marginal") => {
    if (preset === "clean") {
      setValues({ pH: 7.1, Hardness: 60, Solids: 100, Chloramines: 0.5, Sulfate: 30, Conductivity: 120, Organic_carbon: 0.5, Trihalomethanes: 10, Turbidity: 0.5 });
    } else if (preset === "contaminated") {
      setValues({ pH: 4.5, Hardness: 700, Solids: 3500, Chloramines: 8.0, Sulfate: 600, Conductivity: 2200, Organic_carbon: 15.0, Trihalomethanes: 150, Turbidity: 18.0 });
    } else {
      setValues({ pH: 8.2, Hardness: 300, Solids: 1000, Chloramines: 3.5, Sulfate: 250, Conductivity: 900, Organic_carbon: 3.5, Trihalomethanes: 75, Turbidity: 4.5 });
    }
  };

  return (
    <div className="container mx-auto px-4 pb-16 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-2xl bg-primary/10 glow-primary animate-float">
            <Brain className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
          Water Quality <span className="gradient-text">Index Analysis</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base">
          Adjust parameter values to compute conventional IS-10500 Water Quality Index metric parameters.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-2 mb-8 flex-wrap"
      >
        <span className="text-sm text-muted-foreground self-center">Quick Presets:</span>
        <button onClick={() => setPreset("clean")} className="px-4 py-2 rounded-full text-sm font-medium bg-success/20 text-success border border-success/30 hover:bg-success/30 transition-colors">
          ✓ Clean Water
        </button>
        <button onClick={() => setPreset("marginal")} className="px-4 py-2 rounded-full text-sm font-medium bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 transition-colors">
          ⚠ Marginal Quality
        </button>
        <button onClick={() => setPreset("contaminated")} className="px-4 py-2 rounded-full text-sm font-medium bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-colors">
          ✗ Contaminated
        </button>
        <button onClick={resetToDefaults} className="px-4 py-2 rounded-full text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors flex items-center gap-1">
          <RefreshCw className="h-4 w-4" /> Reset
        </button>
        <a 
          href="/Model_Evaluation_Report.pdf" 
          download="ML_Research_Report.pdf"
          className="px-4 py-2 rounded-full text-sm font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors flex items-center gap-1"
        >
          <FileDown className="h-4 w-4" /> Research Report
        </a>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sliders className="h-6 w-6 text-primary" />
            <h2 className="font-heading font-semibold text-foreground text-lg">Dataset Parameters</h2>
            <span className="ml-auto text-sm text-muted-foreground">Adjust sliders or type values</span>
          </div>

          <div className="space-y-6">
            {PARAMETER_NAMES.map((name) => {
              // Defensive key mapping to handle naming variants (pH vs ph, Organic Carbon vs Organic_carbon)
              let fieldName = name.replace(" ", "_") as keyof PredictionInput;
              if (fieldName as string === "pH" || fieldName as string === "ph") fieldName = "pH";
              
              const val = values[fieldName];
              const cfg = SLIDER_CONFIG[fieldName];
              const std = IS_10500_STANDARDS[name] || getParameterStandard(name);
              
              if (!cfg || !std) {
                console.warn(`Missing config or standard for parameter: ${name} (key: ${fieldName})`);
                return null;
              }

              const critical = isParamCritical(name, val);
              const aboveDesirable = !critical && isParamBeyondDesirable(name, val);

              return (
                <div key={name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-semibold ${critical ? "text-destructive" : aboveDesirable ? "text-warning" : "text-foreground"}`}>
                        {name}
                      </span>
                      {std?.unit && <span className="text-sm text-muted-foreground">({std.unit})</span>}
                      {critical && (
                        <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> EXCEEDS LIMIT
                        </span>
                      )}
                      <button
                        onClick={() => setShowInfo(showInfo === name ? null : name)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={val}
                        min={cfg.min}
                        max={cfg.max}
                        step={cfg.step}
                        onChange={(e) => updateValue(fieldName, parseFloat(e.target.value) || 0)}
                        className="w-28 text-right text-base font-mono bg-secondary rounded-lg px-2 py-1 border border-border focus:outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {showInfo === name && std && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-muted-foreground bg-secondary/50 rounded-lg px-4 py-3 border border-border/50"
                      >
                        <p>{std.description}</p>
                        <p className="mt-2 text-xs">
                          <span className="text-primary font-bold">Desirable:</span> {std.is10500Desirable ?? "—"} {std.unit} |{" "}
                          <span className="text-warning font-bold">Permissible Max:</span> {std.is10500Permissible ?? "—"} {std.unit}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <input
                      type="range"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      value={val}
                      onChange={(e) => updateValue(fieldName, parseFloat(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${
                          critical ? "#ef4444" : aboveDesirable ? "#f59e0b" : "hsl(186 100% 42%)"
                        } 0%, ${
                          critical ? "#ef4444" : aboveDesirable ? "#f59e0b" : "hsl(186 100% 42%)"
                        } ${((val - (cfg?.min ?? 0)) / ((cfg?.max ?? 100) - (cfg?.min ?? 0))) * 100}%, hsl(210 30% 16%) ${((val - (cfg?.min ?? 0)) / ((cfg?.max ?? 100) - (cfg?.min ?? 0))) * 100}%, hsl(210 30% 16%) 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground mt-1">
                      <span>{cfg?.min ?? 0}</span>
                      {std?.is10500Desirable !== null && std?.is10500Desirable !== undefined && (
                        <span className="text-success ml-auto mr-12">Desirable: {std.is10500Desirable}</span>
                      )}
                      <span>{cfg?.max ?? 100}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="glass-card rounded-2xl p-0 overflow-hidden shadow-lg border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <div className="p-6 text-center border-b border-border/40">
              <h3 className="font-heading font-semibold text-foreground mb-4 text-xl">WQI Dashboard</h3>
              <CircularWQIGauge wqi={result.wqi} />
              <div className="mt-4 space-y-3">
                <div className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-lg font-bold shadow-sm ${
                  result.potability === "Fit for Drinking"
                    ? "bg-success/20 text-success border border-success/50"
                    : "bg-destructive/20 text-destructive border border-destructive/50"
                }`}>
                  {result.potability === "Fit for Drinking"
                    ? <CheckCircle2 className="h-5 w-5" />
                    : <XCircle className="h-5 w-5" />
                  }
                  {result.potability}
                </div>
              </div>
            </div>

            <div className="flex bg-background/40 border-b border-border/50">
              <button
                onClick={() => setActiveTab("treatment")}
                className={`flex-1 py-3 px-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${
                  activeTab === "treatment" ? "bg-background text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Droplet className="h-4 w-4" /> Treatment Plan
              </button>
              <button
                onClick={() => setActiveTab("alternative")}
                className={`flex-1 py-3 px-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${
                  activeTab === "alternative" ? "bg-background text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Factory className="h-4 w-4" /> Industrial Viability
              </button>
            </div>
            
            <div className="p-5 bg-background/20">
              {activeTab === "treatment" ? (
                <div>
                  {result.treatmentPlan.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-foreground/80 mb-3 font-medium">The following parameters require treatment:</p>
                      {result.treatmentPlan.map((action, idx) => (
                        <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-foreground">{action.parameter}</span>
                            <span className="text-xs text-destructive font-medium px-2 py-0.5 rounded-full bg-destructive/10">
                              {action.issue}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{action.instruction}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-success">
                      <CheckCircle2 className="h-10 w-10 mb-2 opacity-80" />
                      <p className="font-semibold">Water is safely stabilized</p>
                      <p className="text-sm opacity-80">No further chemical treatment required.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                   <p className="text-sm text-foreground/80 mb-3 font-medium">Based on its current state, this water can be utilized for:</p>
                   <ul className="space-y-2">
                     {result.alternativeUses.map((use, idx) => (
                       <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md border border-border">
                         <div className="h-2 w-2 rounded-full bg-primary" /> {use}
                       </li>
                     ))}
                   </ul>
                </div>
              )}
            </div>
          </div>

          <div className={`glass-card rounded-2xl p-5 border ${
            result.wqi >= 70 ? "border-success/30 bg-success/5" : result.wqi >= 50 ? "border-warning/30 bg-warning/5" : "border-destructive/30 bg-destructive/5"
          }`}>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">Algorithm Health Recommendation</h3>
            <p className="text-sm text-foreground/80 leading-relaxed font-body">{result.recommendation}</p>
          </div>

          {result.riskFactors.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-destructive/40 bg-destructive/5 shadow-md">
              <h3 className="font-heading font-bold text-base text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Critical Risk Exceedances
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.riskFactors.map((r) => (
                  <span key={r} className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-sm font-bold shadow-sm">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">Quality Health Radar</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(210 30% 25%)" />
                  <PolarAngleAxis dataKey="parameter" tick={{ fill: "hsl(200 20% 75%)", fontSize: 11, fontWeight: 600 }} />
                  <Radar dataKey="score" stroke="hsl(186 100% 50%)" fill="hsl(186 100% 42%)" fillOpacity={0.3} strokeWidth={2.5} />
                  <Tooltip contentStyle={{ background: "hsl(210 40% 15%)", border: "1px solid hsl(210 30% 30%)", borderRadius: 10, fontSize: 13, color: "#fff" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button
            onClick={() => downloadPredictionReport(values, result)}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all text-base font-bold"
          >
            <FileDown className="h-5 w-5" />
            Download Detailed PDF Report
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PredictPage;
