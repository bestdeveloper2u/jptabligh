import StatsCard from '../StatsCard';
import { Users, Building2, MapPin, Calendar } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="gradient-bg min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
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
      </div>
    </div>
  );
}
