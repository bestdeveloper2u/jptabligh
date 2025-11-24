import { LucideIcon } from "lucide-react";
import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "primary" | "secondary" | "accent";
}

export default function StatsCard({ title, value, icon: Icon, trend, variant = "primary" }: StatsCardProps) {
  const variantClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  return (
    <GlassCard className="hover-elevate transition-all" data-testid={`stats-card-${title}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1" data-testid="stats-title">
            {title}
          </p>
          <p className="text-3xl font-bold mb-2" data-testid="stats-value">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )} data-testid="stats-trend">
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", variantClasses[variant], "bg-current bg-opacity-10")}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </GlassCard>
  );
}
