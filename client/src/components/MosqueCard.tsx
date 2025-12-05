import { Building2, MapPin, Phone, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "./GlassCard";
import { Badge } from "@/components/ui/badge";

interface MosqueCardProps {
  id: string;
  name: string;
  thana: string;
  union: string;
  address: string;
  phone?: string;
  membersCount: number;
  fiveTasksActive?: boolean;
  dailyMashwara?: boolean;
  dailyTalim?: boolean;
  dailyDawah?: boolean;
  weeklyGasht?: boolean;
  monthlyThreeDays?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
};

export default function MosqueCard({
  id,
  name,
  thana,
  union,
  address,
  phone,
  membersCount,
  fiveTasksActive,
  dailyMashwara,
  dailyTalim,
  dailyDawah,
  weeklyGasht,
  monthlyThreeDays,
  onEdit,
  onDelete,
  onView,
}: MosqueCardProps) {
  const activeTasksCount = [dailyMashwara, dailyTalim, dailyDawah, weeklyGasht, monthlyThreeDays].filter(Boolean).length;
  return (
    <GlassCard className="hover-elevate transition-all" data-testid={`mosque-card-${id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary bg-opacity-10 text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid="mosque-name">{name}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" data-testid="mosque-thana">{thana}</Badge>
              <Badge variant="outline" data-testid="mosque-union">{union}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span data-testid="mosque-address">{address}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span data-testid="mosque-phone">{phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span data-testid="mosque-members">{membersCount} জন সাথী</span>
        </div>
      </div>

      {/* পাঁচ কাজের স্ট্যাটাস */}
      <div className="mb-4 pt-3 border-t">
        <div className="flex items-center gap-2 mb-2">
          {fiveTasksActive ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              পাঁচ কাজ চালু ({toBengaliNumber(activeTasksCount)}/৫)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <XCircle className="w-3 h-3 mr-1" />
              পাঁচ কাজ চালু নেই
            </Badge>
          )}
        </div>
        {fiveTasksActive && activeTasksCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {dailyMashwara && <Badge variant="secondary" className="text-xs">মাশওয়ারা</Badge>}
            {dailyTalim && <Badge variant="secondary" className="text-xs">তা'লিম</Badge>}
            {dailyDawah && <Badge variant="secondary" className="text-xs">মেহনত</Badge>}
            {weeklyGasht && <Badge variant="secondary" className="text-xs">গাশত</Badge>}
            {monthlyThreeDays && <Badge variant="secondary" className="text-xs">৩ দিন</Badge>}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onView}
          data-testid={`button-view-${id}`}
        >
          বিস্তারিত
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          data-testid={`button-edit-${id}`}
        >
          সম্পাদনা
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          data-testid={`button-delete-${id}`}
        >
          মুছুন
        </Button>
      </div>
    </GlassCard>
  );
}
