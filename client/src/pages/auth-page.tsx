import { useState } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/LoginForm";
import RegistrationForm from "@/components/RegistrationForm";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = (email: string, password: string) => {
    console.log("Login:", { email, password });
    setLocation("/dashboard");
  };

  const handleRegister = (data: any) => {
    console.log("Registration:", data);
    setLocation("/dashboard");
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      {isLogin ? (
        <LoginForm
          onSubmit={handleLogin}
          onRegisterClick={() => setIsLogin(false)}
        />
      ) : (
        <RegistrationForm
          onSubmit={handleRegister}
          onLoginClick={() => setIsLogin(true)}
        />
      )}
    </div>
  );
}
