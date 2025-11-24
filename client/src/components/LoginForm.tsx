import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GlassCard from "./GlassCard";

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void;
  onRegisterClick?: () => void;
}

export default function LoginForm({ onSubmit, onRegisterClick }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(email, password);
    console.log("Login:", { email, password });
  };

  return (
    <GlassCard className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">লগইন করুন</h1>
        <p className="text-muted-foreground">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" data-testid="label-email">ইমেইল / ফোন নাম্বার</Label>
          <Input
            id="email"
            type="text"
            placeholder="your@email.com অথবা ০১৭১২৩৪৫৬৭৮"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="input-email"
            className="glass"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" data-testid="label-password">পাসওয়ার্ড</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-password"
            className="glass"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          data-testid="button-login"
        >
          লগইন করুন
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          অ্যাকাউন্ট নেই?{" "}
          <button
            onClick={onRegisterClick}
            className="text-primary font-medium hover:underline"
            data-testid="link-register"
          >
            রেজিস্টার করুন
          </button>
        </p>
      </div>
    </GlassCard>
  );
}
