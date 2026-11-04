import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { historicalData } from "@/components/Data/demoData";
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl p-3 border border-border/50 text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-primary font-semibold">WQI: {payload[0]?.value}</p>
        {payload[1] && <p className="text-blue-400">pH: {payload[1]?.value}</p>}
      </div>
    );
  }
  return null;
};

const TrendChart = () => {
  const avgWqi = Math.round(
    historicalData.reduce((s, d) => s + d.wqi, 0) / historicalData.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">WQI Trend (Today)</h3>
            <p className="text-xs text-muted-foreground">Avg WQI: {avgWqi} — Campus average</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-full bg-primary" />
            <span className="text-muted-foreground">WQI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-full bg-blue-400" />
            <span className="text-muted-foreground">pH</span>
          </div>
        </div>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historicalData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="wqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(186 100% 42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(186 100% 42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="phGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 30% 18%)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(200 20% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(200 20% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={70}
              stroke="hsl(152 69% 40%)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="wqi"
              stroke="hsl(186 100% 42%)"
              strokeWidth={2.5}
              fill="url(#wqiGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "hsl(186 100% 42%)" }}
            />
            <Area
              type="monotone"
              dataKey="pH"
              stroke="#60a5fa"
              strokeWidth={1.5}
              fill="url(#phGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#60a5fa" }}
              strokeDasharray="4 2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default TrendChart;
