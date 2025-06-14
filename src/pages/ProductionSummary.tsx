
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Package, RotateCcw, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CombinedItemsList } from '@/components/zone-report/CombinedItemsList';
import { SummarySection } from '@/components/zone-report/SummarySection';

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  distribution_date: string;
  nahag_name?: string;
  dis_number?: number;
  done_schedule?: string;
  separation?: string;
}

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  return_reason?: any;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  return_reason?: any;
}

const ProductionSummary = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch schedules for selected date
  const { data: schedules = [] } = useQuery({
    queryKey: ['production-schedules', selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select(`
          *,
          distribution_groups!inner(separation)
        `)
        .eq('distribution_date', dateStr)
        .not('done_schedule', 'is', null)
        .order('dis_number', { ascending: true });
      
      if (error) throw error;
      return data.map(schedule => ({
        ...schedule,
        separation: schedule.distribution_groups?.separation
      })) as DistributionSchedule[];
    },
  });

  // Fetch orders for selected date schedules
  const { data: orders = [] } = useQuery({
    queryKey: ['production-orders', selectedDate],
    queryFn: async () => {
      if (schedules.length === 0) return [];
      
      const scheduleIds = schedules.map(s => s.schedule_id);
      const { data, error } = await supabase
        .from('mainorder')
        .select('*')
        .in('schedule_id', scheduleIds)
        .order('ordernumber', { ascending: true });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: schedules.length > 0,
  });

  // Fetch returns for selected date schedules
  const { data: returns = [] } = useQuery({
    queryKey: ['production-returns', selectedDate],
    queryFn: async () => {
      if (schedules.length === 0) return [];
      
      const scheduleIds = schedules.map(s => s.schedule_id);
      const { data, error } = await supabase
        .from('mainreturns')
        .select('*')
        .in('schedule_id', scheduleIds)
        .order('returnnumber', { ascending: true });
      
      if (error) throw error;
      return data as Return[];
    },
    enabled: schedules.length > 0,
  });

  // Separate regular items from returned items
  const regularOrders = orders.filter(order => !order.return_reason);
  const regularReturns = returns.filter(returnItem => !returnItem.return_reason);
  const returnedOrders = orders.filter(order => order.return_reason);
  const returnedReturns = returns.filter(returnItem => returnItem.return_reason);

  const totalRegularValue = [...regularOrders, ...regularReturns].reduce((sum, item) => {
    return sum + ('totalorder' in item ? item.totalorder || 0 : item.totalreturn || 0);
  }, 0);

  const totalReturnedValue = [...returnedOrders, ...returnedReturns].reduce((sum, item) => {
    return sum + ('totalorder' in item ? item.totalorder || 0 : item.totalreturn || 0);
  }, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">סיכום הפקה יומי</h1>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP', { locale: he })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">לא נמצאו הפקות עבור התאריך הנבחר</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">סה"כ משלוחים</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schedules.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">הזמנות רגילות</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regularOrders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">החזרות רגילות</CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regularReturns.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ערך כולל (רגיל)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₪{totalRegularValue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Regular Items by Zone */}
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const scheduleOrders = regularOrders.filter(order => order.schedule_id === schedule.schedule_id);
              const scheduleReturns = regularReturns.filter(returnItem => returnItem.schedule_id === schedule.schedule_id);
              const combinedItems = [
                ...scheduleOrders.map(order => ({ type: 'order' as const, data: order })),
                ...scheduleReturns.map(returnItem => ({ type: 'return' as const, data: returnItem }))
              ];

              if (combinedItems.length === 0) return null;

              return (
                <Card key={schedule.schedule_id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>משלוח #{schedule.dis_number}</span>
                      <span className="text-sm font-normal text-gray-500">
                        {schedule.separation} - {schedule.nahag_name}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CombinedItemsList 
                      orders={scheduleOrders}
                      returns={scheduleReturns}
                    />
                    <SummarySection 
                      orders={scheduleOrders}
                      returns={scheduleReturns}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Returned Items Section */}
          {(returnedOrders.length > 0 || returnedReturns.length > 0) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <RotateCcw className="h-5 w-5" />
                  פריטים שהוחזרו למערכת ({returnedOrders.length + returnedReturns.length})
                  <span className="text-sm font-normal">
                    - ערך: ₪{totalReturnedValue.toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...returnedOrders, ...returnedReturns].map((item) => {
                    const isOrder = 'ordernumber' in item;
                    const number = isOrder ? item.ordernumber : item.returnnumber;
                    const total = isOrder ? item.totalorder : item.totalreturn;
                    
                    return (
                      <div
                        key={`${isOrder ? 'order' : 'return'}-${number}`}
                        className="flex justify-between items-center p-3 bg-white rounded border border-orange-200"
                      >
                        <div>
                          <span className="font-medium line-through text-gray-500">
                            {isOrder ? `הזמנה #${number}` : `החזרה #${number}`}
                          </span>
                          <span className="text-sm text-gray-600 mr-2 line-through">
                            - {item.customername}
                          </span>
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded mr-2">
                            {item.return_reason.action} - {item.return_reason.entity}
                          </span>
                        </div>
                        <span className="font-bold line-through text-gray-500">
                          ₪{total?.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionSummary;
