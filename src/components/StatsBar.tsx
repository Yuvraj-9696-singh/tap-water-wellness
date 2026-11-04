import { motion } from "framer-motion";
import { Droplets, CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import { demoTaps } from "@/components/Data/demoData";

const StatsBar = () => {
  const total = demoTaps.length;
  const safe = demoTaps.filter((t) => t.status === "safe").length;
  const warning = demoTaps.filter((t) => t.status === "warning").length;
  const danger = demoTaps.filter((t) => t.status === "danger").length;
  const avgWqi = Math.round(demoTaps.reduce((s, t) => s + t.wqi, 0) / total);

  const stats = [
    {
      icon: Droplets,
      value: total,
      label: "Total Taps",
      color: "text-primary",
      bg: "bg-primary/10",
      glow: "glow-primary",
    },
    {
      icon: CheckCircle2,
      value: safe,
      label: "Safe",
      color: "text-success",
      bg: "bg-success/10",
      glow: "glow-success",
    },
    {
      icon: AlertTriangle,
      value: warning,
      label: "Warning",
      color: "text-warning",
      bg: "bg-warning/10",
      glow: "glow-warning",
    },
    {
      icon: XCircle,
      value: danger,
      label: "Critical",
      color: "text-destructive",
      bg: "bg-destructive/10",
      glow: "glow-danger",
    },
    {
      icon: Activity,
      value: avgWqi,
      label: "Avg WQI",
      color: "text-primary",
      bg: "bg-primary/10",
      glow: "glow-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform duration-300"
        >
          <div className={`p-2 rounded-xl ${stat.bg} ${stat.glow}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <span className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</span>
          <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsBar;
