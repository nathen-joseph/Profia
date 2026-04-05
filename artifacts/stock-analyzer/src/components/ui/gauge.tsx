import { motion } from "framer-motion";

interface GaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function Gauge({ value, size = 120, strokeWidth = 10, className = "" }: GaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  // Determine color based on value
  const colorClass = value >= 70 ? "text-primary" : value >= 40 ? "text-chart-3" : "text-destructive";

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/30"
        />
        {/* Value track */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={colorClass}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tighter">{Math.round(value)}%</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Success</span>
      </div>
    </div>
  );
}
