import React from 'react';
import { Card } from '@/components/ui/card';
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

interface ViewOnlyHorizontalKanbanProps {
  distributionSchedules: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: OrderWithSchedule[];
  returns: ReturnWithSchedule[];
  multiOrderActiveCustomerList?: {
    name: string;
    city: string;
  }[];
  dualActiveOrderReturnCustomers?: {
    name: string;
    city: string;
  }[];
  currentUser?: User;
}

export const ViewOnlyHorizontalKanban: React.FC<ViewOnlyHorizontalKanbanProps> = ({
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  currentUser
}) => {
  // Filter schedules by agent (admin sees all)
  const isAdmin = currentUser?.agentnumber === "4";
  const isAgent99 = currentUser?.agentnumber === "99";

  // Calculate for each schedule if allowed for agent
  const allowedGroupIds = React.useMemo(() => {
    if (isAdmin) return null; // All
    if (!currentUser) return [];

    // Special logic for Agent 99 - only see specific schedule_ids that have his orders/returns
    if (isAgent99) {
      const agent99ScheduleIds = new Set<number>();
      distributionSchedules.forEach(schedule => {
        const hasAgent99Orders = orders.some(order => {
          const relevantScheduleIds = [];
          if (typeof order.schedule_id === 'number') relevantScheduleIds.push(order.schedule_id);
          if (order.schedule_id_if_changed) {
            if (typeof order.schedule_id_if_changed === 'number') {
              relevantScheduleIds.push(order.schedule_id_if_changed);
            } else if (Array.isArray(order.schedule_id_if_changed)) {
              order.schedule_id_if_changed.forEach(sid => {
                if (typeof sid === 'number') relevantScheduleIds.push(sid);
              });
            } else if (typeof order.schedule_id_if_changed === 'object' && order.schedule_id_if_changed.schedule_id) {
              relevantScheduleIds.push(order.schedule_id_if_changed.schedule_id);
            }
          }
          return relevantScheduleIds.includes(schedule.schedule_id) && order.agentnumber === '99';
        });
        const hasAgent99Returns = returns.some(returnItem => {
          const relevantScheduleIds = [];
          if (typeof returnItem.schedule_id === 'number') relevantScheduleIds.push(returnItem.schedule_id);
          if (returnItem.schedule_id_if_changed) {
            if (typeof returnItem.schedule_id_if_changed === 'number') {
              relevantScheduleIds.push(returnItem.schedule_id_if_changed);
            } else if (Array.isArray(returnItem.schedule_id_if_changed)) {
              returnItem.schedule_id_if_changed.forEach(sid => {
                if (typeof sid === 'number') relevantScheduleIds.push(sid);
              });
            } else if (typeof returnItem.schedule_id_if_changed === 'object' && returnItem.schedule_id_if_changed.schedule_id) {
              relevantScheduleIds.push(returnItem.schedule_id_if_changed.schedule_id);
            }
          }
          return relevantScheduleIds.includes(schedule.schedule_id) && returnItem.agentnumber === '99';
        });
        if (hasAgent99Orders || hasAgent99Returns) {
          agent99ScheduleIds.add(schedule.schedule_id);
        }
      });
      return Array.from(agent99ScheduleIds);
    }

    // Get groups where agent is allowed
    const agentAllowedGroups = distributionGroups.filter(group => {
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
    }).map(group => group.groups_id);
    return agentAllowedGroups;
  }, [currentUser, isAdmin, isAgent99, distributionGroups, distributionSchedules, orders, returns]);

  const filteredSchedulesWithItems = distributionSchedules.filter(schedule => {
    if (!isAdmin && !isAgent99) {
      if (!allowedGroupIds || !allowedGroupIds.includes(schedule.groups_id)) return false;
    }
    if (isAgent99 && (!allowedGroupIds || !allowedGroupIds.includes(schedule.schedule_id))) {
      return false;
    }
    const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, schedule.schedule_id);
    return uniqueCustomers.size > 0;
  });

  const schedulesWithItems = filteredSchedulesWithItems;
  const unscheduledSchedules = schedulesWithItems.filter(schedule => !schedule.distribution_date).sort((a, b) => a.schedule_id - b.schedule_id);

  return (
    <div className="mb-6 bg-gray-50/50 p-4 rounded-lg border border-gray-200">
      <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gray-600 px-2 lg:px-0">
        קווי חלוקה - תצוגה
      </h2>
      {unscheduledSchedules.length > 0 ? (
        <Card className="mb-4 p-3 lg:p-4 mx-2 lg:mx-0 bg-white/70">
          <h3 className="text-base lg:text-lg font-medium mb-3 text-gray-600">
            לא מתוזמן
          </h3>
          <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 -mx-1">
            {unscheduledSchedules.map(schedule => (
              <div key={schedule.schedule_id} className="flex-shrink-0 min-w-[280px] lg:min-w-[320px] opacity-80">
                <CalendarCard 
                  scheduleId={schedule.schedule_id}
                  groupId={schedule.groups_id}
                  distributionGroups={distributionGroups}
                  drivers={drivers}
                  orders={orders}
                  returns={returns}
                  driverId={schedule.driver_id}
                  showAllCustomers={true}
                  schedule={schedule}
                  multiOrderActiveCustomerList={multiOrderActiveCustomerList}
                  dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
                  currentUser={currentUser}
                />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="text-center py-6 text-gray-400 mx-2 lg:mx-0">
          אין קווי חלוקה לא מתוזמנים
        </div>
      )}
    </div>
  );
};