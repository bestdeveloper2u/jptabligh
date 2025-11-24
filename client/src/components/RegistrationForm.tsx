import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlassCard from "./GlassCard";

interface RegistrationFormProps {
  onSubmit?: (data: any) => void;
  onLoginClick?: () => void;
}

const tabligActivities = [
  { id: "tin-chilla", label: "তিন চিল্লা (৩ মাস)" },
  { id: "ek-chilla", label: "এক চিল্লা (৪০ দিন)" },
  { id: "bidesh-sofor", label: "বিদেশ সফর" },
  { id: "tin-din", label: "তিন দিনের সাথী" },
  { id: "sat-din", label: "সাত দিনের সাথী" },
  { id: "dos-din", label: "১০ দিনের সাথী" },
];

export default function RegistrationForm({ onSubmit, onLoginClick }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    thana: "",
    union: "",
    mosque: "",
    activities: [] as string[],
  });

  const handleActivityToggle = (activityId: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.includes(activityId)
        ? prev.activities.filter(id => id !== activityId)
        : [...prev.activities, activityId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    console.log("Registration:", formData);
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

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="thana" data-testid="label-thana">থানা *</Label>
            <Select value={formData.thana} onValueChange={(value) => setFormData({...formData, thana: value})}>
              <SelectTrigger id="thana" className="glass" data-testid="select-thana">
                <SelectValue placeholder="থানা নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sadar">জামালপুর সদর</SelectItem>
                <SelectItem value="melandaha">মেলান্দহ</SelectItem>
                <SelectItem value="islampur">ইসলামপুর</SelectItem>
                <SelectItem value="dewanganj">দেওয়ানগঞ্জ</SelectItem>
                <SelectItem value="madarganj">মাদারগঞ্জ</SelectItem>
                <SelectItem value="sarishabari">সরিষাবাড়ি</SelectItem>
                <SelectItem value="bakshiganj">বকসীগঞ্জ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="union" data-testid="label-union">ইউনিয়ন *</Label>
            <Select value={formData.union} onValueChange={(value) => setFormData({...formData, union: value})}>
              <SelectTrigger id="union" className="glass" data-testid="select-union">
                <SelectValue placeholder="ইউনিয়ন নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="union1">ইউনিয়ন ১</SelectItem>
                <SelectItem value="union2">ইউনিয়ন ২</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mosque" data-testid="label-mosque">মসজিদ (ঐচ্ছিক)</Label>
            <Select value={formData.mosque} onValueChange={(value) => setFormData({...formData, mosque: value})}>
              <SelectTrigger id="mosque" className="glass" data-testid="select-mosque">
                <SelectValue placeholder="মসজিদ নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mosque1">বাইতুল আমান মসজিদ</SelectItem>
                <SelectItem value="mosque2">জামে মসজিদ</SelectItem>
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
                  checked={formData.activities.includes(activity.id)}
                  onCheckedChange={() => handleActivityToggle(activity.id)}
                  data-testid={`checkbox-${activity.id}`}
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
        >
          রেজিস্ট্রেশন সম্পন্ন করুন
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
