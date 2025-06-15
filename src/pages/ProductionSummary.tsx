import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Package, RotateCcw, User, Calendar, Printer, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { 
  getOrdersByScheduleId, 
  getReturnsByScheduleId,
  isItemModified,
  getOriginalScheduleId,
  getNewScheduleId,
  isTransferredItem,
  getTransferredFromScheduleId,
  type OrderWithSchedule,
  type ReturnWithSchedule
} from '@/utils/scheduleUtils';

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
  orders: OrderWithSchedule[];
  returns: ReturnWithSchedule[];
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

  // Fetch ALL orders from the database with all required fields
  const { data: allOrders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, icecream, customernumber, agentnumber, schedule_id, schedule_id_if_changed');
      
      if (error) throw error;
      return data as OrderWithSchedule[];
    },
    enabled: !!scheduleId
  });

  // Fetch ALL returns from the database with all required fields
  const { data: allReturns = [] } = useQuery({
    queryKey: ['all-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, icecream, customernumber, agentnumber, schedule_id, schedule_id_if_changed');
      
      if (error) throw error;
      return data as ReturnWithSchedule[];
    },
    enabled: !!scheduleId
  });

  // Filter orders and returns for this schedule using scheduleUtils
  const orders = scheduleId ? getOrdersByScheduleId(allOrders, parseInt(scheduleId)) : [];
  const returns = scheduleId ? getReturnsByScheduleId(allReturns, parseInt(scheduleId)) : [];

  // Fetch customer details
  const { data: customerDetails = [] } = useQuery({
    queryKey: ['customer-details', scheduleId],
    queryFn: async () => {
      // Get unique customer numbers from orders and returns as strings
      const customerNumbers = Array.from(new Set([
        ...orders.map(order => order.customernumber).filter(Boolean),
        ...returns.map(returnItem => returnItem.customernumber).filter(Boolean)
      ])) as string[];

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

  // Calculate total unique customers (נקודות)
  const totalPoints = sortedCustomers.length;

  // Helper function to get agent number for a customer
  const getCustomerAgent = (customer: CustomerEntry) => {
    // Get all agent numbers from orders and returns for this customer
    const agentNumbers = new Set([
      ...customer.orders.map(o => o.agentnumber).filter(Boolean),
      ...customer.returns.map(r => r.agentnumber).filter(Boolean)
    ]);
    
    if (agentNumbers.size === 0) return '';
    if (agentNumbers.size === 1) return Array.from(agentNumbers)[0];
    return 'מעורב'; // Mixed agents
  };

  return (
    <div className="min-h-screen p-2 bg-background">
      <div className="max-w-full mx-auto">
        {/* Header - hidden on print */}
        <div className="flex items-center justify-between mb-4 print:hidden">
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

        {/* Distribution Line Summary */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-4 text-base">
              <span>סיכום קו חלוקה {group?.separation || 'אזור לא מוגדר'} - מזהה לוח זמנים: {scheduleId} לתאריך {schedule.distribution_date ? new Date(schedule.distribution_date).toLocaleDateString('he-IL') : 'לא מוגדר'}</span>
              <span>מס' הפצה: #{schedule.dis_number}</span>
              <span>נהג: {driver?.nahag || 'לא מוגדר'}</span>
              <span>נקודות: {totalPoints}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Customer Details Table */}
        <Card>
          <CardContent className="p-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="text-left p-1 text-xs">שם לקוח</TableHead>
                    <TableHead className="text-left p-1 text-xs w-12">סוכן</TableHead>
                    <TableHead className="text-left p-1 text-xs">כתובת</TableHead>
                    <TableHead className="text-left p-1 text-xs">עיר</TableHead>
                    <TableHead className="text-left p-1 text-xs">טלפון נייד</TableHead>
                    <TableHead className="text-left p-1 text-xs">טלפון</TableHead>
                    <TableHead className="text-left p-1 text-xs">פרטי אספקה</TableHead>
                    <TableHead className="text-left p-1 text-xs">הזמנות</TableHead>
                    <TableHead className="text-left p-1 text-xs">החזרות</TableHead>
                    <TableHead className="text-left p-1 text-xs">תשלום</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customer, index) => {
                    // Check if this customer has orders or returns from agent 99
                    const hasAgent99Items = [...customer.orders, ...customer.returns].some(item => item.agentnumber === "99");
                    
                    // Check if this customer has ALL items transferred from other schedules
                    const allCustomerItems = [...customer.orders, ...customer.returns];
                    const isCompletelyTransferred = allCustomerItems.length > 0 && 
                      allCustomerItems.every(item => isTransferredItem(item, parseInt(scheduleId!)));
                    
                    return (
                      <TableRow key={index} className="text-xs border-b h-8">
                        <TableCell className={`font-medium p-1 text-left text-xs ${isCompletelyTransferred ? 'line-through' : ''}`}>
                          <div className="flex items-center gap-1">
                            <span>{customer.customername}</span>
                            {hasAgent99Items && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-300">
                                קנדי+
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-1 text-left text-xs w-12">
                          {getCustomerAgent(customer)}
                        </TableCell>
                        <TableCell className={`p-1 text-left text-xs ${isCompletelyTransferred ? 'line-through' : ''}`}>
                          {customer.address}
                        </TableCell>
                        <TableCell className={`p-1 text-left text-xs ${isCompletelyTransferred ? 'line-through' : ''}`}>
                          {customer.city}
                        </TableCell>
                        <TableCell className="p-1 text-left text-xs">{customer.mobile || '-'}</TableCell>
                        <TableCell className="p-1 text-left text-xs">{customer.phone || '-'}</TableCell>
                        <TableCell className="p-1 text-left text-xs">{customer.supplydetails || '-'}</TableCell>
                        <TableCell className="p-1 text-left">
                          {customer.orders.length > 0 && (
                            <div className="space-y-0.5">
                              {customer.orders.map(order => (
                                <div key={order.ordernumber} className="text-xs flex items-center gap-1">
                                  <span>#{order.ordernumber}</span>
                                  {isTransferredItem(order, parseInt(scheduleId!)) && (
                                    <span className="bg-orange-100 text-orange-700 px-1 text-[8px] rounded-sm border border-orange-300">
                                      עבר #{getTransferredFromScheduleId(order)}
                                    </span>
                                  )}
                                  {order.icecream && <div className="text-blue-600 text-xs">{order.icecream}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-1 text-left">
                          {customer.returns.length > 0 && (
                            <div className="space-y-0.5">
                              {customer.returns.map(returnItem => (
                                <div key={returnItem.returnnumber} className="text-xs flex items-center gap-1">
                                  <span>#{returnItem.returnnumber}</span>
                                  {isTransferredItem(returnItem, parseInt(scheduleId!)) && (
                                    <span className="bg-orange-100 text-orange-700 px-1 text-[8px] rounded-sm border border-orange-300">
                                      עבר #{getTransferredFromScheduleId(returnItem)}
                                    </span>
                                  )}
                                  {returnItem.icecream && <div className="text-blue-600 text-xs">{returnItem.icecream}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-1 text-left">
                          {customer.shotefnumber === 5 && (
                            <div className="text-red-600 font-bold text-xs">
                              נהג, נא לקחת מזומן
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 5mm;
          }
          
          body {
            font-size: 12px !important;
          }
          
          /* Hide navigation and header elements during print */
          nav, .navbar, header, .header {
            display: none !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          table {
            width: 100% !important;
            font-size: 10px !important;
          }
          
          th, td {
            padding: 1px !important;
            font-size: 10px !important;
            text-align: left !important;
          }
          
          .text-xs {
            font-size: 10px !important;
          }
          
          .w-12 {
            width: 3rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductionSummary;
