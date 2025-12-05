import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Users, CheckCircle2, Calendar, Edit, Clock, Plane, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { User, Thana, Union, Mosque, Halqa } from "@shared/schema";

const activityLabels: Record<string, { label: string; description: string; icon: typeof CheckCircle2 }> = {
  "tin-chilla": { label: "তিন চিল্লা", description: "৩ মাস (১২০ দিন)", icon: CalendarDays },
  "ek-chilla": { label: "এক চিল্লা", description: "৪০ দিন", icon: Calendar },
  "bidesh-sofor": { label: "বিদেশ সফর", description: "বিদেশে দাওয়াতী সফর", icon: Plane },
  "tin-din": { label: "৩ দিনের সাথী", description: "তিন দিন", icon: Clock },
  "sat-din": { label: "৭ দিনের সাথী", description: "সাত দিন", icon: Clock },
  "dos-din": { label: "১০ দিনের সাথী", description: "দশ দিন", icon: Clock },
};

const tabligActivities = [
  { id: "tin-chilla", label: "তিন চিল্লা (৩ মাস)" },
  { id: "ek-chilla", label: "এক চিল্লা (৪০ দিন)" },
  { id: "bidesh-sofor", label: "বিদেশ সফর" },
  { id: "tin-din", label: "তিন দিনের সাথী" },
  { id: "sat-din", label: "সাত দিনের সাথী" },
  { id: "dos-din", label: "১০ দিনের সাথী" },
];

