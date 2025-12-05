import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Moon, Sun, Monitor, Image, Type, Save, Upload, Clock } from "lucide-react";
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

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [siteTitle, setSiteTitle] = useState("জামালপুর তাবলীগ");
  const [siteLogo, setSiteLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoType, setLogoType] = useState<LogoType>("text");
  const [darkModeStart, setDarkModeStart] = useState("18:00");
  const [darkModeEnd, setDarkModeEnd] = useState("06:00");

  const canManageSettings = user?.role === "super_admin";

  const { data: settingsData, isLoading } = useQuery<{ settings: Record<string, string> }>({
    queryKey: ["/api/settings"],
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

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
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
            <h1 className="text-2xl font-bold">সেটিংস</h1>
            <p className="text-muted-foreground">অ্যাপ্লিকেশন সেটিংস পরিবর্তন করুন</p>
          </div>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                থিম সেটিংস
              </CardTitle>
              <CardDescription>
                আপনার পছন্দের রঙের থিম নির্বাচন করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>

          {/* Branding Settings - Only for Super Admin */}
          {canManageSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  ব্র্যান্ডিং সেটিংস
                </CardTitle>
                <CardDescription>
                  সাইটের লোগো এবং টাইটেল পরিবর্তন করুন
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <Separator />

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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
