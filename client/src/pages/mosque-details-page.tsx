import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, MapPin, Building2, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MemberCard from "@/components/MemberCard";
import type { Mosque, Thana, Union, Halqa, User } from "@shared/schema";

export default function MosqueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

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
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          পেছনে যান
        </Button>

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
    </div>
  );
}
