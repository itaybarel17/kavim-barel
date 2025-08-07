import React from 'react';
import { useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Printer } from 'lucide-react';
import { CalendarCard } from './CalendarCard';
import { AgentFilter } from './AgentFilter';
import { ShowMyActivityToggle } from './ShowMyActivityToggle';
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
  multiOrderActiveCustomerList?: {
    name: string;
    city: string;
  }[];
  dualActiveOrderReturnCustomers?: {
    name: string;
    city: string;
  }[];
  currentUser?: User;
  customerReplacementMap?: Map<string, any>;
  agents?: { agentnumber: string; agentname: string }[];
  selectedAgent?: string;
  onAgentChange?: (agent: string) => void;
  showOnlyMyActivity?: boolean;
  onShowMyActivityChange?: (checked: boolean) => void;
  
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
  customerReplacementMap,
  agents = [],
  selectedAgent = '4',
  onAgentChange,
  showOnlyMyActivity = false,
  onShowMyActivityChange,
  
}) => {
  // Filter schedules by agent (admin sees all)
  const isAdmin = currentUser?.agentnumber === "4";
  const isAgent99 = currentUser?.agentnumber === "99";

  // Calculate for each schedule if allowed for agent
  const allowedGroupIds = React.useMemo(() => {
    if (isAdmin) {
      // Admin can filter by selected agent using actual orders/returns
      if (selectedAgent && selectedAgent !== '4') {
        const agentScheduleIds = new Set<number>();
        distributionSchedules.forEach(schedule => {
          const hasAgentOrders = orders.some(order => {
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
            return relevantScheduleIds.includes(schedule.schedule_id) && String(order.agentnumber) === String(selectedAgent);
          });
          const hasAgentReturns = returns.some(returnItem => {
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
            return relevantScheduleIds.includes(schedule.schedule_id) && String(returnItem.agentnumber) === String(selectedAgent);
          });
          if (hasAgentOrders || hasAgentReturns) {
            agentScheduleIds.add(schedule.schedule_id);
          }
        });
        return Array.from(agentScheduleIds);
      }
      return null; // Show all when "משרד" is selected
    }
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
          return relevantScheduleIds.includes(schedule.schedule_id) && String(order.agentnumber) === '99';
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
          return relevantScheduleIds.includes(schedule.schedule_id) && String(returnItem.agentnumber) === '99';
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
  }, [currentUser, isAdmin, isAgent99, distributionGroups, distributionSchedules, orders, returns, selectedAgent]);
  const filteredSchedulesWithItems = distributionSchedules.filter(schedule => {
    if (isAdmin && selectedAgent && selectedAgent !== '4') {
      // When admin filters by specific agent, check if schedule_id is in allowed list
      if (!allowedGroupIds || !allowedGroupIds.includes(schedule.schedule_id)) return false;
    } else if (!isAdmin && !isAgent99) {
      if (!allowedGroupIds || !allowedGroupIds.includes(schedule.groups_id)) return false;
    }
    if (isAgent99 && (!allowedGroupIds || !allowedGroupIds.includes(schedule.schedule_id))) {
      return false;
    }
    const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, schedule.schedule_id);
    return uniqueCustomers.size > 0;
  });
  const hasPriorityCustomers = (schedule: DistributionSchedule): boolean => {
    const scheduleOrders = orders.filter(order => order.schedule_id === schedule.schedule_id || order.schedule_id_if_changed && (typeof order.schedule_id_if_changed === 'object' && order.schedule_id_if_changed.schedule_id === schedule.schedule_id || order.schedule_id_if_changed === schedule.schedule_id));
    const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === schedule.schedule_id || returnItem.schedule_id_if_changed && (typeof returnItem.schedule_id_if_changed === 'object' && returnItem.schedule_id_if_changed.schedule_id === schedule.schedule_id || returnItem.schedule_id_if_changed === schedule.schedule_id));
    const allCustomers = [...scheduleOrders, ...scheduleReturns];

    // Check if any customer in this schedule has blue or red icons
    return allCustomers.some(item => {
      const customerKey = `${item.customername}^^${item.city}`;
      return multiOrderActiveCustomerList.some(customer => `${customer.name}^^${customer.city}` === customerKey) || dualActiveOrderReturnCustomers.some(customer => `${customer.name}^^${customer.city}` === customerKey);
    });
  };

  // Only admin can drop to kanban
  const [{
    isOver
  }, drop] = useDrop(() => ({
    accept: isAdmin ? ['calendar-card', 'card'] : [],
    drop: (item: {
      scheduleId?: number;
      type?: 'order' | 'return';
      data?: OrderWithSchedule | ReturnWithSchedule;
    }) => {
      if (isAdmin && item.scheduleId && onDropToKanban) {
        onDropToKanban(item.scheduleId);
      }
    },
    collect: monitor => ({
      isOver: isAdmin && monitor.isOver()
    })
  }), [isAdmin, onDropToKanban]);
  const schedulesWithItems = filteredSchedulesWithItems;
  const unscheduledSchedules = schedulesWithItems.filter(schedule => !schedule.distribution_date).sort((a, b) => a.schedule_id - b.schedule_id);
  return (
    <div ref={drop} className={`mb-8 ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''}`}>
      <div className="flex items-center justify-between mb-4 px-2 lg:px-0">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-700">
          קווי חלוקה
        </h2>
        {isAdmin && onAgentChange && (
          <AgentFilter
            agents={agents}
            selectedAgent={selectedAgent}
            onAgentChange={onAgentChange}
          />
        )}
        {!isAdmin && onShowMyActivityChange && (
          <ShowMyActivityToggle
            checked={showOnlyMyActivity}
            onCheckedChange={onShowMyActivityChange}
          />
        )}
      </div>
      {unscheduledSchedules.length > 0 ? (
        <Card className="mb-6 p-3 lg:p-4 mx-2 lg:mx-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base lg:text-lg font-medium text-gray-700">
              לא מתוזמן
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Map className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 -mx-1">
            {unscheduledSchedules.map(schedule => (
              <div key={schedule.schedule_id} className="flex-shrink-0 min-w-[280px] lg:min-w-[320px]">
                <CalendarCard 
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
                  customerReplacementMap={customerReplacementMap}
                  
                />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="text-center py-8 text-gray-500 mx-2 lg:mx-0">
          {isOver ? 'שחרר כאן כדי להחזיר לקווי חלוקה לא מתוזמנים' : 'אין קווי חלוקה לא מתוזמנים'}
        </div>
      )}
    </div>
  );
};
