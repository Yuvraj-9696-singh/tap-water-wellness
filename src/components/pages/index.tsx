import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Activity,
  Shield,
  Search,
  ArrowUpDown,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsBar from "@/components/StatsBar";
import TapCard from "@/components/TapCard";
import TrendChart from "@/components/TrendChart";
import TapDetailModal from "@/components/TapDetailModal";
import CampusMap from "@/components/CampusMap";
import AlertsPanel from "@/components/AlertsPanel";
import { useWaterData } from "@/context/WaterDataContext";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/predict", label: "Predict" },
  { to: "/about", label: "About" },
];

type SortOption = "worst" | "best" | "recent" | "az";

const Index = () => {
  const { taps, freshness, filter, setFilter, selectedTap, setSelectedTap } = useWaterData();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("worst");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Brief initial loading skeleton simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  // Filter + Search + Sort
  const processedTaps = useMemo(() => {
    // 1. Status Filter
    let list =
      filter === "all"
        ? taps
        : filter === "stale"
        ? taps.filter((t) => t.evaluation.isStale)
        : taps.filter((t) => t.evaluation.baseStatus === filter);

    // 2. Search query (matches name or location)
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q)
      );
    }

    // 3. Sort
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "worst":
          return a.wqi - b.wqi; // Lowest WQI first
        case "best":
          return b.wqi - a.wqi; // Highest WQI first
        case "recent":
          return a.evaluation.minutesAgo - b.evaluation.minutesAgo; // Most recently updated
        case "az":
          return a.name.localeCompare(b.name); // Alphabetical
        default:
          return 0;
      }
    });
  }, [taps, filter, search, sortBy]);

  const clearFilters = () => {
    setFilter("all");
    setSearch("");
    setSortBy("worst");
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-md bg-background/60 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen((p) => !p)}
                className="sm:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div className="p-2 rounded-xl bg-primary/20 glow-primary">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold gradient-text">AquaWatch</h1>
                <p className="text-xs text-muted-foreground">IoT Water Quality Monitoring</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-1" aria-label="Main Navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Freshness Indicator & Alerts Flyout */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  freshness.mode === "live"
                    ? "bg-success/20 text-success border border-success/30"
                    : freshness.mode === "partial"
                    ? "bg-warning/20 text-warning border border-warning/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                }`}
                title={`Telemetry status: ${freshness.label}`}
                role="status"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    freshness.mode === "live"
                      ? "bg-success animate-pulse-glow"
                      : freshness.mode === "partial"
                      ? "bg-warning animate-pulse"
                      : "bg-destructive animate-pulse"
                  }`}
                />
                {freshness.mode === "live" ? (
                  <span>Live Monitoring</span>
                ) : freshness.mode === "partial" ? (
                  <span>Partial ({freshness.staleCount} Stale)</span>
                ) : (
                  <span>Offline</span>
                )}
              </div>

              <AlertsPanel />
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="sm:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1.5"
                aria-label="Mobile Navigation"
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      location.pathname === link.to
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 pt-12 pb-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-primary/10 glow-primary animate-float">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
              Real-Time <span className="gradient-text">Tap Water</span> Wellness
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              Monitoring water quality parameters using IoT sensors and ML-powered prediction
              to ensure safe drinking water across campus
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <Link
                to="/predict"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all glow-primary"
              >
                Predict Water Quality →
              </Link>
              <a
                href="#tap-stations"
                className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors"
              >
                View Tap Stations
              </a>
            </div>
          </motion.div>
        </section>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-16">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <CampusMap />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <StatsBar />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <TrendChart />
          </motion.div>

          {/* Filter & Search Controls Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, amount: 0.2 }} 
            transition={{ duration: 0.6 }}
            id="tap-stations" 
            className="mb-6 mt-8 space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-heading font-bold text-lg text-foreground">Tap Stations</h3>
                <span className="text-xs text-muted-foreground ml-1">
                  ({processedTaps.length} of {taps.length} showing)
                </span>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Box */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search stations or zones..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs bg-secondary border border-border/60 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                    aria-label="Search tap stations by name or location"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 bg-secondary border border-border/60 rounded-full px-2.5 py-1">
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-xs bg-transparent text-foreground focus:outline-none cursor-pointer"
                    aria-label="Sort tap stations"
                  >
                    <option value="worst" className="bg-card">Worst WQI First</option>
                    <option value="best" className="bg-card">Best WQI First</option>
                    <option value="recent" className="bg-card">Recently Updated</option>
                    <option value="az" className="bg-card">Alphabetical (A–Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Tabs Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
              <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Status filters">
                {(["all", "safe", "warning", "danger", "stale"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                      filter === f
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`}
                    role="tab"
                    aria-selected={filter === f}
                    aria-label={`Filter by ${f} stations`}
                  >
                    {f === "stale" ? "Offline / Stale" : f}
                  </button>
                ))}
              </div>

              {(search || filter !== "all" || sortBy !== "worst") && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <RotateCcw className="h-3 w-3" /> Reset Filters
                </button>
              )}
            </div>
          </motion.div>

          {/* Skeleton Loaders (Initial render simulation) */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-5 border border-border/40 animate-pulse space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-4 bg-secondary rounded w-1/2" />
                    <div className="h-4 bg-secondary rounded w-16" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-secondary/80 rounded w-1/3" />
                    <div className="h-3 bg-secondary/80 rounded w-1/4" />
                  </div>
                  <div className="h-20 bg-secondary/60 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            /* Tap Stations Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedTaps.map((tap, i) => (
                <TapCard key={tap.id} tap={tap} onClick={setSelectedTap} index={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && processedTaps.length === 0 && (
            <div className="glass-card rounded-2xl py-14 px-6 text-center border border-border/60 max-w-md mx-auto my-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-foreground">No stations found</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {search
                    ? `No tap station matches the search term "${search}".`
                    : "No tap station matches the selected filter status."}
                </p>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm inline-flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear Filters & Show All
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 backdrop-blur-md bg-background/50 py-6">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            <p>AquaWatch — Environmental Engineering Department | Undergraduate Project</p>
            <p className="mt-1">IoT Sensor Network × Machine Learning × IS 10500:2012 × Water Quality Index</p>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {selectedTap && (
          <TapDetailModal tap={selectedTap} onClose={() => setSelectedTap(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
