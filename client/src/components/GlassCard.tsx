import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn("glass rounded-2xl p-6 shadow-xl", className)}>
      {children}
    </div>
  );
}
