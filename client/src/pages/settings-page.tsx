import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Moon, 
  Sun, 
  Monitor, 
  Image, 
  Type, 
  Save, 
  Upload, 
  Clock, 
  Download, 
  FileUp, 
  Database, 
  Info, 
  Shield, 
  Bell, 
  Trash2, 
  RefreshCw,
  Check,
  AlertTriangle,
  Settings,
  HardDrive,
  Users,
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  CircleDot
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Thana, Union, Mosque, Halqa, Takaja } from "@shared/schema";

type ThemeMode = "light" | "dark" | "system" | "schedule";
type LogoType = "logo" | "text" | "both";

interface SiteSettings {
  siteTitle: string;
  siteLogo: string;
  themeMode: ThemeMode;
  logoType: LogoType;
  darkModeStart: string;
  darkModeEnd: string;
}

interface ExportData {
  version: string;
  exportDate: string;
  data: {
    users?: unknown[];
    thanas?: unknown[];
    unions?: unknown[];
    mosques?: unknown[];
    halqas?: unknown[];
    takajas?: unknown[];
    settings?: unknown[];
  };
}

const APP_VERSION = "1.0.0";
const APP_NAME = "জামালপুর তাবলীগ";
const BUILD_DATE = "ডিসেম্বর ২০২৪";

