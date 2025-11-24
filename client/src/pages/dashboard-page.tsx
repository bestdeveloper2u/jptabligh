import { useState } from "react";
import { Users, Building2, MapPin, Calendar, Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import MemberCard from "@/components/MemberCard";
import MosqueCard from "@/components/MosqueCard";
import HalqaCard from "@/components/HalqaCard";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [thana, setThana] = useState("all");
  const [union, setUnion] = useState("all");

  const members = [
    {
      id: "1",
      name: "মোহাম্মদ আব্দুল্লাহ",
      phone: "০১৭১২৩৪৫৬৭৮",
      thana: "জামালপুর সদর",
      union: "নরুন্দী",
      mosque: "বাইতুল আমান মসজিদ",
      activities: ["tin-chilla", "ek-chilla", "sat-din"],
    },
    {
      id: "2",
      name: "আহমদ হাসান",
      phone: "০১৮১২৩৪৫৬৭৮",
      thana: "মেলান্দহ",
      union: "মেলান্দহ সদর",
      mosque: "কেন্দ্রীয় জামে মসজিদ",
      activities: ["ek-chilla", "tin-din"],
    },
    {
      id: "3",
      name: "রফিকুল ইসলাম",
      phone: "০১৯১২৩৪৫৬৭৮",
      thana: "ইসলামপুর",
      union: "চিকাজানি",
      activities: ["bidesh-sofor", "tin-chilla"],
    },
  ];

  const mosques = [
    {
      id: "1",
      name: "বাইতুল আমান জামে মসজিদ",
      thana: "জামালপুর সদর",
      union: "নরুন্দী",
      address: "সদর রোড, জামালপুর",
      phone: "০১৭১২৩৪৫৬৭৮",
      membersCount: 45,
    },
    {
      id: "2",
      name: "কেন্দ্রীয় জামে মসজিদ",
      thana: "মেলান্দহ",
      union: "মেলান্দহ সদর",
      address: "মেলান্দহ বাজার",
      membersCount: 32,
    },
  ];

  const halqas = [
    {
      id: "1",
      name: "সদর হালকা - ১",
      thana: "জামালপুর সদর",
      union: "নরুন্দী",
      membersCount: 156,
      createdDate: "১৫ জানুয়ারি, ২০২৪",
    },
    {
      id: "2",
      name: "মেলান্দহ হালকা - ২",
      thana: "মেলান্দহ",
      union: "মেলান্দহ সদর",
      membersCount: 98,
      createdDate: "২০ ফেব্রুয়ারি, ২০২৪",
    },
  ];

  return (
    <DashboardLayout
      userName="মোহাম্মদ আব্দুল্লাহ"
      userRole="super_admin"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">ড্যাশবোর্ড</h2>
            <p className="text-muted-foreground">জামালপুর জেলার তাবলীগ কার্যক্রমের সংক্ষিপ্ত বিবরণ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="মোট সাথী"
            value="১,২৫৪"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            variant="primary"
          />
          <StatsCard
            title="মসজিদ"
            value="৮৯"
            icon={Building2}
            trend={{ value: 5, isPositive: true }}
            variant="secondary"
          />
          <StatsCard
            title="হালকা"
            value="২৩"
            icon={MapPin}
            variant="accent"
          />
          <StatsCard
            title="এই মাসে তাবলীগ"
            value="৩৪৫"
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
            variant="primary"
          />
        </div>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="members" data-testid="tab-members">সাথীগণ</TabsTrigger>
            <TabsTrigger value="mosques" data-testid="tab-mosques">মসজিদ</TabsTrigger>
            <TabsTrigger value="halqa" data-testid="tab-halqa">হালকা</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">সাথীদের তালিকা</h3>
              <Button data-testid="button-add-member">
                <Plus className="w-4 h-4 mr-2" />
                নতুন সাথী যোগ করুন
              </Button>
            </div>

            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              thanaValue={thana}
              onThanaChange={setThana}
              unionValue={union}
              onUnionChange={setUnion}
            />

            <div className="grid md:grid-cols-2 gap-4">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  {...member}
                  onView={() => console.log("View:", member.id)}
                  onEdit={() => console.log("Edit:", member.id)}
                  onDelete={() => console.log("Delete:", member.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mosques" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">মসজিদের তালিকা</h3>
              <Button data-testid="button-add-mosque">
                <Plus className="w-4 h-4 mr-2" />
                নতুন মসজিদ যোগ করুন
              </Button>
            </div>

            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              thanaValue={thana}
              onThanaChange={setThana}
              unionValue={union}
              onUnionChange={setUnion}
            />

            <div className="grid md:grid-cols-2 gap-4">
              {mosques.map((mosque) => (
                <MosqueCard
                  key={mosque.id}
                  {...mosque}
                  onView={() => console.log("View:", mosque.id)}
                  onEdit={() => console.log("Edit:", mosque.id)}
                  onDelete={() => console.log("Delete:", mosque.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="halqa" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">হালকার তালিকা</h3>
              <Button data-testid="button-add-halqa">
                <Plus className="w-4 h-4 mr-2" />
                নতুন হালকা যোগ করুন
              </Button>
            </div>

            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              thanaValue={thana}
              onThanaChange={setThana}
              unionValue={union}
              onUnionChange={setUnion}
            />

            <div className="grid md:grid-cols-2 gap-4">
              {halqas.map((halqa) => (
                <HalqaCard
                  key={halqa.id}
                  {...halqa}
                  onView={() => console.log("View:", halqa.id)}
                  onEdit={() => console.log("Edit:", halqa.id)}
                  onDelete={() => console.log("Delete:", halqa.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
