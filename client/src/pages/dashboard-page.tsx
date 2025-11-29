import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Building2, MapPin, Calendar, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import MemberCard from "@/components/MemberCard";
import MosqueCard from "@/components/MosqueCard";
import HalqaCard from "@/components/HalqaCard";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { User, Mosque, Halqa, Thana, Union } from "@shared/schema";

const tabligActivities = [
  { id: "tin-chilla", label: "তিন চিল্লা (৩ মাস)" },
  { id: "ek-chilla", label: "এক চিল্লা (৪০ দিন)" },
  { id: "bidesh-sofor", label: "বিদেশ সফর" },
  { id: "tin-din", label: "তিন দিনের সাথী" },
  { id: "sat-din", label: "সাত দিনের সাথী" },
  { id: "dos-din", label: "১০ দিনের সাথী" },
];

// Form schemas
const memberFormSchema = z.object({
  name: z.string().min(1, "নাম আবশ্যক"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  phone: z.string().min(11, "সঠিক মোবাইল নাম্বার দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
  thanaId: z.string().min(1, "থানা নির্বাচন করুন"),
  unionId: z.string().min(1, "ইউনিয়ন নির্বাচন করুন"),
  mosqueId: z.string().optional(),
  halqaId: z.string().optional(),
  tabligActivities: z.array(z.string()).optional(),
});

const mosqueFormSchema = z.object({
  name: z.string().min(1, "মসজিদের নাম আবশ্যক"),
  address: z.string().min(1, "ঠিকানা আবশ্যক"),
  thanaId: z.string().min(1, "থানা নির্বাচন করুন"),
  unionId: z.string().min(1, "ইউনিয়ন নির্বাচন করুন"),
  halqaId: z.string().optional(),
  imamPhone: z.string().optional(),
  muazzinPhone: z.string().optional(),
});

const halqaFormSchema = z.object({
  name: z.string().min(1, "হালকার নাম আবশ্যক"),
  thanaId: z.string().min(1, "থানা নির্বাচন করুন"),
  unionId: z.string().min(1, "ইউনিয়ন নির্বাচন করুন"),
});

const managerFormSchema = z.object({
  name: z.string().min(1, "নাম আবশ্যক"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  phone: z.string().min(11, "সঠিক মোবাইল নাম্বার দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
  thanaId: z.string().min(1, "থানা নির্বাচন করুন"),
});

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [thana, setThana] = useState("all");
  const [union, setUnion] = useState("all");
  
  // Dialog states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddMosqueOpen, setIsAddMosqueOpen] = useState(false);
  const [isAddHalqaOpen, setIsAddHalqaOpen] = useState(false);
  const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery<{ stats: {
    totalMembers: number;
    totalMosques: number;
    totalHalqas: number;
    thisMonthTablig: number;
  }}>({
    queryKey: ["/api/stats"],
  });

  // Fetch thanas
  const { data: thanasData } = useQuery<{ thanas: Thana[] }>({
    queryKey: ["/api/thanas"],
  });

  // Fetch all unions for lookup - using a stable query key to always get all unions
  const { data: allUnionsData } = useQuery<{ unions: Union[] }>({
    queryKey: ["/api/unions", { all: "true" }],
  });

  // Create lookup maps for thana and union names
  const thanaNameMap = useMemo(() => {
    const map = new Map<string, string>();
    thanasData?.thanas?.forEach(t => map.set(t.id, t.nameBn));
    return map;
  }, [thanasData]);

  const unionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allUnionsData?.unions?.forEach(u => map.set(u.id, u.nameBn));
    return map;
  }, [allUnionsData]);

  const getThanaName = (id: string | null | undefined) => id ? (thanaNameMap.get(id) || id) : "";
  const getUnionName = (id: string | null | undefined) => id ? (unionNameMap.get(id) || id) : "";

  // Fetch members with filters
  const membersQueryKey = useMemo(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (thana && thana !== "all") params.thanaId = thana;
    if (union && union !== "all") params.unionId = union;
    return ["/api/members", params] as const;
  }, [search, thana, union]);

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: User[] }>({
    queryKey: membersQueryKey,
  });

  // Fetch mosques with filters
  const mosquesQueryKey = useMemo(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (thana && thana !== "all") params.thanaId = thana;
    if (union && union !== "all") params.unionId = union;
    return ["/api/mosques", params] as const;
  }, [search, thana, union]);

  const { data: mosquesData, isLoading: mosquesLoading } = useQuery<{ mosques: Mosque[] }>({
    queryKey: mosquesQueryKey,
  });

  // Fetch halqas with filters
  const halqasQueryKey = useMemo(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (thana && thana !== "all") params.thanaId = thana;
    if (union && union !== "all") params.unionId = union;
    return ["/api/halqas", params] as const;
  }, [search, thana, union]);

  const { data: halqasData, isLoading: halqasLoading } = useQuery<{ halqas: Halqa[] }>({
    queryKey: halqasQueryKey,
  });

  // Fetch managers (super admin only)
  const { data: managersData, isLoading: managersLoading } = useQuery<{ members: User[] }>({
    queryKey: ["/api/members", { role: "manager" }],
    enabled: user?.role === "super_admin",
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/members/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "সফল হয়েছে",
        description: "সাথী মুছে ফেলা হয়েছে",
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

  // Delete mosque mutation
  const deleteMosqueMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/mosques/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mosques"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "সফল হয়েছে",
        description: "মসজিদ মুছে ফেলা হয়েছে",
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

  // Delete halqa mutation
  const deleteHalqaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/halqas/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/halqas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "সফল হয়েছে",
        description: "হালকা মুছে ফেলা হয়েছে",
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

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof memberFormSchema>) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        role: "member",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsAddMemberOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "নতুন সাথী যোগ করা হয়েছে",
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

  // Create mosque mutation
  const createMosqueMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mosqueFormSchema>) => {
      const response = await apiRequest("POST", "/api/mosques", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mosques"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsAddMosqueOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "নতুন মসজিদ যোগ করা হয়েছে",
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

  // Create halqa mutation
  const createHalqaMutation = useMutation({
    mutationFn: async (data: z.infer<typeof halqaFormSchema>) => {
      const response = await apiRequest("POST", "/api/halqas", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/halqas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsAddHalqaOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "নতুন হালকা যোগ করা হয়েছে",
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

  // Create manager mutation
  const createManagerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof managerFormSchema>) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        role: "manager",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsAddManagerOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "নতুন ম্যানেজার যোগ করা হয়েছে",
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

  const stats = statsData?.stats;
  const members = membersData?.members || [];
  const mosques = mosquesData?.mosques || [];
  const halqas = halqasData?.halqas || [];
  const managers = managersData?.members || [];
  const thanas = thanasData?.thanas || [];

  const canManage = user?.role === "super_admin" || user?.role === "manager";
  const isSuperAdmin = user?.role === "super_admin";

  const handleDeleteMember = (id: string) => {
    if (confirm("আপনি কি নিশ্চিত যে এই সাথীকে মুছে ফেলতে চান?")) {
      deleteMemberMutation.mutate(id);
    }
  };

  const handleDeleteMosque = (id: string) => {
    if (confirm("আপনি কি নিশ্চিত যে এই মসজিদ মুছে ফেলতে চান?")) {
      deleteMosqueMutation.mutate(id);
    }
  };

  const handleDeleteHalqa = (id: string) => {
    if (confirm("আপনি কি নিশ্চিত যে এই হালকা মুছে ফেলতে চান?")) {
      deleteHalqaMutation.mutate(id);
    }
  };

  // Dashboard view content
  const renderDashboardView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">ড্যাশবোর্ড</h2>
          <p className="text-muted-foreground">জামালপুর জেলার তাবলীগ কার্যক্রমের সংক্ষিপ্ত বিবরণ</p>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="মোট সাথী"
            value={stats?.totalMembers.toString() || "০"}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="মসজিদ"
            value={stats?.totalMosques.toString() || "০"}
            icon={Building2}
            variant="secondary"
          />
          <StatsCard
            title="হালকা"
            value={stats?.totalHalqas.toString() || "০"}
            icon={MapPin}
            variant="accent"
          />
          <StatsCard
            title="এই মাসে তাবলীগ"
            value={stats?.thisMonthTablig.toString() || "০"}
            icon={Calendar}
            variant="primary"
          />
        </div>
      )}

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass">
          <TabsTrigger value="members" data-testid="tab-members">সাথীগণ</TabsTrigger>
          <TabsTrigger value="mosques" data-testid="tab-mosques">মসজিদ</TabsTrigger>
          <TabsTrigger value="halqa" data-testid="tab-halqa">হালকা</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            thanaValue={thana}
            onThanaChange={setThana}
            unionValue={union}
            onUnionChange={setUnion}
          />

          {membersLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              কোন সাথী পাওয়া যায়নি
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {members.slice(0, 6).map((member) => (
                <MemberCard
                  key={member.id}
                  id={member.id}
                  name={member.name}
                  phone={member.phone}
                  thana={getThanaName(member.thanaId)}
                  union={getUnionName(member.unionId)}
                  mosque={member.mosqueId || ""}
                  activities={member.tabligActivities || []}
                  onView={() => console.log("View:", member.id)}
                  onEdit={() => console.log("Edit:", member.id)}
                  onDelete={isSuperAdmin ? () => handleDeleteMember(member.id) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mosques" className="space-y-4">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            thanaValue={thana}
            onThanaChange={setThana}
            unionValue={union}
            onUnionChange={setUnion}
          />

          {mosquesLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : mosques.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              কোন মসজিদ পাওয়া যায়নি
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {mosques.slice(0, 6).map((mosque) => (
                <MosqueCard
                  key={mosque.id}
                  id={mosque.id}
                  name={mosque.name}
                  thana={getThanaName(mosque.thanaId)}
                  union={getUnionName(mosque.unionId)}
                  address={mosque.address}
                  phone={mosque.phone || ""}
                  membersCount={0}
                  onView={() => console.log("View:", mosque.id)}
                  onEdit={canManage ? () => console.log("Edit:", mosque.id) : undefined}
                  onDelete={canManage ? () => handleDeleteMosque(mosque.id) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="halqa" className="space-y-4">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            thanaValue={thana}
            onThanaChange={setThana}
            unionValue={union}
            onUnionChange={setUnion}
          />

          {halqasLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : halqas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              কোন হালকা পাওয়া যায়নি
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {halqas.slice(0, 6).map((halqa) => (
                <HalqaCard
                  key={halqa.id}
                  id={halqa.id}
                  name={halqa.name}
                  thana={getThanaName(halqa.thanaId)}
                  union={getUnionName(halqa.unionId)}
                  membersCount={halqa.membersCount}
                  createdDate={new Date(halqa.createdAt).toLocaleDateString('bn-BD')}
                  onView={() => console.log("View:", halqa.id)}
                  onEdit={canManage ? () => console.log("Edit:", halqa.id) : undefined}
                  onDelete={canManage ? () => handleDeleteHalqa(halqa.id) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Members view content
  const renderMembersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">সাথীদের তালিকা</h2>
          <p className="text-muted-foreground">সকল তাবলীগ সাথীদের বিস্তারিত তথ্য</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsAddMemberOpen(true)} data-testid="button-add-member">
            <Plus className="w-4 h-4 mr-2" />
            নতুন সাথী যোগ করুন
          </Button>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        thanaValue={thana}
        onThanaChange={setThana}
        unionValue={union}
        onUnionChange={setUnion}
      />

      {membersLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          কোন সাথী পাওয়া যায়নি
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              id={member.id}
              name={member.name}
              phone={member.phone}
              thana={getThanaName(member.thanaId)}
              union={getUnionName(member.unionId)}
              mosque={member.mosqueId || ""}
              activities={member.tabligActivities || []}
              onView={() => console.log("View:", member.id)}
              onEdit={() => console.log("Edit:", member.id)}
              onDelete={isSuperAdmin ? () => handleDeleteMember(member.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Mosques view content
  const renderMosquesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">মসজিদের তালিকা</h2>
          <p className="text-muted-foreground">সকল মসজিদের বিস্তারিত তথ্য</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsAddMosqueOpen(true)} data-testid="button-add-mosque">
            <Plus className="w-4 h-4 mr-2" />
            নতুন মসজিদ যোগ করুন
          </Button>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        thanaValue={thana}
        onThanaChange={setThana}
        unionValue={union}
        onUnionChange={setUnion}
      />

      {mosquesLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : mosques.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          কোন মসজিদ পাওয়া যায়নি
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {mosques.map((mosque) => (
            <MosqueCard
              key={mosque.id}
              id={mosque.id}
              name={mosque.name}
              thana={getThanaName(mosque.thanaId)}
              union={getUnionName(mosque.unionId)}
              address={mosque.address}
              phone={mosque.phone || ""}
              membersCount={0}
              onView={() => console.log("View:", mosque.id)}
              onEdit={canManage ? () => console.log("Edit:", mosque.id) : undefined}
              onDelete={canManage ? () => handleDeleteMosque(mosque.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Halqas view content
  const renderHalqasView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">হালকার তালিকা</h2>
          <p className="text-muted-foreground">সকল হালকার বিস্তারিত তথ্য</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsAddHalqaOpen(true)} data-testid="button-add-halqa">
            <Plus className="w-4 h-4 mr-2" />
            নতুন হালকা যোগ করুন
          </Button>
        )}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        thanaValue={thana}
        onThanaChange={setThana}
        unionValue={union}
        onUnionChange={setUnion}
      />

      {halqasLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : halqas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          কোন হালকা পাওয়া যায়নি
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {halqas.map((halqa) => (
            <HalqaCard
              key={halqa.id}
              id={halqa.id}
              name={halqa.name}
              thana={getThanaName(halqa.thanaId)}
              union={getUnionName(halqa.unionId)}
              membersCount={halqa.membersCount}
              createdDate={new Date(halqa.createdAt).toLocaleDateString('bn-BD')}
              onView={() => console.log("View:", halqa.id)}
              onEdit={canManage ? () => console.log("Edit:", halqa.id) : undefined}
              onDelete={canManage ? () => handleDeleteHalqa(halqa.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Managers view content
  const renderManagersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">ম্যানেজারদের তালিকা</h2>
          <p className="text-muted-foreground">সকল ম্যানেজারদের বিস্তারিত তথ্য</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setIsAddManagerOpen(true)} data-testid="button-add-manager">
            <Plus className="w-4 h-4 mr-2" />
            নতুন ম্যানেজার যোগ করুন
          </Button>
        )}
      </div>

      {managersLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : managers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          কোন ম্যানেজার পাওয়া যায়নি
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {managers.map((manager) => (
            <MemberCard
              key={manager.id}
              id={manager.id}
              name={manager.name}
              phone={manager.phone}
              thana={getThanaName(manager.thanaId)}
              union={getUnionName(manager.unionId)}
              mosque={manager.mosqueId || ""}
              activities={manager.tabligActivities || []}
              onView={() => console.log("View:", manager.id)}
              onEdit={() => console.log("Edit:", manager.id)}
              onDelete={isSuperAdmin ? () => handleDeleteMember(manager.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Settings view content
  const renderSettingsView = () => {
    const handleExportMembers = async () => {
      try {
        const response = await fetch('/api/members', { credentials: 'include' });
        const data = await response.json();
        const members = data.members || [];
        
        // Create CSV content
        const headers = ['নাম', 'মোবাইল', 'ইমেইল', 'থানা', 'ইউনিয়ন', 'তাবলীগ কার্যক্রম'];
        const csvContent = [
          headers.join(','),
          ...members.map((m: any) => [
            m.name,
            m.phone,
            m.email || '',
            getThanaName(m.thanaId),
            getUnionName(m.unionId),
            (m.tabligActivities || []).join('; ')
          ].map(field => `"${field}"`).join(','))
        ].join('\n');

        // Download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `sathi-list-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        toast({
          title: "সফল হয়েছে",
          description: "সাথীদের তালিকা ডাউনলোড হয়েছে",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "ব্যর্থ হয়েছে",
          description: "ডেটা এক্সপোর্ট করতে সমস্যা হয়েছে",
        });
      }
    };

    const handleExportMosques = async () => {
      try {
        const response = await fetch('/api/mosques', { credentials: 'include' });
        const data = await response.json();
        const mosquesList = data.mosques || [];
        
        const headers = ['মসজিদের নাম', 'ঠিকানা', 'থানা', 'ইউনিয়ন', 'ইমামের ফোন', 'মুয়াজ্জিনের ফোন'];
        const csvContent = [
          headers.join(','),
          ...mosquesList.map((m: any) => [
            m.name,
            m.address,
            getThanaName(m.thanaId),
            getUnionName(m.unionId),
            m.imamPhone || '',
            m.muazzinPhone || ''
          ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mosque-list-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        toast({
          title: "সফল হয়েছে",
          description: "মসজিদের তালিকা ডাউনলোড হয়েছে",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "ব্যর্থ হয়েছে",
          description: "ডেটা এক্সপোর্ট করতে সমস্যা হয়েছে",
        });
      }
    };

    const handleExportHalqas = async () => {
      try {
        const response = await fetch('/api/halqas', { credentials: 'include' });
        const data = await response.json();
        const halqasList = data.halqas || [];
        
        const headers = ['হালকার নাম', 'থানা', 'ইউনিয়ন', 'সদস্য সংখ্যা', 'তৈরির তারিখ'];
        const csvContent = [
          headers.join(','),
          ...halqasList.map((h: any) => [
            h.name,
            getThanaName(h.thanaId),
            getUnionName(h.unionId),
            h.membersCount || 0,
            new Date(h.createdAt).toLocaleDateString('bn-BD')
          ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `halqa-list-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        toast({
          title: "সফল হয়েছে",
          description: "হালকার তালিকা ডাউনলোড হয়েছে",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "ব্যর্থ হয়েছে",
          description: "ডেটা এক্সপোর্ট করতে সমস্যা হয়েছে",
        });
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">সেটিংস</h2>
          <p className="text-muted-foreground">আপনার প্রোফাইল এবং অ্যাকাউন্ট সেটিংস</p>
        </div>

        {/* Profile Section */}
        <div className="glass p-6 rounded-lg space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-4">ব্যক্তিগত তথ্য</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">নাম</Label>
                <p className="text-lg font-medium">{user?.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">মোবাইল নাম্বার</Label>
                <p className="text-lg font-medium">{user?.phone}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">ইমেইল</Label>
                <p className="text-lg font-medium">{user?.email || "যোগ করা হয়নি"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">ভূমিকা</Label>
                <p className="text-lg font-medium">
                  {user?.role === "super_admin" ? "সুপার এডমিন" : 
                   user?.role === "manager" ? "ম্যানেজার" : "সাথী"}
                </p>
              </div>
              {user?.thanaId && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">থানা</Label>
                  <p className="text-lg font-medium">{getThanaName(user.thanaId)}</p>
                </div>
              )}
              {user?.unionId && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">ইউনিয়ন</Label>
                  <p className="text-lg font-medium">{getUnionName(user.unionId)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thana/Union Management - Super Admin Only */}
        {isSuperAdmin && (
          <div className="glass p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold mb-4">থানা ও ইউনিয়ন ব্যবস্থাপনা</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">মোট থানা</h4>
                <p className="text-3xl font-bold text-primary">{thanas.length}</p>
                <p className="text-sm text-muted-foreground mt-1">জামালপুর জেলার সকল থানা</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">মোট ইউনিয়ন</h4>
                <p className="text-3xl font-bold text-primary">{allUnionsData?.unions?.length || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">সকল থানার অধীনে ইউনিয়ন</p>
              </div>
            </div>
            <div className="pt-4">
              <h4 className="font-medium mb-3">থানা অনুযায়ী তালিকা</h4>
              <div className="grid md:grid-cols-3 gap-2">
                {thanas.map((thana) => (
                  <div key={thana.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{thana.nameBn}</p>
                    <p className="text-sm text-muted-foreground">
                      {allUnionsData?.unions?.filter(u => u.thanaId === thana.id).length || 0} ইউনিয়ন
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Export Section - Super Admin Only */}
        {isSuperAdmin && (
          <div className="glass p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold mb-4">ডেটা এক্সপোর্ট</h3>
            <p className="text-muted-foreground mb-4">CSV ফরম্যাটে ডেটা ডাউনলোড করুন</p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={handleExportMembers}
                data-testid="button-export-members"
              >
                সাথীদের তালিকা ডাউনলোড
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportMosques}
                data-testid="button-export-mosques"
              >
                মসজিদের তালিকা ডাউনলোড
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportHalqas}
                data-testid="button-export-halqas"
              >
                হালকার তালিকা ডাউনলোড
              </Button>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        <div className="glass p-6 rounded-lg space-y-4">
          <h3 className="text-xl font-semibold mb-4">সংক্ষিপ্ত পরিসংখ্যান</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats?.totalMembers || 0}</p>
              <p className="text-sm text-muted-foreground">মোট সাথী</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats?.totalMosques || 0}</p>
              <p className="text-sm text-muted-foreground">মোট মসজিদ</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats?.totalHalqas || 0}</p>
              <p className="text-sm text-muted-foreground">মোট হালকা</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{stats?.thisMonthTablig || 0}</p>
              <p className="text-sm text-muted-foreground">এই মাসে তাবলীগ</p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="glass p-6 rounded-lg space-y-4">
          <h3 className="text-xl font-semibold mb-4">অ্যাপ সম্পর্কে</h3>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              জামালপুর জেলার তাবলীগ জামাত সাথী ব্যবস্থাপনা সিস্টেম
            </p>
            <p className="text-sm text-muted-foreground">
              ভার্সন ১.০.০
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboardView();
      case "members":
        return renderMembersView();
      case "mosques":
        return renderMosquesView();
      case "halqa":
        return renderHalqasView();
      case "managers":
        return isSuperAdmin ? renderManagersView() : renderDashboardView();
      case "settings":
        return renderSettingsView();
      default:
        return renderDashboardView();
    }
  };

  return (
    <>
      <DashboardLayout
        userName={user?.name || ""}
        userRole={(user?.role as "member" | "super_admin" | "manager") || "member"}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={logout}
      >
        {renderContent()}
      </DashboardLayout>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onSubmit={(data) => createMemberMutation.mutate(data)}
        isLoading={createMemberMutation.isPending}
        thanas={thanas}
      />

      {/* Add Mosque Dialog */}
      <AddMosqueDialog
        open={isAddMosqueOpen}
        onOpenChange={setIsAddMosqueOpen}
        onSubmit={(data) => createMosqueMutation.mutate(data)}
        isLoading={createMosqueMutation.isPending}
        thanas={thanas}
      />

      {/* Add Halqa Dialog */}
      <AddHalqaDialog
        open={isAddHalqaOpen}
        onOpenChange={setIsAddHalqaOpen}
        onSubmit={(data) => createHalqaMutation.mutate(data)}
        isLoading={createHalqaMutation.isPending}
        thanas={thanas}
      />

      {/* Add Manager Dialog */}
      <AddManagerDialog
        open={isAddManagerOpen}
        onOpenChange={setIsAddManagerOpen}
        onSubmit={(data) => createManagerMutation.mutate(data)}
        isLoading={createManagerMutation.isPending}
        thanas={thanas}
      />
    </>
  );
}

// Add Member Dialog Component
function AddMemberDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  thanas 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSubmit: (data: z.infer<typeof memberFormSchema>) => void;
  isLoading: boolean;
  thanas: Thana[];
}) {
  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      thanaId: "",
      unionId: "",
      mosqueId: "",
      halqaId: "",
      tabligActivities: [],
    },
  });

  const selectedThana = form.watch("thanaId");
  const selectedUnion = form.watch("unionId");
  const selectedActivities = form.watch("tabligActivities") || [];

  // Fetch unions based on selected thana
  const { data: unionsData } = useQuery<{ unions: Union[] }>({
    queryKey: ["/api/unions", { thanaId: selectedThana }],
    enabled: !!selectedThana,
  });

  // Fetch mosques based on selected thana and union
  const { data: mosquesData } = useQuery<{ mosques: Mosque[] }>({
    queryKey: ["/api/mosques", { thanaId: selectedThana, unionId: selectedUnion }],
    enabled: !!selectedThana && !!selectedUnion,
  });

  // Fetch halqas based on selected thana and union
  const { data: halqasData } = useQuery<{ halqas: Halqa[] }>({
    queryKey: ["/api/halqas", { thanaId: selectedThana, unionId: selectedUnion }],
    enabled: !!selectedThana && !!selectedUnion,
  });

  const unions = unionsData?.unions || [];
  const mosques = mosquesData?.mosques || [];
  const halqas = halqasData?.halqas || [];

  // Reset union, mosque, and halqa when thana changes
  useEffect(() => {
    if (selectedThana) {
      form.setValue("unionId", "");
      form.setValue("mosqueId", "");
      form.setValue("halqaId", "");
    }
  }, [selectedThana, form]);

  // Reset mosque and halqa when union changes
  useEffect(() => {
    if (selectedUnion) {
      form.setValue("mosqueId", "");
      form.setValue("halqaId", "");
    }
  }, [selectedUnion, form]);

  const handleActivityToggle = (activityId: string) => {
    const current = selectedActivities;
    const updated = current.includes(activityId)
      ? current.filter(id => id !== activityId)
      : [...current, activityId];
    form.setValue("tabligActivities", updated);
  };

  const handleSubmit = (data: z.infer<typeof memberFormSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>নতুন সাথী যোগ করুন</DialogTitle>
          <DialogDescription>
            নতুন তাবলীগ সাথীর তথ্য প্রদান করুন
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পূর্ণ নাম *</FormLabel>
                    <FormControl>
                      <Input placeholder="নাম লিখুন" {...field} data-testid="input-member-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>মোবাইল নাম্বার *</FormLabel>
                    <FormControl>
                      <Input placeholder="০১৭১২৩৪৫৬৭৮" {...field} data-testid="input-member-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইমেইল (ঐচ্ছিক)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} data-testid="input-member-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পাসওয়ার্ড *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} data-testid="input-member-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="thanaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>থানা *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-member-thana">
                          <SelectValue placeholder="থানা নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {thanas.map((thana) => (
                          <SelectItem key={thana.id} value={thana.id}>
                            {thana.nameBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইউনিয়ন *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedThana}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-member-union">
                          <SelectValue placeholder="ইউনিয়ন নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unions.map((union) => (
                          <SelectItem key={union.id} value={union.id}>
                            {union.nameBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mosqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>মসজিদ (ঐচ্ছিক)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedUnion}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-member-mosque">
                          <SelectValue placeholder="মসজিদ নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mosques.map((mosque) => (
                          <SelectItem key={mosque.id} value={mosque.id}>
                            {mosque.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="halqaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>হালকা (ঐচ্ছিক)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedUnion}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-member-halqa">
                        <SelectValue placeholder="হালকা নির্বাচন করুন" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {halqas.map((halqa) => (
                        <SelectItem key={halqa.id} value={halqa.id}>
                          {halqa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label className="text-base font-semibold">তাবলীগ কার্যক্রম</Label>
              <p className="text-sm text-muted-foreground">অংশগ্রহণকৃত কার্যক্রম চিহ্নিত করুন</p>
              <div className="grid md:grid-cols-2 gap-3">
                {tabligActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`member-${activity.id}`}
                      checked={selectedActivities.includes(activity.id)}
                      onCheckedChange={() => handleActivityToggle(activity.id)}
                      data-testid={`checkbox-member-${activity.id}`}
                    />
                    <Label
                      htmlFor={`member-${activity.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {activity.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-member"
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-submit-member">
                {isLoading ? "যোগ হচ্ছে..." : "সাথী যোগ করুন"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Add Mosque Dialog Component
function AddMosqueDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  thanas 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSubmit: (data: z.infer<typeof mosqueFormSchema>) => void;
  isLoading: boolean;
  thanas: Thana[];
}) {
  const form = useForm<z.infer<typeof mosqueFormSchema>>({
    resolver: zodResolver(mosqueFormSchema),
    defaultValues: {
      name: "",
      address: "",
      thanaId: "",
      unionId: "",
      halqaId: "",
      imamPhone: "",
      muazzinPhone: "",
    },
  });

  const selectedThana = form.watch("thanaId");
  const selectedUnion = form.watch("unionId");

  // Fetch unions based on selected thana
  const { data: unionsData } = useQuery<{ unions: Union[] }>({
    queryKey: ["/api/unions", { thanaId: selectedThana }],
    enabled: !!selectedThana,
  });

  // Fetch halqas based on selected thana and union
  const { data: halqasData } = useQuery<{ halqas: Halqa[] }>({
    queryKey: ["/api/halqas", { thanaId: selectedThana, unionId: selectedUnion }],
    enabled: !!selectedThana && !!selectedUnion,
  });

  const unions = unionsData?.unions || [];
  const halqas = halqasData?.halqas || [];

  // Track previous values to detect changes
  const prevThanaRef = useRef(selectedThana);
  const prevUnionRef = useRef(selectedUnion);

  // Reset union and halqa when thana changes
  useEffect(() => {
    if (prevThanaRef.current !== selectedThana && prevThanaRef.current !== "") {
      form.setValue("unionId", "");
      form.setValue("halqaId", "");
    }
    prevThanaRef.current = selectedThana;
  }, [selectedThana, form]);

  // Reset halqa when union changes
  useEffect(() => {
    if (prevUnionRef.current !== selectedUnion && prevUnionRef.current !== "") {
      form.setValue("halqaId", "");
    }
    prevUnionRef.current = selectedUnion;
  }, [selectedUnion, form]);

  const handleSubmit = (data: z.infer<typeof mosqueFormSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>নতুন মসজিদ যোগ করুন</DialogTitle>
          <DialogDescription>
            নতুন মসজিদের তথ্য প্রদান করুন
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>মসজিদের নাম *</FormLabel>
                  <FormControl>
                    <Input placeholder="মসজিদের নাম লিখুন" {...field} data-testid="input-mosque-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ঠিকানা *</FormLabel>
                  <FormControl>
                    <Input placeholder="ঠিকানা লিখুন" {...field} data-testid="input-mosque-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="thanaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>থানা *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-mosque-thana">
                          <SelectValue placeholder="থানা নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {thanas.map((thana) => (
                          <SelectItem key={thana.id} value={thana.id}>
                            {thana.nameBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইউনিয়ন *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedThana}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-mosque-union">
                          <SelectValue placeholder="ইউনিয়ন নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unions.map((union) => (
                          <SelectItem key={union.id} value={union.id}>
                            {union.nameBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="halqaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>হালকা (ঐচ্ছিক)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedUnion}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-mosque-halqa">
                        <SelectValue placeholder="হালকা নির্বাচন করুন" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {halqas.map((halqa) => (
                        <SelectItem key={halqa.id} value={halqa.id}>
                          {halqa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imamPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইমামের ফোন নাম্বার (ঐচ্ছিক)</FormLabel>
                    <FormControl>
                      <Input placeholder="০১৭১২৩৪৫৬৭৮" {...field} data-testid="input-mosque-imam-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="muazzinPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>মুয়াজ্জিনের ফোন নাম্বার (ঐচ্ছিক)</FormLabel>
                    <FormControl>
                      <Input placeholder="০১৭১২৩৪৫৬৭৮" {...field} data-testid="input-mosque-muazzin-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-mosque"
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-submit-mosque">
                {isLoading ? "যোগ হচ্ছে..." : "মসজিদ যোগ করুন"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Add Halqa Dialog Component
function AddHalqaDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  thanas 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSubmit: (data: z.infer<typeof halqaFormSchema>) => void;
  isLoading: boolean;
  thanas: Thana[];
}) {
  const form = useForm<z.infer<typeof halqaFormSchema>>({
    resolver: zodResolver(halqaFormSchema),
    defaultValues: {
      name: "",
      thanaId: "",
      unionId: "",
    },
  });

  const selectedThana = form.watch("thanaId");

  // Fetch unions based on selected thana
  const { data: unionsData } = useQuery<{ unions: Union[] }>({
    queryKey: ["/api/unions", { thanaId: selectedThana }],
    enabled: !!selectedThana,
  });

  const unions = unionsData?.unions || [];

  // Reset union when thana changes
  useEffect(() => {
    if (selectedThana) {
      form.setValue("unionId", "");
    }
  }, [selectedThana, form]);

  const handleSubmit = (data: z.infer<typeof halqaFormSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>নতুন হালকা যোগ করুন</DialogTitle>
          <DialogDescription>
            নতুন হালকার তথ্য প্রদান করুন
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>হালকার নাম *</FormLabel>
                  <FormControl>
                    <Input placeholder="হালকার নাম লিখুন" {...field} data-testid="input-halqa-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="thanaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>থানা *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-halqa-thana">
                          <SelectValue placeholder="থানা নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {thanas.map((thana) => (
                          <SelectItem key={thana.id} value={thana.id}>
                            {thana.nameBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইউনিয়ন *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedThana}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-halqa-union">
                          <SelectValue placeholder="ইউনিয়ন নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unions.map((union) => (
                          <SelectItem key={union.id} value={union.id}>
                            {union.nameBn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-halqa"
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-submit-halqa">
                {isLoading ? "যোগ হচ্ছে..." : "হালকা যোগ করুন"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Add Manager Dialog Component
function AddManagerDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  thanas 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSubmit: (data: z.infer<typeof managerFormSchema>) => void;
  isLoading: boolean;
  thanas: Thana[];
}) {
  const form = useForm<z.infer<typeof managerFormSchema>>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      thanaId: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof managerFormSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>নতুন ম্যানেজার যোগ করুন</DialogTitle>
          <DialogDescription>
            নতুন ম্যানেজারের তথ্য প্রদান করুন
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পূর্ণ নাম *</FormLabel>
                    <FormControl>
                      <Input placeholder="নাম লিখুন" {...field} data-testid="input-manager-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>মোবাইল নাম্বার *</FormLabel>
                    <FormControl>
                      <Input placeholder="০১৭১২৩৪৫৬৭৮" {...field} data-testid="input-manager-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইমেইল (ঐচ্ছিক)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} data-testid="input-manager-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পাসওয়ার্ড *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} data-testid="input-manager-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="thanaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>থানা *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-manager-thana">
                        <SelectValue placeholder="থানা নির্বাচন করুন" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {thanas.map((thana) => (
                        <SelectItem key={thana.id} value={thana.id}>
                          {thana.nameBn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                data-testid="button-cancel-manager"
              >
                বাতিল
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-submit-manager">
                {isLoading ? "যোগ হচ্ছে..." : "ম্যানেজার যোগ করুন"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
