
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from 'lucide-react';

// Simple types to avoid recursion issues
interface SimpleOrder {
  ordernumber: number;
  customername: string | null;
  city: string | null;
  totalorder: number | null;
  schedule_id: number | null;
  return_reason: any;
  schedule_id_if_changed: any;
}

interface SimpleReturn {
  returnnumber: number;
  customername: string | null;
  city: string | null;
  totalreturn: number | null;
  schedule_id: number | null;
  return_reason: any;
  schedule_id_if_changed: any;
}

// Define return reason entry type
interface ReturnReasonEntry {
  type: string;
  responsible: string;
  timestamp: string;
}

// Helper functions to safely convert data to typed arrays
const parseReturnReasonHistory = (data: any): ReturnReasonEntry[] => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        // Handle both old format (reason) and new format (type)
        if ('type' in item) {
          return { 
            type: String(item.type || ''), 
            responsible: String(item.responsible || ''),
            timestamp: String(item.timestamp || '') 
          };
        } else if ('reason' in item) {
          // Convert old format to new format
          return { 
            type: String(item.reason || ''), 
            responsible: 'לא צוין',
            timestamp: String(item.timestamp || '') 
          };
        }
      }
      if (typeof item === 'string') {
        return { type: item, responsible: 'לא צוין', timestamp: '' };
      }
      return { type: String(item), responsible: 'לא צוין', timestamp: '' };
    });
  }
  
  if (typeof data === 'object' && data !== null) {
    if ('type' in data) {
      return [{ 
        type: String(data.type || ''), 
        responsible: String(data.responsible || ''),
        timestamp: String(data.timestamp || '') 
      }];
    } else if ('reason' in data) {
      // Convert old format to new format
      return [{ 
        type: String(data.reason || ''), 
        responsible: 'לא צוין',
        timestamp: String(data.timestamp || '') 
      }];
    }
  }
  
  if (typeof data === 'string') {
    return [{ type: data, responsible: 'לא צוין', timestamp: '' }];
  }
  
  return [];
};

const parseScheduleIdHistory = (data: any): number[] => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data.map(item => Number(item)).filter(num => !isNaN(num));
  }
  
  if (typeof data === 'number') {
    return [data];
  }
  
  if (typeof data === 'string') {
    const num = Number(data);
    return isNaN(num) ? [] : [num];
  }
  
  return [];
};

const Archive = () => {
  const [returnReason, setReturnReason] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ type: 'order' | 'return'; itemId: number } | null>(null);

  const { data: archivedOrders = [], refetch: refetchArchivedOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['archived-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, city, totalorder, schedule_id, return_reason, schedule_id_if_changed')
        .not('schedule_id', 'is', null)
        .order('ordernumber', { ascending: false });

      if (error) throw error;
      return data as SimpleOrder[];
    }
  });

  const { data: archivedReturns = [], refetch: refetchArchivedReturns, isLoading: returnsLoading } = useQuery({
    queryKey: ['archived-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, city, totalreturn, schedule_id, return_reason, schedule_id_if_changed')
        .not('schedule_id', 'is', null)
        .order('returnnumber', { ascending: false });

      if (error) throw error;
      return data as SimpleReturn[];
    }
  });

  const handleReturnToDistribution = async (type: 'order' | 'return', itemId: number, reason: string) => {
    try {
      console.log(`Starting return to distribution for ${type} ${itemId} with reason: ${reason}`);
      
      const table = type === 'order' ? 'mainorder' : 'mainreturns';
      const idField = type === 'order' ? 'ordernumber' : 'returnnumber';
      
      // First, get the current item data to preserve existing history
      const { data: currentItem, error: fetchError } = await supabase
        .from(table)
        .select('schedule_id, schedule_id_if_changed, return_reason')
        .eq(idField, itemId)
        .single();

      if (fetchError) {
        console.error('Error fetching current item:', fetchError);
        return;
      }

      console.log('Current item data:', currentItem);

      // Create new return reason entry with the correct structure
      const newReasonEntry = {
        type: reason,
        responsible: 'משרד',
        timestamp: new Date().toISOString()
      };

      // Build return reason history
      const existingReasonHistory = parseReturnReasonHistory(currentItem.return_reason);
      const updatedReasonHistory = [...existingReasonHistory, newReasonEntry];

      // Build schedule ID history - avoid duplicates
      const existingScheduleHistory = parseScheduleIdHistory(currentItem.schedule_id_if_changed);
      let updatedScheduleHistory = [...existingScheduleHistory];
      
      if (currentItem.schedule_id && !existingScheduleHistory.includes(currentItem.schedule_id)) {
        updatedScheduleHistory.push(currentItem.schedule_id);
      }

      // Convert arrays to JSON before sending to database
      const updateData = {
        schedule_id: null,
        return_reason: JSON.parse(JSON.stringify(updatedReasonHistory)),
        schedule_id_if_changed: JSON.parse(JSON.stringify(updatedScheduleHistory))
      };

      console.log('Update data:', updateData);

      const { error, data: updatedData } = await supabase
        .from(table)
        .update(updateData)
        .eq(idField, itemId)
        .select();

      if (error) {
        console.error('Error returning item to distribution:', error);
        return;
      }

      console.log('Update successful:', updatedData);
      console.log(`${type} ${itemId} returned to distribution with reason: ${reason}`);
      
      // Refetch the data
      if (type === 'order') {
        refetchArchivedOrders();
      } else {
        refetchArchivedReturns();
      }
      
    } catch (error) {
      console.error('Error in handleReturnToDistribution:', error);
    }
  };

  const handleOpenReturnDialog = (type: 'order' | 'return', itemId: number) => {
    setSelectedItem({ type, itemId });
    setReturnReason('');
  };

  const handleCloseReturnDialog = () => {
    setSelectedItem(null);
    setReturnReason('');
  };

  const handleConfirmReturn = async () => {
    if (!selectedItem || !returnReason) return;
    await handleReturnToDistribution(selectedItem.type, selectedItem.itemId, returnReason);
    handleCloseReturnDialog();
  };

  const isLoading = ordersLoading || returnsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6">ארכיון</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">הזמנות בארכיון</h2>
        {archivedOrders.length === 0 ? (
          <p className="text-gray-500">אין הזמנות בארכיון.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedOrders.map((order) => (
              <Card key={order.ordernumber}>
                <CardHeader>
                  <CardTitle>הזמנה #{order.ordernumber}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>לקוח: {order.customername}</p>
                  <p>עיר: {order.city}</p>
                  <p>סכום: ₪{order.totalorder}</p>
                  <Button onClick={() => handleOpenReturnDialog('order', order.ordernumber)} variant="outline">
                    החזרה להפצה
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">החזרות בארכיון</h2>
        {archivedReturns.length === 0 ? (
          <p className="text-gray-500">אין החזרות בארכיון.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedReturns.map((returnItem) => (
              <Card key={returnItem.returnnumber}>
                <CardHeader>
                  <CardTitle>החזרה #{returnItem.returnnumber}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>לקוח: {returnItem.customername}</p>
                  <p>עיר: {returnItem.city}</p>
                  <p>סכום: ₪{returnItem.totalreturn}</p>
                  <Button onClick={() => handleOpenReturnDialog('return', returnItem.returnnumber)} variant="outline">
                    החזרה להפצה
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Return Confirmation Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>החזרה להפצה</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="returnReason">סיבת החזרה</Label>
                <Textarea
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="הזן סיבה להחזרה..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={handleCloseReturnDialog}>
                  ביטול
                </Button>
                <Button onClick={handleConfirmReturn}>אישור החזרה</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Archive;
