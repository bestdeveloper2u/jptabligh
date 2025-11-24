import { Bell, Menu, Moon, Sun, LogOut } from "lucide-react";
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
import { useState } from "react";

interface TopNavigationProps {
  userName: string;
  userRole: "super_admin" | "manager" | "member";
  onMenuClick?: () => void;
  onLogout?: () => void;
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

export default function TopNavigation({ userName, userRole, onMenuClick, onLogout }: TopNavigationProps) {
  const [isDark, setIsDark] = useState(false);
  const initials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    console.log("Theme toggled:", !isDark ? "dark" : "light");
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
          <div>
            <h1 className="text-xl font-bold">জামালপুর তাবলীগ</h1>
            <p className="text-xs text-muted-foreground">সাথী ব্যবস্থাপনা সিস্টেম</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

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
              <DropdownMenuItem data-testid="menu-profile">
                <User className="w-4 h-4 mr-2" />
                প্রোফাইল দেখুন
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-settings">
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
