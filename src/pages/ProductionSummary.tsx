
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Calculate totals
  const totalOrdersAmount = orders.reduce((sum, order) => sum + (order.totalorder || 0), 0);
  const totalReturnsAmount = returns.reduce((sum, returnItem) => sum + (returnItem.totalreturn || 0), 0);
  const netTotal = totalOrdersAmount - totalReturnsAmount;

  // Group customers
  const uniqueCustomers = new Set([
    ...orders.map(order => order.customername),
    ...returns.map(returnItem => returnItem.customername)
  ]);

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h1 className="text-3xl font-bold">סיכום הפקה</h1>
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

        {/* Production Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              פרטי הפקה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">מספר הפקה</div>
                <div className="font-semibold text-lg">#{schedule.dis_number}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">תאריך הפקה</div>
                <div className="font-semibold">{schedule.distribution_date ? new Date(schedule.distribution_date).toLocaleDateString('he-IL') : 'לא מוגדר'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">אזור</div>
                <div className="font-semibold">{group?.separation || 'לא מוגדר'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">נהג</div>
                <div className="font-semibold">{driver?.nahag || 'לא מוגדר'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{uniqueCustomers.size}</div>
              <div className="text-sm text-gray-600">נקודות חלוקה</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{orders.length}</div>
              <div className="text-sm text-gray-600">הזמנות</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{returns.length}</div>
              <div className="text-sm text-gray-600">החזרות</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">₪{netTotal.toLocaleString('he-IL')}</div>
              <div className="text-sm text-gray-600">סה"כ נטו</div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>סיכום כספי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-600">סה"כ הזמנות:</span>
                <span className="font-semibold text-green-600">₪{totalOrdersAmount.toLocaleString('he-IL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">סה"כ החזרות:</span>
                <span className="font-semibold text-red-600">₪{totalReturnsAmount.toLocaleString('he-IL')}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">סה"כ נטו:</span>
                <span className="font-bold">₪{netTotal.toLocaleString('he-IL')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {orders.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                הזמנות ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {orders.map((order) => (
                  <div key={order.ordernumber} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{order.customername}</div>
                      <div className="text-sm text-gray-600">{order.address}, {order.city}</div>
                      <div className="text-xs text-gray-500">הזמנה #{order.ordernumber}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-green-600">₪{order.totalorder?.toLocaleString('he-IL')}</div>
                      {order.icecream && <div className="text-xs text-blue-600">{order.icecream}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Returns List */}
        {returns.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-red-600" />
                החזרות ({returns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {returns.map((returnItem) => (
                  <div key={returnItem.returnnumber} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{returnItem.customername}</div>
                      <div className="text-sm text-gray-600">{returnItem.address}, {returnItem.city}</div>
                      <div className="text-xs text-gray-500">החזרה #{returnItem.returnnumber}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-red-600">₪{returnItem.totalreturn?.toLocaleString('he-IL')}</div>
                      {returnItem.icecream && <div className="text-xs text-blue-600">{returnItem.icecream}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductionSummary;
