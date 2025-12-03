import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Phone, MapPin, Building2, Users, Calendar, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MemberCard from "@/components/MemberCard";
import type { Mosque, Thana, Union, Halqa, User } from "@shared/schema";

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

export default function MosqueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const canManage = user?.role === "super_admin" || user?.role === "manager";

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

  const mosque = mosqueData?.mosque;
  const thanas = thanasData?.thanas || [];
  const unions = unionsData?.unions || [];
  const halqas = halqasData?.halqas || [];
  const members = membersData?.members || [];

  const thanaName = thanas.find(t => t.id === mosque?.thanaId)?.nameBn || "";
  const unionName = unions.find(u => u.id === mosque?.unionId)?.nameBn || "";
  const halqaName = halqas.find(h => h.id === mosque?.halqaId)?.name || "";

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

  const selectedThanaId = form.watch("thanaId");
  const selectedUnionId = form.watch("unionId");

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

  const handleSubmit = (data: z.infer<typeof editMosqueSchema>) => {
    updateMosqueMutation.mutate(data);
  };

  if (mosqueLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!mosque) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">মসজিদ পাওয়া যায়নি</h2>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-to-dashboard">
            ড্যাশবোর্ডে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            এই মসজিদের সাথীগণ ({members.length})
          </h2>

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
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
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
    </div>
  );
}
