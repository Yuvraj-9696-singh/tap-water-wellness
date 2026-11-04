import { motion } from "framer-motion";
import { Droplets } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import PredictPage from "@/components/pages/PredictPage";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/predict", label: "Predict" },
  { to: "/about", label: "About" },
];

const PredictLayout = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/20 text-success text-xs font-medium hidden sm:flex">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              Live Monitoring
            </div>
          </div>
        </header>
        <PredictPage />
        <footer className="border-t border-border/50 backdrop-blur-md bg-background/50 py-6 mt-4">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            <p>AquaWatch — Environmental Engineering Department | Undergraduate Project</p>
            <p className="mt-1">IoT Sensor Network × Machine Learning × IS 10500:2012 × Water Quality Index</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PredictLayout;
