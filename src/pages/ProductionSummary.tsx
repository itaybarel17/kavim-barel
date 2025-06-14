
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Package, RotateCcw, User, Calendar, Printer } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
}

interface CustomerDetails {
  customernumber: string;
  mobile?: string;
  phone?: string;
  supplydetails?: string;
  shotefnumber?: number;
}

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  distribution_date?: string;
  dis_number?: number;
  done_schedule?: string;
  driver_id?: number;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
}

interface Driver {
  id: number;
  nahag: string;
}

interface CustomerEntry {
  customername: string;
  address: string;
  city: string;
  customernumber?: string;
  mobile?: string;
  phone?: string;
  supplydetails?: string;
  shotefnumber?: number;
  orders: Order[];
  returns: Return[];
}

const ProductionSummary = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();

  // Fetch schedule details
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['production-schedule', scheduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('*')
        .eq('schedule_id', parseInt(scheduleId!))
        .single();
      
      if (error) throw error;
      return data as DistributionSchedule;
    },
    enabled: !!scheduleId
  });

  // Fetch distribution group
  const { data: group } = useQuery({
    queryKey: ['distribution-group', schedule?.groups_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('*')
        .eq('groups_id', schedule!.groups_id)
        .single();
      
      if (error) throw error;
      return data as DistributionGroup;
    },
    enabled: !!schedule?.groups_id
  });

  // Fetch driver
  const { data: driver } = useQuery({
    queryKey: ['driver', schedule?.driver_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nahagim')
        .select('*')
        .eq('id', schedule!.driver_id)
        .single();
      
      if (error) throw error;
      return data as Driver;
    },
    enabled: !!schedule?.driver_id
  });

  // Fetch orders for this schedule
  const { data: orders = [] } = useQuery({
    queryKey: ['production-orders', scheduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, icecream, customernumber, agentnumber')
        .eq('schedule_id', parseInt(scheduleId!))
        .not('done_mainorder', 'is', null);
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!scheduleId
  });

  // Fetch returns for this schedule
  const { data: returns = [] } = useQuery({
    queryKey: ['production-returns', scheduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, icecream, customernumber, agentnumber')
        .eq('schedule_id', parseInt(scheduleId!))
        .not('done_return', 'is', null);
      
      if (error) throw error;
      return data as Return[];
    },
    enabled: !!scheduleId
  });

  // Fetch customer details
  const { data: customerDetails = [] } = useQuery({
    queryKey: ['customer-details', scheduleId],
    queryFn: async () => {
      // Get unique customer numbers from orders and returns
      const customerNumbers = Array.from(new Set([
        ...orders.map(order => order.customernumber).filter(Boolean),
        ...returns.map(returnItem => returnItem.customernumber).filter(Boolean)
      ]));

      if (customerNumbers.length === 0) return [];

      const { data, error } = await supabase
        .from('customerlist')
        .select('customernumber, mobile, phone, supplydetails, shotefnumber')
        .in('customernumber', customerNumbers);
      
      if (error) throw error;
      return data as CustomerDetails[];
    },
    enabled: orders.length > 0 || returns.length > 0
  });

  const handlePrint = () => {
    window.print();
  };

  if (scheduleLoading) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-600">קו חלוקה לא נמצא</h1>
          <Button onClick={() => navigate('/calendar')} className="mt-4">
            חזרה ללוח השנה
          </Button>
        </div>
      </div>
    );
  }

  // Create customer lookup map
  const customerDetailsMap = new Map(
    customerDetails.map(customer => [customer.customernumber, customer])
  );

  // Combine orders and returns by customer
  const customerEntries = new Map<string, CustomerEntry>();

  // Process orders
  orders.forEach(order => {
    const key = `${order.customername}-${order.city}`;
    if (!customerEntries.has(key)) {
      const details = customerDetailsMap.get(order.customernumber || '');
      customerEntries.set(key, {
        customername: order.customername,
        address: order.address,
        city: order.city,
        customernumber: order.customernumber,
        mobile: details?.mobile,
        phone: details?.phone,
        supplydetails: details?.supplydetails,
        shotefnumber: details?.shotefnumber,
        orders: [],
        returns: []
      });
    }
    customerEntries.get(key)!.orders.push(order);
  });

  // Process returns
  returns.forEach(returnItem => {
    const key = `${returnItem.customername}-${returnItem.city}`;
    if (!customerEntries.has(key)) {
      const details = customerDetailsMap.get(returnItem.customernumber || '');
      customerEntries.set(key, {
        customername: returnItem.customername,
        address: returnItem.address,
        city: returnItem.city,
        customernumber: returnItem.customernumber,
        mobile: details?.mobile,
        phone: details?.phone,
        supplydetails: details?.supplydetails,
        shotefnumber: details?.shotefnumber,
        orders: [],
        returns: []
      });
    }
    customerEntries.get(key)!.returns.push(returnItem);
  });

  // Sort customers by city (Hebrew alphabetically) then by name
  const sortedCustomers = Array.from(customerEntries.values()).sort((a, b) => {
    const cityComparison = a.city.localeCompare(b.city, 'he');
    if (cityComparison !== 0) return cityComparison;
    return a.customername.localeCompare(b.customername, 'he');
  });

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h1 className="text-3xl font-bold">
            סיכום הפקה - {group?.separation || 'אזור לא מוגדר'} #{schedule.dis_number}
          </h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              הדפס
            </Button>
            <Button onClick={() => navigate('/calendar')} variant="outline" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה ללוח השנה
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">
            סיכום הפקה - {group?.separation || 'אזור לא מוגדר'}
          </h1>
          <h2 className="text-xl">מספר הפקה: #{schedule.dis_number}</h2>
        </div>

        {/* Production Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              פרטי הפקה ו חלוקה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-gray-600">מספר הפקה</div>
                <div className="font-semibold text-lg">#{schedule.dis_number}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">תאריך אספקה</div>
                <div className="font-semibold">{schedule.distribution_date ? new Date(schedule.distribution_date).toLocaleDateString('he-IL') : 'לא מוגדר'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">תאריך הפקה</div>
                <div className="font-semibold">{schedule.done_schedule ? new Date(schedule.done_schedule).toLocaleDateString('he-IL') : 'לא מוגדר'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">נהג</div>
                <div className="font-semibold">{driver?.nahag || 'לא מוגדר'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">כמויות</div>
                <div className="font-semibold">{orders.length} הזמנות, {returns.length} החזרות</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט לקוחות - {sortedCustomers.length} נקודות חלוקה</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם לקוח</TableHead>
                  <TableHead className="text-right">כתובת</TableHead>
                  <TableHead className="text-right">עיר</TableHead>
                  <TableHead className="text-right">טלפון נייד</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">פרטי אספקה</TableHead>
                  <TableHead className="text-right">הזמנות</TableHead>
                  <TableHead className="text-right">החזרות</TableHead>
                  <TableHead className="text-right">הערות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCustomers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{customer.customername}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell>{customer.mobile || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.supplydetails || '-'}</TableCell>
                    <TableCell>
                      {customer.orders.length > 0 && (
                        <div className="space-y-1">
                          {customer.orders.map(order => (
                            <div key={order.ordernumber} className="text-xs">
                              הזמנה #{order.ordernumber}
                              {order.icecream && <div className="text-blue-600">{order.icecream}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.returns.length > 0 && (
                        <div className="space-y-1">
                          {customer.returns.map(returnItem => (
                            <div key={returnItem.returnnumber} className="text-xs">
                              החזרה #{returnItem.returnnumber}
                              {returnItem.icecream && <div className="text-blue-600">{returnItem.icecream}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.shotefnumber === 5 && (
                        <div className="text-red-600 font-bold text-sm">
                          נהג, נא לקחת מזומן
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductionSummary;
