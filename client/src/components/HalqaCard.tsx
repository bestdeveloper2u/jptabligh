import { MapPin, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "./GlassCard";
import { Badge } from "@/components/ui/badge";

interface HalqaCardProps {
  id: string;
  name: string;
  thana: string;
  union: string;
  membersCount: number;
  createdDate: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export default function HalqaCard({
  id,
  name,
  thana,
  union,
  membersCount,
  createdDate,
  onEdit,
  onDelete,
  onView,
}: HalqaCardProps) {
  return (
    <GlassCard className="hover-elevate transition-all" data-testid={`halqa-card-${id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-accent bg-opacity-10 text-accent">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid="halqa-name">{name}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" data-testid="halqa-thana">{thana}</Badge>
              <Badge variant="outline" data-testid="halqa-union">{union}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span data-testid="halqa-members">{membersCount} জন সদস্য</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span data-testid="halqa-date">তৈরি: {createdDate}</span>
        </div>
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
