import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, XCircle, Droplets, Wifi, WifiOff, Clock, Layers, MapPin } from "lucide-react";
import { useWaterData, EnhancedTapLocation } from "@/context/WaterDataContext";
import { STATUS_THEME } from "@/config/waterQualityConfig";
import "leaflet/dist/leaflet.css";

// IIT BHU verified GPS coordinates for each campus station
const GPS_COORDS: Record<string, [number, number]> = {
  "tap-1": [25.2635, 82.9868], // Vishwakarma Hostel, IIT BHU
  "tap-2": [25.2624, 82.9876], // Rajputana Ground & Sports Complex, IIT BHU
  "tap-3": [25.2618, 82.9893], // Main Library (Dr. S. Radhakrishnan / Central Library), IIT BHU
  "tap-4": [25.2598, 82.9882], // LC (Lecture Theatre Complex / LT-3), IIT BHU
  "tap-5": [25.2592, 82.9865], // Visvesvaraya Hostel, IIT BHU
};

type TileStyle = "osm" | "hot" | "dark";

const TILE_LAYERS: Record<TileStyle, { url: string; attribution: string; name: string }> = {
  osm: {
    name: "OpenStreetMap Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
  hot: {
    name: "OSM Humanitarian",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team',
  },
  dark: {
    name: "OSM Dark Mode",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

export default function CampusMap() {
  const { taps, setSelectedTap: setGlobalSelectedTap } = useWaterData();
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [localSelectedTap, setLocalSelectedTap] = useState<EnhancedTapLocation | null>(null);
  const [activeTileStyle, setActiveTileStyle] = useState<TileStyle>("osm");

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const latLngs = Object.values(GPS_COORDS).map(([lat, lng]) => L.latLng(lat, lng));
      const bounds = L.latLngBounds(latLngs);

      const map = L.map(mapContainerRef.current!, {
        center: [25.2615, 82.9878], // Center of IIT BHU academic & hostel quadrangle
        zoom: 16,
        zoomControl: true,
        attributionControl: true,
      });

      mapRef.current = map;

      // Add OpenStreetMap default tile layer
      const activeTile = TILE_LAYERS.osm;
      tileLayerRef.current = L.tileLayer(activeTile.url, {
        attribution: activeTile.attribution,
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Fit campus bounds with generous padding so all station pins are clearly visible
      map.fitBounds(bounds, { padding: [70, 70] });

      // Add accurately pointed teardrop markers for each station
      taps.forEach((tap) => {
        const [lat, lng] = GPS_COORDS[tap.id] ?? [25.2615, 82.9878];
        const statusTheme = STATUS_THEME[tap.evaluation.baseStatus];
        const isStale = tap.evaluation.isStale;
        const color = isStale ? "#94a3b8" : statusTheme.hex;
        const displayWqi = tap.wqi;

        const faultBadge = isStale
          ? `
          <div style="
            position:absolute;top:-4px;right:-4px;z-index:10;
            width:18px;height:18px;border-radius:50%;
            background:#64748b;border:2px solid #0f172a;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:bold;color:#fff;
            box-shadow:0 0 6px rgba(0,0,0,0.6);
          " title="Sensor Offline">⏱</div>
        `
          : tap.sensorStatus === "faulty"
          ? `
          <div style="
            position:absolute;top:-4px;right:-4px;z-index:10;
            width:18px;height:18px;border-radius:50%;
            background:#f59e0b;border:2px solid #0f172a;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:bold;color:#000;
            box-shadow:0 0 6px rgba(0,0,0,0.6);
          " title="Sensor Fault">⚠</div>
        `
          : "";

        // Precision teardrop map pin with tip pointing exactly to coordinate [22, 52]
        const iconHtml = `
          <div style="position:relative; width:44px; height:54px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45)); cursor:pointer;">
            <!-- Teardrop Pin Shape pointing downward -->
            <svg width="44" height="54" viewBox="0 0 44 54" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 0C9.84974 0 0 9.84974 0 22C0 35.5 19 50.5 22 53C25 50.5 44 35.5 44 22C44 9.84974 34.1503 0 22 0Z" fill="${color}" stroke="${isStale ? '#cbd5e1' : '#ffffff'}" stroke-width="2.5"/>
              <circle cx="22" cy="22" r="15" fill="#0f172a" fill-opacity="0.3"/>
            </svg>
            
            <!-- WQI Score centered inside head of pin -->
            <div style="position:absolute; top:9px; left:0; width:44px; text-align:center; color:#ffffff; font-size:14px; font-weight:800; font-family:sans-serif; text-shadow:0 1px 3px rgba(0,0,0,0.8); pointer-events:none;">
              ${displayWqi}
            </div>

            ${faultBadge}

            <!-- Station Label directly below marker -->
            <div style="position:absolute; top:56px; left:50%; transform:translateX(-50%); white-space:nowrap; background:rgba(15,23,42,0.95); color:#f8fafc; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid ${color}; box-shadow:0 2px 8px rgba(0,0,0,0.5); font-family:sans-serif; pointer-events:none;">
              ${tap.name}
            </div>
          </div>
        `;

        const customPinIcon = L.divIcon({
          html: iconHtml,
          className: "custom-pointed-pin",
          iconSize: [44, 54],
          iconAnchor: [22, 53], // Exactly at the bottom point of the teardrop pin
          popupAnchor: [0, -54],
        });

        const marker = L.marker([lat, lng], { icon: customPinIcon }).addTo(map);

        // Bind informative tooltip on hover
        marker.bindTooltip(
          `<strong>${tap.name}</strong><br/>WQI: ${displayWqi} • ${tap.evaluation.statusLabel}<br/><span style="font-size:10px;color:#94a3b8;">${tap.evaluation.potabilityLabel}</span>`,
          { direction: "top", offset: [0, -54], opacity: 0.95 }
        );

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

  // Handle Tile Style Change
  const switchTileStyle = (style: TileStyle) => {
    setActiveTileStyle(style);
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
      const selected = TILE_LAYERS[style];
      tileLayerRef.current = L.tileLayer(selected.url, {
        attribution: selected.attribution,
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(mapRef.current);
    });
  };

  const activeTap = localSelectedTap;

  return (
    <div
      className="relative w-full h-[360px] sm:h-[460px] md:h-[560px] rounded-3xl overflow-hidden shadow-2xl border border-primary/20 mb-8"
      style={{ isolation: "isolate" }}
    >
      {/* Top Left: Title Badge & Network Health */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-md bg-background/90 border border-primary/30 shadow-lg">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-xs sm:text-sm font-bold text-foreground">
          IIT BHU Varanasi — OpenStreetMap Telemetry
        </span>
        <span className="flex items-center gap-1 text-[11px] text-success font-semibold border-l border-border/60 pl-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          {taps.length} Points Marked
        </span>
      </div>

      {/* Top Right: OpenStreetMap Tile Style Switcher */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-1 p-1 rounded-2xl backdrop-blur-md bg-background/90 border border-border/60 shadow-lg">
        <span className="text-[10px] text-muted-foreground font-semibold px-2 flex items-center gap-1">
          <Layers className="h-3 w-3" /> Map Style:
        </span>
        {(["osm", "hot", "dark"] as TileStyle[]).map((style) => (
          <button
            key={style}
            onClick={() => switchTileStyle(style)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
              activeTileStyle === style
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title={TILE_LAYERS[style].name}
          >
            {style === "osm" ? "OSM Standard" : style === "hot" ? "Humanitarian" : "Dark"}
          </button>
        ))}
      </div>

      {/* Bottom Left: Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-1.5 px-3 py-2.5 rounded-2xl backdrop-blur-md bg-background/90 border border-border/60 shadow-lg">
        <div className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-0.5">
          Water Quality Status
        </div>
        {([["safe", "#22c55e", "Safe (WQI ≥ 70)"], ["warning", "#f59e0b", "Warning (Needs Treatment)"], ["danger", "#ef4444", "Critical / Contaminated"]] as const).map(
          ([status, color, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full border border-white"
                style={{ background: color }}
              />
              <span className="text-[11px] text-foreground font-medium">{label}</span>
            </div>
          )
        )}
        <div className="border-t border-border/40 mt-0.5 pt-1 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border border-white/60 bg-slate-500" />
          <span className="text-[11px] text-muted-foreground font-medium">Sensor Offline (&gt;30m)</span>
        </div>
      </div>

      {/* Leaflet map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Selected Node Details Card */}
      <AnimatePresence>
        {activeTap && (
          <motion.div
            key={activeTap.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="absolute right-4 bottom-4 sm:top-16 sm:bottom-auto z-[400] w-[290px] rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "rgba(10, 18, 32, 0.96)",
              border: `1.5px solid ${STATUS_THEME[activeTap.evaluation.baseStatus].hex}88`,
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: STATUS_THEME[activeTap.evaluation.baseStatus].hex }}
            />

            <div className="p-4 sm:p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-heading font-bold text-white text-base leading-tight">
                    {activeTap.name}
                  </h3>
                  <p className="text-xs font-medium flex items-center gap-1 mt-0.5 text-muted-foreground">
                    {activeTap.evaluation.isStale ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Stale ({activeTap.lastUpdated})
                      </span>
                    ) : (
                      <span className="text-success flex items-center gap-1">
                        <Wifi className="h-3 w-3" /> Telemetry Verified
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setLocalSelectedTap(null)}
                  className="p-1 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                  aria-label="Close station popup"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* WQI + Status grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-[10px] text-white/60 mb-0.5">WQI Score</p>
                  <p
                    className="text-2xl font-black font-heading leading-none"
                    style={{ color: STATUS_THEME[activeTap.evaluation.baseStatus].hex }}
                  >
                    {activeTap.wqi}
                  </p>
                  <p className="text-[10px] text-white/70 mt-1">{activeTap.evaluation.wqiBand}</p>
                </div>

                <div
                  className="rounded-xl p-3 text-center flex flex-col justify-center"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-[10px] text-white/60 mb-1.5">Status</p>
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
                className={`mb-3 px-3 py-1.5 rounded-xl text-center text-xs font-semibold ${
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
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              >
                Open Detailed Station Analysis
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
