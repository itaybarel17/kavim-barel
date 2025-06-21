
import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchType = "orders" | "returns" | "schedules";

type SearchResult = {
  id: number;
  type: SearchType;
  title: string;
  subtitle: string;
  details: string;
};

type SelectedItem = {
  type: SearchType;
  id: number;
  title: string;
  subtitle: string;
};

type SearchComponentProps = {
  onSelect: (item: SelectedItem) => void;
  selectedItem: SelectedItem | null;
  onClear: () => void;
};

export const SearchComponent: React.FC<SearchComponentProps> = ({
  onSelect,
  selectedItem,
  onClear
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("orders");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search query with autocomplete
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['autocomplete-search', searchType, searchTerm],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!searchTerm || searchTerm.length < 1) return [];
      
      const results: SearchResult[] = [];
      
      if (searchType === "orders") {
        const { data, error } = await supabase
          .from('mainorder')
          .select('ordernumber, customername, customernumber, orderdate')
          .or(`customername.ilike.%${searchTerm}%,customernumber.ilike.%${searchTerm}%,ordernumber.eq.${parseInt(searchTerm) || 0}`)
          .limit(8);
        
        if (error) throw error;
        
        data?.forEach(item => {
          results.push({
            id: item.ordernumber,
            type: "orders",
            title: `הזמנה #${item.ordernumber}`,
            subtitle: `${item.customername} (${item.customernumber})`,
            details: item.orderdate || ""
          });
        });
      } else if (searchType === "returns") {
        const { data, error } = await supabase
          .from('mainreturns')
          .select('returnnumber, customername, customernumber, returndate')
          .or(`customername.ilike.%${searchTerm}%,customernumber.ilike.%${searchTerm}%,returnnumber.eq.${parseInt(searchTerm) || 0}`)
          .limit(8);
        
        if (error) throw error;
        
        data?.forEach(item => {
          results.push({
            id: item.returnnumber,
            type: "returns",
            title: `החזרה #${item.returnnumber}`,
            subtitle: `${item.customername} (${item.customernumber})`,
            details: item.returndate || ""
          });
        });
      } else if (searchType === "schedules") {
        // Don't show schedules for agent 99
        if (user?.agentnumber === "99") return [];
        
        const { data, error } = await supabase
          .from('distribution_schedule')
          .select('schedule_id, distribution_date, nahag_name, destinations, dis_number')
          .or(`schedule_id.eq.${parseInt(searchTerm) || 0},nahag_name.ilike.%${searchTerm}%,dis_number.eq.${parseInt(searchTerm) || 0}`)
          .order('distribution_date', { ascending: false })
          .limit(8);
        
        if (error) throw error;
        
        data?.forEach(item => {
          results.push({
            id: item.schedule_id,
            type: "schedules",
            title: `קו הפצה #${item.schedule_id}${item.dis_number ? ` (${item.dis_number})` : ''}`,
            subtitle: `נהג: ${item.nahag_name || 'לא הוקצה'}`,
            details: `תאריך: ${item.distribution_date || 'לא נקבע'} | יעדים: ${item.destinations || 0}`
          });
        });
      }
      
      return results;
    },
    enabled: searchTerm.length >= 1
  });

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(value.length >= 1);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect({
      type: result.type,
      id: result.id,
      title: result.title,
      subtitle: result.subtitle
    });
    setSearchTerm("");
    setIsOpen(false);
  };

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case "orders": return "חפש הזמנות לפי מספר, שם לקוח או מספר לקוח...";
      case "returns": return "חפש החזרות לפי מספר, שם לקוח או מספר לקוח...";
      case "schedules": return "חפש קווי הפצה לפי מספר, נהג או מספר הפצה...";
      default: return "חפש...";
    }
  };

  const getTypeLabel = () => {
    switch (searchType) {
      case "orders": return "הזמנות";
      case "returns": return "החזרות";
      case "schedules": return "קווי הפצה";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={searchType} onValueChange={(value: SearchType) => {
          setSearchType(value);
          setSearchTerm("");
          setIsOpen(false);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orders">הזמנות</SelectItem>
            <SelectItem value="returns">החזרות</SelectItem>
            {user?.agentnumber !== "99" && (
              <SelectItem value="schedules">קווי הפצה</SelectItem>
            )}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1" ref={dropdownRef}>
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            placeholder={getSearchPlaceholder()}
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            className="pl-10"
            onFocus={() => setIsOpen(searchTerm.length >= 1)}
          />
          
          {isOpen && (searchResults?.length > 0 || isLoading) && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
              <CardContent className="p-2">
                {isLoading ? (
                  <div className="p-2 text-center text-gray-500">חיפוש...</div>
                ) : (
                  <div className="space-y-1">
                    {searchResults?.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSelect(result)}
                      >
                        <div className="font-semibold text-sm">{result.title}</div>
                        <div className="text-sm text-gray-600">{result.subtitle}</div>
                        <div className="text-xs text-gray-500">{result.details}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedItem && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-blue-900">{selectedItem.title}</div>
                <div className="text-sm text-blue-700">{selectedItem.subtitle}</div>
                <div className="text-xs text-blue-600 mt-1">
                  נבחר לצירוף להודעה
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
