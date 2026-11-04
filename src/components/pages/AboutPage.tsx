import { motion } from "framer-motion";
import { Droplets, BookOpen, Brain, Wifi, Shield, Github, FlaskConical } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/predict", label: "Predict" },
  { to: "/about", label: "About" },
];

const features = [
  {
    icon: Wifi,
    title: "IoT Sensor Network",
    description: "Real-time data from 5 tap stations across campus using ESP32 + sensors for pH, turbidity, TDS, DO, and more.",
  },
  {
    icon: Brain,
    title: "ML-Powered Prediction",
    description: "In-browser AI model using IS 10500:2012 weighted sub-index formula for instant WQI prediction without a backend.",
  },
  {
    icon: Shield,
    title: "IS 10500:2012 Compliance",
    description: "All parameters benchmarked against India's Bureau of Indian Standards and WHO 2022 drinking water guidelines.",
  },
  {
    icon: FlaskConical,
    title: "10 Water Parameters",
    description: "pH, Turbidity, TDS, DO, BOD, Conductivity, Ammonia, COD, Lead, Mercury — comprehensive water quality assessment.",
  },
  {
    icon: BookOpen,
    title: "PDF Reports",
    description: "Downloadable laboratory-style reports with parameter analysis, IS 10500 comparison, and remediation advice.",
  },
];

const parameters = [
  { name: "pH", role: "Acidity/Alkalinity", limit: "6.5–8.5", who: "6.5–8.0" },
  { name: "Turbidity", role: "Suspended particles", limit: "10 NTU", who: "5 NTU" },
  { name: "TDS", role: "Mineral content", limit: "2000 mg/L", who: "600 mg/L" },
  { name: "DO", role: "Water freshness", limit: "≥6 mg/L", who: "N/A" },
  { name: "BOD", role: "Organic pollution", limit: "5 mg/L", who: "N/A" },
  { name: "Conductivity", role: "Dissolved ions", limit: "2000 μS/cm", who: "400 μS/cm" },
  { name: "Ammonia", role: "Sewage indicator", limit: "0.5 mg/L", who: "1.5 mg/L" },
  { name: "COD", role: "Chemical pollution", limit: "10 mg/L", who: "N/A" },
  { name: "Lead", role: "Toxic heavy metal", limit: "0.05 mg/L", who: "0.01 mg/L" },
  { name: "Mercury", role: "Toxic heavy metal", limit: "0.001 mg/L", who: "0.006 mg/L" },
];

const AboutPage = () => {
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
                <Link key={link.to} to={link.to} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${location.pathname === link.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 pb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              About <span className="gradient-text">AquaWatch</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              An undergraduate research project making drinking water quality monitoring accessible through IoT, machine learning, and IS 10500:2012 standards.
            </p>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-2xl p-5">
                <div className="p-2.5 rounded-xl bg-primary/10 glow-primary w-fit mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Standards Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6 mb-12">
            <h3 className="font-heading font-semibold text-foreground mb-4 text-lg">IS 10500:2012 & WHO Standards</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Parameter</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Role</th>
                    <th className="text-left py-2 px-3 text-warning font-medium">IS 10500 Permissible</th>
                    <th className="text-left py-2 px-3 text-blue-400 font-medium">WHO Guideline</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((p, i) => (
                    <tr key={p.name} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}>
                      <td className="py-2 px-3 font-semibold text-foreground">{p.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{p.role}</td>
                      <td className="py-2 px-3 text-warning">{p.limit}</td>
                      <td className="py-2 px-3 text-blue-400">{p.who}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* WQI Formula */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6 mb-12">
            <h3 className="font-heading font-semibold text-foreground mb-4 text-lg">WQI Calculation Methodology</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Weighted Arithmetic Mean (IS WQI)</h4>
                <div className="bg-secondary/50 rounded-xl p-4 font-mono text-xs space-y-1 text-muted-foreground">
                  <p className="text-foreground">qi = ((Vi - Vio) / (Vs - Vio)) × 100</p>
                  <p className="text-foreground">WQI = Σ(qi × Wi) / Σ(Wi)</p>
                  <p className="mt-2">Vi  = Observed value</p>
                  <p>Vio = Ideal value (best case)</p>
                  <p>Vs  = IS 10500 standard value</p>
                  <p>Wi  = Assigned weight for parameter</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">WQI Classification</h4>
                <div className="space-y-2">
                  {[
                    { range: "90–100", label: "Excellent", color: "text-success", bg: "bg-success/10" },
                    { range: "70–89", label: "Good", color: "text-success", bg: "bg-success/10" },
                    { range: "50–69", label: "Fair", color: "text-warning", bg: "bg-warning/10" },
                    { range: "25–49", label: "Poor", color: "text-destructive", bg: "bg-destructive/10" },
                    { range: "0–24", label: "Very Poor", color: "text-destructive", bg: "bg-destructive/10" },
                  ].map((c) => (
                    <div key={c.label} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${c.bg}`}>
                      <span className={`text-xs font-semibold ${c.color}`}>{c.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{c.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* References */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-semibold text-foreground mb-3 text-lg">References</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>• Bureau of Indian Standards. <em>IS 10500:2012 — Drinking Water Specification</em>. BIS, New Delhi.</li>
              <li>• World Health Organization. <em>Guidelines for Drinking-water Quality, 4th Edition incorporating the 1st and 2nd Addenda</em>. WHO Press, 2022.</li>
              <li>• Brown, R.M., McClelland, N.I., Deininger, R.A. and Tozer, R.G. (1970). <em>A water quality index — Do we dare?</em> Water & Sewage Works.</li>
              <li>• Central Pollution Control Board (CPCB). <em>Water Quality Assessment and Monitoring Programme</em>. Ministry of Environment, India.</li>
            </ul>
          </motion.div>
        </div>

        <footer className="border-t border-border/50 backdrop-blur-md bg-background/50 py-6">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            <p>AquaWatch — Environmental Engineering Department | Undergraduate Project</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AboutPage;
