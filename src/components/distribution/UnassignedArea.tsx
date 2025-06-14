
import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { OrderCard } from './OrderCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
}

interface UnassignedAreaProps {
  unassignedOrders: Order[];
  unassignedReturns: Return[];
  onDragStart: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  onDropToUnassigned: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  onRefresh?: () => void;
}

export const UnassignedArea: React.FC<UnassignedAreaProps> = ({
  unassignedOrders,
  unassignedReturns,
  onDragStart,
  onDropToUnassigned,
  onRefresh,
}) => {
  const [showDelete, setShowDelete] = useState<{ type: 'order' | 'return'; number: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      console.log('Dropping item back to unassigned area:', item);
      onDropToUnassigned(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleDelete = async () => {
    if (!showDelete) return;
    setLoading(true);
    const now = new Date().toISOString();

    try {
      if (showDelete.type === 'order') {
        const { error } = await supabase
          .from('mainorder')
          .update({ ordercancel: now })
          .eq('ordernumber', showDelete.number);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mainreturns')
          .update({ returncancel: now })
          .eq('returnnumber', showDelete.number);
        if (error) throw error;
      }
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('שגיאה במחיקת הפריט');
    }

    setLoading(false);
    setShowDelete(null);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">הזמנות והחזרות ללא שיוך</h2>
      <div 
        ref={drop}
        className={`flex gap-4 overflow-x-auto pb-4 min-h-[120px] border-2 border-dashed rounded-lg p-4 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        {unassignedOrders.map((order) => (
          <div key={`order-${order.ordernumber}`} className="relative">
            <OrderCard
              type="order"
              data={order}
              onDragStart={onDragStart}
            />
            <button
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 hover:bg-gray-100"
              onClick={() => setShowDelete({ type: 'order', number: order.ordernumber })}
              aria-label="Delete order"
              title="מחק הזמנה"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          </div>
        ))}
        {unassignedReturns.map((returnItem) => (
          <div key={`return-${returnItem.returnnumber}`} className="relative">
            <OrderCard
              type="return"
              data={returnItem}
              onDragStart={onDragStart}
            />
            <button
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 hover:bg-gray-100"
              onClick={() => setShowDelete({ type: 'return', number: returnItem.returnnumber })}
              aria-label="Delete return"
              title="מחק החזרה"
            >
              <X className="w-4 h-4 text-black" />
            </button>
          </div>
        ))}
        {unassignedOrders.length === 0 && unassignedReturns.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8 w-full">
            כל ההזמנות וההחזרות משויכות לאזורים
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!showDelete} onOpenChange={val => !val && setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showDelete ? `האם למחוק את #${showDelete.number}?` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDelete(null)}
              disabled={loading}
            >לא</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >{loading ? 'מוחק...' : 'כן, למחוק'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
