import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Moon, Sun, Monitor, Image, Type, Save, Upload } from "lucide-react";
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

type ThemeMode = "light" | "dark" | "system";

interface SiteSettings {
  siteTitle: string;
  siteLogo: string;
  themeMode: ThemeMode;
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [siteTitle, setSiteTitle] = useState("জামালপুর তাবলীগ");
  const [siteLogo, setSiteLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const canManageSettings = user?.role === "super_admin";

  const { data: settingsData, isLoading } = useQuery<{ settings: Array<{ key: string; value: string }> }>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settingsData?.settings) {
      const settings = settingsData.settings;
      const themeSetting = settings.find(s => s.key === "themeMode");
      const titleSetting = settings.find(s => s.key === "siteTitle");
      const logoSetting = settings.find(s => s.key === "siteLogo");
      
      if (themeSetting) setThemeMode(themeSetting.value as ThemeMode);
      if (titleSetting) setSiteTitle(titleSetting.value);
      if (logoSetting) {
        setSiteLogo(logoSetting.value);
        setLogoPreview(logoSetting.value);
      }
    }
  }, [settingsData]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
    applyTheme(savedTheme || "system");
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    
    if (mode === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) {
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
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode);
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
            <CardContent>
              <RadioGroup
                value={themeMode}
                onValueChange={(value) => handleThemeChange(value as ThemeMode)}
                className="grid grid-cols-3 gap-4"
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
              </RadioGroup>
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

                <Separator />

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
