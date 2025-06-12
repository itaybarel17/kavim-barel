
import React from 'react';
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
}

export const HorizontalKanban: React.FC<HorizontalKanbanProps> = ({
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns
}) => {
  // Filter schedules that have assigned items (orders or returns)
  const schedulesWithItems = distributionSchedules.filter(schedule => {
    const hasOrders = orders.some(order => order.schedule_id === schedule.schedule_id);
    const hasReturns = returns.some(returnItem => returnItem.schedule_id === schedule.schedule_id);
    return hasOrders || hasReturns;
  });

  // Separate unscheduled and scheduled items
  const unscheduledSchedules = schedulesWithItems.filter(schedule => !schedule.distribution_date);
  const scheduledSchedules = schedulesWithItems.filter(schedule => schedule.distribution_date);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">קווי חלוקה</h2>
      
      {/* Unscheduled items */}
      {unscheduledSchedules.length > 0 && (
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled items */}
      {scheduledSchedules.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-700">מתוזמן</h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {scheduledSchedules.map((schedule) => (
              <div key={schedule.schedule_id} className="flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-1">
                  {schedule.distribution_date ? 
                    new Date(schedule.distribution_date).toLocaleDateString('he-IL') : 
                    'לא מתוזמן'
                  }
                </div>
                <CalendarCard
                  scheduleId={schedule.schedule_id}
                  groupId={schedule.groups_id}
                  distributionGroups={distributionGroups}
                  drivers={drivers}
                  orders={orders}
                  returns={returns}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {schedulesWithItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          אין קווי חלוקה פעילים
        </div>
      )}
    </div>
  );
};
