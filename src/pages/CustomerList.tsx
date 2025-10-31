import React, { useMemo, useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistributionDays, formatDistributionDaysShort } from '@/utils/dateUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';

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
  agentnumber: string;
}

const formatJsonbField = (value: any): string => {
  if (!value) return '-';
  if (Array.isArray(value)) {
    return value
      .map(item => typeof item === 'string' ? item : JSON.stringify(item))
      .join(', ')
      .replace(/[\[\]"]/g, '');
  }
  return String(value).replace(/[\[\]"]/g, '');
};

// Memoized row component to prevent unnecessary re-renders
const CustomerTableRow = memo(({ 
  customer, 
  currentUser, 
  distributionAreas, 
  areasWithDays,
  openAreaSelect,
  setOpenAreaSelect,
  updateAreaMutation,
  updateSelectedDaysMutation,
  updateExtraAreaMutation
}: {
  customer: Customer;
  currentUser: any;
  distributionAreas: string[];
  areasWithDays: any[];
  openAreaSelect: string | null;
  setOpenAreaSelect: (val: string | null) => void;
  updateAreaMutation: any;
  updateSelectedDaysMutation: any;
  updateExtraAreaMutation: any;
}) => {
  return (
    <TableRow className="h-8 hover:bg-muted/50">
      <TableCell className="px-2 py-1 text-xs font-medium">
        {customer.customernumber}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs max-w-[150px] truncate" title={customer.customername}>
        {customer.customername}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs max-w-[120px] truncate" title={customer.address}>
        {customer.address || '-'}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {customer.city || '-'}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {currentUser?.agentnumber === "4" ? (
          <Select
            value={customer.newarea || customer.city_area || ''}
            onValueChange={(value) => {
              updateAreaMutation.mutate({
                customernumber: customer.customernumber,
                newarea: value === customer.city_area ? null : value
              });
              setOpenAreaSelect(null);
            }}
            open={openAreaSelect === customer.customernumber}
            onOpenChange={(isOpen) => {
              setOpenAreaSelect(isOpen ? customer.customernumber : null);
            }}
          >
            <SelectTrigger className="h-6 text-xs border-0 shadow-none hover:bg-accent [&>svg]:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {distributionAreas.map((area) => (
                <SelectItem key={area} value={area} className="text-xs">
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span>{customer.newarea || customer.city_area || '-'}</span>
        )}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {(() => {
          const areaData = areasWithDays.find(a => a.separation === (customer.newarea || customer.city_area));
          const days = areaData?.days || [];
          
          let availableDays: string[] = [];
          if (Array.isArray(days)) {
            days.forEach(dayEntry => {
              if (typeof dayEntry === 'string' && dayEntry.includes(',')) {
                availableDays.push(...dayEntry.split(',').map(d => d.trim()));
              } else if (typeof dayEntry === 'string') {
                availableDays.push(dayEntry);
              }
            });
          }
          
          if (availableDays.length === 0) return '-';
          if (availableDays.length === 1) {
            return <div>{formatDistributionDaysShort([availableDays[0]])}</div>;
          }
          
          if (currentUser?.agentnumber === "4") {
            const isDefaultSelection = !customer.selected_day || customer.selected_day === availableDays.join(',');
            
            return (
              <Select
                value={customer.selected_day || availableDays.join(',')}
                onValueChange={(value) => {
                  const selectedDay = value === availableDays.join(',') ? null : value;
                  updateSelectedDaysMutation.mutate({
                    customernumber: customer.customernumber,
                    selectedDay,
                    isExtra: false
                  });
                }}
              >
                <SelectTrigger className="h-6 text-xs border-0 shadow-none hover:bg-accent [&>svg]:hidden">
                  <SelectValue>
                    <span className={isDefaultSelection ? 'text-muted-foreground' : ''}>
                      {formatDistributionDaysShort(customer.selected_day ? [customer.selected_day] : availableDays)}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {availableDays.map(day => (
                    <SelectItem key={day} value={day} className="text-xs">
                      {formatDistributionDaysShort([day])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          
          return <div>{formatDistributionDaysShort(customer.selected_day || days)}</div>;
        })()}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {currentUser?.agentnumber === "4" ? (
          <Select
            value={customer.extraarea || 'none'}
            onValueChange={(value) => {
              updateExtraAreaMutation.mutate({
                customernumber: customer.customernumber,
                extraarea: value === 'none' ? null : value
              });
            }}
          >
            <SelectTrigger className="h-6 text-xs border-0 shadow-none hover:bg-accent [&>svg]:hidden">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="none" className="text-xs">ללא</SelectItem>
              {distributionAreas.map((area) => (
                <SelectItem key={area} value={area} className="text-xs">
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span>{customer.extraarea || '-'}</span>
        )}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {(() => {
          if (!customer.extraarea) return '-';
          
          const areaData = areasWithDays.find(a => a.separation === customer.extraarea);
          const days = areaData?.days || [];
          
          let availableDays: string[] = [];
          if (Array.isArray(days)) {
            days.forEach(dayEntry => {
              if (typeof dayEntry === 'string' && dayEntry.includes(',')) {
                availableDays.push(...dayEntry.split(',').map(d => d.trim()));
              } else if (typeof dayEntry === 'string') {
                availableDays.push(dayEntry);
              }
            });
          }
          
          if (availableDays.length === 0) return '-';
          if (availableDays.length === 1) {
            return <div>{formatDistributionDaysShort([availableDays[0]])}</div>;
          }
          
          if (currentUser?.agentnumber === "4") {
            const isDefaultSelection = !customer.selected_day_extra || customer.selected_day_extra === availableDays.join(',');
            
            return (
              <Select
                value={customer.selected_day_extra || availableDays.join(',')}
                onValueChange={(value) => {
                  const selectedDay = value === availableDays.join(',') ? null : value;
                  updateSelectedDaysMutation.mutate({
                    customernumber: customer.customernumber,
                    selectedDay,
                    isExtra: true
                  });
                }}
              >
                <SelectTrigger className="h-6 text-xs border-0 shadow-none hover:bg-accent [&>svg]:hidden">
                  <SelectValue>
                    <span className={isDefaultSelection ? 'text-muted-foreground' : ''}>
                      {formatDistributionDaysShort(customer.selected_day_extra ? [customer.selected_day_extra] : availableDays)}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {availableDays.map(day => (
                    <SelectItem key={day} value={day} className="text-xs">
                      {formatDistributionDaysShort([day])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          
          return <div>{formatDistributionDaysShort(customer.selected_day_extra || days)}</div>;
        })()}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {formatDistributionDaysShort(customer.nodeliverday) || '-'}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {formatJsonbField(customer.deliverhour)}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs text-center">
        {customer.averagesupply ? customer.averagesupply.toFixed(2) : '-'}
      </TableCell>
      <TableCell className="px-2 py-1 text-xs">
        {customer.customergroup || '-'}
      </TableCell>
    </TableRow>
  );
});

CustomerTableRow.displayName = 'CustomerTableRow';

const CustomerList = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [agentSelectOpen, setAgentSelectOpen] = useState(false);
  const [citySelectOpen, setCitySelectOpen] = useState(false);
  const [areaSelectOpen, setAreaSelectOpen] = useState(false);
  const [openAreaSelect, setOpenAreaSelect] = useState<string | null>(null);
  const ITEMS_PER_PAGE = Math.ceil(1000 / 3); // ~333 items per page

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea],
    queryFn: async () => {
      let query = supabase
        .from('customerlist')
        .select('*')
        .not('averagesupply', 'is', null)
        .order('customernumber');
      
      // If not agent 4, filter by their agent number
      if (currentUser?.agentnumber !== "4") {
        query = query.eq('agentnumber', currentUser?.agentnumber);
      } else {
        // For agent 4, apply selected filters
        if (selectedAgent) {
          query = query.eq('agentnumber', selectedAgent);
        }
        if (selectedCity) {
          query = query.eq('city', selectedCity);
        }
        if (selectedArea) {
          query = query.or(`city_area.eq.${selectedArea},newarea.eq.${selectedArea}`);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Customer[];
    },
    enabled: !!currentUser && (
      currentUser.agentnumber !== "4" || 
      (currentUser.agentnumber === "4" && (!!selectedAgent || !!selectedCity || !!selectedArea))
    ),
    staleTime: 30000, // Data stays fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });

  // Get unique areas from customers for filter
  const areas = React.useMemo(() => {
    const areaSet = new Set<string>();
    customers?.forEach(customer => {
      if (customer.city_area && customer.city_area.trim()) areaSet.add(customer.city_area);
      if (customer.newarea && customer.newarea.trim()) areaSet.add(customer.newarea);
    });
    return Array.from(areaSet).filter(area => area && area.trim()).sort();
  }, [customers]);

  const { data: distributionAreas = [] } = useQuery({
    queryKey: ['distribution-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('separation')
        .order('separation');
      
      if (error) throw error;
      return (data || []).map(d => d.separation).filter(Boolean);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: areasWithDays = [] } = useQuery({
    queryKey: ['distribution-areas-with-days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('separation, days')
        .order('separation');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('agentnumber, agentname')
        .order('agentnumber');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customerlist')
        .select('city')
        .not('city', 'is', null)
        .not('averagesupply', 'is', null);
      
      if (error) throw error;
      
      // Get unique list of cities, sorted
      const uniqueCities = [...new Set((data || []).map(item => item.city))].sort();
      
      return uniqueCities;
    },
    enabled: currentUser?.agentnumber === "4",
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const updateAreaMutation = useMutation({
    mutationFn: async ({ customernumber, newarea }: { customernumber: string; newarea: string | null }) => {
      const { error } = await supabase
        .from('customerlist')
        .update({ 
          newarea,
          selected_day: null,
          selected_day_extra: null
        })
        .eq('customernumber', customernumber);
      
      if (error) throw error;
      return { customernumber, newarea };
    },
    onMutate: async ({ customernumber, newarea }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      
      // Snapshot the previous value
      const previousCustomers = queryClient.getQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea]);
      
      // Optimistically update
      queryClient.setQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea], (old: Customer[] = []) => {
        return old.map(customer => 
          customer.customernumber === customernumber 
            ? { ...customer, newarea, selected_day: null, selected_day_extra: null }
            : customer
        );
      });
      
      return { previousCustomers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea], context.previousCustomers);
      }
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון האזור",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "עודכן בהצלחה",
        description: "האזור עודכן בהצלחה",
      });
    }
  });

  const updateSelectedDaysMutation = useMutation({
    mutationFn: async ({ customernumber, selectedDay, isExtra }: { customernumber: string; selectedDay: any; isExtra: boolean }) => {
      const { error } = await supabase
        .from('customerlist')
        .update({ [isExtra ? 'selected_day_extra' : 'selected_day']: selectedDay })
        .eq('customernumber', customernumber);
      
      if (error) throw error;
      return { customernumber, selectedDay, isExtra };
    },
    onMutate: async ({ customernumber, selectedDay, isExtra }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      
      // Snapshot the previous value
      const previousCustomers = queryClient.getQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea]);
      
      // Optimistically update
      queryClient.setQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea], (old: Customer[] = []) => {
        return old.map(customer => 
          customer.customernumber === customernumber 
            ? { ...customer, [isExtra ? 'selected_day_extra' : 'selected_day']: selectedDay }
            : customer
        );
      });
      
      return { previousCustomers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea], context.previousCustomers);
      }
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון ימי החלוקה",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "עודכן בהצלחה",
        description: "ימי החלוקה עודכנו בהצלחה",
      });
    }
  });

  const updateExtraAreaMutation = useMutation({
    mutationFn: async ({ customernumber, extraarea }: { customernumber: string; extraarea: string | null }) => {
      const { error } = await supabase
        .from('customerlist')
        .update({ extraarea })
        .eq('customernumber', customernumber);
      
      if (error) throw error;
      return { customernumber, extraarea };
    },
    onMutate: async ({ customernumber, extraarea }) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      
      const previousCustomers = queryClient.getQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea]);
      
      queryClient.setQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea], (old: Customer[] = []) => {
        return old.map(customer => 
          customer.customernumber === customernumber 
            ? { ...customer, extraarea }
            : customer
        );
      });
      
      return { previousCustomers };
    },
    onError: (err, variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers', currentUser?.agentnumber, selectedAgent, selectedCity, selectedArea], context.previousCustomers);
      }
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון האזור הנוסף",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "עודכן בהצלחה",
        description: "האזור הנוסף עודכן",
      });
    }
  });

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.customernumber?.toLowerCase().includes(term) ||
      customer.customername?.toLowerCase().includes(term) ||
      customer.city?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, ITEMS_PER_PAGE]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">רשימת לקוחות</h1>
          <p className="text-sm text-muted-foreground">
            {currentUser?.agentnumber === "4" 
              ? `סה"כ ${customers.length} לקוחות בכל המערכת`
              : `${customers.length} לקוחות שלך`}
          </p>
        </div>
        <Button 
          onClick={() => navigate('/lines')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          חזרה לקווי הפצה
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {currentUser?.agentnumber === "4" && (
        <div className="mb-4 flex gap-4 items-center">
          <Select 
            value={selectedAgent || undefined} 
            onValueChange={(value) => {
              setSelectedAgent(value);
              setCurrentPage(1);
              setAgentSelectOpen(false);
            }}
            open={agentSelectOpen}
            onOpenChange={setAgentSelectOpen}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="בחר סוכן..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {agents.map((agent) => (
                <SelectItem key={agent.agentnumber} value={agent.agentnumber}>
                  {agent.agentnumber} - {agent.agentname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedCity || undefined} 
            onValueChange={(value) => {
              setSelectedCity(value);
              setCurrentPage(1);
              setCitySelectOpen(false);
            }}
            open={citySelectOpen}
            onOpenChange={setCitySelectOpen}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="בחר עיר..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedArea || undefined} 
            onValueChange={(value) => {
              setSelectedArea(value);
              setCurrentPage(1);
              setAreaSelectOpen(false);
            }}
            open={areaSelectOpen}
            onOpenChange={setAreaSelectOpen}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="בחר אזור..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {areas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedAgent || selectedCity || selectedArea) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAgent('');
                setSelectedCity('');
                setSelectedArea('');
                setCurrentPage(1);
              }}
            >
              נקה פילטרים
            </Button>
          )}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <Input
          placeholder="חיפוש לפי מספר לקוח, שם או עיר..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          עמוד {currentPage} מתוך {totalPages} | סה"כ {filteredCustomers.length} לקוחות
        </div>
      </div>

      {(selectedAgent || selectedCity || selectedArea || currentUser?.agentnumber !== "4") && filteredCustomers.length > 0 && (
        <>
          <div className="border rounded-lg bg-card">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="h-8 px-2 text-xs font-semibold">מספר</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">שם לקוח</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">כתובת</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">עיר</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">אזור</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">ימי חלוקה</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">אזור נוסף</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">ימי אזור נוסף</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">ימים ללא חלוקה</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">שעות חלוקה</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold text-center">ממוצע</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">קבוצה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <CustomerTableRow
                  key={customer.customernumber}
                  customer={customer}
                  currentUser={currentUser}
                  distributionAreas={distributionAreas}
                  areasWithDays={areasWithDays}
                  openAreaSelect={openAreaSelect}
                  setOpenAreaSelect={setOpenAreaSelect}
                  updateAreaMutation={updateAreaMutation}
                  updateSelectedDaysMutation={updateSelectedDaysMutation}
                  updateExtraAreaMutation={updateExtraAreaMutation}
                />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[1, 2, 3].map((page) => (
                    page <= totalPages && (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {currentUser?.agentnumber === "4" && !selectedAgent && !selectedCity && !selectedArea && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">בחר סוכן, עיר או אזור כדי להציג לקוחות</p>
          <p className="text-sm">יש יותר מ-2000 לקוחות במערכת, נא לבחור פילטר</p>
        </div>
      )}

      {filteredCustomers.length === 0 && (selectedAgent || selectedCity || selectedArea || currentUser?.agentnumber !== "4") && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? 'לא נמצאו לקוחות התואמים את החיפוש' : 'אין לקוחות להצגה'}
        </div>
      )}
    </div>
  );
};

export default CustomerList;
