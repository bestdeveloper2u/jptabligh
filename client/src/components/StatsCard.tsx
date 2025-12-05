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

  const bgVariantClasses = {
    primary: "bg-primary/10",
    secondary: "bg-secondary/10",
    accent: "bg-accent/10",
  };

  return (
    <GlassCard className="hover-elevate transition-all p-4" data-testid={`stats-card-${title}`}>
      <div className="flex flex-col items-center text-center gap-2">
        <div className={cn("p-2 rounded-lg", bgVariantClasses[variant])}>
          <Icon className={cn("w-5 h-5", variantClasses[variant])} />
        </div>
        <p className="text-2xl font-bold" data-testid="stats-value">
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground" data-testid="stats-title">
          {title}
        </p>
        {trend && (
          <p className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )} data-testid="stats-trend">
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </p>
        )}
      </div>
    </GlassCard>
  );
}
