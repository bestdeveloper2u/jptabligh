import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlassCard from "./GlassCard";
import type { Thana, Union, Mosque, Halqa } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface RegistrationFormProps {
  onSubmit?: (data: any) => void;
  onLoginClick?: () => void;
  isLoading?: boolean;
}

const tabligActivities = [
  { id: "tin-chilla", label: "তিন চিল্লা (৩ মাস)" },
  { id: "ek-chilla", label: "এক চিল্লা (৪০ দিন)" },
  { id: "bidesh-sofor", label: "বিদেশ সফর" },
  { id: "tin-din", label: "তিন দিনের সাথী" },
  { id: "sat-din", label: "সাত দিনের সাথী" },
  { id: "dos-din", label: "১০ দিনের সাথী" },
];

export default function RegistrationForm({ onSubmit, onLoginClick, isLoading }: RegistrationFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    thanaId: "",
    unionId: "",
    halqaId: "",
    mosqueId: "",
    tabligActivities: [] as string[],
  });

  // Fetch thanas
  const { data: thanasData } = useQuery<{ thanas: Thana[] }>({
    queryKey: ["/api/thanas"],
  });

  // Fetch unions based on selected thana
  const { data: unionsData } = useQuery<{ unions: Union[] }>({
    queryKey: ["/api/unions", { thanaId: formData.thanaId }],
    enabled: !!formData.thanaId,
  });

  // Fetch halqas based on selected thana and union
  const { data: halqasData } = useQuery<{ halqas: Halqa[] }>({
    queryKey: ["/api/halqas", { thanaId: formData.thanaId, unionId: formData.unionId }],
    enabled: !!formData.thanaId && !!formData.unionId,
  });

  // Fetch mosques based on selected thana and union
  const { data: mosquesData } = useQuery<{ mosques: Mosque[] }>({
    queryKey: ["/api/mosques", { thanaId: formData.thanaId, unionId: formData.unionId }],
    enabled: !!formData.thanaId && !!formData.unionId,
  });

  const thanas = thanasData?.thanas || [];
  const unions = unionsData?.unions || [];
  const halqas = halqasData?.halqas || [];
  const mosques = mosquesData?.mosques || [];

  // Reset union, halqa and mosque when thana changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, unionId: "", halqaId: "", mosqueId: "" }));
  }, [formData.thanaId]);

  // Reset halqa and mosque when union changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, halqaId: "", mosqueId: "" }));
  }, [formData.unionId]);

  const handleActivityToggle = (activityId: string) => {
    setFormData(prev => ({
      ...prev,
      tabligActivities: prev.tabligActivities.includes(activityId)
        ? prev.tabligActivities.filter(id => id !== activityId)
        : [...prev.tabligActivities, activityId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "পাসওয়ার্ড মিলছে না",
        description: "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড একই হতে হবে",
      });
      return;
    }

    // Prepare data for submission
    const { confirmPassword, ...submitData } = formData;
    onSubmit?.(submitData);
  };

  return (
    <GlassCard className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">রেজিস্ট্রেশন করুন</h1>
        <p className="text-muted-foreground">তাবলীগের সাথী হিসেবে যুক্ত হন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" data-testid="label-name">পূর্ণ নাম *</Label>
            <Input
              id="name"
              type="text"
              placeholder="আপনার নাম"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              data-testid="input-name"
              className="glass"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" data-testid="label-phone">মোবাইল নাম্বার *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="০১৭১২৩৪৫৬৭৮"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              data-testid="input-phone"
              className="glass"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" data-testid="label-email">ইমেইল (ঐচ্ছিক)</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            data-testid="input-email"
            className="glass"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="password" data-testid="label-password">পাসওয়ার্ড *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              data-testid="input-password"
              className="glass"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" data-testid="label-confirm-password">পাসওয়ার্ড নিশ্চিত করুন *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              data-testid="input-confirm-password"
              className="glass"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="thana" data-testid="label-thana">থানা *</Label>
            <Select 
              value={formData.thanaId} 
              onValueChange={(value) => setFormData({...formData, thanaId: value})}
              disabled={isLoading}
            >
              <SelectTrigger id="thana" className="glass" data-testid="select-thana">
                <SelectValue placeholder="থানা নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {thanas.map((thana) => (
                  <SelectItem key={thana.id} value={thana.id}>
                    {thana.nameBn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="union" data-testid="label-union">ইউনিয়ন *</Label>
            <Select 
              value={formData.unionId} 
              onValueChange={(value) => setFormData({...formData, unionId: value})}
              disabled={isLoading || !formData.thanaId}
            >
              <SelectTrigger id="union" className="glass" data-testid="select-union">
                <SelectValue placeholder="ইউনিয়ন নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {unions.map((union) => (
                  <SelectItem key={union.id} value={union.id}>
                    {union.nameBn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="halqa" data-testid="label-halqa">হালকা (ঐচ্ছিক)</Label>
            <Select 
              value={formData.halqaId} 
              onValueChange={(value) => setFormData({...formData, halqaId: value})}
              disabled={isLoading || !formData.unionId}
            >
              <SelectTrigger id="halqa" className="glass" data-testid="select-halqa">
                <SelectValue placeholder="হালকা নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {halqas.map((halqa) => (
                  <SelectItem key={halqa.id} value={halqa.id}>
                    {halqa.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mosque" data-testid="label-mosque">মসজিদ (ঐচ্ছিক)</Label>
            <Select 
              value={formData.mosqueId} 
              onValueChange={(value) => setFormData({...formData, mosqueId: value})}
              disabled={isLoading || !formData.unionId}
            >
              <SelectTrigger id="mosque" className="glass" data-testid="select-mosque">
                <SelectValue placeholder="মসজিদ নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {mosques.map((mosque) => (
                  <SelectItem key={mosque.id} value={mosque.id}>
                    {mosque.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">তাবলীগ কার্যক্রম</Label>
          <p className="text-sm text-muted-foreground">আপনি যে কার্যক্রমগুলোতে অংশগ্রহণ করেছেন তা চিহ্নিত করুন</p>
          <div className="grid md:grid-cols-2 gap-4">
            {tabligActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <Checkbox
                  id={activity.id}
                  checked={formData.tabligActivities.includes(activity.id)}
                  onCheckedChange={() => handleActivityToggle(activity.id)}
                  data-testid={`checkbox-${activity.id}`}
                  disabled={isLoading}
                />
                <Label
                  htmlFor={activity.id}
                  className="text-sm font-normal cursor-pointer"
                  data-testid={`label-${activity.id}`}
                >
                  {activity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          data-testid="button-register"
          disabled={isLoading}
        >
          {isLoading ? "রেজিস্ট্রেশন হচ্ছে..." : "রেজিস্ট্রেশন সম্পন্ন করুন"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <button
            onClick={onLoginClick}
            className="text-primary font-medium hover:underline"
            data-testid="link-login"
          >
            লগইন করুন
          </button>
        </p>
      </div>
    </GlassCard>
  );
}
