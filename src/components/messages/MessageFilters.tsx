
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const SUBJECT_OPTIONS = [
  { value: "לבטל הזמנה", label: "לבטל הזמנה" },
  { value: "לדחות", label: "לדחות" },
  { value: "שינוי מוצרים", label: "שינוי מוצרים" },
  { value: "הנחות", label: "הנחות" },
  { value: "אספקה", label: "אספקה" },
  { value: "לקוח אחר", label: "לקוח אחר" },
  { value: "קו הפצה", label: "קו הפצה" }
] as const;

// Add warehouse option only for admin
const getSubjectOptions = (isAdmin: boolean) => {
  const options = [...SUBJECT_OPTIONS];
  if (isAdmin) {
    options.push({ value: "מחסן", label: "מחסן" });
  }
  return options;
};

interface MessageFiltersProps {
  filters: {
    subject: string;
    isHandled: string;
    dateFrom: string;
    dateTo: string;
    searchTerm: string;
  };
  onFiltersChange: (filters: any) => void;
  isAdmin?: boolean;
}

export const MessageFilters: React.FC<MessageFiltersProps> = ({ 
  filters, 
  onFiltersChange,
  isAdmin = false 
}) => {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      subject: "",
      isHandled: "",
      dateFrom: "",
      dateTo: "",
      searchTerm: ""
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">סינון הודעות</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            נקה סינונים
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Subject Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">נושא ההודעה</label>
          <Select value={filters.subject} onValueChange={(value) => updateFilter("subject", value)}>
            <SelectTrigger>
              <SelectValue placeholder="כל הנושאים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">כל הנושאים</SelectItem>
              {getSubjectOptions(isAdmin).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">סטטוס טיפול</label>
          <Select value={filters.isHandled} onValueChange={(value) => updateFilter("isHandled", value)}>
            <SelectTrigger>
              <SelectValue placeholder="כל הסטטוסים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">כל הסטטוסים</SelectItem>
              <SelectItem value="false">לא טופל</SelectItem>
              <SelectItem value="true">טופל</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">חיפוש בתוכן</label>
          <Input
            placeholder="חפש בתוכן ההודעה או לקוח נכון..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
          />
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <label className="text-sm font-medium">מתאריך</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(new Date(filters.dateFrom), "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={(date) => updateFilter("dateFrom", date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
                locale={he}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <label className="text-sm font-medium">עד תאריך</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(new Date(filters.dateTo), "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={(date) => updateFilter("dateTo", date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
                locale={he}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
