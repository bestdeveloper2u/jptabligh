import { useState, useEffect } from "react";
import { Home, Building2, MapPin, Users, Settings, UserPlus, PanelLeftClose, PanelLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import TopNavigation from "./TopNavigation";
import BottomNavigation from "./BottomNavigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isDesktopSidebarCollapsed));
  }, [isDesktopSidebarCollapsed]);

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
  };

  const handleProfileClick = () => {
    setLocation(`/member/${userId}`);
  };

  const handleSettingsClick = () => {
    setLocation("/settings");
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

  const SidebarButton = ({ item, isActive }: { item: typeof sidebarItems[0]; isActive: boolean }) => {
    const Icon = item.icon;
    
    const handleClick = () => {
      if (item.id === "settings") {
        setLocation("/settings");
      } else {
        onViewChange(item.id);
      }
      setIsMobileSidebarOpen(false);
    };

    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover-elevate",
          isDesktopSidebarCollapsed && "md:justify-center md:px-2"
        )}
        data-testid={`sidebar-${item.id}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className={cn("font-medium", isDesktopSidebarCollapsed && "md:hidden")}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div className="gradient-bg min-h-screen">
      <TopNavigation
        userName={userName}
        userRole={userRole}
        notifications={notifications}
        onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onLogout={onLogout}
        onNotificationClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
      />

      <div className="flex">
        <aside
          className={cn(
            "fixed md:sticky top-[73px] left-0 h-[calc(100vh-73px)] glass border-r transition-all duration-300 z-40 flex flex-col",
            isMobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
            isDesktopSidebarCollapsed ? "md:w-16" : "md:w-64"
          )}
        >
          <nav className={cn("flex-1 p-4 space-y-2", isDesktopSidebarCollapsed && "md:p-2")}>
            {filteredItems.map((item) => {
              const isActive = activeView === item.id;

              if (isDesktopSidebarCollapsed) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="hidden md:block">
                        <SidebarButton item={item} isActive={isActive} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden md:block">
                      {item.label}
                    </TooltipContent>
                    <div className="md:hidden">
                      <SidebarButton item={item} isActive={isActive} />
                    </div>
                  </Tooltip>
                );
              }

              return <SidebarButton key={item.id} item={item} isActive={isActive} />;
            })}
          </nav>

          <div className={cn("p-4 border-t hidden md:block", isDesktopSidebarCollapsed && "p-2")}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isDesktopSidebarCollapsed ? "icon" : "default"}
                  onClick={toggleDesktopSidebar}
                  className={cn("w-full", isDesktopSidebarCollapsed ? "justify-center" : "justify-start gap-2")}
                  data-testid="button-toggle-sidebar"
                >
                  {isDesktopSidebarCollapsed ? (
                    <PanelLeft className="w-5 h-5" />
                  ) : (
                    <>
                      <PanelLeftClose className="w-5 h-5" />
                      <span>সাইডবার হাইড করুন</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {isDesktopSidebarCollapsed && (
                <TooltipContent side="right">
                  সাইডবার প্রদর্শন করুন
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <BottomNavigation activeTab={activeView} onTabChange={onViewChange} />
    </div>
  );
}
