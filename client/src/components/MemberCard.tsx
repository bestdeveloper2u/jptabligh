import { User, Phone, MapPin, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "./GlassCard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MemberCardProps {
  id: string;
  name: string;
  phone: string;
  thana: string;
  union: string;
  mosque?: string;
  activities: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

const activityLabels: Record<string, string> = {
  "tin-chilla": "৩ চিল্লা",
  "ek-chilla": "১ চিল্লা",
  "bidesh-sofor": "বিদেশ সফর",
  "tin-din": "৩ দিন",
  "sat-din": "৭ দিন",
  "dos-din": "১০ দিন",
};

export default function MemberCard({
  id,
  name,
  phone,
  thana,
  union,
  mosque,
  activities,
  onEdit,
  onDelete,
  onView,
}: MemberCardProps) {
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <GlassCard className="hover-elevate transition-all" data-testid={`member-card-${id}`}>
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1" data-testid="member-name">{name}</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs" data-testid="member-thana">{thana}</Badge>
            <Badge variant="outline" className="text-xs" data-testid="member-union">{union}</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span data-testid="member-phone">{phone}</span>
        </div>
        {mosque && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span data-testid="member-mosque">{mosque}</span>
          </div>
        )}
      </div>

      {activities.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">তাবলীগ কার্যক্রম:</p>
          <div className="flex flex-wrap gap-1">
            {activities.map((activity) => (
              <Badge key={activity} variant="outline" className="text-xs" data-testid={`activity-${activity}`}>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {activityLabels[activity] || activity}
              </Badge>
            ))}
          </div>
        </div>
      )}

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
