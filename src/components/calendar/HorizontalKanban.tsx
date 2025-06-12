
import React from 'react';
import { useDrop } from 'react-dnd';
import { CalendarCard } from './CalendarCard';

interface Order {
  ordernumber: number;
  customername: string;
  totalorder: number;
  schedule_id?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  totalreturn: number;
  schedule_id?: number;
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
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'calendar-card',
    drop: (item: { scheduleId: number }) => {
      if (onDropToKanban) {
        onDropToKanban(item.scheduleId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Filter schedules that have assigned items (orders or returns)
  const schedulesWithItems = distributionSchedules.filter(schedule => {
    const hasOrders = orders.some(order => order.schedule_id === schedule.schedule_id);
    const hasReturns = returns.some(returnItem => returnItem.schedule_id === schedule.schedule_id);
    return hasOrders || hasReturns;
  });

  // Separate unscheduled and scheduled items
  const unscheduledSchedules = schedulesWithItems.filter(schedule => !schedule.distribution_date);

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
              <CalendarCard
                key={schedule.schedule_id}
                scheduleId={schedule.schedule_id}
                groupId={schedule.groups_id}
                distributionGroups={distributionGroups}
                drivers={drivers}
                orders={orders}
                returns={returns}
                showAllCustomers={true}
                onUpdateDestinations={onUpdateDestinations}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {isOver ? 'שחרר כאן כדי להחזיר לקווי חלוקה לא מתוזמנים' : 'אין קווי חלוקה לא מתוזמנים'}
        </div>
      )}
    </div>
  );
};
