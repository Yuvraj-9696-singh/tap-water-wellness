import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR / hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`h-9 w-9 rounded-full bg-secondary/80 border border-border/60 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border ${
        isDark
          ? "bg-secondary/80 border-border/60 text-amber-300 hover:text-amber-200 hover:bg-secondary hover:border-amber-400/40 shadow-sm"
          : "bg-secondary border-border/80 text-sky-600 hover:text-sky-700 hover:bg-secondary/80 hover:border-sky-400/50 shadow-sm"
      } ${className}`}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <motion.div
        key={isDark ? "dark" : "light"}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex items-center gap-2"
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.5)]" />
        ) : (
          <Moon className="h-4 w-4 text-sky-600 drop-shadow-[0_0_6px_rgba(2,132,199,0.3)]" />
        )}
        {showLabel && (
          <span className="text-xs font-semibold text-foreground pr-1">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        )}
      </motion.div>
    </button>
  );
}
