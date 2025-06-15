import React from 'react';
import { useDrop } from 'react-dnd';
import { CalendarCard } from './CalendarCard';
import { getUniqueCustomersForSchedule } from '@/utils/scheduleUtils';
import type { OrderWithSchedule, ReturnWithSchedule } from '@/utils/scheduleUtils';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  agents?: any;
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

interface User {
  agentnumber: string;
  agentname: string;
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
  currentUser?: User;
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
  currentUser,
}) => {
  // Filter schedules by agent (admin sees all)
  const isAdmin = currentUser?.agentnumber === "4";

  // Calculate for each schedule if allowed for agent
  const allowedGroupIds = React.useMemo(() => {
    if (isAdmin) return null; // All
    if (!currentUser) return [];
    
    // Get groups where agent is allowed OR groups that contain agent 99 orders
    const agentAllowedGroups = distributionGroups
      .filter((group) => {
        if (!group.agents) return false;
        if (Array.isArray(group.agents)) {
          return group.agents.includes(parseInt(currentUser.agentnumber));
        }
        if (typeof group.agents === "string") {
          try {
            const arr = JSON.parse(group.agents);
            return arr.includes(parseInt(currentUser.agentnumber));
          } catch {
            return false;
          }
        }
        return false;
      })
      .map((group) => group.groups_id);

    // Also include groups that have agent 99 orders - everyone should see these
    const agent99GroupIds = new Set<number>();
    distributionSchedules.forEach(schedule => {
      const hasAgent99Orders = orders.some(order => 
        (order.schedule_id === schedule.schedule_id || 
         (order.schedule_id_if_changed && 
          ((typeof order.schedule_id_if_changed === 'object' && order.schedule_id_if_changed.schedule_id === schedule.schedule_id) ||
           order.schedule_id_if_changed === schedule.schedule_id))) &&
        order.agentnumber === '99'
      );
      
      const hasAgent99Returns = returns.some(returnItem => 
        (returnItem.schedule_id === schedule.schedule_id || 
         (returnItem.schedule_id_if_changed && 
          ((typeof returnItem.schedule_id_if_changed === 'object' && returnItem.schedule_id_if_changed.schedule_id === schedule.schedule_id) ||
           returnItem.schedule_id_if_changed === schedule.schedule_id))) &&
        returnItem.agentnumber === '99'
      );

      if (hasAgent99Orders || hasAgent99Returns) {
        agent99GroupIds.add(schedule.groups_id);
      }
    });

    return [...agentAllowedGroups, ...Array.from(agent99GroupIds)];
  }, [currentUser, isAdmin, distributionGroups, distributionSchedules, orders, returns]);

  const filteredSchedulesWithItems = distributionSchedules.filter(schedule => {
    if (!isAdmin) {
      if (!allowedGroupIds || !allowedGroupIds.includes(schedule.groups_id))
        return false;
    }
    const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, schedule.schedule_id);
    return uniqueCustomers.size > 0;
  });

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

  // Only admin can drop to kanban
  const [{ isOver }, drop] = useDrop(() => ({
    accept: (isAdmin ? ['calendar-card', 'card'] : []),
    drop: (item: { scheduleId?: number; type?: 'order' | 'return'; data?: OrderWithSchedule | ReturnWithSchedule }) => {
      if (isAdmin && item.scheduleId && onDropToKanban) {
        onDropToKanban(item.scheduleId);
      }
    },
    collect: (monitor) => ({
      isOver: isAdmin && monitor.isOver(),
    }),
  }), [isAdmin, onDropToKanban]);

  const schedulesWithItems = filteredSchedulesWithItems;
  const unscheduledSchedules = schedulesWithItems
    .filter(schedule => !schedule.distribution_date)
    .sort((a, b) => a.schedule_id - b.schedule_id);

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
                currentUser={currentUser}
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
