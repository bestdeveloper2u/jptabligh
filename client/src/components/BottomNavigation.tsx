import { Home, Building2, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "ড্যাশবোর্ড", icon: Home },
  { id: "mosques", label: "মসজিদ", icon: Building2 },
  { id: "halqa", label: "হালকা", icon: MapPin },
  { id: "profile", label: "প্রোফাইল", icon: User },
];

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="glass border-t">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[60px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover-elevate"
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
