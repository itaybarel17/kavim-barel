
import React from 'react';
import { useDrop } from 'react-dnd';
import { CalendarCard } from './CalendarCard';
import { getUniqueCustomersForSchedule } from '@/utils/scheduleUtils';
import type { OrderWithSchedule, ReturnWithSchedule } from '@/utils/scheduleUtils';

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
  orders: OrderWithSchedule[];
  returns: ReturnWithSchedule[];
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
    accept: ['calendar-card', 'card'], // Accept both calendar cards and regular order/return cards
    drop: (item: { scheduleId?: number; type?: 'order' | 'return'; data?: OrderWithSchedule | ReturnWithSchedule }) => {
      if (item.scheduleId && onDropToKanban) {
        onDropToKanban(item.scheduleId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Filter schedules that have assigned items (orders or returns) using effective schedule ID logic
  const schedulesWithItems = distributionSchedules.filter(schedule => {
    const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, schedule.schedule_id);
    return uniqueCustomers.size > 0;
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
                driverId={schedule.driver_id}
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
