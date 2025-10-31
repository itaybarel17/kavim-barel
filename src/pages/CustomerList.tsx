import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistributionDays } from '@/utils/dateUtils';
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
  day?: any;
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

const CustomerList = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = Math.ceil(1000 / 3); // ~333 items per page

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentUser?.agentnumber],
    queryFn: async () => {
      let query = supabase
        .from('customerlist')
        .select('*')
        .order('customernumber');
      
      if (currentUser?.agentnumber !== "4") {
        query = query.eq('agentnumber', currentUser?.agentnumber);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Customer[];
    },
    enabled: !!currentUser
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['distribution-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('separation')
        .order('separation');
      
      if (error) throw error;
      return (data || []).map(d => d.separation).filter(Boolean);
    }
  });

  const updateAreaMutation = useMutation({
    mutationFn: async ({ customernumber, newarea }: { customernumber: string; newarea: string | null }) => {
      const { error } = await supabase
        .from('customerlist')
        .update({ newarea })
        .eq('customernumber', customernumber);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "עודכן בהצלחה",
        description: "האזור עודכן בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון האזור",
        variant: "destructive",
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
                <TableHead className="h-8 px-2 text-xs font-semibold">ימים ללא חלוקה</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">שעות חלוקה</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold text-center">ממוצע</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">קבוצה</TableHead>
                <TableHead className="h-8 px-2 text-xs font-semibold">סוכן</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow key={customer.customernumber} className="h-8 hover:bg-muted/50">
                  <TableCell className="px-2 py-1 text-xs font-medium">
                    {customer.customernumber}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs max-w-[150px] truncate" title={customer.customername}>
                    {customer.customername}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs max-w-[180px] truncate" title={customer.address}>
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
                        }}
                      >
                        <SelectTrigger className="h-6 text-xs border-0 shadow-none hover:bg-accent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area) => (
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
                    {formatDistributionDays(customer.day)}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    {formatDistributionDays(customer.nodeliverday)}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    {formatJsonbField(customer.deliverhour)}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs text-center">
                    {customer.averagesupply ? Math.round(customer.averagesupply) : '-'}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    {customer.customergroup || '-'}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    {customer.agentnumber || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? 'לא נמצאו לקוחות התואמים את החיפוש' : 'אין לקוחות להצגה'}
        </div>
      )}

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
    </div>
  );
};

export default CustomerList;
