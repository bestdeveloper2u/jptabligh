import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Phone, MapPin, Building2, Users, Calendar, Edit, CheckCircle2, XCircle, Clock, BookOpen, Heart, Footprints, CalendarDays, UserPlus, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import MemberCard from "@/components/MemberCard";
import type { Mosque, Thana, Union, Halqa, User } from "@shared/schema";

const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
};

const dayNamesBn: Record<string, string> = {
  sunday: "রবিবার",
  monday: "সোমবার",
  tuesday: "মঙ্গলবার",
  wednesday: "বুধবার",
  thursday: "বৃহস্পতিবার",
  friday: "শুক্রবার",
  saturday: "শনিবার",
};

const editMosqueSchema = z.object({
  name: z.string().min(1, "মসজিদের নাম আবশ্যক"),
  address: z.string().min(1, "ঠিকানা আবশ্যক"),
  thanaId: z.string().min(1, "থানা নির্বাচন করুন"),
  unionId: z.string().min(1, "ইউনিয়ন নির্বাচন করুন"),
  halqaId: z.string().optional(),
  imamPhone: z.string().optional(),
  muazzinPhone: z.string().optional(),
  phone: z.string().optional(),
});

const fiveTasksSchema = z.object({
  fiveTasksActive: z.boolean().default(false),
  dailyMashwara: z.boolean().default(false),
  dailyTalim: z.boolean().default(false),
  dailyDawah: z.boolean().default(false),
  weeklyGasht: z.boolean().default(false),
  monthlyThreeDays: z.boolean().default(false),
  mashwaraTime: z.string().optional(),
  talimTime: z.string().optional(),
  dawahTime: z.string().optional(),
  gashtDay: z.string().optional(),
  threeDaysSchedule: z.string().optional(),
});


