import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Plus, 
  ClipboardList,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Halqa, User as UserType, Takaja, Thana, Union } from "@shared/schema";

const takajaFormSchema = z.object({
  title: z.string().min(1, "শিরোনাম আবশ্যক"),
  description: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueDate: z.string().optional(),
});

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: "কম", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  normal: { label: "সাধারণ", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "বেশি", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "জরুরি", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

const statusLabels: Record<string, { label: string; icon: typeof Clock }> = {
  pending: { label: "অপেক্ষমান", icon: Clock },
  in_progress: { label: "চলমান", icon: AlertCircle },
  completed: { label: "সম্পন্ন", icon: CheckCircle },
};

export default function HalqaDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddTakajaOpen, setIsAddTakajaOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTakaja, setSelectedTakaja] = useState<Takaja | null>(null);

  const form = useForm<z.infer<typeof takajaFormSchema>>({
    resolver: zodResolver(takajaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "normal",
      dueDate: "",
    },
  });

  const { data: halqaData, isLoading: halqaLoading } = useQuery<{ halqa: Halqa }>({
    queryKey: ["/api/halqas", id],
    queryFn: async () => {
      const res = await fetch(`/api/halqas/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch halqa");
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

  const { data: takajasData, isLoading: takajasLoading } = useQuery<{ takajas: Takaja[] }>({
    queryKey: ["/api/takajas", { halqaId: id }],
    queryFn: async () => {
      const res = await fetch(`/api/takajas?halqaId=${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch takajas");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: UserType[] }>({
    queryKey: ["/api/members", { halqaId: id }],
    enabled: !!id,
  });

  const halqaMembers = membersData?.members || [];

  const halqa = halqaData?.halqa;
  const takajas = takajasData?.takajas || [];
  const thanas = thanasData?.thanas || [];
  const unions = unionsData?.unions || [];

  const thanaName = thanas.find(t => t.id === halqa?.thanaId)?.nameBn || "";
  const unionName = unions.find(u => u.id === halqa?.unionId)?.nameBn || "";

  const createTakajaMutation = useMutation({
    mutationFn: async (data: z.infer<typeof takajaFormSchema>) => {
      return apiRequest("POST", "/api/takajas", {
        ...data,
        halqaId: id,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/takajas", { halqaId: id }] });
      setIsAddTakajaOpen(false);
      form.reset();
      toast({ title: "তাকাজা যোগ করা হয়েছে" });
    },
    onError: () => {
      toast({ title: "তাকাজা যোগ করতে ব্যর্থ হয়েছে", variant: "destructive" });
    },
  });

  const assignTakajaMutation = useMutation({
    mutationFn: async ({ takajaId, userId }: { takajaId: string; userId: string | null }) => {
      return apiRequest("POST", `/api/takajas/${takajaId}/assign`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/takajas", { halqaId: id }] });
      setAssignDialogOpen(false);
      setSelectedTakaja(null);
      toast({ title: "তাকাজা এসাইন করা হয়েছে" });
    },
    onError: () => {
      toast({ title: "তাকাজা এসাইন করতে ব্যর্থ হয়েছে", variant: "destructive" });
    },
  });

  const completeTakajaMutation = useMutation({
    mutationFn: async (takajaId: string) => {
      return apiRequest("POST", `/api/takajas/${takajaId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/takajas", { halqaId: id }] });
      toast({ title: "তাকাজা সম্পন্ন হয়েছে" });
    },
    onError: () => {
      toast({ title: "তাকাজা সম্পন্ন করতে ব্যর্থ হয়েছে", variant: "destructive" });
    },
  });

  const deleteTakajaMutation = useMutation({
    mutationFn: async (takajaId: string) => {
      return apiRequest("DELETE", `/api/takajas/${takajaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/takajas", { halqaId: id }] });
      toast({ title: "তাকাজা মুছে ফেলা হয়েছে" });
    },
    onError: () => {
      toast({ title: "তাকাজা মুছতে ব্যর্থ হয়েছে", variant: "destructive" });
    },
  });

  const handleSubmit = (data: z.infer<typeof takajaFormSchema>) => {
    createTakajaMutation.mutate(data);
  };

  const handleAssign = (userId: string | null) => {
    if (selectedTakaja) {
      assignTakajaMutation.mutate({ takajaId: selectedTakaja.id, userId });
    }
  };

  const getMemberName = (userId: string | null) => {
    if (!userId) return "কাউকে এসাইন করা হয়নি";
    const member = membersData?.members?.find((m) => m.id === userId);
    return member?.name || "অজানা";
  };

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  if (halqaLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!halqa) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">হালকা পাওয়া যায়নি</h2>
          <Button onClick={() => setLocation("/dashboard")}>
            ড্যাশবোর্ডে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          ড্যাশবোর্ডে ফিরে যান
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/10 text-accent">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl" data-testid="halqa-title">{halqa.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{thanaName}</Badge>
                    <Badge variant="outline">{unionName}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span className="font-medium">{halqaMembers.length} জন সাথী</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {halqaMembers.slice(0, 6).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  data-testid={`member-item-${member.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
                  </div>
                </div>
              ))}
              {halqaMembers.length > 6 && (
                <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50 text-muted-foreground">
                  +{halqaMembers.length - 6} জন আরো
                </div>
              )}
              {halqaMembers.length === 0 && (
                <p className="text-muted-foreground col-span-3">এই হালকায় কোনো সাথী নেই</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              <h2 className="text-xl font-semibold">তাকাজা সমূহ</h2>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsAddTakajaOpen(true)} data-testid="button-add-takaja">
                <Plus className="w-4 h-4 mr-2" />
                নতুন তাকাজা
              </Button>
            )}
          </div>

          {takajasLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : takajas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>এই হালকায় কোনো তাকাজা নেই</p>
                {isAdmin && (
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    onClick={() => setIsAddTakajaOpen(true)}
                    data-testid="button-add-first-takaja"
                  >
                    প্রথম তাকাজা যোগ করুন
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {takajas.map((takaja) => {
                const StatusIcon = statusLabels[takaja.status]?.icon || Clock;
                const priority = priorityLabels[takaja.priority] || priorityLabels.normal;
                
                return (
                  <Card 
                    key={takaja.id} 
                    className={takaja.status === "completed" ? "opacity-75" : ""}
                    data-testid={`takaja-card-${takaja.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold" data-testid={`takaja-title-${takaja.id}`}>
                              {takaja.title}
                            </h3>
                            <Badge className={priority.color} variant="secondary">
                              {priority.label}
                            </Badge>
                            <Badge 
                              variant={takaja.status === "completed" ? "default" : "outline"}
                              className="gap-1"
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[takaja.status]?.label || takaja.status}
                            </Badge>
                          </div>
                          {takaja.description && (
                            <p className="text-muted-foreground text-sm mb-2">
                              {takaja.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span data-testid={`takaja-assignee-${takaja.id}`}>
                                {getMemberName(takaja.assignedTo)}
                              </span>
                            </div>
                            {takaja.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(takaja.dueDate).toLocaleDateString("bn-BD")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            {takaja.status !== "completed" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTakaja(takaja);
                                    setAssignDialogOpen(true);
                                  }}
                                  data-testid={`button-assign-${takaja.id}`}
                                >
                                  এসাইন করুন
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => completeTakajaMutation.mutate(takaja.id)}
                                  disabled={completeTakajaMutation.isPending}
                                  data-testid={`button-complete-${takaja.id}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTakajaMutation.mutate(takaja.id)}
                              disabled={deleteTakajaMutation.isPending}
                              data-testid={`button-delete-${takaja.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddTakajaOpen} onOpenChange={setIsAddTakajaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নতুন তাকাজা যোগ করুন</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>শিরোনাম</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="তাকাজার শিরোনাম লিখুন" 
                        {...field} 
                        data-testid="input-takaja-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>বিবরণ (ঐচ্ছিক)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="তাকাজার বিবরণ লিখুন" 
                        {...field} 
                        data-testid="input-takaja-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>গুরুত্ব</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-takaja-priority">
                          <SelectValue placeholder="গুরুত্ব নির্বাচন করুন" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">কম</SelectItem>
                        <SelectItem value="normal">সাধারণ</SelectItem>
                        <SelectItem value="high">বেশি</SelectItem>
                        <SelectItem value="urgent">জরুরি</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>শেষ তারিখ (ঐচ্ছিক)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-takaja-dueDate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddTakajaOpen(false)}
                  data-testid="button-cancel-takaja"
                >
                  বাতিল
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTakajaMutation.isPending}
                  data-testid="button-submit-takaja"
                >
                  {createTakajaMutation.isPending ? "যোগ হচ্ছে..." : "তাকাজা যোগ করুন"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>তাকাজা এসাইন করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTakaja && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedTakaja.title}</p>
                {selectedTakaja.description && (
                  <p className="text-sm text-muted-foreground">{selectedTakaja.description}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="font-medium">সাথী নির্বাচন করুন:</p>
              {halqaMembers.length === 0 ? (
                <p className="text-muted-foreground">এই হালকায় কোনো সাথী নেই</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {halqaMembers.map((member) => (
                    <Button
                      key={member.id}
                      variant={selectedTakaja?.assignedTo === member.id ? "default" : "outline"}
                      className="w-full justify-start gap-3"
                      onClick={() => handleAssign(member.id)}
                      disabled={assignTakajaMutation.isPending}
                      data-testid={`button-assign-member-${member.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.phone}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {selectedTakaja?.assignedTo && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAssign(null)}
                disabled={assignTakajaMutation.isPending}
                data-testid="button-unassign"
              >
                এসাইন সরিয়ে দিন
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
