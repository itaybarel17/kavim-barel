
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
  dis_number?: number;
  done_schedule?: string;
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
  multiOrderActiveCustomerList?: { name: string; city: string }[];
  dualActiveOrderReturnCustomers?: { name: string; city: string }[];
}

export const HorizontalKanban: React.FC<HorizontalKanbanProps> = ({
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns,
  onUpdateDestinations,
  onDropToKanban,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['calendar-card', 'card'],
    drop: (item: { scheduleId?: number; type?: 'order' | 'return'; data?: OrderWithSchedule | ReturnWithSchedule }) => {
      if (item.scheduleId && onDropToKanban) {
        onDropToKanban(item.scheduleId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Filter schedules that have assigned items
  const schedulesWithItems = distributionSchedules.filter(schedule => {
    const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, schedule.schedule_id);
    return uniqueCustomers.size > 0;
  });

  // Function to check if a schedule has priority customers (blue or red icons)
  const hasPriorityCustomers = (schedule: DistributionSchedule): boolean => {
    const scheduleOrders = orders.filter(order => 
      order.schedule_id === schedule.schedule_id || 
      (order.schedule_id_if_changed && 
       ((typeof order.schedule_id_if_changed === 'object' && order.schedule_id_if_changed.schedule_id === schedule.schedule_id) ||
        order.schedule_id_if_changed === schedule.schedule_id))
    );
    
    const scheduleReturns = returns.filter(returnItem => 
      returnItem.schedule_id === schedule.schedule_id || 
      (returnItem.schedule_id_if_changed && 
       ((typeof returnItem.schedule_id_if_changed === 'object' && returnItem.schedule_id_if_changed.schedule_id === schedule.schedule_id) ||
        returnItem.schedule_id_if_changed === schedule.schedule_id))
    );

    const allCustomers = [...scheduleOrders, ...scheduleReturns];
    
    // Check if any customer in this schedule has blue or red icons
    return allCustomers.some(item => {
      const customerKey = `${item.customername}^^${item.city}`;
      return multiOrderActiveCustomerList.some(customer => `${customer.name}^^${customer.city}` === customerKey) ||
             dualActiveOrderReturnCustomers.some(customer => `${customer.name}^^${customer.city}` === customerKey);
    });
  };

  // Separate unscheduled schedules and sort by priority
  const unscheduledSchedules = schedulesWithItems
    .filter(schedule => !schedule.distribution_date)
    .sort((a, b) => {
      const aPriority = hasPriorityCustomers(a);
      const bPriority = hasPriorityCustomers(b);
      
      // Priority customers first
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      
      // Then by schedule_id
      return a.schedule_id - b.schedule_id;
    });

  return (
    <div
      ref={drop}
      className={`mb-8 ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''}`}
    >
      <h2 className="text-xl font-semibold mb-4">קווי חלוקה</h2>
      
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
                schedule={schedule}
                multiOrderActiveCustomerList={multiOrderActiveCustomerList}
                dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
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
