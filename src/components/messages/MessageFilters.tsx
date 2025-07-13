
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

type Filters = {
  subject: string;
  isHandled: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
};

type MessageFiltersProps = {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
};

const SUBJECT_OPTIONS = [
  { value: "all", label: "כל הנושאים" },
  { value: "לבטל הזמנה", label: "לבטל הזמנה" },
  { value: "לדחות", label: "לדחות" },
  { value: "שינוי מוצרים", label: "שינוי מוצרים" },
  { value: "הנחות", label: "הנחות" },
  { value: "אספקה", label: "אספקה" },
  { value: "הזמנה על לקוח אחר", label: "הזמנה על לקוח אחר" },
  { value: "מחסן", label: "מחסן" }
];

export const MessageFilters: React.FC<MessageFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const hasActiveFilters = Object.values(filters).some(value => value !== "" && value !== "all");

  const clearFilters = () => {
    onFiltersChange({
      subject: "",
      isHandled: "",
      dateFrom: "",
      dateTo: "",
      searchTerm: ""
    });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">סינון הודעות</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-gray-600"
          >
            <X className="w-4 h-4 mr-1" />
            נקה סינונים
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Term */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חיפוש בתוכן ההודעות..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Subject Filter */}
        <Select 
          value={filters.subject || "all"} 
          onValueChange={(value) => onFiltersChange({ ...filters, subject: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="נושא ההודעה" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Handled Status Filter */}
        <Select 
          value={filters.isHandled || "all"} 
          onValueChange={(value) => onFiltersChange({ ...filters, isHandled: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="מצב טיפול" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל ההודעות</SelectItem>
            <SelectItem value="false">לא טופל</SelectItem>
            <SelectItem value="true">טופל</SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          placeholder="מתאריך"
          value={filters.dateFrom}
          onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
        />

        {/* Date To */}
        <Input
          type="date"
          placeholder="עד תאריך"
          value={filters.dateTo}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
        />
      </div>
    </div>
  );
};