export default function MosqueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFiveTasksEditOpen, setIsFiveTasksEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const canManage = user?.role === "super_admin" || user?.role === "manager";

  const safeGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/dashboard", { replace: true });
    }
  };

  const handleViewChange = (view: string) => {
    if (view === "settings") {
      setLocation("/settings", { replace: true });
    } else {
      setLocation(`/dashboard?view=${view}`, { replace: true });
    }
  };

  const { data: mosqueData, isLoading: mosqueLoading } = useQuery<{ mosque: Mosque }>({
    queryKey: ["/api/mosques", id],
    queryFn: async () => {
      const res = await fetch(`/api/mosques/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mosque");
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

  const { data: halqasData } = useQuery<{ halqas: Halqa[] }>({
    queryKey: ["/api/halqas"],
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: User[] }>({
    queryKey: ["/api/members", { mosqueId: id }],
    enabled: !!id,
  });

  const { data: allMembersData } = useQuery<{ members: User[] }>({
    queryKey: ["/api/members"],
  });

  const mosque = mosqueData?.mosque;
  const allMembers = allMembersData?.members || [];
  const thanas = thanasData?.thanas || [];
  const unions = unionsData?.unions || [];
  const halqas = halqasData?.halqas || [];
  const members = membersData?.members || [];

  const thanaName = thanas.find(t => t.id === mosque?.thanaId)?.nameBn || "";
  const unionName = unions.find(u => u.id === mosque?.unionId)?.nameBn || "";
  const halqaName = halqas.find(h => h.id === mosque?.halqaId)?.name || "";

  const activeTasksCount = mosque ? [
    mosque.dailyMashwara,
    mosque.dailyTalim,
    mosque.dailyDawah,
    mosque.weeklyGasht,
    mosque.monthlyThreeDays
  ].filter(Boolean).length : 0;

  const form = useForm<z.infer<typeof editMosqueSchema>>({
    resolver: zodResolver(editMosqueSchema),
    defaultValues: {
      name: "",
      address: "",
      thanaId: "",
      unionId: "",
      halqaId: "",
      imamPhone: "",
      muazzinPhone: "",
      phone: "",
    },
  });

  const fiveTasksForm = useForm<z.infer<typeof fiveTasksSchema>>({
    resolver: zodResolver(fiveTasksSchema),
    defaultValues: {
      fiveTasksActive: false,
      dailyMashwara: false,
      dailyTalim: false,
      dailyDawah: false,
      weeklyGasht: false,
      monthlyThreeDays: false,
      mashwaraTime: "",
      talimTime: "",
      dawahTime: "",
      gashtDay: "",
      threeDaysSchedule: "",
    },
  });

  const selectedThanaId = form.watch("thanaId");
  const selectedUnionId = form.watch("unionId");
  
  // Five tasks form watch values
  const fiveTasksActive = fiveTasksForm.watch("fiveTasksActive");
  const dailyMashwaraWatch = fiveTasksForm.watch("dailyMashwara");
  const dailyTalimWatch = fiveTasksForm.watch("dailyTalim");
  const dailyDawahWatch = fiveTasksForm.watch("dailyDawah");
  const weeklyGashtWatch = fiveTasksForm.watch("weeklyGasht");
  const monthlyThreeDaysWatch = fiveTasksForm.watch("monthlyThreeDays");
  
  const hasAtLeastOneTaskInDetails = dailyMashwaraWatch || dailyTalimWatch || dailyDawahWatch || weeklyGashtWatch || monthlyThreeDaysWatch;

  const filteredUnions = useMemo(() => {
    if (!selectedThanaId || selectedThanaId === "all") return unions;
    return unions.filter(u => u.thanaId === selectedThanaId);
  }, [selectedThanaId, unions]);

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

  const availableMembers = useMemo(() => {
    if (!mosque) return [];
    return allMembers.filter(m => 
      !m.mosqueId && 
      m.role === "member" &&
      m.thanaId === mosque.thanaId &&
      m.unionId === mosque.unionId
    );
  }, [allMembers, mosque]);

  const openEditDialog = () => {
    if (mosque) {
      form.reset({
        name: mosque.name,
        address: mosque.address,
        thanaId: mosque.thanaId,
        unionId: mosque.unionId,
        halqaId: mosque.halqaId || "",
        imamPhone: mosque.imamPhone || "",
        muazzinPhone: mosque.muazzinPhone || "",
        phone: mosque.phone || "",
      });
      setIsEditOpen(true);
    }
  };

  const openFiveTasksEditDialog = () => {
    if (mosque) {
      fiveTasksForm.reset({
        fiveTasksActive: mosque.fiveTasksActive || false,
        dailyMashwara: mosque.dailyMashwara || false,
        dailyTalim: mosque.dailyTalim || false,
        dailyDawah: mosque.dailyDawah || false,
        weeklyGasht: mosque.weeklyGasht || false,
        monthlyThreeDays: mosque.monthlyThreeDays || false,
        mashwaraTime: mosque.mashwaraTime || "",
        talimTime: mosque.talimTime || "",
        dawahTime: mosque.dawahTime || "",
        gashtDay: mosque.gashtDay || "",
        threeDaysSchedule: mosque.threeDaysSchedule || "",
      });
      setIsFiveTasksEditOpen(true);
    }
  };

  const updateMosqueMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editMosqueSchema>) => {
      const payload = {
        ...data,
        halqaId: data.halqaId === "none" ? null : data.halqaId || null,
      };
      await apiRequest("PUT", `/api/mosques/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mosques", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/mosques"] });
      setIsEditOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "মসজিদের তথ্য আপডেট করা হয়েছে",
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

  const updateFiveTasksMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fiveTasksSchema>) => {
      const payload = {
        name: mosque?.name,
        address: mosque?.address,
        thanaId: mosque?.thanaId,
        unionId: mosque?.unionId,
        halqaId: mosque?.halqaId,
        imamPhone: mosque?.imamPhone,
        muazzinPhone: mosque?.muazzinPhone,
        phone: mosque?.phone,
        ...data,
      };
      await apiRequest("PUT", `/api/mosques/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mosques", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/mosques"] });
      setIsFiveTasksEditOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "পাঁচ কাজের তথ্য আপডেট করা হয়েছে",
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

  const addMemberToMosqueMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("PUT", `/api/members/${memberId}`, { 
        mosqueId: id,
        halqaId: mosque?.halqaId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", { mosqueId: id }] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setIsAddMemberOpen(false);
      toast({
        title: "সফল হয়েছে",
        description: "সাথী মসজিদে যোগ করা হয়েছে",
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

  const handleSubmit = (data: z.infer<typeof editMosqueSchema>) => {
    updateMosqueMutation.mutate(data);
  };

  const handleFiveTasksSubmit = (data: z.infer<typeof fiveTasksSchema>) => {
    updateFiveTasksMutation.mutate(data);
  };

  if (mosqueLoading || !user) {
    return (
      <DashboardLayout
        userName={user?.name || ""}
        userId={user?.id || ""}
        userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
        activeView="mosques"
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

  if (!mosque) {
    return (
      <DashboardLayout
        userName={user?.name || ""}
        userId={user?.id || ""}
        userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
        activeView="mosques"
        onViewChange={handleViewChange}
        onLogout={logout}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">মসজিদ পাওয়া যায়নি</h2>
            <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-to-dashboard">
              ড্যাশবোর্ডে ফিরে যান
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fiveTasksItems = [
    { 
      key: 'dailyMashwara', 
      label: 'দৈনিক মাশওয়ারা', 
      icon: Users, 
      active: mosque.dailyMashwara,
      time: mosque.mashwaraTime,
      timeLabel: 'সময়'
    },
    { 
      key: 'dailyTalim', 
      label: 'দৈনিক তালিম', 
      icon: BookOpen, 
      active: mosque.dailyTalim,
      time: mosque.talimTime,
      timeLabel: 'সময়'
    },
    { 
      key: 'dailyDawah', 
      label: 'দৈনিক দাওয়াত/মেহনত', 
      icon: Heart, 
      active: mosque.dailyDawah,
      time: mosque.dawahTime,
      timeLabel: 'সময়'
    },
    { 
      key: 'weeklyGasht', 
      label: 'সাপ্তাহিক গাশত', 
      icon: Footprints, 
      active: mosque.weeklyGasht,
      time: mosque.gashtDay ? dayNamesBn[mosque.gashtDay] : null,
      timeLabel: 'দিন'
    },
    { 
      key: 'monthlyThreeDays', 
      label: 'মাসিক ৩ দিন', 
      icon: CalendarDays, 
      active: mosque.monthlyThreeDays,
      time: mosque.threeDaysSchedule,
      timeLabel: 'সময়সূচী'
    },
  ];

  return (
    <DashboardLayout
      userName={user?.name || ""}
      userId={user?.id || ""}
      userRole={user?.role as "super_admin" | "manager" | "member" || "member"}
      activeView="mosques"
      onViewChange={handleViewChange}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={safeGoBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            পেছনে যান
          </Button>
          {canManage && (
            <Button onClick={openEditDialog} data-testid="button-edit-mosque">
              <Edit className="w-4 h-4 mr-2" />
              সম্পাদনা করুন
            </Button>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary bg-opacity-10 text-primary">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2" data-testid="text-mosque-name">{mosque.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {thanaName && <Badge variant="secondary" data-testid="badge-thana">{thanaName}</Badge>}
                  {unionName && <Badge variant="outline" data-testid="badge-union">{unionName}</Badge>}
                  {halqaName && <Badge variant="outline" data-testid="badge-halqa">{halqaName}</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">ঠিকানা ও যোগাযোগ</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <span data-testid="text-address">{mosque.address}</span>
                  </div>
                  {mosque.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-phone">মসজিদ: {mosque.phone}</span>
                    </div>
                  )}
                  {mosque.imamPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-imam-phone">ইমাম: {mosque.imamPhone}</span>
                    </div>
                  )}
                  {mosque.muazzinPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span data-testid="text-muazzin-phone">মুয়াজ্জিন: {mosque.muazzinPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">পরিসংখ্যান</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span data-testid="text-members-count">{members.length} জন সাথী</span>
                  </div>
                </div>
              </div>
            </div>

            {mosque.createdAt && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>যোগ করা হয়েছে: {new Date(mosque.createdAt).toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">পাঁচ কাজ</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mosque.fiveTasksActive ? (
                      <span className="text-green-600 dark:text-green-400">
                        চালু আছে ({toBengaliNumber(activeTasksCount)}/৫)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">চালু নেই</span>
                    )}
                  </p>
                </div>
              </div>
              {canManage && (
                <Button variant="outline" onClick={openFiveTasksEditDialog} data-testid="button-edit-five-tasks">
                  <Edit className="w-4 h-4 mr-2" />
                  সম্পাদনা
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fiveTasksItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={item.key}
                    className={`p-4 rounded-lg border ${
                      item.active 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                        : 'bg-muted/30 border-muted'
                    }`}
                    data-testid={`five-task-${item.key}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        item.active 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.label}</span>
                          {item.active ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        {item.active && item.time && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{item.timeLabel}: {item.time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              এই মসজিদের সাথীগণ ({members.length})
            </h2>
            {canManage && (
              <Button 
                onClick={() => setIsAddMemberOpen(true)}
                size="sm"
                data-testid="button-add-member-from-mosque"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                সাথী যোগ করুন
              </Button>
            )}
          </div>

          {membersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                এই মসজিদে কোনো সাথী নেই
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  id={member.id}
                  name={member.name}
                  phone={member.phone}
                  thana={thanaName}
                  union={unionName}
                  activities={member.tabligActivities || []}
                  onView={() => setLocation(`/member/${member.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>মসজিদের তথ্য সম্পাদনা</DialogTitle>
            <DialogDescription>মসজিদের তথ্য আপডেট করুন</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>মসজিদের নাম</FormLabel>
                    <FormControl>
                      <Input placeholder="মসজিদের নাম" {...field} data-testid="input-edit-mosque-name" />
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
                    <FormLabel>ঠিকানা</FormLabel>
                    <FormControl>
                      <Input placeholder="মসজিদের ঠিকানা" {...field} data-testid="input-edit-mosque-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="thanaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>থানা</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-mosque-thana">
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
                          <SelectTrigger data-testid="select-edit-mosque-union">
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

              <FormField
                control={form.control}
                name="halqaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>হালকা (ঐচ্ছিক)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-mosque-halqa">
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

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>মসজিদের ফোন (ঐচ্ছিক)</FormLabel>
                      <FormControl>
                        <Input placeholder="01XXXXXXXXX" {...field} data-testid="input-edit-mosque-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imamPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ইমামের ফোন (ঐচ্ছিক)</FormLabel>
                      <FormControl>
                        <Input placeholder="01XXXXXXXXX" {...field} data-testid="input-edit-imam-phone" />
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
                      <FormLabel>মুয়াজ্জিনের ফোন (ঐচ্ছিক)</FormLabel>
                      <FormControl>
                        <Input placeholder="01XXXXXXXXX" {...field} data-testid="input-edit-muazzin-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-mosque">
                  বাতিল
                </Button>
                <Button type="submit" disabled={updateMosqueMutation.isPending} data-testid="button-save-mosque">
                  {updateMosqueMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFiveTasksEditOpen} onOpenChange={setIsFiveTasksEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>পাঁচ কাজ সম্পাদনা</DialogTitle>
            <DialogDescription>মসজিদের পাঁচ কাজের তথ্য আপডেট করুন</DialogDescription>
          </DialogHeader>
          <Form {...fiveTasksForm}>
            <form onSubmit={fiveTasksForm.handleSubmit(handleFiveTasksSubmit)} className="space-y-6">
              <FormField
                control={fiveTasksForm.control}
                name="fiveTasksActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">পাঁচ কাজ চালু</FormLabel>
                      <p className="text-sm text-muted-foreground">এই মসজিদে পাঁচ কাজ চালু আছে কিনা</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-five-tasks-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h4 className="font-medium border-b pb-2">কাজসমূহ</h4>
                
                {!fiveTasksActive && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    পাঁচ কাজ চালু করুন তাহলে সময়সূচী সেট করতে পারবেন
                  </p>
                )}
                
                {/* পাঁচ কাজ চালু থাকলে অন্তত একটা কাজ সিলেক্ট করতে হবে */}
                {fiveTasksActive && !hasAtLeastOneTaskInDetails && (
                  <p className="text-sm text-destructive">অন্তত একটি কাজ সিলেক্ট করুন</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={fiveTasksForm.control}
                    name="dailyMashwara"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="font-normal">দৈনিক মাশওয়ারা</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!fiveTasksActive} data-testid="switch-daily-mashwara" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fiveTasksForm.control}
                    name="mashwaraTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>মাশওয়ারার সময়</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: ফজরের পর" {...field} disabled={!fiveTasksActive || !dailyMashwaraWatch} data-testid="input-mashwara-time" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={fiveTasksForm.control}
                    name="dailyTalim"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="font-normal">দৈনিক তালিম</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!fiveTasksActive} data-testid="switch-daily-talim" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fiveTasksForm.control}
                    name="talimTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>তালিমের সময়</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: এশার পর" {...field} disabled={!fiveTasksActive || !dailyTalimWatch} data-testid="input-talim-time" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={fiveTasksForm.control}
                    name="dailyDawah"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="font-normal">দৈনিক দাওয়াত/মেহনত</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!fiveTasksActive} data-testid="switch-daily-dawah" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fiveTasksForm.control}
                    name="dawahTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>দাওয়াতের সময়</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: আসরের পর" {...field} disabled={!fiveTasksActive || !dailyDawahWatch} data-testid="input-dawah-time" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={fiveTasksForm.control}
                    name="weeklyGasht"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="font-normal">সাপ্তাহিক গাশত</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!fiveTasksActive} data-testid="switch-weekly-gasht" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fiveTasksForm.control}
                    name="gashtDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>গাশতের দিন</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={!fiveTasksActive || !weeklyGashtWatch}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gasht-day">
                              <SelectValue placeholder="দিন নির্বাচন করুন" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="saturday">শনিবার</SelectItem>
                            <SelectItem value="sunday">রবিবার</SelectItem>
                            <SelectItem value="monday">সোমবার</SelectItem>
                            <SelectItem value="tuesday">মঙ্গলবার</SelectItem>
                            <SelectItem value="wednesday">বুধবার</SelectItem>
                            <SelectItem value="thursday">বৃহস্পতিবার</SelectItem>
                            <SelectItem value="friday">শুক্রবার</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={fiveTasksForm.control}
                    name="monthlyThreeDays"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <FormLabel className="font-normal">মাসিক ৩ দিন</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!fiveTasksActive} data-testid="switch-monthly-three-days" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fiveTasksForm.control}
                    name="threeDaysSchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>৩ দিনের সময়সূচী</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: প্রতি মাসের ১ম সপ্তাহ" {...field} disabled={!fiveTasksActive || !monthlyThreeDaysWatch} data-testid="input-three-days-schedule" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFiveTasksEditOpen(false)} data-testid="button-cancel-five-tasks">
                  বাতিল
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateFiveTasksMutation.isPending || (fiveTasksActive && !hasAtLeastOneTaskInDetails)} 
                  data-testid="button-save-five-tasks"
                >
                  {updateFiveTasksMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog - Selection based like halqa */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>মসজিদে সাথী যোগ করুন</DialogTitle>
            <DialogDescription>এই মসজিদে সাথী যোগ করতে নিচের তালিকা থেকে নির্বাচন করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>কোনো নতুন সাথী পাওয়া যায়নি</p>
                <p className="text-sm mt-2">এই এলাকায় সব সাথী ইতিমধ্যে কোনো মসজিদে যুক্ত আছে</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableMembers.map((member) => (
                  <Button
                    key={member.id}
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      addMemberToMosqueMutation.mutate(member.id);
                    }}
                    disabled={addMemberToMosqueMutation.isPending}
                    data-testid={`button-add-member-${member.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
