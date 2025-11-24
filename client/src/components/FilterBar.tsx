import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlassCard from "./GlassCard";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  thanaValue: string;
  onThanaChange: (value: string) => void;
  unionValue: string;
  onUnionChange: (value: string) => void;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  thanaValue,
  onThanaChange,
  unionValue,
  onUnionChange,
}: FilterBarProps) {
  return (
    <GlassCard className="sticky top-4 z-10">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="নাম বা ফোন নাম্বার দিয়ে খুঁজুন..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 glass"
            data-testid="input-search"
          />
        </div>

        <Select value={thanaValue} onValueChange={onThanaChange}>
          <SelectTrigger className="w-full md:w-48 glass" data-testid="select-filter-thana">
            <SelectValue placeholder="সকল থানা" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল থানা</SelectItem>
            <SelectItem value="sadar">জামালপুর সদর</SelectItem>
            <SelectItem value="melandaha">মেলান্দহ</SelectItem>
            <SelectItem value="islampur">ইসলামপুর</SelectItem>
            <SelectItem value="dewanganj">দেওয়ানগঞ্জ</SelectItem>
            <SelectItem value="madarganj">মাদারগঞ্জ</SelectItem>
            <SelectItem value="sarishabari">সরিষাবাড়ি</SelectItem>
            <SelectItem value="bakshiganj">বকসীগঞ্জ</SelectItem>
          </SelectContent>
        </Select>

        <Select value={unionValue} onValueChange={onUnionChange}>
          <SelectTrigger className="w-full md:w-48 glass" data-testid="select-filter-union">
            <SelectValue placeholder="সকল ইউনিয়ন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল ইউনিয়ন</SelectItem>
            <SelectItem value="union1">ইউনিয়ন ১</SelectItem>
            <SelectItem value="union2">ইউনিয়ন ২</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </GlassCard>
  );
}
