import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export type ThemeMode = "dark" | "black" | "light";

interface ThemeOption {
  id: ThemeMode;
  label: string;
  icon: typeof Moon;
  description: string;
  activeColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "dark",
    label: "Ocean",
    icon: Moon,
    description: "Ocean Dark: Deep cyan & midnight waters",
    activeColor: "text-cyan-400 bg-cyan-500/20 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]",
  },
  {
    id: "black",
    label: "OLED",
    icon: Sparkles,
    description: "OLED Black: Pitch black & pure white animation",
    activeColor: "text-white bg-white/20 border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.45)]",
  },
  {
    id: "light",
    label: "Day",
    icon: Sun,
    description: "Day Light: Fresh clean aquatic palette",
    activeColor: "text-amber-500 bg-amber-500/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
  },
];

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`h-8 w-24 rounded-full bg-secondary/60 border border-border/50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const activeTheme: ThemeMode = (theme as ThemeMode) || "dark";

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full bg-secondary/80 border border-border/70 backdrop-blur-md shadow-sm ${className}`}
      role="group"
      aria-label="Theme mode switcher"
    >
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = activeTheme === opt.id;

        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            type="button"
            className={`relative flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-transparent ${
              isActive
                ? opt.activeColor
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
            aria-pressed={isActive}
            title={opt.description}
            aria-label={opt.description}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {showLabel && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
