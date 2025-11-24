import DashboardLayout from '../DashboardLayout';
import StatsCard from '../StatsCard';
import MemberCard from '../MemberCard';
import { Users, Building2, MapPin, Calendar } from "lucide-react";

export default function DashboardLayoutExample() {
  return (
    <DashboardLayout
      userName="মোহাম্মদ আব্দুল্লাহ"
      userRole="super_admin"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">ড্যাশবোর্ড</h2>
          <p className="text-muted-foreground">জামালপুর জেলার তাবলীগ কার্যক্রমের সংক্ষিপ্ত বিবরণ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div>
          <h3 className="text-xl font-bold mb-4">সাম্প্রতিক সাথী</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <MemberCard
              id="1"
              name="মোহাম্মদ আব্দুল্লাহ"
              phone="০১৭১২৩৪৫৬৭৮"
              thana="জামালপুর সদর"
              union="নরুন্দী"
              mosque="বাইতুল আমান মসজিদ"
              activities={["tin-chilla", "ek-chilla"]}
              onView={() => console.log("View")}
              onEdit={() => console.log("Edit")}
              onDelete={() => console.log("Delete")}
            />
            <MemberCard
              id="2"
              name="আহমদ হাসান"
              phone="০১৮১২৩৪৫৬৭৮"
              thana="মেলান্দহ"
              union="মেলান্দহ সদর"
              activities={["sat-din"]}
              onView={() => console.log("View")}
              onEdit={() => console.log("Edit")}
              onDelete={() => console.log("Delete")}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