const editMemberSchema = z.object({
  name: z.string().min(1, "নাম আবশ্যক"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  phone: z.string().min(11, "সঠিক মোবাইল নাম্বার দিন"),
  thanaId: z.string().min(1, "থানা নির্বাচন করুন"),
  unionId: z.string().min(1, "ইউনিয়ন নির্বাচন করুন"),
  mosqueId: z.string().optional(),
  halqaId: z.string().optional(),
  tabligActivities: z.array(z.string()).optional(),
});

export default function MemberDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const canManage = user?.role === "super_admin" || user?.role === "manager";

  const handleViewChange = (view: string) => {
    if (view === "settings") {
      setLocation("/settings");
    } else {
      setLocation(`/dashboard?view=${view}`);
    }
  };

  const { data: memberData, isLoading: memberLoading } = useQuery<{ member: User }>({
    queryKey: ["/api/members", id],
    queryFn: async () => {
      const res = await fetch(`/api/members/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch member");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: thanasData } = useQuery<{ thanas: Thana[] }>({
    queryKey: ["/api/thanas"],
  });

  const { data: unionsData } = useQuery<{ unions: Union[] }>({
    queryKey: ["/api/unions"],
  });

  const { data: mosquesData } = useQuery<{ mosques: Mosque[] }>({
    queryKey: ["/api/mosques"],
  });

  const { data: halqasData } = useQuery<{ halqas: Halqa[] }>({
    queryKey: ["/api/halqas"],
  });

  const member = memberData?.member;
  const thanas = thanasData?.thanas || [];
  const unions = unionsData?.unions || [];
  const mosques = mosquesData?.mosques || [];
  const halqas = halqasData?.halqas || [];

  const thanaName = thanas.find(t => t.id === member?.thanaId)?.nameBn || "";
  const unionName = unions.find(u => u.id === member?.unionId)?.nameBn || "";
  const mosqueName = mosques.find(m => m.id === member?.mosqueId)?.name || "";
  const halqaName = halqas.find(h => h.id === member?.halqaId)?.name || "";

  const form = useForm<z.infer<typeof editMemberSchema>>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      thanaId: "",
      unionId: "",
      mosqueId: "",
      halqaId: "",
      tabligActivities: [],
    },
  });

  const selectedThanaId = form.watch("thanaId");
  const selectedUnionId = form.watch("unionId");

  const filteredUnions = useMemo(() => {
    if (!selectedThanaId || selectedThanaId === "all") return unions;
    return unions.filter(u => u.thanaId === selectedThanaId);
  }, [selectedThanaId, unions]);

  const filteredMosques = useMemo(() => {
    let filtered = mosques;
    if (selectedThanaId && selectedThanaId !== "all") {
      filtered = filtered.filter(m => m.thanaId === selectedThanaId);
    }
    if (selectedUnionId && selectedUnionId !== "all") {
      filtered = filtered.filter(m => m.unionId === selectedUnionId);
    }
    return filtered;
  }, [selectedThanaId, selectedUnionId, mosques]);

  const filteredHalqas = useMemo(() => {
    let filtered = halqas;
    if (selectedThanaId && selectedThanaId !== "all") {
      filtered = filtered.filter(h => h.thanaId === selectedThanaId);
    }
    if (selectedUnionId && selectedUnionId !== "all") {
      filtered = filtered.filter(h => h.unionId === selectedUnionId);
    }
    return filtered;
  }, [selectedThanaId, selectedUnionId, halqas]);

  const openEditDialog = () => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email || "",
        phone: member.phone,
        thanaId: member.thanaId || "",
        unionId: member.unionId || "",
        mosqueId: member.mosqueId || "",
        halqaId: member.halqaId || "",
        tabligActivities: member.tabligActivities || [],
      });
      setIsEditOpen(true);
    }
  };

  const updateMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editMemberSchema>) => {
      const payload = {
        ...data,
        halqaId: data.halqaId === "none" || !data.halqaId ? null : data.halqaId,
        mosqueId: data.mosqueId === "none" || !data.mosqueId ? null : data.mosqueId,
      };
      await apiRequest("PUT", `/api/members/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/halqas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/halqas", member?.halqaId] });
      queryClient.invalidateQueries({ queryKey: ["/api/mosques"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsEditOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "সাথীর তথ্য আপডেট করা হয়েছে",
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

  const handleSubmit = (data: z.infer<typeof editMemberSchema>) => {
    updateMemberMutation.mutate(data);
  };

  if (memberLoading || !user) {
    return (
      <DashboardLayout
        userName={user?.name || ""}
        userId={user?.id || ""}
        userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
        activeView="members"
        onViewChange={handleViewChange}
        onLogout={logout}
      >
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!member) {
    return (
      <DashboardLayout
        userName={user?.name || ""}
        userId={user?.id || ""}
        userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
        activeView="members"
        onViewChange={handleViewChange}
        onLogout={logout}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">সাথী পাওয়া যায়নি</h2>
            <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-to-dashboard">
              ড্যাশবোর্ডে ফিরে যান
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const initials = member.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const activities = member.tabligActivities || [];

  return (
    <DashboardLayout
      userName={user?.name || ""}
      userId={user?.id || ""}
      userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
      activeView="members"
      onViewChange={handleViewChange}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            পেছনে যান
          </Button>
          {canManage && (
            <Button onClick={openEditDialog} data-testid="button-edit-member">
              <Edit className="w-4 h-4 mr-2" />
              সম্পাদনা করুন
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2" data-testid="text-member-name">{member.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" data-testid="badge-role">
                    {member.role === "super_admin" ? "সুপার এডমিন" : 
                     member.role === "manager" ? "ম্যানেজার" : "সাথী"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">যোগাযোগ তথ্য</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span data-testid="text-phone">{member.phone}</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-email">{member.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">অবস্থান তথ্য</h3>
                <div className="space-y-3">
                  {thanaName && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-thana">থানা: {thanaName}</span>
                    </div>
                  )}
                  {unionName && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-union">ইউনিয়ন: {unionName}</span>
                    </div>
                  )}
                  {mosqueName && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-mosque">মসজিদ: {mosqueName}</span>
                    </div>
                  )}
                  {halqaName && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-halqa">হালকা: {halqaName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">তাবলীগ কার্যক্রম</h3>
              {activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activities.map((activity) => {
                    const activityInfo = activityLabels[activity];
                    const IconComponent = activityInfo?.icon || CheckCircle2;
                    return (
                      <div 
                        key={activity} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                        data-testid={`badge-activity-${activity}`}
                      >
                        <div className="p-2 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-300">
                            {activityInfo?.label || activity}
                          </p>
                          {activityInfo?.description && (
                            <p className="text-xs text-green-600/70 dark:text-green-400/70">
                              {activityInfo.description}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">কোনো তাবলীগ কার্যক্রম নেই</p>
              )}
            </div>

            {member.createdAt && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>যোগদান: {new Date(member.createdAt).toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>সাথীর তথ্য সম্পাদনা</DialogTitle>
            <DialogDescription>সাথীর তথ্য আপডেট করুন</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>নাম</FormLabel>
                    <FormControl>
                      <Input placeholder="সাথীর নাম" {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>মোবাইল নাম্বার</FormLabel>
                      <FormControl>
                        <Input placeholder="01XXXXXXXXX" {...field} data-testid="input-edit-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ইমেইল (ঐচ্ছিক)</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="thanaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>থানা</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-thana">
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
                      <FormLabel>ইউনিয়ন</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-union">
                            <SelectValue placeholder="ইউনিয়ন নির্বাচন করুন" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredUnions.map((union) => (
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mosqueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>মসজিদ (ঐচ্ছিক)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-mosque">
                            <SelectValue placeholder="মসজিদ নির্বাচন করুন" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">নির্বাচন করুন</SelectItem>
                          {filteredMosques.map((mosque) => (
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

                <FormField
                  control={form.control}
                  name="halqaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>হালকা (ঐচ্ছিক)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-halqa">
                            <SelectValue placeholder="হালকা নির্বাচন করুন" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">নির্বাচন করুন</SelectItem>
                          {filteredHalqas.map((halqa) => (
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
              </div>

              <FormField
                control={form.control}
                name="tabligActivities"
                render={() => (
                  <FormItem>
                    <FormLabel>তাবলীগ কার্যক্রম</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {tabligActivities.map((activity) => (
                        <FormField
                          key={activity.id}
                          control={form.control}
                          name="tabligActivities"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(activity.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, activity.id]);
                                    } else {
                                      field.onChange(current.filter((v) => v !== activity.id));
                                    }
                                  }}
                                  data-testid={`checkbox-activity-${activity.id}`}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {activity.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-member">
                  বাতিল
                </Button>
                <Button type="submit" disabled={updateMemberMutation.isPending} data-testid="button-save-member">
                  {updateMemberMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
