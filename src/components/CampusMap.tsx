import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, ArrowRight, XCircle, Droplets, Wifi, WifiOff, Brain, AlertTriangle } from "lucide-react";
import { demoTaps, TapLocation } from "@/components/Data/demoData";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

// IIT BHU actual GPS coordinates for each node
const GPS_COORDS: Record<string, [number, number]> = {
  "tap-1": [25.2639, 82.9869],   // Vishwakarma Hostel
  "tap-2": [25.2625, 82.9875],   // Rajputana Ground (FAULTY)
  "tap-3": [25.2618, 82.9892],   // Main Library
  "tap-4": [25.2597, 82.9881],   // LC (Lecture Complex)
  "tap-5": [25.2592, 82.9864],   // Visvesvaraya Hostel
};

const STATUS_COLOR: Record<string, string> = {
  safe: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const STATUS_GLOW: Record<string, string> = {
  safe: "rgba(34,197,94,0.5)",
  warning: "rgba(245,158,11,0.5)",
  danger: "rgba(239,68,68,0.5)",
};

export default function CampusMap() {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTap, setSelectedTap] = useState<TapLocation | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapContainerRef.current!, {
        center: [25.2615, 82.9878], // Center of IIT BHU hostel/academic area
        zoom: 16,
        zoomControl: true,
        attributionControl: true,
      });

      mapRef.current = map;

      // Google Maps standard tiles
      L.tileLayer(
        "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        {
          attribution: '&copy; <a href="https://www.google.com/intl/en_us/help/terms_maps.html">Google Maps</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      demoTaps.forEach((tap) => {
        const [lat, lng] = GPS_COORDS[tap.id] ?? [25.2615, 82.9878];
        const color = STATUS_COLOR[tap.status];
        const glow = STATUS_GLOW[tap.status];
        const isFaulty = tap.sensorStatus === "faulty";

        // Faulty nodes get an additional warning ring + different icon
        const faultBadge = isFaulty ? `
          <div style="
            position:absolute;top:-6px;right:-6px;z-index:10;
            width:18px;height:18px;border-radius:50%;
            background:#f59e0b;border:2px solid #111;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:bold;color:#000;
            box-shadow:0 0 8px rgba(245,158,11,0.8);
          ">⚠</div>
        ` : "";

        const displayWqi = isFaulty ? tap.mlPredictedWqi ?? tap.wqi : tap.wqi;

        const iconHtml = `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
            <div style="
              position:absolute;inset:0;border-radius:50%;
              background:${isFaulty ? "#f59e0b" : color};opacity:0.25;
              animation: pulseRing 2.4s cubic-bezier(0.215,0.61,0.355,1) infinite;
            "></div>
            <div style="
              position:relative;width:38px;height:38px;border-radius:50%;
              background:${color};
              border:${isFaulty ? "3px dashed rgba(245,158,11,0.9)" : "2.5px solid rgba(255,255,255,0.85)"};
              box-shadow: 0 0 18px ${glow}, 0 4px 12px rgba(0,0,0,0.6);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;
              color: white;
              font-weight: bold;
              font-size: 14px;
              font-family: sans-serif;
            ">
              ${displayWqi}
            </div>
            ${faultBadge}
          </div>
          <style>
            @keyframes pulseRing {
              0% { transform: scale(0.85); opacity: 0.5; }
              70% { transform: scale(1.7); opacity: 0; }
              100% { transform: scale(0.85); opacity: 0; }
            }
          </style>
        `;

        const divIcon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        const marker = L.marker([lat, lng], { icon: divIcon }).addTo(map);
        marker.on("click", () => {
          setSelectedTap(tap);
          map.panTo([lat, lng], { animate: true, duration: 0.5 });
        });
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const displayWqi = selectedTap
    ? (selectedTap.sensorStatus === "faulty" ? selectedTap.mlPredictedWqi ?? selectedTap.wqi : selectedTap.wqi)
    : null;

  return (
    <div
      className="relative w-full h-[500px] md:h-[580px] rounded-3xl overflow-hidden shadow-2xl border border-primary/20 mb-8"
      style={{ isolation: "isolate" }}
    >
      {/* Header badge */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-background/80 border border-primary/30 shadow-lg">
        <Wifi className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">IIT BHU — Live IoT Network</span>
        <span className="flex items-center gap-1 ml-2 text-xs text-success font-medium">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          5 Nodes Online
        </span>
      </div>

      {/* Sensor fault alert ribbon */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md bg-warning/10 border border-warning/40 shadow-lg">
        <WifiOff className="h-3.5 w-3.5 text-warning" />
        <span className="text-xs font-bold text-warning">1 Sensor Fault Detected</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-1.5 px-3 py-3 rounded-2xl backdrop-blur-md bg-background/80 border border-border/50 shadow-lg">
        {([["safe","#22c55e","Drinking Safe"], ["warning","#f59e0b","Needs Treatment"], ["danger","#ef4444","Hazardous"]] as const).map(([status, color, label]) => (
          <div key={status} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-white/60" style={{ background: color }} />
            <span className="text-xs text-foreground/80 font-medium">{label}</span>
          </div>
        ))}
        <div className="border-t border-border/40 mt-1 pt-1 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-dashed border-warning/80 bg-transparent" />
          <span className="text-xs text-warning/80 font-medium">Faulty Sensor (AI Mode)</span>
        </div>
      </div>

      {/* Leaflet map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Selected Node Popup */}
      <AnimatePresence>
        {selectedTap && (
          <motion.div
            key={selectedTap.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="absolute right-4 top-16 z-[400] w-[290px] rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "rgba(8, 14, 28, 0.94)",
              border: selectedTap.sensorStatus === "faulty"
                ? "1px solid rgba(245,158,11,0.5)"
                : "1px solid rgba(0,188,212,0.3)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: selectedTap.sensorStatus === "faulty" ? "#f59e0b" : STATUS_COLOR[selectedTap.status] }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-heading font-bold text-white text-base leading-tight">{selectedTap.name}</h3>
                  <p className="text-xs font-medium flex items-center gap-1 mt-0.5"
                    style={{ color: selectedTap.sensorStatus === "faulty" ? "#f59e0b" : "hsl(186 100% 60%)" }}
                  >
                    {selectedTap.sensorStatus === "faulty"
                      ? <><WifiOff className="h-3 w-3" /> Sensor Fault — AI Fallback Active</>
                      : <><Wifi className="h-3 w-3" /> IoT Live Telemetry</>
                    }
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTap(null)}
                  className="p-1 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* AI Prediction Banner — only for faulty sensor */}
              {selectedTap.sensorStatus === "faulty" && (
                <div className="mb-3 px-3 py-2.5 rounded-xl flex gap-2 items-start"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
                >
                  <Brain className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-warning leading-snug">WQI Predicted by AI Model</p>
                    <p className="text-[10px] text-warning/70 mt-0.5 leading-snug">
                      Sensors offline: {selectedTap.faultyParams?.join(", ")}. WQI computed via ML fallback using available readings.
                    </p>
                  </div>
                </div>
              )}

              {/* WQI + Status grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] text-white/50 mb-0.5">
                    {selectedTap.sensorStatus === "faulty" ? "AI-Predicted WQI" : "WQI Score"}
                  </p>
                  <p className="text-[28px] font-bold font-heading leading-none"
                    style={{ color: STATUS_COLOR[selectedTap.status] }}
                  >
                    {displayWqi}
                  </p>
                  {selectedTap.sensorStatus === "faulty" && (
                    <p className="text-[9px] text-warning/60 mt-1">
                      Model confidence: {selectedTap.mlConfidence}%
                    </p>
                  )}
                </div>
                <div className="rounded-xl p-3 text-center flex flex-col justify-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] text-white/50 mb-1.5">Status</p>
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-bold capitalize inline-flex items-center gap-1 justify-center"
                    style={{
                      background: `${STATUS_COLOR[selectedTap.status]}22`,
                      color: STATUS_COLOR[selectedTap.status],
                      border: `1px solid ${STATUS_COLOR[selectedTap.status]}44`,
                    }}
                  >
                    <Droplets className="h-3 w-3" /> {selectedTap.status}
                  </span>
                </div>
              </div>

              {/* Faulty sensors list */}
              {selectedTap.sensorStatus === "faulty" && (
                <div className="mb-3 space-y-1">
                  {selectedTap.parameters.slice(0, 4).map((p) => {
                    const isFaultySensor = selectedTap.faultyParams?.includes(p.name);
                    return (
                      <div key={p.name}
                        className="flex justify-between items-center text-xs px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: isFaultySensor ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)",
                          border: isFaultySensor ? "1px solid rgba(245,158,11,0.2)" : "none",
                        }}
                      >
                        <span className={isFaultySensor ? "text-warning/70" : "text-white/50"}>
                          {isFaultySensor && "⚠ "}{p.name}
                        </span>
                        <span className={`font-bold ${isFaultySensor ? "text-warning/60 line-through" : "text-white/90"}`}>
                          {p.value} <span className="font-normal opacity-60">{p.unit}</span>
                          {isFaultySensor && <span className="ml-1 no-underline text-[9px] font-normal text-warning/50 not-italic">[stale]</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Healthy sensor: show top 3 params normally */}
              {selectedTap.sensorStatus === "healthy" && (
                <div className="mb-3 space-y-1">
                  {selectedTap.parameters.slice(0, 3).map((p) => (
                    <div key={p.name} className="flex justify-between items-center text-xs px-2.5 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <span className="text-white/50">{p.name}</span>
                      <span className="font-bold text-white/90">{p.value} <span className="font-normal opacity-50">{p.unit}</span></span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-white/30 mb-3 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Last updated: {selectedTap.lastUpdated}
              </p>

              <button
                onClick={() => navigate("/predict", { state: { prefillParams: selectedTap.parameters } })}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all group"
                style={{
                  background: "hsl(186 100% 42%)",
                  color: "#001a22",
                  boxShadow: "0 4px 20px rgba(0,188,212,0.3)",
                }}
              >
                Analyze Full Parameters
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
