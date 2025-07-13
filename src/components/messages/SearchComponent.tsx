import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export type RelatedItem = {
  type: "orders" | "returns";
  id: number;
  customername: string;
  customernumber: string;
  amount: number;
  date: string;
  agentnumber: string;
};

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
  onSelect: (item: SelectedItem, relatedItems?: RelatedItem[]) => void;
  selectedItem: SelectedItem | null;
  onClear: () => void;
  allowedTypes?: SearchType[];
};

export const SearchComponent: React.FC<SearchComponentProps> = ({
  onSelect,
  selectedItem,
  onClear,
  allowedTypes = ["orders", "returns", "schedules"]
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<SearchType>(allowedTypes[0] || "orders");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.agentnumber === "4";

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

  // Search query with agent-based filtering
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['autocomplete-search', searchType, searchTerm, user?.agentnumber],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!searchTerm || searchTerm.length < 1) return [];
      
      const results: SearchResult[] = [];
      
      if (searchType === "orders") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all orders - both assigned and unassigned that match "waiting" criteria
        const { data: allOrders, error: allOrdersError } = await supabase
          .from('mainorder')
          .select(`
            ordernumber, 
            customername, 
            customernumber, 
            orderdate, 
            agentnumber,
            done_mainorder,
            schedule_id,
            distribution_schedule(
              done_schedule,
              distribution_date
            )
          `)
          .or(`customername.ilike.%${searchTerm}%,customernumber.ilike.%${searchTerm}%,ordernumber.eq.${parseInt(searchTerm) || 0}`)
          .is('ordercancel', null)
          .is('icecream', null)
          .limit(20);
          
        if (allOrdersError) throw allOrdersError;
        
        // Filter based on waiting criteria (same as useWaitingCustomers)
        const waitingOrders = (allOrders || []).filter(order => {
          // Unassigned orders (no schedule_id) are waiting if done_mainorder is null
          if (!order.schedule_id) {
            return !order.done_mainorder;
          }
          
          // Assigned orders waiting criteria
          const schedule = order.distribution_schedule;
          
          // Criteria 1: done_mainorder is NULL
          if (!order.done_mainorder) {
            return true;
          }
          
          // Criteria 2: done_mainorder has timestamp but done_schedule is null and distribution_date is today or later
          if (order.done_mainorder && !schedule?.done_schedule && schedule?.distribution_date) {
            const distributionDate = new Date(schedule.distribution_date);
            distributionDate.setHours(0, 0, 0, 0);
            
            // If distribution date is today or later and not yet distributed, it's still waiting
            if (distributionDate >= today) {
              return true;
            }
          }
          
          return false;
        });
        
        let filteredOrders = waitingOrders;

        // Filter by agent unless admin
        if (!isAdmin && user?.agentnumber) {
          if (user.agentnumber === '99') {
            filteredOrders = filteredOrders.filter(order => order.agentnumber === '99');
          } else {
            filteredOrders = filteredOrders.filter(order => 
              order.agentnumber === user.agentnumber && order.agentnumber !== '99'
            );
          }
        }
        
        // Limit results
        filteredOrders = filteredOrders.slice(0, 8);
        
        filteredOrders.forEach(item => {
          results.push({
            id: item.ordernumber,
            type: "orders",
            title: `הזמנה #${item.ordernumber}`,
            subtitle: `${item.customername} (${item.customernumber})`,
            details: `${item.orderdate || ""} | סוכן: ${item.agentnumber || 'לא זוהה'}`
          });
        });
      } else if (searchType === "returns") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all returns - both assigned and unassigned that match "waiting" criteria
        const { data: allReturns, error: allReturnsError } = await supabase
          .from('mainreturns')
          .select(`
            returnnumber, 
            customername, 
            customernumber, 
            returndate, 
            agentnumber,
            done_return,
            schedule_id,
            distribution_schedule(
              done_schedule,
              distribution_date
            )
          `)
          .or(`customername.ilike.%${searchTerm}%,customernumber.ilike.%${searchTerm}%,returnnumber.eq.${parseInt(searchTerm) || 0}`)
          .is('returncancel', null)
          .is('icecream', null)
          .limit(20);
          
        if (allReturnsError) throw allReturnsError;
        
        // Filter based on waiting criteria (same logic as orders)
        const waitingReturns = (allReturns || []).filter(returnItem => {
          // Unassigned returns (no schedule_id) are waiting if done_return is null
          if (!returnItem.schedule_id) {
            return !returnItem.done_return;
          }
          
          // Assigned returns waiting criteria
          const schedule = returnItem.distribution_schedule;
          
          // Criteria 1: done_return is NULL
          if (!returnItem.done_return) {
            return true;
          }
          
          // Criteria 2: done_return has timestamp but done_schedule is null and distribution_date is today or later
          if (returnItem.done_return && !schedule?.done_schedule && schedule?.distribution_date) {
            const distributionDate = new Date(schedule.distribution_date);
            distributionDate.setHours(0, 0, 0, 0);
            
            // If distribution date is today or later and not yet distributed, it's still waiting
            if (distributionDate >= today) {
              return true;
            }
          }
          
          return false;
        });
        
        let filteredReturns = waitingReturns;

        // Filter by agent unless admin
        if (!isAdmin && user?.agentnumber) {
          if (user.agentnumber === '99') {
            filteredReturns = filteredReturns.filter(returnItem => returnItem.agentnumber === '99');
          } else {
            filteredReturns = filteredReturns.filter(returnItem => 
              returnItem.agentnumber === user.agentnumber && returnItem.agentnumber !== '99'
            );
          }
        }
        
        // Limit results
        filteredReturns = filteredReturns.slice(0, 8);
        
        filteredReturns.forEach(item => {
          results.push({
            id: item.returnnumber,
            type: "returns",
            title: `החזרה #${item.returnnumber}`,
            subtitle: `${item.customername} (${item.customernumber})`,
            details: `${item.returndate || ""} | סוכן: ${item.agentnumber || 'לא זוהה'}`
          });
        });
      } else if (searchType === "schedules") {
        // Don't show schedules for agent 99
        if (user?.agentnumber === "99") return [];
        
        const { data, error } = await supabase
          .from('distribution_schedule')
          .select('schedule_id, distribution_date, nahag_name, destinations, dis_number')
          .or(`schedule_id.eq.${parseInt(searchTerm) || 0},nahag_name.ilike.%${searchTerm}%,dis_number.eq.${parseInt(searchTerm) || 0}`)
          .is('done_schedule', null)
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

  // Function to get related items for orders/returns
  const getRelatedItems = async (selectedItem: SelectedItem): Promise<RelatedItem[]> => {
    if (selectedItem.type === "schedules") return [];
    
    const relatedItems: RelatedItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First, get the selected item details to find customer info
    if (selectedItem.type === "orders") {
      const { data: orderData } = await supabase
        .from('mainorder')
        .select('customername, customernumber, city')
        .eq('ordernumber', selectedItem.id)
        .single();
      
      if (!orderData) return [];

      // Find related orders for same customer/city
      const { data: relatedOrders } = await supabase
        .from('mainorder')
        .select(`
          ordernumber, customername, customernumber, orderdate, agentnumber, totalorder,
          done_mainorder, schedule_id, distribution_schedule(done_schedule, distribution_date)
        `)
        .eq('customername', orderData.customername)
        .eq('city', orderData.city)
        .neq('ordernumber', selectedItem.id)
        .is('ordercancel', null)
        .is('icecream', null);

      // Find related returns for same customer/city  
      const { data: relatedReturns } = await supabase
        .from('mainreturns')
        .select(`
          returnnumber, customername, customernumber, returndate, agentnumber, totalreturn,
          done_return, schedule_id, distribution_schedule(done_schedule, distribution_date)
        `)
        .eq('customername', orderData.customername)
        .eq('city', orderData.city)
        .is('returncancel', null)
        .is('icecream', null);

      // Filter waiting orders (same logic as search)
      const waitingOrders = (relatedOrders || []).filter(order => {
        if (!order.schedule_id) return !order.done_mainorder;
        const schedule = order.distribution_schedule;
        if (!order.done_mainorder) return true;
        if (order.done_mainorder && !schedule?.done_schedule && schedule?.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          return distributionDate >= today;
        }
        return false;
      });

      // Filter waiting returns
      const waitingReturns = (relatedReturns || []).filter(returnItem => {
        if (!returnItem.schedule_id) return !returnItem.done_return;
        const schedule = returnItem.distribution_schedule;
        if (!returnItem.done_return) return true;
        if (returnItem.done_return && !schedule?.done_schedule && schedule?.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          return distributionDate >= today;
        }
        return false;
      });

      // Add to related items
      waitingOrders.forEach(order => {
        relatedItems.push({
          type: "orders",
          id: order.ordernumber,
          customername: order.customername,
          customernumber: order.customernumber,
          amount: order.totalorder || 0,
          date: order.orderdate || '',
          agentnumber: order.agentnumber || ''
        });
      });

      waitingReturns.forEach(returnItem => {
        relatedItems.push({
          type: "returns", 
          id: returnItem.returnnumber,
          customername: returnItem.customername,
          customernumber: returnItem.customernumber,
          amount: returnItem.totalreturn || 0,
          date: returnItem.returndate || '',
          agentnumber: returnItem.agentnumber || ''
        });
      });

    } else if (selectedItem.type === "returns") {
      const { data: returnData } = await supabase
        .from('mainreturns')
        .select('customername, customernumber, city')
        .eq('returnnumber', selectedItem.id)
        .single();
      
      if (!returnData) return [];

      // Find related orders for same customer/city
      const { data: relatedOrders } = await supabase
        .from('mainorder')
        .select(`
          ordernumber, customername, customernumber, orderdate, agentnumber, totalorder,
          done_mainorder, schedule_id, distribution_schedule(done_schedule, distribution_date)
        `)
        .eq('customername', returnData.customername)
        .eq('city', returnData.city)
        .is('ordercancel', null)
        .is('icecream', null);

      // Find related returns for same customer/city
      const { data: relatedReturns } = await supabase
        .from('mainreturns')
        .select(`
          returnnumber, customername, customernumber, returndate, agentnumber, totalreturn,
          done_return, schedule_id, distribution_schedule(done_schedule, distribution_date)
        `)
        .eq('customername', returnData.customername)
        .eq('city', returnData.city)
        .neq('returnnumber', selectedItem.id)
        .is('returncancel', null)
        .is('icecream', null);

      // Filter waiting items (same logic as above)
      const waitingOrders = (relatedOrders || []).filter(order => {
        if (!order.schedule_id) return !order.done_mainorder;
        const schedule = order.distribution_schedule;
        if (!order.done_mainorder) return true;
        if (order.done_mainorder && !schedule?.done_schedule && schedule?.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          return distributionDate >= today;
        }
        return false;
      });

      const waitingReturns = (relatedReturns || []).filter(returnItem => {
        if (!returnItem.schedule_id) return !returnItem.done_return;
        const schedule = returnItem.distribution_schedule;
        if (!returnItem.done_return) return true;
        if (returnItem.done_return && !schedule?.done_schedule && schedule?.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          return distributionDate >= today;
        }
        return false;
      });

      // Add to related items
      waitingOrders.forEach(order => {
        relatedItems.push({
          type: "orders",
          id: order.ordernumber,
          customername: order.customername,
          customernumber: order.customernumber,
          amount: order.totalorder || 0,
          date: order.orderdate || '',
          agentnumber: order.agentnumber || ''
        });
      });

      waitingReturns.forEach(returnItem => {
        relatedItems.push({
          type: "returns",
          id: returnItem.returnnumber,
          customername: returnItem.customername,
          customernumber: returnItem.customernumber,
          amount: returnItem.totalreturn || 0,
          date: returnItem.returndate || '',
          agentnumber: returnItem.agentnumber || ''
        });
      });
    }

    return relatedItems;
  };

  const handleSelect = async (result: SearchResult) => {
    const selectedItem = {
      type: result.type,
      id: result.id,
      title: result.title,
      subtitle: result.subtitle
    };

    // Get related items only for orders/returns
    let relatedItems: RelatedItem[] = [];
    if (selectedItem.type === "orders" || selectedItem.type === "returns") {
      relatedItems = await getRelatedItems(selectedItem);
    }

    onSelect(selectedItem, relatedItems);
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

  return (
    <div className="space-y-4">
      <div className="flex">
        <Select value={searchType} onValueChange={(value: SearchType) => {
          if (allowedTypes.includes(value)) {
            setSearchType(value);
            setSearchTerm("");
            setIsOpen(false);
          }
        }}>
          <SelectTrigger className={isMobile ? "w-24 text-xs rounded-r-none border-r-0" : "w-32 rounded-r-none border-r-0"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedTypes.includes("orders") && (
              <SelectItem value="orders">הזמנות</SelectItem>
            )}
            {allowedTypes.includes("returns") && (
              <SelectItem value="returns">החזרות</SelectItem>
            )}
            {allowedTypes.includes("schedules") && user?.agentnumber !== "99" && (
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
            className="pl-10 text-sm w-full rounded-l-none"
            onFocus={() => setIsOpen(searchTerm.length >= 1)}
          />
          
          {isOpen && (searchResults?.length > 0 || isLoading) && (
            <Card className={`absolute top-full left-0 right-0 z-50 mt-1 overflow-y-auto ${isMobile ? "max-h-80" : "max-h-64"}`}>
              <CardContent className="p-2">
                {isLoading ? (
                  <div className="p-2 text-center text-gray-500">חיפוש...</div>
                ) : searchResults?.length === 0 ? (
                  <div className="p-2 text-center text-gray-500">
                    {!isAdmin ? "לא נמצאו תוצאות מהסוכן שלך" : "לא נמצאו תוצאות"}
                  </div>
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
