import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerLinks = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch main customers
  const { data: mainCustomers = [], isLoading: isLoadingMain } = useQuery({
    queryKey: ['main-customers-for-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customerlist')
        .select('customernumber, customername, city, linked_candy_customernumber')
        .order('customername');
      if (error) throw error;
      return data;
    }
  });

  // Fetch candy customers
  const { data: candyCustomers = [], isLoading: isLoadingCandy } = useQuery({
    queryKey: ['candy-customers-for-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candycustomerlist')
        .select('customernumber, customername, city')
        .order('customername');
      if (error) throw error;
      return data;
    }
  });

  const updateLink = async (mainCustomer: string, candyCustomer: string | null) => {
    try {
      const { error } = await supabase
        .from('customerlist')
        .update({ linked_candy_customernumber: candyCustomer })
        .eq('customernumber', mainCustomer);

      if (error) throw error;

      toast.success('הקישור עודכן בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['main-customers-for-links'] });
    } catch (error) {
      console.error('Error updating link:', error);
      toast.error('שגיאה בעדכון קישור');
    }
  };

  // Filter customers based on search term
  const filteredCustomers = mainCustomers.filter(customer =>
    customer.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customernumber?.includes(searchTerm)
  );

  // Count statistics
  const linkedCount = mainCustomers.filter(c => c.linked_candy_customernumber).length;

  if (isLoadingMain || isLoadingCandy) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          חזרה
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-6 w-6" />
              ניהול קישורי לקוחות
            </CardTitle>
            <CardDescription>
              קשר בין לקוחות מ-customerlist (שלנו) ללקוחות מ-candycustomerlist (יבואן)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  סה"כ לקוחות: <span className="font-semibold">{mainCustomers.length}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  מקושרים: <span className="font-semibold">{linkedCount}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-64">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש לקוח..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">מספר לקוח</TableHead>
                    <TableHead>שם לקוח</TableHead>
                    <TableHead>עיר</TableHead>
                    <TableHead>לקוח candy מקושר</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(customer => (
                    <TableRow key={customer.customernumber}>
                      <TableCell className="font-mono text-xs">
                        {customer.customernumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.customername}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.city}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={customer.linked_candy_customernumber || 'none'}
                          onValueChange={(value) =>
                            updateLink(
                              customer.customernumber,
                              value === 'none' ? null : value
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="בחר לקוח מקושר" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">ללא קישור</SelectItem>
                            {candyCustomers.map(candy => (
                              <SelectItem
                                key={candy.customernumber}
                                value={candy.customernumber}
                              >
                                {candy.customername} ({candy.city}) - {candy.customernumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerLinks;
