import React, { useMemo, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getAreaColor } from '@/utils/areaColors';
import { cn } from '@/lib/utils';

interface Customer {
  customernumber: string;
  customername: string;
  address: string;
  city: string;
  city_area: string;
  newarea: string | null;
  nodeliverday: any;
  deliverhour: any;
  averagesupply: number;
  customergroup?: string;
  selected_day?: any;
  selected_day_extra?: any;
  extraarea?: string | null;
  agent_visit_day?: string;
}

const getGroupBorderColor = (group?: string): string => {
  const groupColors: Record<string, string> = {
    'סופר-מרקט': 'border-l-blue-500',
    'מכולת': 'border-l-green-500',
    'מזנון': 'border-l-purple-500',
    'מסעדה': 'border-l-orange-500',
    'קיוסק': 'border-l-pink-500',
    'בית קפה': 'border-l-cyan-500',
  };
  return groupColors[group || ''] || 'border-l-gray-400';
};

const formatDays = (days: any): string[] => {
  if (!days) return [];
  if (Array.isArray(days)) return days;
  if (typeof days === 'string') return [days];
  return [];
};

const formatDeliveryHour = (value: any): { text: string; direction: 'up' | 'down' | null } => {
  if (!value) return { text: '-', direction: null };
  
  let hourStr = '';
  if (Array.isArray(value)) {
    hourStr = value.join(', ').replace(/[\[\]"]/g, '');
  } else {
    hourStr = String(value).replace(/[\[\]"]/g, '');
  }
  
  if (hourStr.includes(':') && hourStr.match(/\d+:\d+\s*-\s*\d+:\d+/)) {
    return { text: hourStr, direction: null };
  }
  
  if (hourStr.startsWith('-')) {
    return { text: hourStr.substring(1), direction: 'down' };
  }
  
  return { text: hourStr, direction: 'up' };
};

const CustomerCard = ({ 
  customer, 
  currentUser,
  distributionAreas,
  updateAreaMutation,
  updateSelectedDaysMutation,
  updateExtraAreaMutation
}: { 
  customer: Customer;
  currentUser: any;
  distributionAreas: string[];
  updateAreaMutation: any;
  updateSelectedDaysMutation: any;
  updateExtraAreaMutation: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const area = customer.newarea || customer.city_area;
  const deliveryHour = formatDeliveryHour(customer.deliverhour);
  const selectedDays = formatDays(customer.selected_day);
  const selectedDaysExtra = formatDays(customer.selected_day_extra);
  const noDeliveryDays = formatDays(customer.nodeliverday);
  
  const isAgent4 = currentUser?.agentnumber === "4";
  
  const handleAreaUpdate = useCallback((newArea: string) => {
    updateAreaMutation.mutate({
      customernumber: customer.customernumber,
      newarea: newArea
    });
  }, [customer.customernumber, updateAreaMutation]);
  
  const handleDaysUpdate = useCallback((days: string) => {
    updateSelectedDaysMutation.mutate({
      customernumber: customer.customernumber,
      selected_day: days
    });
  }, [customer.customernumber, updateSelectedDaysMutation]);
  
  const handleExtraAreaUpdate = useCallback((extraArea: string) => {
    updateExtraAreaMutation.mutate({
      customernumber: customer.customernumber,
      extraarea: extraArea
    });
  }, [customer.customernumber, updateExtraAreaMutation]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "border-l-4 transition-all duration-200 hover:shadow-lg",
        getGroupBorderColor(customer.customergroup)
      )}>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs">
                  {customer.customernumber}
                </Badge>
                <h3 className="font-semibold text-base">
                  {customer.customername}
                </h3>
              </div>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 transition-transform duration-200 flex-shrink-0",
                  isOpen && "rotate-180"
                )} 
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{customer.city}</span>
              <Badge className={cn("text-xs", getAreaColor(area))}>
                {area}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {customer.averagesupply && (
                <Badge 
                  className={cn(
                    "text-xs font-medium",
                    customer.averagesupply > 1000 
                      ? "bg-gradient-to-r from-green-500 to-blue-500 text-white" 
                      : "bg-gradient-to-r from-gray-400 to-orange-400 text-white"
                  )}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {customer.averagesupply.toLocaleString()}
                </Badge>
              )}
              {customer.agent_visit_day && (
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {customer.agent_visit_day}
                </Badge>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-4 border-t">
            {/* Address */}
            <div className="pt-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">כתובת</div>
                  <div className="font-medium">{customer.address || '-'}</div>
                </div>
              </div>
            </div>

            {/* Area Selection */}
            {isAgent4 ? (
              <div>
                <div className="text-xs text-muted-foreground mb-2">אזור חלוקה</div>
                <Select value={area} onValueChange={handleAreaUpdate}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {distributionAreas.map((areaOption) => (
                      <SelectItem key={areaOption} value={areaOption}>
                        {areaOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Distribution Days */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">ימי חלוקה</div>
              {isAgent4 ? (
                <Select value={selectedDays.join(',')} onValueChange={handleDaysUpdate}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="א,ב,ג,ד,ה,ו">כל השבוע</SelectItem>
                    <SelectItem value="א">ראשון</SelectItem>
                    <SelectItem value="ב">שני</SelectItem>
                    <SelectItem value="ג">שלישי</SelectItem>
                    <SelectItem value="ד">רביעי</SelectItem>
                    <SelectItem value="ה">חמישי</SelectItem>
                    <SelectItem value="ו">שישי</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {selectedDays.length > 0 ? (
                    selectedDays.map((day) => (
                      <Badge key={day} variant="default" className="text-xs">
                        {day}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              )}
            </div>

            {/* Extra Area */}
            {(customer.extraarea || isAgent4) && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">אזור נוסף</div>
                {isAgent4 ? (
                  <Select 
                    value={customer.extraarea || ''} 
                    onValueChange={handleExtraAreaUpdate}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="בחר אזור נוסף" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ללא</SelectItem>
                      {distributionAreas.map((areaOption) => (
                        <SelectItem key={areaOption} value={areaOption}>
                          {areaOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  customer.extraarea && (
                    <Badge className={cn("text-xs", getAreaColor(customer.extraarea))}>
                      {customer.extraarea}
                    </Badge>
                  )
                )}
                {customer.extraarea && selectedDaysExtra.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {selectedDaysExtra.map((day) => (
                      <Badge key={day} variant="outline" className="text-xs">
                        {day}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Delivery Days */}
            {noDeliveryDays.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">ימים ללא חלוקה</div>
                <div className="flex gap-1 flex-wrap">
                  {noDeliveryDays.map((day) => (
                    <Badge key={day} variant="destructive" className="text-xs">
                      <X className="w-3 h-3 mr-1" />
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Hours */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">שעות חלוקה</div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{deliveryHour.text}</span>
                {deliveryHour.direction === 'up' && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    מ-
                  </Badge>
                )}
                {deliveryHour.direction === 'down' && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                    עד
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const CustomerList = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  
  useRealtimeSubscription();

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea],
    queryFn: async () => {
      let query = supabase
        .from('customerlist')
        .select('customernumber, customername, address, city, city_area, newarea, selected_day, selected_day_extra, extraarea, nodeliverday, deliverhour, averagesupply, customergroup, agent_visit_day, agentnumber')
        .eq('active', 'פעיל')
        .not('averagesupply', 'is', null)
        .order('customername');
      
      if (currentUser?.agentnumber !== "4") {
        query = query.eq('agentnumber', currentUser?.agentnumber);
      } else if (selectedAgent || selectedCity || selectedArea) {
        if (selectedAgent) query = query.eq('agentnumber', selectedAgent);
        if (selectedCity) query = query.eq('city', selectedCity);
        if (selectedArea) query = query.or(`city_area.eq.${selectedArea},newarea.eq.${selectedArea}`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch distribution areas
  const { data: distributionAreas = [] } = useQuery({
    queryKey: ['distribution-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('separation')
        .order('separation');
      
      if (error) throw error;
      return data.map(d => d.separation).filter(Boolean) as string[];
    },
  });

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('agentnumber, agentname')
        .order('agentnumber');
      
      if (error) throw error;
      return data;
    },
    enabled: currentUser?.agentnumber === "4",
  });

  // Fetch cities
  const { data: cities = [] } = useQuery({
    queryKey: ['cities-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customerlist')
        .select('city')
        .eq('active', 'פעיל')
        .not('city', 'is', null);
      
      if (error) throw error;
      const uniqueCities = Array.from(new Set(data.map(d => d.city).filter(Boolean))) as string[];
      return uniqueCities.sort();
    },
    enabled: currentUser?.agentnumber === "4",
  });

  // Update mutations
  const updateAreaMutation = useMutation({
    mutationFn: async ({ customernumber, newarea }: { customernumber: string; newarea: string }) => {
      const { error } = await supabase
        .from('customerlist')
        .update({ newarea })
        .eq('customernumber', customernumber);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'אזור עודכן בהצלחה' });
    },
    onError: () => {
      toast({ title: 'שגיאה בעדכון אזור', variant: 'destructive' });
    },
  });

  const updateSelectedDaysMutation = useMutation({
    mutationFn: async ({ customernumber, selected_day }: { customernumber: string; selected_day: string }) => {
      const { error } = await supabase
        .from('customerlist')
        .update({ selected_day })
        .eq('customernumber', customernumber);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'ימים עודכנו בהצלחה' });
    },
    onError: () => {
      toast({ title: 'שגיאה בעדכון ימים', variant: 'destructive' });
    },
  });

  const updateExtraAreaMutation = useMutation({
    mutationFn: async ({ customernumber, extraarea }: { customernumber: string; extraarea: string }) => {
      const { error } = await supabase
        .from('customerlist')
        .update({ extraarea: extraarea || null })
        .eq('customernumber', customernumber);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'אזור נוסף עודכן בהצלחה' });
    },
    onError: () => {
      toast({ title: 'שגיאה בעדכון אזור נוסף', variant: 'destructive' });
    },
  });

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = !searchTerm || 
        customer.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customernumber?.includes(searchTerm) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [customers, searchTerm]);

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: filteredCustomers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAgent('');
    setSelectedCity('');
    setSelectedArea('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAgent4 = currentUser?.agentnumber === "4";
  const showFilters = isAgent4 && (selectedAgent || selectedCity || selectedArea);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              רשימת לקוחות
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {filteredCustomers.length} לקוחות
              </Badge>
              {filteredCustomers.length > 0 && (
                <Badge variant="outline" className="text-sm">
                  ממוצע: {Math.round(filteredCustomers.reduce((sum, c) => sum + (c.averagesupply || 0), 0) / filteredCustomers.length).toLocaleString()}
                </Badge>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="חפש לפי שם, מספר לקוח או עיר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {isAgent4 && (
              <div className="flex flex-wrap gap-2">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="כל הסוכנים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל הסוכנים</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.agentnumber} value={agent.agentnumber}>
                        {agent.agentname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="כל הערים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל הערים</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="כל האזורים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל האזורים</SelectItem>
                    {distributionAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {showFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 ml-1" />
                    נקה
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Virtual List */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {!isAgent4 && !showFilters && filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>לא נמצאו לקוחות</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>לא נמצאו לקוחות התואמים לחיפוש</p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
            className="container mx-auto px-4 py-4"
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const customer = filteredCustomers[virtualRow.index];
              return (
                <div
                  key={customer.customernumber}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-3"
                >
                  <CustomerCard
                    customer={customer}
                    currentUser={currentUser}
                    distributionAreas={distributionAreas}
                    updateAreaMutation={updateAreaMutation}
                    updateSelectedDaysMutation={updateSelectedDaysMutation}
                    updateExtraAreaMutation={updateExtraAreaMutation}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
