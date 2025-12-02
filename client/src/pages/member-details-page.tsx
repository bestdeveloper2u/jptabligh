import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Users, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Thana, Union, Mosque, Halqa } from "@shared/schema";

const activityLabels: Record<string, string> = {
  "tin-chilla": "তিন চিল্লা (৩ মাস)",
  "ek-chilla": "এক চিল্লা (৪০ দিন)",
  "bidesh-sofor": "বিদেশ সফর",
  "tin-din": "তিন দিনের সাথী",
  "sat-din": "সাত দিনের সাথী",
  "dos-din": "১০ দিনের সাথী",
};

export default function MemberDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

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

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">সাথী পাওয়া যায়নি</h2>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-to-dashboard">
            ড্যাশবোর্ডে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  const initials = member.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const activities = member.tabligActivities || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          পেছনে যান
        </Button>

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

            {activities.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">তাবলীগ কার্যক্রম</h3>
                <div className="flex flex-wrap gap-2">
                  {activities.map((activity) => (
                    <Badge key={activity} variant="outline" className="text-sm py-1" data-testid={`badge-activity-${activity}`}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      {activityLabels[activity] || activity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

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
    </div>
  );
}
