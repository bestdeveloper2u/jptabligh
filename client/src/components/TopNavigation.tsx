import { Bell, Menu, Moon, Sun, LogOut, ClipboardList, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

interface Notification {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  createdAt: string | Date;
}

type ThemeMode = "light" | "dark" | "system" | "schedule";
type LogoType = "logo" | "text" | "both";

interface TopNavigationProps {
  userName: string;
  userRole: "super_admin" | "manager" | "member";
  notifications?: Notification[];
  onMenuClick?: () => void;
  onLogout?: () => void;
  onNotificationClick?: (id: string) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

const roleLabels = {
  super_admin: "সুপার এডমিন",
  manager: "ম্যানেজার",
  member: "সাথী",
};

const roleColors = {
  super_admin: "bg-primary",
  manager: "bg-secondary",
  member: "bg-accent",
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: "কম", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  normal: { label: "সাধারণ", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "বেশি", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "জরুরি", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export default function TopNavigation({ 
  userName, 
  userRole, 
  notifications = [], 
  onMenuClick, 
  onLogout,
  onNotificationClick,
  onProfileClick,
  onSettingsClick
}: TopNavigationProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [darkModeStart, setDarkModeStart] = useState("18:00");
  const [darkModeEnd, setDarkModeEnd] = useState("06:00");
  
  const initials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  
  const pendingNotifications = notifications.filter(n => n.status !== "completed");
  const hasNotifications = pendingNotifications.length > 0;

  const { data: settingsData } = useQuery<{ settings: Record<string, string> }>({
    queryKey: ["/api/settings"],
  });

  const siteTitle = settingsData?.settings?.siteTitle || "জামালপুর তাবলীগ";
  const siteLogo = settingsData?.settings?.siteLogo || "";
  const logoType: LogoType = (settingsData?.settings?.logoType as LogoType) || "text";

  const isInDarkModeSchedule = useCallback((startTime: string, endTime: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }, []);

  const applyTheme = useCallback((mode: ThemeMode, startTime?: string, endTime?: string) => {
    const root = document.documentElement;
    
    if (mode === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) {
        root.classList.add("dark");
        setIsDark(true);
      } else {
        root.classList.remove("dark");
        setIsDark(false);
      }
    } else if (mode === "schedule") {
      const start = startTime || darkModeStart;
      const end = endTime || darkModeEnd;
      if (isInDarkModeSchedule(start, end)) {
        root.classList.add("dark");
        setIsDark(true);
      } else {
        root.classList.remove("dark");
        setIsDark(false);
      }
    } else if (mode === "dark") {
      root.classList.add("dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      setIsDark(false);
    }
  }, [darkModeStart, darkModeEnd, isInDarkModeSchedule]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode | null;
    const savedStart = localStorage.getItem("darkModeStart");
    const savedEnd = localStorage.getItem("darkModeEnd");
    
    if (savedTheme) setThemeMode(savedTheme);
    if (savedStart) setDarkModeStart(savedStart);
    if (savedEnd) setDarkModeEnd(savedEnd);
    
    applyTheme(savedTheme || "system", savedStart || "18:00", savedEnd || "06:00");
  }, []);

  useEffect(() => {
    if (settingsData?.settings) {
      const settings = settingsData.settings;
      const apiTheme = settings.themeMode as ThemeMode | undefined;
      const apiStart = settings.darkModeStart;
      const apiEnd = settings.darkModeEnd;
      
      if (apiTheme) {
        setThemeMode(apiTheme);
        localStorage.setItem("themeMode", apiTheme);
      }
      if (apiStart) {
        setDarkModeStart(apiStart);
        localStorage.setItem("darkModeStart", apiStart);
      }
      if (apiEnd) {
        setDarkModeEnd(apiEnd);
        localStorage.setItem("darkModeEnd", apiEnd);
      }
      
      if (apiTheme || apiStart || apiEnd) {
        applyTheme(
          apiTheme || themeMode, 
          apiStart || darkModeStart, 
          apiEnd || darkModeEnd
        );
      }
    }
  }, [settingsData]);

  useEffect(() => {
    if (themeMode === "schedule") {
      const interval = setInterval(() => {
        applyTheme("schedule", darkModeStart, darkModeEnd);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [themeMode, darkModeStart, darkModeEnd, applyTheme]);

  const cycleTheme = () => {
    const modes: ThemeMode[] = ["light", "dark", "system", "schedule"];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    setThemeMode(nextMode);
    localStorage.setItem("themeMode", nextMode);
    applyTheme(nextMode, darkModeStart, darkModeEnd);
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case "light":
        return <Sun className="w-5 h-5" />;
      case "dark":
        return <Moon className="w-5 h-5" />;
      case "schedule":
        return <Clock className="w-5 h-5" />;
      default:
        return isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
    }
  };

  return (
    <div className="glass border-b sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            {(logoType === "logo" || logoType === "both") && siteLogo && (
              <img 
                src={siteLogo} 
                alt="Logo" 
                className="w-10 h-10 object-contain"
                data-testid="img-site-logo"
              />
            )}
            {(logoType === "text" || logoType === "both") && (
              <div>
                <h1 className="text-xl font-bold" data-testid="text-site-title">{siteTitle}</h1>
                <p className="text-xs text-muted-foreground">সাথী ব্যবস্থাপনা সিস্টেম</p>
              </div>
            )}
            {logoType === "logo" && !siteLogo && (
              <div>
                <h1 className="text-xl font-bold">জামালপুর তাবলীগ</h1>
                <p className="text-xs text-muted-foreground">সাথী ব্যবস্থাপনা সিস্টেম</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            data-testid="button-theme-toggle"
            title={`থিম: ${themeMode === "light" ? "লাইট" : themeMode === "dark" ? "ডার্ক" : themeMode === "schedule" ? "সিডিউল" : "সিস্টেম"}`}
          >
            {getThemeIcon()}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" />
                {hasNotifications && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-medium rounded-full px-1">
                    {pendingNotifications.length > 9 ? "9+" : pendingNotifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="font-medium">নোটিফিকেশন</span>
                </div>
                {hasNotifications && (
                  <Badge variant="secondary">{pendingNotifications.length} টি নতুন</Badge>
                )}
              </div>
              
              {pendingNotifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">কোনো নতুন নোটিফিকেশন নেই</p>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="p-1">
                    {pendingNotifications.map((notification) => {
                      const priority = priorityLabels[notification.priority] || priorityLabels.normal;
                      return (
                        <div
                          key={notification.id}
                          className="p-3 rounded-md hover-elevate cursor-pointer transition-all mb-1"
                          onClick={() => onNotificationClick?.(notification.id)}
                          data-testid={`notification-${notification.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                              <ClipboardList className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-medium text-sm truncate">{notification.title}</p>
                                <Badge className={`${priority.color} text-xs`} variant="secondary">
                                  {priority.label}
                                </Badge>
                              </div>
                              {notification.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {notification.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.createdAt).toLocaleDateString("bn-BD")}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
              
              {pendingNotifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm"
                      onClick={() => onNotificationClick?.("")}
                      data-testid="button-view-all-notifications"
                    >
                      সব দেখুন
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="button-user-menu">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={`${roleColors[userRole]} text-white text-xs`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[userRole]}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[userRole]}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onProfileClick} data-testid="menu-profile">
                <User className="w-4 h-4 mr-2" />
                প্রোফাইল দেখুন
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSettingsClick} data-testid="menu-settings">
                <Settings className="w-4 h-4 mr-2" />
                সেটিংস
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" />
                লগআউট
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function User({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
    </svg>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 8C13.5 8.17 13.49 8.34 13.47 8.51L14.91 9.65C15.04 9.75 15.08 9.93 15 10.08L13.64 12.42C13.56 12.57 13.38 12.63 13.22 12.57L11.54 11.89C11.22 12.13 10.88 12.34 10.5 12.5L10.25 14.32C10.23 14.49 10.09 14.62 9.92 14.62H7.2C7.03 14.62 6.89 14.49 6.87 14.32L6.62 12.5C6.24 12.34 5.9 12.13 5.58 11.89L3.9 12.57C3.74 12.63 3.56 12.57 3.48 12.42L2.12 10.08C2.04 9.93 2.08 9.75 2.21 9.65L3.65 8.51C3.63 8.34 3.62 8.17 3.62 8C3.62 7.83 3.63 7.66 3.65 7.49L2.21 6.35C2.08 6.25 2.04 6.07 2.12 5.92L3.48 3.58C3.56 3.43 3.74 3.37 3.9 3.43L5.58 4.11C5.9 3.87 6.24 3.66 6.62 3.5L6.87 1.68C6.89 1.51 7.03 1.38 7.2 1.38H9.92C10.09 1.38 10.23 1.51 10.25 1.68L10.5 3.5C10.88 3.66 11.22 3.87 11.54 4.11L13.22 3.43C13.38 3.37 13.56 3.43 13.64 3.58L15 5.92C15.08 6.07 15.04 6.25 14.91 6.35L13.47 7.49C13.49 7.66 13.5 7.83 13.5 8ZM8.56 5.5C7.17 5.5 6.06 6.61 6.06 8C6.06 9.39 7.17 10.5 8.56 10.5C9.95 10.5 11.06 9.39 11.06 8C11.06 6.61 9.95 5.5 8.56 5.5Z" fill="currentColor"/>
    </svg>
  );
}
