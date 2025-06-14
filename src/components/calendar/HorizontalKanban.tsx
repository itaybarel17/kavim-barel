
import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { CalendarCard } from './CalendarCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  ordernumber: number;
  customername: string;
  totalorder: number;
  schedule_id?: number;
  ordercancel?: string | null;
}
interface Return {
  returnnumber: number;
  customername: string;
  totalreturn: number;
  schedule_id?: number;
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
  distribution_date?: string;
  destinations?: number;
  driver_id?: number;
}
interface Driver {
  id: number;
  nahag: string;
}

interface HorizontalKanbanProps {
  distributionSchedules: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: Order[];
  returns: Return[];
  onUpdateDestinations?: (scheduleId: number) => void;
  onDropToKanban?: (scheduleId: number) => void;
}

export const HorizontalKanban: React.FC<HorizontalKanbanProps> = ({
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns,
  onUpdateDestinations,
  onDropToKanban
}) => {
  // State for archiving modal
  const [showDelete, setShowDelete] = useState<{ type: 'order' | 'return'; number: number; scheduleId: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['calendar-card', 'card'], // Accept both calendar cards and regular order/return cards
    drop: (item: { scheduleId?: number; type?: 'order' | 'return'; data?: Order | Return }) => {
      if (item.scheduleId && onDropToKanban) {
        onDropToKanban(item.scheduleId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Remove orders/returns with cancel timestamp
  const activeOrders = orders.filter(o => !o.ordercancel);
  const activeReturns = returns.filter(r => !r.returncancel);

  // Filter schedules that have assigned items (that are not archived)
  const schedulesWithItems = distributionSchedules.filter(schedule => {
    const hasOrders = activeOrders.some(order => order.schedule_id === schedule.schedule_id);
    const hasReturns = activeReturns.some(returnItem => returnItem.schedule_id === schedule.schedule_id);
    return hasOrders || hasReturns;
  });

  // Separate unscheduled and scheduled items
  const unscheduledSchedules = schedulesWithItems.filter(schedule => !schedule.distribution_date);

  // Archive logic
  const handleArchive = async () => {
    if (!showDelete) return;
    setLoading(true);
    const now = new Date().toISOString();
    if (showDelete.type === 'order') {
      // Archive ALL orders assigned to this schedule
      const { error } = await supabase
        .from('mainorder')
        .update({ ordercancel: now })
        .eq('schedule_id', showDelete.scheduleId);
      if (error) {
        setLoading(false);
        alert('שגיאה בארכוב ההזמנה');
        return;
      }
    } else {
      const { error } = await supabase
        .from('mainreturns')
        .update({ returncancel: now })
        .eq('schedule_id', showDelete.scheduleId);
      if (error) {
        setLoading(false);
        alert('שגיאה בארכוב ההחזרה');
        return;
      }
    }
    setLoading(false);
    setShowDelete(null);
    // Call destination update, Kanban refresh
    if (onUpdateDestinations) onUpdateDestinations(showDelete.scheduleId);
  };

  return (
    <div
      ref={drop}
      className={`mb-8 ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''}`}
    >
      <h2 className="text-xl font-semibold mb-4">קווי חלוקה</h2>
      {/* Only show unscheduled items */}
      {unscheduledSchedules.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">לא מתוזמן</h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {unscheduledSchedules.map((schedule) => (
              <div key={schedule.schedule_id} className="relative">
                <CalendarCard
                  scheduleId={schedule.schedule_id}
                  groupId={schedule.groups_id}
                  distributionGroups={distributionGroups}
                  drivers={drivers}
                  orders={activeOrders}
                  returns={activeReturns}
                  driverId={schedule.driver_id}
                  showAllCustomers={true}
                  onUpdateDestinations={onUpdateDestinations}
                />
                {/* Render delete (X) button in horizontal kanban only */}
                <button
                  className="absolute top-1 left-1 w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center z-10 shadow"
                  onClick={() => {
                    // Pick a type and displayed number for dialog title
                    const attachedOrder = activeOrders.find(order => order.schedule_id === schedule.schedule_id);
                    if (attachedOrder) {
                      setShowDelete({ type: 'order', number: attachedOrder.ordernumber, scheduleId: schedule.schedule_id });
                    } else {
                      // If no order, assume return
                      const attachedReturn = activeReturns.find(ret => ret.schedule_id === schedule.schedule_id);
                      setShowDelete({ type: 'return', number: attachedReturn ? attachedReturn.returnnumber : 0, scheduleId: schedule.schedule_id });
                    }
                  }}
                  aria-label="Archive"
                  title="העבר לארכיון"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {isOver ? 'שחרר כאן כדי להחזיר לקווי חלוקה לא מתוזמנים' : 'אין קווי חלוקה לא מתוזמנים'}
        </div>
      )}
      {/* Archive dialog/modal */}
      <Dialog open={!!showDelete} onOpenChange={val => !val && setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showDelete
                ? `האם למחוק את #${showDelete.number}?`
                : ""}
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
              onClick={handleArchive}
              disabled={loading}
            >{loading ? 'מוחק...' : 'כן, למחוק'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
