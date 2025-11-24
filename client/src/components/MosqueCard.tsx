import { Building2, MapPin, Phone, Users } from "lucide-react";
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
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export default function MosqueCard({
  id,
  name,
  thana,
  union,
  address,
  phone,
  membersCount,
  onEdit,
  onDelete,
  onView,
}: MosqueCardProps) {
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
