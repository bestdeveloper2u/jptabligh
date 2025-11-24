import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  // Check if user is logged in on mount
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (authData?.user) {
      setUser(authData.user);
    } else {
      setUser(null);
    }
  }, [authData]);

  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { phone, password });
      return await res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "সফলভাবে লগইন হয়েছে",
        description: `স্বাগতম, ${data.user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "লগইন ব্যর্থ হয়েছে",
        description: error.message,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "রেজিস্ট্রেশন সফল হয়েছে",
        description: `স্বাগতম, ${data.user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "রেজিস্ট্রেশন ব্যর্থ হয়েছে",
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return await res.json();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: "লগআউট সফল হয়েছে",
        description: "আবার আসবেন!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "লগআউট ব্যর্থ হয়েছে",
        description: error.message,
      });
    },
  });

  const login = async (phone: string, password: string) => {
    await loginMutation.mutateAsync({ phone, password });
  };

  const register = async (data: any) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
