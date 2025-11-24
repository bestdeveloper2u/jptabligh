import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Building2, MapPin, Calendar, Plus } from "lucide-react";
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
import type { User, Mosque, Halqa } from "@shared/schema";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [thana, setThana] = useState("all");
  const [union, setUnion] = useState("all");

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery<{ stats: {
    totalMembers: number;
    totalMosques: number;
    totalHalqas: number;
    thisMonthTablig: number;
  }}>({
    queryKey: ["/api/stats"],
  });

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

  const stats = statsData?.stats;
  const members = membersData?.members || [];
  const mosques = mosquesData?.mosques || [];
  const halqas = halqasData?.halqas || [];

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

  return (
    <DashboardLayout
      userName={user?.name || ""}
      userRole={(user?.role as "member" | "super_admin" | "manager") || "member"}
    >
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
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">সাথীদের তালিকা</h3>
              {canManage && (
                <Button data-testid="button-add-member">
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
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    id={member.id}
                    name={member.name}
                    phone={member.phone}
                    thana={member.thanaId || ""}
                    union={member.unionId || ""}
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
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">মসজিদের তালিকা</h3>
              {canManage && (
                <Button data-testid="button-add-mosque">
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
                {mosques.map((mosque) => (
                  <MosqueCard
                    key={mosque.id}
                    id={mosque.id}
                    name={mosque.name}
                    thana={mosque.thanaId}
                    union={mosque.unionId}
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
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">হালকার তালিকা</h3>
              {canManage && (
                <Button data-testid="button-add-halqa">
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
                {halqas.map((halqa) => (
                  <HalqaCard
                    key={halqa.id}
                    id={halqa.id}
                    name={halqa.name}
                    thana={halqa.thanaId}
                    union={halqa.unionId}
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
    </DashboardLayout>
  );
}
