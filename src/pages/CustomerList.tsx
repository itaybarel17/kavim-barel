import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistributionDays } from '@/utils/dateUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Customer {
  customernumber: string;
  customername: string;
  address: string;
  city: string;
  city_area: string;
  nodeliverday: any;
  deliverhour: any;
  averagesupply: number;
  customergroup?: string;
  day?: any;
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
  const [searchTerm, setSearchTerm] = React.useState('');

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

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.customernumber?.toLowerCase().includes(term) ||
      customer.customername?.toLowerCase().includes(term) ||
      customer.city?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

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

      <div className="mb-4">
        <Input
          placeholder="חיפוש לפי מספר לקוח, שם או עיר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
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
                    {customer.city_area || '-'}
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
    </div>
  );
};

export default CustomerList;
