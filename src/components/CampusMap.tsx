import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, XCircle, Droplets, Wifi, WifiOff, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { useWaterData, EnhancedTapLocation } from "@/context/WaterDataContext";
import { STATUS_THEME } from "@/config/waterQualityConfig";
import "leaflet/dist/leaflet.css";

// IIT BHU actual GPS coordinates for each node
const GPS_COORDS: Record<string, [number, number]> = {
  "tap-1": [25.2639, 82.9869],   // Vishwakarma Hostel
  "tap-2": [25.2625, 82.9875],   // Rajputana Ground
  "tap-3": [25.2618, 82.9892],   // Main Library
  "tap-4": [25.2597, 82.9881],   // LC (Lecture Complex)
  "tap-5": [25.2592, 82.9864],   // Visvesvaraya Hostel
};

export default function CampusMap() {
  const { taps, setSelectedTap: setGlobalSelectedTap } = useWaterData();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [localSelectedTap, setLocalSelectedTap] = useState<EnhancedTapLocation | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      // Fit campus bounds
      const latLngs = Object.values(GPS_COORDS).map(([lat, lng]) => L.latLng(lat, lng));
      const bounds = L.latLngBounds(latLngs);

      const map = L.map(mapContainerRef.current!, {
        center: [25.2615, 82.9878], // Center of IIT BHU hostel/academic area
        zoom: 16,
        zoomControl: true,
        attributionControl: true,
      });

      mapRef.current = map;

      // Clean tile layer with low visual clutter
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      // Fit bounds to GPS coordinates after tiles load
      map.fitBounds(bounds, { padding: [60, 60] });

      // Add markers from the unified single source of truth
      taps.forEach((tap) => {
        const [lat, lng] = GPS_COORDS[tap.id] ?? [25.2615, 82.9878];
        const statusTheme = STATUS_THEME[tap.evaluation.baseStatus];
        const isStale = tap.evaluation.isStale;
        const color = isStale ? "#94a3b8" : statusTheme.hex;
        const glow = isStale ? "rgba(148,163,184,0.3)" : statusTheme.hex + "66";

        // Single source of truth: Station score is consistently tap.wqi
        const displayWqi = tap.wqi;

        const faultBadge = isStale
          ? `
          <div style="
            position:absolute;top:-6px;right:-6px;z-index:10;
            width:18px;height:18px;border-radius:50%;
            background:#64748b;border:2px solid #0f172a;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:bold;color:#fff;
            box-shadow:0 0 8px rgba(100,116,139,0.8);
          " title="Sensor Offline">⏱</div>
        `
          : tap.sensorStatus === "faulty"
          ? `
          <div style="
            position:absolute;top:-6px;right:-6px;z-index:10;
            width:18px;height:18px;border-radius:50%;
            background:#f59e0b;border:2px solid #0f172a;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:bold;color:#000;
            box-shadow:0 0 8px rgba(245,158,11,0.8);
          " title="Sensor Fault">⚠</div>
        `
          : "";

        const iconHtml = `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
            <div style="
              position:absolute;inset:0;border-radius:50%;
              background:${color};opacity:${isStale ? "0.15" : "0.25"};
              animation: ${isStale ? "none" : "pulseRing 2.4s cubic-bezier(0.215,0.61,0.355,1) infinite"};
            "></div>
            <div style="
              position:relative;width:38px;height:38px;border-radius:50%;
              background:${color};
              border:${isStale ? "2px solid #94a3b8" : "2.5px solid rgba(255,255,255,0.9)"};
              box-shadow: 0 0 16px ${glow}, 0 4px 10px rgba(0,0,0,0.6);
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
              70% { transform: scale(1.6); opacity: 0; }
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
          setLocalSelectedTap(tap);
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
  }, [taps]);

  const activeTap = localSelectedTap;

  return (
    <div
      className="relative w-full h-[340px] sm:h-[440px] md:h-[540px] rounded-3xl overflow-hidden shadow-2xl border border-primary/20 mb-8"
      style={{ isolation: "isolate" }}
    >
      {/* Header badge */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-background/80 border border-primary/30 shadow-lg">
        <Wifi className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">IIT BHU — Campus Sensor Map</span>
        <span className="flex items-center gap-1 ml-2 text-xs text-success font-medium">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          {taps.length} Stations Monitored
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-1.5 px-3 py-3 rounded-2xl backdrop-blur-md bg-background/80 border border-border/50 shadow-lg">
        <div className="text-[11px] font-semibold text-foreground/90 mb-0.5">Status Legend</div>
        {([["safe", "#22c55e", "Safe (WQI ≥ 70)"], ["warning", "#f59e0b", "Warning (Needs Treatment)"], ["danger", "#ef4444", "Critical / Hazardous"]] as const).map(
          ([status, color, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-white/60" style={{ background: color }} />
              <span className="text-xs text-foreground/80 font-medium">{label}</span>
            </div>
          )
        )}
        <div className="border-t border-border/40 mt-1 pt-1 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border border-border/80 bg-slate-500" />
          <span className="text-xs text-muted-foreground font-medium">Sensor Offline / Stale</span>
        </div>
      </div>

      {/* Leaflet map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Selected Node Popup */}
      <AnimatePresence>
        {activeTap && (
          <motion.div
            key={activeTap.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="absolute right-4 top-16 z-[400] w-[290px] rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "rgba(8, 14, 28, 0.94)",
              border: `1px solid ${STATUS_THEME[activeTap.evaluation.baseStatus].hex}55`,
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: STATUS_THEME[activeTap.evaluation.baseStatus].hex }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-heading font-bold text-white text-base leading-tight">{activeTap.name}</h3>
                  <p className="text-xs font-medium flex items-center gap-1 mt-0.5 text-muted-foreground">
                    {activeTap.evaluation.isStale ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Stale ({activeTap.lastUpdated})
                      </span>
                    ) : (
                      <span className="text-success flex items-center gap-1">
                        <Wifi className="h-3 w-3" /> Live Telemetry
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setLocalSelectedTap(null)}
                  className="p-1 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* WQI + Status grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] text-white/50 mb-0.5">WQI Score</p>
                  <p
                    className="text-[28px] font-bold font-heading leading-none"
                    style={{ color: STATUS_THEME[activeTap.evaluation.baseStatus].hex }}
                  >
                    {activeTap.wqi}
                  </p>
                  <p className="text-[10px] text-white/60 mt-1">{activeTap.evaluation.wqiBand}</p>
                </div>

                <div
                  className="rounded-xl p-3 text-center flex flex-col justify-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] text-white/50 mb-1.5">Status</p>
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-bold capitalize inline-flex items-center gap-1 justify-center"
                    style={{
                      background: `${STATUS_THEME[activeTap.evaluation.baseStatus].hex}22`,
                      color: STATUS_THEME[activeTap.evaluation.baseStatus].hex,
                      border: `1px solid ${STATUS_THEME[activeTap.evaluation.baseStatus].hex}44`,
                    }}
                  >
                    <Droplets className="h-3 w-3" /> {activeTap.evaluation.statusLabel}
                  </span>
                </div>
              </div>

              {/* Potability status */}
              <div
                className={`mb-3 px-3 py-2 rounded-xl text-center text-xs font-semibold ${
                  activeTap.evaluation.baseStatus === "safe"
                    ? "bg-success/20 text-success border border-success/30"
                    : activeTap.evaluation.baseStatus === "warning"
                    ? "bg-warning/20 text-warning border border-warning/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                }`}
              >
                {activeTap.evaluation.potabilityLabel}
              </div>

              {/* Parameter preview */}
              <div className="mb-3 space-y-1">
                {activeTap.parameters.slice(0, 3).map((p) => (
                  <div
                    key={p.name}
                    className="flex justify-between items-center text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <span className="text-white/60">{p.name}</span>
                    <span className="font-bold text-white/90">
                      {p.value} <span className="font-normal opacity-50">{p.unit}</span>
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setGlobalSelectedTap(activeTap);
                  setLocalSelectedTap(null);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
              >
                Open Detailed Analysis
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
