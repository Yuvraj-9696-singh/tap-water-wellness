import { useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Activity, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import StatsBar from "@/components/StatsBar";
import TapCard from "@/components/TapCard";
import TrendChart from "@/components/TrendChart";
import TapDetailModal from "@/components/TapDetailModal";
import CampusMap from "@/components/CampusMap";
import { demoTaps, TapLocation } from "@/components/Data/demoData";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/predict", label: "Predict" },
  { to: "/about", label: "About" },
];

const Index = () => {
  const [selectedTap, setSelectedTap] = useState<TapLocation | null>(null);
  const [filter, setFilter] = useState<"all" | "safe" | "warning" | "danger">("all");
  const location = useLocation();

  const filteredTaps = filter === "all" ? demoTaps : demoTaps.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-md bg-background/50 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 glow-primary">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold gradient-text">AquaWatch</h1>
                <p className="text-xs text-muted-foreground">IoT Water Quality Monitoring</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/20 text-success text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
                Live Monitoring
              </div>
            </div>
          </div>
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

          {/* Filter Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, amount: 0.2 }} 
            transition={{ duration: 0.6 }}
            id="tap-stations" 
            className="flex items-center gap-2 mb-6 mt-8"
          >
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-semibold text-foreground">Tap Stations</h3>
            <div className="ml-auto flex gap-1">
              {(["all", "safe", "warning", "danger"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTaps.map((tap, i) => (
              <TapCard key={tap.id} tap={tap} onClick={setSelectedTap} index={i} />
            ))}
          </div>

          {filteredTaps.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No tap stations match the selected filter.
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

      <TapDetailModal tap={selectedTap} onClose={() => setSelectedTap(null)} />
    </div>
  );
};

export default Index;
