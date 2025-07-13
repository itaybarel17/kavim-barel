
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  getReplacementCustomerDetails,
  getCustomerReplacementMap,
  type OrderWithSchedule,
  type ReturnWithSchedule,
  type CustomerReplacement
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
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
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
  const { data: allReturns = [], isLoading: returnsLoading } = useQuery({
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

  // Fetch customer replacement data
  const { data: customerReplacements = [], isLoading: replacementsLoading } = useQuery({
    queryKey: ['customer-replacements', scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];
      
      console.log('Fetching customer replacement data for schedule:', scheduleId);
      
      // Get all orders and returns for this schedule directly from the database
      const [ordersResult, returnsResult] = await Promise.all([
        supabase
          .from('mainorder')
          .select('ordernumber')
          .or(`schedule_id.eq.${scheduleId},schedule_id_if_changed.cs.["${scheduleId}"]`),
        supabase
          .from('mainreturns')
          .select('returnnumber')
          .or(`schedule_id.eq.${scheduleId},schedule_id_if_changed.cs.["${scheduleId}"]`)
      ]);
      
      if (ordersResult.error) throw ordersResult.error;
      if (returnsResult.error) throw returnsResult.error;
      
      const orderNumbers = ordersResult.data?.map(o => o.ordernumber) || [];
      const returnNumbers = returnsResult.data?.map(r => r.returnnumber) || [];
      
      if (orderNumbers.length === 0 && returnNumbers.length === 0) return [];
      
      // Get all "order on another customer" messages for these orders/returns
      const { data: messages, error } = await supabase
        .from('messages')
        .select('ordernumber, returnnumber, correctcustomer, city')
        .eq('subject', 'הזמנה על לקוח אחר')
        .not('correctcustomer', 'is', null)
        .or(`ordernumber.in.(${orderNumbers.join(',')}),returnnumber.in.(${returnNumbers.join(',')})`);
      
      if (error) throw error;
      if (!messages || messages.length === 0) return [];
      
      // Get customer details for all replacement customers
      const correctCustomerNames = [...new Set(messages.map(m => m.correctcustomer).filter(Boolean))];
      
      const { data: existingCustomers, error: customerError } = await supabase
        .from('customerlist')
        .select('customername, customernumber, address, city, mobile, phone, supplydetails')
        .in('customername', correctCustomerNames);
      
      if (customerError) throw customerError;
      
      // Create customer lookup map
      const customerMap = new globalThis.Map(existingCustomers?.map(c => [c.customername, c]) || []);
      
      // Build replacement data
      const replacements: CustomerReplacement[] = messages.map(msg => ({
        ordernumber: msg.ordernumber,
        returnnumber: msg.returnnumber,
        correctcustomer: msg.correctcustomer,
        city: msg.city,
        existsInSystem: customerMap.has(msg.correctcustomer),
        customerData: customerMap.get(msg.correctcustomer) ? {
          customername: customerMap.get(msg.correctcustomer)!.customername,
          customernumber: customerMap.get(msg.correctcustomer)!.customernumber,
          address: customerMap.get(msg.correctcustomer)!.address,
          city: customerMap.get(msg.correctcustomer)!.city,
          mobile: customerMap.get(msg.correctcustomer)!.mobile,
          phone: customerMap.get(msg.correctcustomer)!.phone,
          supplydetails: customerMap.get(msg.correctcustomer)!.supplydetails,
        } : undefined
      }));
      
      console.log('Customer replacements:', replacements);
      return replacements;
    },
    enabled: !!scheduleId
  });

  // Create replacement map
  const replacementMap = getCustomerReplacementMap(customerReplacements);

  // Fetch customer details - only after orders and returns are loaded
  const { data: customerDetails = [], isLoading: customerDetailsLoading } = useQuery({
    queryKey: ['customer-details', scheduleId, orders.length, returns.length],
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
    enabled: !!scheduleId && !ordersLoading && !returnsLoading && (orders.length > 0 || returns.length > 0)
  });

  const handlePrint = () => {
    window.print();
  };

  if (scheduleLoading) {
    return (
      <div className="p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="p-6 bg-background">
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
  
  console.log('Customer details loaded:', customerDetails.length);
  console.log('Customer details map:', customerDetailsMap);

  // Combine orders and returns by customer
  const customerEntries = new Map<string, CustomerEntry>();

  // Process orders with customer replacement
  orders.forEach(order => {
    const replacementDetails = getReplacementCustomerDetails(order, replacementMap);
    
    // Debug logging for replacement
    if (order.ordernumber === 345126) {
      console.log('Order 345126 - Original:', order.customername, order.city);
      console.log('Order 345126 - Replacement details:', replacementDetails);
      console.log('Order 345126 - Replacement map has:', replacementMap.size, 'entries');
      console.log('Order 345126 - Replacement map:', Array.from(replacementMap.entries()));
    }
    
    // If there's a replacement, use the new customer key and show new customer with original order
    const key = replacementDetails.customername !== order.customername 
      ? `${replacementDetails.customername}-${replacementDetails.city}`
      : `${order.customername}-${order.city}`;
    
    console.log(`Processing order ${order.ordernumber} - Key: ${key}, IsReplacement: ${replacementDetails.customername !== order.customername}`);
    
    if (!customerEntries.has(key)) {
      const originalDetails = customerDetailsMap.get(order.customernumber || '');
      // If there's a replacement, check if it exists in system
      let finalDetails;
      if (replacementDetails.customernumber) {
        // If replacement customer has customernumber, use its details
        finalDetails = customerDetailsMap.get(replacementDetails.customernumber);
      } else if (replacementDetails.customername !== order.customername) {
        // If replacement customer name is different but no customernumber, leave details empty
        finalDetails = undefined;
      } else {
        // No replacement, use original details
        finalDetails = originalDetails;
      }
        
      console.log(`Processing order for ${order.customername}:`, {
        originalDetails,
        replacementDetails,
        finalDetails
      });
      
      customerEntries.set(key, {
        customername: replacementDetails.customername,
        address: replacementDetails.address || '',
        city: replacementDetails.city || '',
        customernumber: replacementDetails.customernumber || order.customernumber,
        mobile: finalDetails?.mobile || replacementDetails.mobile,
        phone: finalDetails?.phone || replacementDetails.phone,
        supplydetails: finalDetails?.supplydetails || replacementDetails.supplydetails,
        shotefnumber: finalDetails?.shotefnumber,
        orders: [],
        returns: []
      });
    }
    customerEntries.get(key)!.orders.push(order);
  });

  // Process returns with customer replacement
  returns.forEach(returnItem => {
    const replacementDetails = getReplacementCustomerDetails(returnItem, replacementMap);
    
    // If there's a replacement, use the new customer key and show new customer with original return
    const key = replacementDetails.customername !== returnItem.customername 
      ? `${replacementDetails.customername}-${replacementDetails.city}`
      : `${returnItem.customername}-${returnItem.city}`;
    
    if (!customerEntries.has(key)) {
      const originalDetails = customerDetailsMap.get(returnItem.customernumber || '');
      // If there's a replacement, check if it exists in system
      let finalDetails;
      if (replacementDetails.customernumber) {
        // If replacement customer has customernumber, use its details
        finalDetails = customerDetailsMap.get(replacementDetails.customernumber);
      } else if (replacementDetails.customername !== returnItem.customername) {
        // If replacement customer name is different but no customernumber, leave details empty
        finalDetails = undefined;
      } else {
        // No replacement, use original details
        finalDetails = originalDetails;
      }
        
      console.log(`Processing return for ${returnItem.customername}:`, {
        originalDetails,
        replacementDetails,
        finalDetails
      });
      
      customerEntries.set(key, {
        customername: replacementDetails.customername,
        address: replacementDetails.address || '',
        city: replacementDetails.city || '',
        customernumber: replacementDetails.customernumber || returnItem.customernumber,
        mobile: finalDetails?.mobile || replacementDetails.mobile,
        phone: finalDetails?.phone || replacementDetails.phone,
        supplydetails: finalDetails?.supplydetails || replacementDetails.supplydetails,
        shotefnumber: finalDetails?.shotefnumber,
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

  // Check if schedule is produced (done_schedule is not null/empty)
  const isScheduleProduced = schedule?.done_schedule && schedule.done_schedule.trim() !== '';

  // Show loading if data is still being fetched
  const isDataLoading = ordersLoading || returnsLoading || customerDetailsLoading || replacementsLoading;

  return (
    <div className="p-2 bg-background">
      <div className="w-full">
        {/* Header - hidden on print */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={!isScheduleProduced}
            >
              <Printer className="h-4 w-4" />
              הדפס
            </Button>
            {!isScheduleProduced && (
              <span className="text-sm text-red-600 font-medium">
                יש להפיק לפני הדפסה
              </span>
            )}
          </div>
          <Button 
            onClick={() => navigate('/calendar')} 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה ללוח השנה
          </Button>
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
            <div className="w-full">
              {isDataLoading ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">טוען פרטי לקוחות...</span>
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
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
              )}
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
