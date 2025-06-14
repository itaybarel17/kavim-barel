import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, ArrowLeft, Undo2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
  ordercancel?: string | null;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
  returncancel?: string | null;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
}

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  driver_id?: number;
  done_schedule?: string | null;
}

interface Driver {
  id: number;
  nahag: string;
}

const Archive = () => {
  const navigate = useNavigate();
  const [showRestoreDialog, setShowRestoreDialog] = useState<{
    type: 'order' | 'return';
    number: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch produced orders (with done_mainorder timestamp)
  const { data: producedOrders = [] } = useQuery({
    queryKey: ['produced-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, done_mainorder, invoicenumber')
        .not('done_mainorder', 'is', null)
        .order('done_mainorder', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch produced returns (with done_return timestamp)
  const { data: producedReturns = [] } = useQuery({
    queryKey: ['produced-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, done_return')
        .not('done_return', 'is', null)
        .order('done_return', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch distribution groups
  const { data: distributionGroups = [] } = useQuery({
    queryKey: ['distribution-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('groups_id, separation');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch produced distribution schedules (with done_schedule timestamp)
  const { data: producedSchedules = [] } = useQuery({
    queryKey: ['produced-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('schedule_id, groups_id, create_at_schedule, driver_id, done_schedule')
        .not('done_schedule', 'is', null)
        .order('done_schedule', { ascending: false });
      
      if (error) throw error;
      return data as DistributionSchedule[];
    }
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nahagim')
        .select('id, nahag')
        .order('nahag');
      
      if (error) throw error;
      return data as Driver[];
    }
  });

  // Fetch deleted orders (with ordercancel timestamp)
  const { data: deletedOrders = [], refetch: refetchDeletedOrders } = useQuery({
    queryKey: ['deleted-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, ordercancel, invoicenumber')
        .not('ordercancel', 'is', null)
        .order('ordercancel', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch deleted returns (with returncancel timestamp)
  const { data: deletedReturns = [], refetch: refetchDeletedReturns } = useQuery({
    queryKey: ['deleted-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, returncancel')
        .not('returncancel', 'is', null)
        .order('returncancel', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleRestore = async () => {
    if (!showRestoreDialog) return;
    setLoading(true);

    try {
      if (showRestoreDialog.type === 'order') {
        const { error } = await supabase
          .from('mainorder')
          .update({ ordercancel: null })
          .eq('ordernumber', showRestoreDialog.number);
        if (error) throw error;
        refetchDeletedOrders();
      } else {
        const { error } = await supabase
          .from('mainreturns')
          .update({ returncancel: null })
          .eq('returnnumber', showRestoreDialog.number);
        if (error) throw error;
        refetchDeletedReturns();
      }
    } catch (error) {
      console.error('Error restoring item:', error);
      alert('שגיאה בשחזור הפריט');
    }

    setLoading(false);
    setShowRestoreDialog(null);
  };

  const isLoading = !deletedOrders || !deletedReturns || loading;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div>טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/distribution')}
            variant="outline"
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">ארכיון</h1>
        </div>
      </div>

      {/* Deleted Items Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Trash2 className="h-6 w-6" />
          פריטים מחוקים
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Deleted Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הזמנות מחוקות ({deletedOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deletedOrders.map((order) => (
                  <div
                    key={order.ordernumber}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-red-800">#{order.ordernumber}</span>
                        <span className="text-sm font-bold text-red-700">₪{order.totalorder?.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-red-600">{order.customername}</p>
                      <p className="text-xs text-red-500">{order.address}, {order.city}</p>
                      {order.invoicenumber && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          חשבונית: {order.invoicenumber}
                        </p>
                      )}
                      <p className="text-xs text-red-400 mt-1">
                        נמחק: {new Date(order.ordercancel).toLocaleDateString('he-IL')} {new Date(order.ordercancel).toLocaleTimeString('he-IL')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRestoreDialog({ type: 'order', number: order.ordernumber })}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      title="שחזר הזמנה"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {deletedOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">אין הזמנות מחוקות</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deleted Returns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">החזרות מחוקות ({deletedReturns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deletedReturns.map((returnItem) => (
                  <div
                    key={returnItem.returnnumber}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-red-800">#{returnItem.returnnumber}</span>
                        <span className="text-sm font-bold text-red-700">₪{returnItem.totalreturn?.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-red-600">{returnItem.customername}</p>
                      <p className="text-xs text-red-500">{returnItem.address}, {returnItem.city}</p>
                      <p className="text-xs text-red-400 mt-1">
                        נמחק: {new Date(returnItem.returncancel).toLocaleDateString('he-IL')} {new Date(returnItem.returncancel).toLocaleTimeString('he-IL')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRestoreDialog({ type: 'return', number: returnItem.returnnumber })}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      title="שחזר החזרה"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {deletedReturns.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">אין החזרות מחוקות</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Produced Schedules Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          קווי חלוקה שהופקו
        </h2>
        
        <div className="grid gap-6 md:grid-cols-1">
          {/* Produced Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">קווי חלוקה שהופקו ({producedSchedules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {producedSchedules.map((schedule) => (
                  <div
                    key={schedule.schedule_id}
                    className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-green-600">
                        קבוצה: {distributionGroups.find(group => group.groups_id === schedule.groups_id)?.separation}
                      </p>
                      <p className="text-xs text-green-500">
                        נוצר בתאריך: {new Date(schedule.create_at_schedule).toLocaleDateString('he-IL')}
                      </p>
                      <p className="text-xs text-green-500">
                        הופק בתאריך: {schedule.done_schedule ? new Date(schedule.done_schedule).toLocaleDateString('he-IL') : 'לא ידוע'}
                      </p>
                    </div>
                  </div>
                ))}
                {producedSchedules.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">אין קווי חלוקה שהופקו</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Restore confirmation dialog */}
      <Dialog open={!!showRestoreDialog} onOpenChange={val => !val && setShowRestoreDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showRestoreDialog ? `האם לשחזר את #${showRestoreDialog.number}?` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(null)}
              disabled={loading}
            >לא</Button>
            <Button
              onClick={handleRestore}
              disabled={loading}
            >{loading ? 'משחזר...' : 'כן, לשחזר'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Archive;