const DAYS_OF_WEEK = [
  { value: "sunday", label: "রবিবার" },
  { value: "monday", label: "সোমবার" },
  { value: "tuesday", label: "মঙ্গলবার" },
  { value: "wednesday", label: "বুধবার" },
  { value: "thursday", label: "বৃহস্পতিবার" },
  { value: "friday", label: "শুক্রবার" },
  { value: "saturday", label: "শনিবার" },
];

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const handleViewChange = (view: string) => {
    if (view === "settings") return;
    setLocation(`/dashboard?view=${view}`, { replace: true });
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvMemberInputRef = useRef<HTMLInputElement>(null);
  const csvMosqueInputRef = useRef<HTMLInputElement>(null);
  const csvHalqaInputRef = useRef<HTMLInputElement>(null);
  
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [siteTitle, setSiteTitle] = useState("জামালপুর তাবলীগ");
  const [siteLogo, setSiteLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoType, setLogoType] = useState<LogoType>("text");
  const [darkModeStart, setDarkModeStart] = useState("18:00");
  const [darkModeEnd, setDarkModeEnd] = useState("06:00");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sabgujariDay, setSabgujariDay] = useState("thursday");
  const [mashwaraDay, setMashwaraDay] = useState("monday");

  const canManageSettings = user?.role === "super_admin";

  const { data: settingsData, isLoading } = useQuery<{ settings: Record<string, string> }>({
    queryKey: ["/api/settings"],
  });

  // Data queries
  const { data: usersResponse } = useQuery<{ users: unknown[] }>({
    queryKey: ["/api/users"],
  });

  const { data: thanasResponse } = useQuery<{ thanas: Thana[] }>({
    queryKey: ["/api/thanas"],
  });

  const { data: unionsResponse } = useQuery<{ unions: Union[] }>({
    queryKey: ["/api/unions"],
  });

  const { data: mosquesResponse } = useQuery<{ mosques: Mosque[] }>({
    queryKey: ["/api/mosques"],
  });

  const { data: halqasResponse } = useQuery<{ halqas: Halqa[] }>({
    queryKey: ["/api/halqas"],
  });

  const { data: takajasResponse } = useQuery<{ takajas: Takaja[] }>({
    queryKey: ["/api/takajas"],
    enabled: canManageSettings,
  });

  // Extract data from responses
  const usersData = usersResponse?.users || [];
  const thanasData = thanasResponse?.thanas || [];
  const unionsData = unionsResponse?.unions || [];
  const mosquesData = mosquesResponse?.mosques || [];
  const halqasData = halqasResponse?.halqas || [];
  const takajasData = takajasResponse?.takajas || [];

  // Count active takajas
  const activeTakajas = takajasData.filter(t => t.status !== "completed")?.length || 0;

  useEffect(() => {
    if (settingsData?.settings) {
      const settings = settingsData.settings;
      
      if (settings.themeMode) setThemeMode(settings.themeMode as ThemeMode);
      if (settings.siteTitle) setSiteTitle(settings.siteTitle);
      if (settings.siteLogo) {
        setSiteLogo(settings.siteLogo);
        setLogoPreview(settings.siteLogo);
      }
      if (settings.logoType) setLogoType(settings.logoType as LogoType);
      if (settings.darkModeStart) setDarkModeStart(settings.darkModeStart);
      if (settings.darkModeEnd) setDarkModeEnd(settings.darkModeEnd);
      if (settings.sabgujariDay) setSabgujariDay(settings.sabgujariDay);
      if (settings.mashwaraDay) setMashwaraDay(settings.mashwaraDay);
    }
  }, [settingsData]);

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
      } else {
        root.classList.remove("dark");
      }
    } else if (mode === "schedule") {
      const start = startTime || darkModeStart;
      const end = endTime || darkModeEnd;
      if (isInDarkModeSchedule(start, end)) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    localStorage.setItem("themeMode", mode);
    if (startTime) localStorage.setItem("darkModeStart", startTime);
    if (endTime) localStorage.setItem("darkModeEnd", endTime);
  }, [darkModeStart, darkModeEnd, isInDarkModeSchedule]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode | null;
    const savedStart = localStorage.getItem("darkModeStart");
    const savedEnd = localStorage.getItem("darkModeEnd");
    
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
    if (savedStart) setDarkModeStart(savedStart);
    if (savedEnd) setDarkModeEnd(savedEnd);
    
    applyTheme(savedTheme || "system", savedStart || "18:00", savedEnd || "06:00");
  }, []);

  useEffect(() => {
    if (themeMode === "schedule") {
      const interval = setInterval(() => {
        applyTheme("schedule", darkModeStart, darkModeEnd);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [themeMode, darkModeStart, darkModeEnd, applyTheme]);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode, darkModeStart, darkModeEnd);
  };

  const handleScheduleTimeChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setDarkModeStart(value);
      if (themeMode === "schedule") {
        applyTheme("schedule", value, darkModeEnd);
      }
    } else {
      setDarkModeEnd(value);
      if (themeMode === "schedule") {
        applyTheme("schedule", darkModeStart, value);
      }
    }
  };

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      for (const setting of settings) {
        await apiRequest("PUT", "/api/settings", setting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "সফল হয়েছে",
        description: "সেটিংস সংরক্ষণ করা হয়েছে",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "ব্যর্থ হয়েছে",
        description: error.message,
      });
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setSiteLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    const settings = [
      { key: "themeMode", value: themeMode },
      { key: "siteTitle", value: siteTitle },
      { key: "siteLogo", value: siteLogo },
      { key: "logoType", value: logoType },
      { key: "darkModeStart", value: darkModeStart },
      { key: "darkModeEnd", value: darkModeEnd },
      { key: "sabgujariDay", value: sabgujariDay },
      { key: "mashwaraDay", value: mashwaraDay },
    ];
    saveSettingsMutation.mutate(settings);
  };

  // Export all data (JSON)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await apiRequest("GET", "/api/export");
      const data = await response.json();
      
      const exportData: ExportData = {
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        data: data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jamalpur-tablig-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "সফল হয়েছে",
        description: "ডেটা এক্সপোর্ট করা হয়েছে",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ব্যর্থ হয়েছে",
        description: "ডেটা এক্সপোর্ট করতে সমস্যা হয়েছে",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import data (JSON)
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      if (!importData.version || !importData.data) {
        throw new Error("অবৈধ ব্যাকআপ ফাইল");
      }

      await apiRequest("POST", "/api/import", importData.data);

      queryClient.invalidateQueries();

      toast({
        title: "সফল হয়েছে",
        description: "ডেটা ইমপোর্ট করা হয়েছে",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ব্যর্থ হয়েছে",
        description: error instanceof Error ? error.message : "ডেটা ইমপোর্ট করতে সমস্যা হয়েছে",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // CSV Export functions
  const handleExportMembersCSV = async () => {
    try {
      const response = await apiRequest("GET", "/api/users");
      const data = await response.json();
      const users = data.users || [];
      
      const headers = ["নাম", "ফোন", "ইমেইল", "থানা", "ইউনিয়ন", "তাবলীগ কার্যক্রম"];
      const csvContent = [
        headers.join(","),
        ...users.map((u: any) => [
          u.name || "",
          u.phone || "",
          u.email || "",
          thanasData?.find(t => t.id === u.thanaId)?.nameBn || "",
          unionsData?.find(un => un.id === u.unionId)?.nameBn || "",
          (u.tabligActivities || []).join("; ")
        ].map(v => `"${v}"`).join(","))
      ].join("\n");
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sathi-list-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "সফল হয়েছে", description: "সাথী তালিকা ডাউনলোড হয়েছে" });
    } catch (error) {
      toast({ variant: "destructive", title: "ব্যর্থ", description: "এক্সপোর্ট করতে সমস্যা হয়েছে" });
    }
  };

  const handleExportMosquesCSV = async () => {
    try {
      const csvContent = [
        ["মসজিদের নাম", "ঠিকানা", "ইমামের ফোন", "মুয়াজ্জিনের ফোন", "থানা", "ইউনিয়ন"].join(","),
        ...(mosquesData || []).map(m => [
          m.name || "",
          m.address || "",
          m.imamPhone || "",
          m.muazzinPhone || "",
          thanasData?.find(t => t.id === m.thanaId)?.nameBn || "",
          unionsData?.find(un => un.id === m.unionId)?.nameBn || ""
        ].map(v => `"${v}"`).join(","))
      ].join("\n");
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mosque-list-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "সফল হয়েছে", description: "মসজিদের তালিকা ডাউনলোড হয়েছে" });
    } catch (error) {
      toast({ variant: "destructive", title: "ব্যর্থ", description: "এক্সপোর্ট করতে সমস্যা হয়েছে" });
    }
  };

  const handleExportHalqasCSV = async () => {
    try {
      const csvContent = [
        ["হালকার নাম", "থানা", "ইউনিয়ন"].join(","),
        ...(halqasData || []).map(h => [
          h.name || "",
          thanasData?.find(t => t.id === h.thanaId)?.nameBn || "",
          unionsData?.find(un => un.id === h.unionId)?.nameBn || ""
        ].map(v => `"${v}"`).join(","))
      ].join("\n");
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `halqa-list-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "সফল হয়েছে", description: "হালকার তালিকা ডাউনলোড হয়েছে" });
    } catch (error) {
      toast({ variant: "destructive", title: "ব্যর্থ", description: "এক্সপোর্ট করতে সমস্যা হয়েছে" });
    }
  };

  // CSV Import functions
  const handleCSVImport = async (file: File, type: "members" | "mosques" | "halqas") => {
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        throw new Error("ফাইলে কোনো ডেটা নেই");
      }
      
      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.replace(/^"|"$/g, "").trim());
        return values;
      });

      await apiRequest("POST", `/api/import-csv/${type}`, { data });
      
      queryClient.invalidateQueries();
      toast({ title: "সফল হয়েছে", description: "ডেটা ইমপোর্ট সম্পন্ন হয়েছে" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "ব্যর্থ", 
        description: error instanceof Error ? error.message : "ইমপোর্ট করতে সমস্যা হয়েছে" 
      });
    }
  };

  // Clear cache
  const handleClearCache = () => {
    queryClient.clear();
    toast({
      title: "সফল হয়েছে",
      description: "ক্যাশ পরিষ্কার করা হয়েছে",
    });
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "সুপার এডমিন";
      case "manager": return "ম্যানেজার";
      case "member": return "সাথী";
      default: return role;
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout
        userName={user?.name || ""}
        userId={user?.id || ""}
        userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
        activeView="settings"
        onViewChange={handleViewChange}
        onLogout={logout}
      >
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userName={user?.name || ""}
      userId={user?.id || ""}
      userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
      activeView="settings"
      onViewChange={handleViewChange}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-7 h-7" />
              সেটিংস
            </h1>
            <p className="text-muted-foreground">আপনার প্রোফাইল এবং অ্যাকাউন্ট সেটিংস</p>
          </div>

          {/* Personal Information Card */}
          <Card data-testid="card-personal-info">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                ব্যক্তিগত তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">নাম</p>
                  <p className="font-medium" data-testid="text-user-name">{user.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> মোবাইল নাম্বার
                  </p>
                  <p className="font-medium" data-testid="text-user-phone">{user.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> ইমেইল
                  </p>
                  <p className="font-medium" data-testid="text-user-email">{user.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ভূমিকা</p>
                  <Badge variant="secondary" data-testid="badge-user-role">
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thana & Union Management - Super Admin Only */}
          {canManageSettings && (
            <Card data-testid="card-thana-union">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  থানা ও ইউনিয়ন ব্যবস্থাপনা
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">মোট থানা</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-thana-count">
                      {thanasData.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">জামালপুর জেলার সকল থানা</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">মোট ইউনিয়ন</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-union-count">
                      {unionsData.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">সকল থানার অধীন ইউনিয়ন</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">থানা অনুযায়ী তালিকা</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {thanasData.map(thana => {
                      const unionCount = unionsData.filter(u => u.thanaId === thana.id).length || 0;
                      return (
                        <div 
                          key={thana.id} 
                          className="p-3 rounded-lg bg-muted/30 hover-elevate"
                          data-testid={`thana-item-${thana.id}`}
                        >
                          <p className="font-medium text-sm">{thana.nameBn}</p>
                          <p className="text-xs text-muted-foreground">{unionCount} ইউনিয়ন</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accordion Settings */}
          <Accordion type="multiple" defaultValue={["theme"]} className="space-y-4">
            {/* Theme Settings */}
            <AccordionItem value="theme" className="border rounded-lg px-1">
              <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-theme">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sun className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">থিম সেটিংস</h3>
                    <p className="text-sm text-muted-foreground">আপনার পছন্দের রঙের থিম নির্বাচন করুন</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6 pt-2">
                  <RadioGroup
                    value={themeMode}
                    onValueChange={(value) => handleThemeChange(value as ThemeMode)}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="light" id="light" className="peer sr-only" />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        data-testid="theme-light"
                      >
                        <Sun className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">লাইট</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        data-testid="theme-dark"
                      >
                        <Moon className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">ডার্ক</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="system" className="peer sr-only" />
                      <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        data-testid="theme-system"
                      >
                        <Monitor className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">সিস্টেম</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="schedule" id="schedule" className="peer sr-only" />
                      <Label
                        htmlFor="schedule"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        data-testid="theme-schedule"
                      >
                        <Clock className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">সিডিউল</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {themeMode === "schedule" && (
                    <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        নির্ধারিত সময় অনুযায়ী স্বয়ংক্রিয়ভাবে ডার্ক/লাইট মোড পরিবর্তন হবে
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="darkModeStart" className="flex items-center gap-2 text-sm">
                            <Moon className="w-4 h-4" />
                            ডার্ক মোড শুরু
                          </Label>
                          <Input
                            id="darkModeStart"
                            type="time"
                            value={darkModeStart}
                            onChange={(e) => handleScheduleTimeChange("start", e.target.value)}
                            data-testid="input-dark-mode-start"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="darkModeEnd" className="flex items-center gap-2 text-sm">
                            <Sun className="w-4 h-4" />
                            লাইট মোড শুরু
                          </Label>
                          <Input
                            id="darkModeEnd"
                            type="time"
                            value={darkModeEnd}
                            onChange={(e) => handleScheduleTimeChange("end", e.target.value)}
                            data-testid="input-dark-mode-end"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Branding Settings - Only for Super Admin */}
            {canManageSettings && (
              <AccordionItem value="site" className="border rounded-lg px-1">
                <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-site">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">সাইট সেটিংস</h3>
                      <p className="text-sm text-muted-foreground">লোগো ও সাইট টাইটেল পরিবর্তন করুন</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-6 pt-2">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">হেডারে কি দেখাবে?</Label>
                      <RadioGroup
                        value={logoType}
                        onValueChange={(value) => setLogoType(value as LogoType)}
                        className="grid grid-cols-3 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="text" id="logoType-text" className="peer sr-only" />
                          <Label
                            htmlFor="logoType-text"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            data-testid="logo-type-text"
                          >
                            <Type className="mb-3 h-6 w-6" />
                            <span className="text-sm font-medium">শুধু টেক্সট</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="logo" id="logoType-logo" className="peer sr-only" />
                          <Label
                            htmlFor="logoType-logo"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            data-testid="logo-type-logo"
                          >
                            <Image className="mb-3 h-6 w-6" />
                            <span className="text-sm font-medium">শুধু লোগো</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="both" id="logoType-both" className="peer sr-only" />
                          <Label
                            htmlFor="logoType-both"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            data-testid="logo-type-both"
                          >
                            <div className="flex items-center gap-1 mb-3">
                              <Image className="h-5 w-5" />
                              <Type className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium">দুটোই</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator />

                    {(logoType === "text" || logoType === "both") && (
                      <div className="space-y-2">
                        <Label htmlFor="siteTitle" className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          সাইট টাইটেল
                        </Label>
                        <Input
                          id="siteTitle"
                          value={siteTitle}
                          onChange={(e) => setSiteTitle(e.target.value)}
                          placeholder="সাইটের নাম লিখুন"
                          data-testid="input-site-title"
                        />
                      </div>
                    )}

                    {(logoType === "logo" || logoType === "both") && (
                      <>
                        {logoType === "both" && <Separator />}
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            সাইট লোগো
                          </Label>
                          
                          {logoPreview && (
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                                <img 
                                  src={logoPreview} 
                                  alt="Logo Preview" 
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setLogoPreview(null);
                                  setSiteLogo("");
                                }}
                                data-testid="button-remove-logo"
                              >
                                লোগো সরান
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload"
                              data-testid="input-logo-upload"
                            />
                            <Label
                              htmlFor="logo-upload"
                              className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover-elevate"
                            >
                              <Upload className="w-4 h-4" />
                              লোগো আপলোড করুন
                            </Label>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">প্রিভিউ</Label>
                      <div className="p-4 rounded-lg border bg-muted/30 flex items-center gap-3">
                        {(logoType === "logo" || logoType === "both") && logoPreview && (
                          <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain" />
                        )}
                        {(logoType === "text" || logoType === "both") && (
                          <span className="text-lg font-bold">{siteTitle || "সাইটের নাম"}</span>
                        )}
                        {logoType === "logo" && !logoPreview && (
                          <span className="text-muted-foreground">লোগো আপলোড করুন</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveSettings}
                        disabled={saveSettingsMutation.isPending}
                        data-testid="button-save-settings"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saveSettingsMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* CSV Export - Super Admin Only */}
            {canManageSettings && (
              <AccordionItem value="csv-export" className="border rounded-lg px-1">
                <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-csv-export">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">ডেটা এক্সপোর্ট</h3>
                      <p className="text-sm text-muted-foreground">CSV ফরম্যাটে ডেটা ডাউনলোড করুন</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={handleExportMembersCSV} data-testid="button-export-members-csv">
                        <Download className="w-4 h-4 mr-2" />
                        সাথীদের তালিকা ডাউনলোড
                      </Button>
                      <Button variant="outline" onClick={handleExportMosquesCSV} data-testid="button-export-mosques-csv">
                        <Download className="w-4 h-4 mr-2" />
                        মসজিদের তালিকা ডাউনলোড
                      </Button>
                      <Button variant="outline" onClick={handleExportHalqasCSV} data-testid="button-export-halqas-csv">
                        <Download className="w-4 h-4 mr-2" />
                        হালকার তালিকা ডাউনলোড
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* CSV Import - Super Admin Only */}
            {canManageSettings && (
              <AccordionItem value="csv-import" className="border rounded-lg px-1">
                <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-csv-import">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">ডেটা ইমপোর্ট</h3>
                      <p className="text-sm text-muted-foreground">CSV ফাইল থেকে ডেটা আপলোড করুন</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Member Import */}
                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">সাথী ইমপোর্ট</CardTitle>
                        <CardDescription className="text-xs">
                          CSV ফরম্যাট: নাম, মোবাইল, ইমেইল, থানা, ইউনিয়ন
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Input
                          ref={csvMemberInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCSVImport(file, "members");
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => csvMemberInputRef.current?.click()}
                          data-testid="button-import-members-csv"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          সাথী আপলোড
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mosque Import */}
                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">মসজিদ ইমপোর্ট</CardTitle>
                        <CardDescription className="text-xs">
                          CSV ফরম্যাট: নাম, ঠিকানা, ইমামের ফোন, মুয়াজ্জিনের ফোন, থানা, ইউনিয়ন
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Input
                          ref={csvMosqueInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCSVImport(file, "mosques");
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => csvMosqueInputRef.current?.click()}
                          data-testid="button-import-mosques-csv"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          মসজিদ আপলোড
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Halqa Import */}
                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">হালকা ইমপোর্ট</CardTitle>
                        <CardDescription className="text-xs">
                          CSV ফরম্যাট: নাম, থানা, ইউনিয়ন
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Input
                          ref={csvHalqaInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCSVImport(file, "halqas");
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => csvHalqaInputRef.current?.click()}
                          data-testid="button-import-halqas-csv"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          হালকা আপলোড
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Weekly Schedule Settings - Super Admin Only */}
            {canManageSettings && (
              <AccordionItem value="schedule" className="border rounded-lg px-1">
                <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-schedule">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">সাপ্তাহিক সিডিউল সেটিংস</h3>
                      <p className="text-sm text-muted-foreground">সবগুজারি এবং মাসোয়ারার দিন নির্ধারণ করুন</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label>সবগুজারির দিন</Label>
                      <Select value={sabgujariDay} onValueChange={setSabgujariDay}>
                        <SelectTrigger data-testid="select-sabgujari-day">
                          <SelectValue placeholder="দিন নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map(day => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>সাপ্তাহিক মাসোয়ারার দিন</Label>
                      <Select value={mashwaraDay} onValueChange={setMashwaraDay}>
                        <SelectTrigger data-testid="select-mashwara-day">
                          <SelectValue placeholder="দিন নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map(day => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={saveSettingsMutation.isPending}
                      size="sm"
                      data-testid="button-save-schedule"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      সংরক্ষণ করুন
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Data Management (JSON Backup) - Only for Super Admin */}
            {canManageSettings && (
              <AccordionItem value="data" className="border rounded-lg px-1">
                <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-data">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">ডেটা ম্যানেজমেন্ট</h3>
                      <p className="text-sm text-muted-foreground">ব্যাকআপ, রিস্টোর ও ক্যাশ পরিষ্কার</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-6 pt-2">
                    {/* Export JSON */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">JSON ব্যাকআপ</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            সমস্ত ডেটা JSON ফাইল হিসেবে ডাউনলোড করুন।
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleExportData}
                            disabled={isExporting}
                            data-testid="button-export-json"
                          >
                            {isExporting ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                এক্সপোর্ট হচ্ছে...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                JSON এক্সপোর্ট
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Import JSON */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">JSON রিস্টোর</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            পূর্বে এক্সপোর্ট করা ব্যাকআপ ফাইল থেকে ডেটা পুনরুদ্ধার করুন।
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              ref={fileInputRef}
                              type="file"
                              accept=".json"
                              onChange={handleImportData}
                              className="hidden"
                              id="import-file"
                              data-testid="input-import-json"
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={isImporting} data-testid="button-import-json">
                                  {isImporting ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                      ইমপোর্ট হচ্ছে...
                                    </>
                                  ) : (
                                    <>
                                      <FileUp className="w-4 h-4 mr-2" />
                                      JSON ইমপোর্ট
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    ডেটা ইমপোর্ট নিশ্চিত করুন
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ইমপোর্ট করলে বর্তমান ডেটা পরিবর্তন হতে পারে। এটি একটি গুরুত্বপূর্ণ পদক্ষেপ। 
                                    আপনি কি নিশ্চিত যে আপনি ব্যাকআপ ফাইল ইমপোর্ট করতে চান?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => fileInputRef.current?.click()}>
                                    হ্যাঁ, ইমপোর্ট করুন
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Clear Cache */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">ক্যাশ পরিষ্কার</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            অ্যাপ্লিকেশনের সাময়িক ডেটা পরিষ্কার করুন।
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleClearCache}
                            data-testid="button-clear-cache"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            ক্যাশ পরিষ্কার করুন
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Notification Settings */}
            <AccordionItem value="notifications" className="border rounded-lg px-1">
              <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-notifications">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">নোটিফিকেশন</h3>
                    <p className="text-sm text-muted-foreground">অ্যালার্ট ও বিজ্ঞপ্তি সেটিংস</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">নোটিফিকেশন চালু</Label>
                      <p className="text-sm text-muted-foreground">গুরুত্বপূর্ণ বিজ্ঞপ্তি পান</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                      data-testid="switch-notifications"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Security Settings - Only for Super Admin */}
            {canManageSettings && (
              <AccordionItem value="security" className="border rounded-lg px-1">
                <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-security">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">নিরাপত্তা</h3>
                      <p className="text-sm text-muted-foreground">একাউন্ট নিরাপত্তা সেটিংস</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="font-medium">একাউন্ট সুরক্ষিত</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        আপনার একাউন্ট পাসওয়ার্ড দিয়ে সুরক্ষিত আছে। নিয়মিত পাসওয়ার্ড পরিবর্তন করুন।
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/change-password")}
                      data-testid="button-change-password"
                    >
                      পাসওয়ার্ড পরিবর্তন করুন
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Brief Statistics Card */}
          <Card data-testid="card-statistics">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CircleDot className="w-5 h-5" />
                সংক্ষিপ্ত পরিসংখ্যান
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="stat-members">
                    {usersData.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">মোট সাথী</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="stat-mosques">
                    {mosquesData.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">মোট মসজিদ</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 text-center">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-halqas">
                    {halqasData.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">মোট হালকা</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 text-center">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400" data-testid="stat-takajas">
                    {activeTakajas}
                  </p>
                  <p className="text-sm text-muted-foreground">এ মাসে তাকাজা</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section Card */}
          <Card data-testid="card-about">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5" />
                অ্যাপ সম্পর্কে
              </CardTitle>
              <CardDescription>
                জামালপুর জেলার তাবলীগ সাথী ব্যবস্থাপনা সিস্টেম
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">অ্যাপ্লিকেশন</span>
                  <span className="font-medium">{APP_NAME}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ভার্শন</span>
                  <Badge variant="secondary" className="font-mono">v{APP_VERSION}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">বিল্ড তারিখ</span>
                  <span className="text-sm">{BUILD_DATE}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">প্ল্যাটফর্ম</span>
                  <span className="text-sm">ওয়েব অ্যাপ্লিকেশন</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ডেভেলপার</span>
                  <span className="text-sm">জামালপুর তাবলীগ টিম</span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border border-dashed">
                <p className="text-sm text-center text-muted-foreground">
                  দাওয়াত ও তাবলীগের কাজে এই সফটওয়্যার ব্যবহার করুন। 
                  আল্লাহ আমাদের সকলকে দ্বীনের খেদমত করার তৌফিক দান করুন।
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
