import { useState } from "react";
import { Home, Building2, MapPin, Users, Settings, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import TopNavigation from "./TopNavigation";
import BottomNavigation from "./BottomNavigation";
import { cn } from "@/lib/utils";
import type { Takaja } from "@shared/schema";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  userId: string;
  userRole: "super_admin" | "manager" | "member";
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const sidebarItems = [
  { id: "dashboard", label: "ড্যাশবোর্ড", icon: Home },
  { id: "mosques", label: "মসজিদ", icon: Building2 },
  { id: "halqa", label: "হালকা", icon: MapPin },
  { id: "members", label: "সাথীগণ", icon: Users },
  { id: "managers", label: "ম্যানেজার", icon: UserPlus, adminOnly: true },
  { id: "settings", label: "সেটিংস", icon: Settings },
];

export default function DashboardLayout({ 
  children, 
  userName, 
  userId,
  userRole, 
  activeView, 
  onViewChange,
  onLogout 
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleProfileClick = () => {
    setLocation(`/member/${userId}`);
  };

  const handleSettingsClick = () => {
    onViewChange("settings");
  };

  const { data: myTakajasData } = useQuery<{ takajas: Takaja[] }>({
    queryKey: ["/api/takajas/my"],
    enabled: userRole === "member",
    refetchInterval: 30000,
  });

  const notifications = (myTakajasData?.takajas || []).map(takaja => ({
    id: takaja.id,
    title: takaja.title,
    description: takaja.description,
    priority: takaja.priority,
    status: takaja.status,
    createdAt: takaja.createdAt,
  }));

  const filteredItems = sidebarItems.filter(
    item => !item.adminOnly || userRole === "super_admin"
  );

  const handleNotificationClick = (takajaId: string) => {
    onViewChange("dashboard");
  };

  return (
    <div className="gradient-bg min-h-screen">
      <TopNavigation
        userName={userName}
        userRole={userRole}
        notifications={notifications}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={onLogout}
        onNotificationClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
      />

      <div className="flex">
        <aside
          className={cn(
            "fixed md:sticky top-[73px] left-0 h-[calc(100vh-73px)] w-64 glass border-r transition-transform duration-300 z-40",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <nav className="p-4 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover-elevate"
                  )}
                  data-testid={`sidebar-${item.id}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <BottomNavigation activeTab={activeView} onTabChange={onViewChange} />
    </div>
  );
}
