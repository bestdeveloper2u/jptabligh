import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ArrowLeft, 
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
  MapPin
} from "lucide-react";
import { useAuth } from "@/lib/auth";
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

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const canManageSettings = user?.role === "super_admin";

  const { data: settingsData, isLoading } = useQuery<{ settings: Record<string, string> }>({
    queryKey: ["/api/settings"],
  });

  // Stats queries for export info
  const { data: usersData } = useQuery<{ users: unknown[] }>({
    queryKey: ["/api/users"],
    enabled: canManageSettings,
  });

  const { data: thanasData } = useQuery<unknown[]>({
    queryKey: ["/api/thanas"],
    enabled: canManageSettings,
  });

  const { data: mosquesData } = useQuery<unknown[]>({
    queryKey: ["/api/mosques"],
    enabled: canManageSettings,
  });

  const { data: halqasData } = useQuery<unknown[]>({
    queryKey: ["/api/halqas"],
    enabled: canManageSettings,
  });

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
    ];
    saveSettingsMutation.mutate(settings);
  };

  // Export all data
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

  // Import data
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Validate the import data
      if (!importData.version || !importData.data) {
        throw new Error("অবৈধ ব্যাকআপ ফাইল");
      }

      await apiRequest("POST", "/api/import", importData.data);

      // Invalidate all queries to refresh data
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

  // Clear cache
  const handleClearCache = () => {
    queryClient.clear();
    toast({
      title: "সফল হয়েছে",
      description: "ক্যাশ পরিষ্কার করা হয়েছে",
    });
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="mb-6 gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          ড্যাশবোর্ডে ফিরে যান
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-7 h-7" />
              সেটিংস
            </h1>
            <p className="text-muted-foreground">অ্যাপ্লিকেশন সেটিংস ও কনফিগারেশন</p>
          </div>

          <Accordion type="multiple" defaultValue={["theme", "site", "data", "about"]} className="space-y-4">
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
                      <RadioGroupItem
                        value="light"
                        id="light"
                        className="peer sr-only"
                      />
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
                      <RadioGroupItem
                        value="dark"
                        id="dark"
                        className="peer sr-only"
                      />
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
                      <RadioGroupItem
                        value="system"
                        id="system"
                        className="peer sr-only"
                      />
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
                      <RadioGroupItem
                        value="schedule"
                        id="schedule"
                        className="peer sr-only"
                      />
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
                      <p className="text-xs text-muted-foreground">
                        উদাহরণ: সন্ধ্যা ৬টা থেকে সকাল ৬টা পর্যন্ত ডার্ক মোড থাকবে
                      </p>
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
                    {/* Logo Type Selection */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">হেডারে কি দেখাবে?</Label>
                      <RadioGroup
                        value={logoType}
                        onValueChange={(value) => setLogoType(value as LogoType)}
                        className="grid grid-cols-3 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="text"
                            id="logoType-text"
                            className="peer sr-only"
                          />
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
                          <RadioGroupItem
                            value="logo"
                            id="logoType-logo"
                            className="peer sr-only"
                          />
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
                          <RadioGroupItem
                            value="both"
                            id="logoType-both"
                            className="peer sr-only"
                          />
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

                    {/* Site Title - Show if text or both selected */}
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

                    {/* Logo Upload - Show if logo or both selected */}
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

                    {/* Preview */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">প্রিভিউ</Label>
                      <div className="p-4 rounded-lg border bg-muted/30 flex items-center gap-3">
                        {(logoType === "logo" || logoType === "both") && logoPreview && (
                          <img 
                            src={logoPreview} 
                            alt="Logo" 
                            className="w-10 h-10 object-contain"
                          />
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

            {/* Data Management - Only for Super Admin */}
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
                    {/* Data Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-2xl font-bold">{usersData?.users?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">সদস্য</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <MapPin className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-2xl font-bold">{(thanasData as unknown[])?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">থানা</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <Building2 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-2xl font-bold">{(mosquesData as unknown[])?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">মসজিদ</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <HardDrive className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-2xl font-bold">{(halqasData as unknown[])?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">হালকা</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Export */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">ডেটা এক্সপোর্ট</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            সমস্ত ডেটা JSON ফাইল হিসেবে ডাউনলোড করুন। এই ফাইল ব্যাকআপ হিসেবে সংরক্ষণ করতে পারবেন।
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleExportData}
                            disabled={isExporting}
                            data-testid="button-export"
                          >
                            {isExporting ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                এক্সপোর্ট হচ্ছে...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                এক্সপোর্ট করুন
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Import */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">ডেটা ইমপোর্ট</h4>
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
                              data-testid="input-import"
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={isImporting} data-testid="button-import">
                                  {isImporting ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                      ইমপোর্ট হচ্ছে...
                                    </>
                                  ) : (
                                    <>
                                      <FileUp className="w-4 h-4 mr-2" />
                                      ইমপোর্ট করুন
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
                                  <AlertDialogAction
                                    onClick={() => fileInputRef.current?.click()}
                                  >
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
                            অ্যাপ্লিকেশনের সাময়িক ডেটা পরিষ্কার করুন। সমস্যা হলে এটি সাহায্য করতে পারে।
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

            {/* About Section */}
            <AccordionItem value="about" className="border rounded-lg px-1">
              <AccordionTrigger className="px-4 hover:no-underline" data-testid="accordion-about">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">সফটওয়্যার তথ্য</h3>
                    <p className="text-sm text-muted-foreground">ভার্শন ও ডেভেলপার তথ্য</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-4">
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
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
