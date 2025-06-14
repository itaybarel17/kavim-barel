
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Package, RotateCcw } from 'lucide-react';
import { ReturnReasonDialog } from '@/components/distribution/ReturnReasonDialog';
import { toast } from 'sonner';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  invoicedate: string;
  schedule_id?: number;
  done_mainorder?: string;
  return_reason?: any;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  returndate: string;
  schedule_id?: number;
  done_return?: string;
  return_reason?: any;
}

const Archive = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [returnDialog, setReturnDialog] = useState<{
    open: boolean;
    item: { type: 'order' | 'return'; data: Order | Return } | null;
  }>({ open: false, item: null });
  
  const queryClient = useQueryClient();

  // Fetch completed orders
  const { data: completedOrders = [] } = useQuery({
    queryKey: ['completed-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('*')
        .not('done_mainorder', 'is', null)
        .order('done_mainorder', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });

  // Fetch completed returns
  const { data: completedReturns = [] } = useQuery({
    queryKey: ['completed-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('*')
        .not('done_return', 'is', null)
        .order('done_return', { ascending: false });
      
      if (error) throw error;
      return data as Return[];
    },
  });

  // Return item mutation
  const returnItemMutation = useMutation({
    mutationFn: async ({ 
      item, 
      reason 
    }: { 
      item: { type: 'order' | 'return'; data: Order | Return }; 
      reason: { action: string; entity: string } 
    }) => {
      const isOrder = item.type === 'order';
      const table = isOrder ? 'mainorder' : 'mainreturns';
      const idField = isOrder ? 'ordernumber' : 'returnnumber';
      const doneField = isOrder ? 'done_mainorder' : 'done_return';
      const itemData = item.data as Order | Return;
      
      // Store the current schedule_id before nullifying it
      const currentScheduleId = itemData.schedule_id;
      
      const { error } = await supabase
        .from(table)
        .update({
          [doneField]: null,
          schedule_id: null,
          schedule_id_if_changed: currentScheduleId ? [currentScheduleId] : null,
          return_reason: reason,
        })
        .eq(idField, isOrder ? (itemData as Order).ordernumber : (itemData as Return).returnnumber);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completed-orders'] });
      queryClient.invalidateQueries({ queryKey: ['completed-returns'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-orders'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-returns'] });
      toast.success('הפריט הוחזר בהצלחה למערכת');
    },
    onError: (error) => {
      console.error('Error returning item:', error);
      toast.error('שגיאה בהחזרת הפריט');
    },
  });

  const handleReturnItem = (item: { type: 'order' | 'return'; data: Order | Return }) => {
    setReturnDialog({ open: true, item });
  };

  const handleReturnConfirm = (reason: { action: string; entity: string }) => {
    if (returnDialog.item) {
      returnItemMutation.mutate({ item: returnDialog.item, reason });
    }
    setReturnDialog({ open: false, item: null });
  };

  // Filter items based on search term
  const filteredOrders = completedOrders.filter(order =>
    order.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.ordernumber.toString().includes(searchTerm)
  );

  const filteredReturns = completedReturns.filter(returnItem =>
    returnItem.customername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.returnnumber.toString().includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">ארכיון הזמנות</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש לפי שם לקוח או מספר הזמנה..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {/* Completed Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              הזמנות מופקות ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.ordernumber}
                  className={`border rounded-lg p-4 ${
                    order.return_reason ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">הזמנה #{order.ordernumber}</span>
                        {order.return_reason && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            הוחזר: {order.return_reason.action} - {order.return_reason.entity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{order.customername}</p>
                      <p className="text-xs text-gray-500">{order.address}, {order.city}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>₪{order.totalorder?.toLocaleString()}</span>
                        {order.invoicedate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.invoicedate).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturnItem({ type: 'order', data: order })}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      🔙
                    </Button>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <p className="text-center text-gray-500 py-8">לא נמצאו הזמנות מופקות</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Returns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              החזרות מופקות ({filteredReturns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReturns.map((returnItem) => (
                <div
                  key={returnItem.returnnumber}
                  className={`border rounded-lg p-4 ${
                    returnItem.return_reason ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">החזרה #{returnItem.returnnumber}</span>
                        {returnItem.return_reason && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            הוחזר: {returnItem.return_reason.action} - {returnItem.return_reason.entity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{returnItem.customername}</p>
                      <p className="text-xs text-gray-500">{returnItem.address}, {returnItem.city}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>₪{returnItem.totalreturn?.toLocaleString()}</span>
                        {returnItem.returndate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(returnItem.returndate).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturnItem({ type: 'return', data: returnItem })}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      🔙
                    </Button>
                  </div>
                </div>
              ))}
              {filteredReturns.length === 0 && (
                <p className="text-center text-gray-500 py-8">לא נמצאו החזרות מופקות</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ReturnReasonDialog
        open={returnDialog.open}
        onOpenChange={(open) => setReturnDialog({ open, item: null })}
        onConfirm={handleReturnConfirm}
        itemType={returnDialog.item?.type || 'order'}
        itemNumber={
          returnDialog.item?.type === 'order'
            ? (returnDialog.item.data as Order).ordernumber
            : (returnDialog.item.data as Return).returnnumber
        }
      />
    </div>
  );
};

export default Archive;
