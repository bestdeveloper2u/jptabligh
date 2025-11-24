import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import RegistrationForm from "@/components/RegistrationForm";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const { user, login, register, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const handleLogin = async (phone: string, password: string) => {
    setIsSubmitting(true);
    try {
      await login(phone, password);
      setLocation("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: any) => {
    setIsSubmitting(true);
    try {
      await register(data);
      setLocation("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="text-xl">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      {isLogin ? (
        <LoginForm
          onSubmit={handleLogin}
          onRegisterClick={() => setIsLogin(false)}
          isLoading={isSubmitting}
        />
      ) : (
        <RegistrationForm
          onSubmit={handleRegister}
          onLoginClick={() => setIsLogin(true)}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
