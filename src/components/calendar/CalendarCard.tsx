import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { 
  getOrdersByScheduleId, 
  getReturnsByScheduleId, 
  getUniqueCustomersForSchedule,
  isItemModified,
  getOriginalScheduleId,
  getNewScheduleId,
  isCustomerCompletelyTransferred
} from '@/utils/scheduleUtils';
import type { OrderWithSchedule, ReturnWithSchedule } from '@/utils/scheduleUtils';

interface DistributionGroup {
  groups_id: number;
  separation: string;
}

interface Driver {
  id: number;
  nahag: string;
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

interface CalendarCardProps {
  scheduleId: number;
  groupId: number;
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: OrderWithSchedule[];
  returns: ReturnWithSchedule[];
  driverId?: number;
  showAllCustomers?: boolean;
  onUpdateDestinations?: (scheduleId: number) => void;
  isCalendarMode?: boolean;
  schedule?: DistributionSchedule;
  multiOrderActiveCustomerList?: { name: string; city: string }[];
  dualActiveOrderReturnCustomers?: { name: string; city: string }[];
  currentUser?: { agentnumber: string; agentname: string };
}

export const CalendarCard: React.FC<CalendarCardProps> = ({
  scheduleId,
  groupId,
  distributionGroups,
  drivers,
  orders,
  returns,
  driverId,
  showAllCustomers = false,
  onUpdateDestinations,
  isCalendarMode = false,
  schedule,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  currentUser,
}) => {
  // Check if this schedule has produced based on done_schedule timestamp
  const isProduced = schedule?.done_schedule != null;
  
  // Only admin can drag non-produced cards
  const canDrag = currentUser?.agentnumber === "4" && !isProduced;
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'calendar-card',
    item: { scheduleId },
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Find the group info
  const group = distributionGroups.find(g => g.groups_id === groupId);
  const driver = drivers.find(d => d.id === driverId);

  // Get orders and returns for this schedule using the new logic
  const scheduleOrders = getOrdersByScheduleId(orders, scheduleId);
  const scheduleReturns = getReturnsByScheduleId(returns, scheduleId);

  // Calculate unique customers using the utility function
  const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, scheduleId);
  
  // Create a map of customers with their cities for proper strikethrough logic
  const customerCityMap = new Map<string, string>();
  [...scheduleOrders, ...scheduleReturns].forEach(item => {
    if (!customerCityMap.has(item.customername)) {
      customerCityMap.set(item.customername, item.city);
    }
  });
  
  const uniqueCustomersList = Array.from(uniqueCustomers);

  // Create a map to track which customers belong to agent 99
  const agent99Customers = new Set<string>();
  [...scheduleOrders, ...scheduleReturns].forEach(item => {
    if (item.agentnumber === '99') {
      agent99Customers.add(item.customername);
    }
  });

  // Calculate totals in money
  const totalOrdersAmount = scheduleOrders.reduce((sum, order) => sum + (order.totalorder || 0), 0);
  const totalReturnsAmount = scheduleReturns.reduce((sum, returnItem) => sum + (returnItem.totalreturn || 0), 0);
  const totalOrders = scheduleOrders.length;
  const totalReturns = scheduleReturns.length;

  // Check if this schedule has modified items - but only show for scheduled cards
  const hasModifiedItems = schedule?.distribution_date ? 
    [...scheduleOrders, ...scheduleReturns].some(item => isItemModified(item)) : false;
  
  // Check if user is admin (agent "4")
  const isAdmin = currentUser?.agentnumber === "4";
  
  // Enhanced styling - all cards have normal visibility, only cursor changes based on permissions
  const cardClasses = isCalendarMode 
    ? `w-full max-w-[260px] overflow-hidden ${
        isProduced 
          ? 'cursor-not-allowed border-4 border-green-500 bg-green-50 shadow-lg' 
          : canDrag 
            ? 'cursor-move border-blue-200 bg-blue-50'
            : 'cursor-default border-blue-200 bg-blue-50'
      }`
    : `min-w-[250px] max-w-[280px] ${
        isProduced 
          ? 'cursor-not-allowed border-4 border-green-500 bg-green-50 shadow-lg' 
          : canDrag 
            ? 'cursor-move border-blue-200 bg-blue-50'
            : 'cursor-default border-blue-200 bg-blue-50'
      }`;

  const contentPadding = isCalendarMode ? "p-2" : "p-3";
  const titleSize = isCalendarMode ? "text-xs" : "text-sm";
  const textSize = isCalendarMode ? "text-[10px]" : "text-xs";
  const spacing = isCalendarMode ? "mb-1.5" : "mb-2";
  const maxHeight = isCalendarMode ? "max-h-28" : "max-h-20";

  return (
    <Card
      ref={canDrag ? drag : null}
      className={`${cardClasses} ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardContent className={contentPadding}>
        <div className={spacing}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${titleSize} ${isProduced ? 'text-green-800' : 'text-blue-800'} truncate`}>
              {group?.separation || 'אזור לא מוגדר'}
            </h3>
            <div className="flex items-center gap-1">
              {isProduced && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-green-100 text-green-800 border border-green-300">
                  הופק #{schedule?.dis_number || 'לא ידוע'}
                </Badge>
              )}
            </div>
          </div>
          <div className={`text-xs font-bold text-muted-foreground`}>
            <div className="truncate">מזהה: {scheduleId}</div>
          </div>
        </div>

        <div className={spacing}>
          <div className={`${textSize} font-medium text-gray-700 mb-0.5`}>נקודות:</div>
          <div className={`${maxHeight} overflow-y-auto ${textSize} space-y-0.5`}>
            {uniqueCustomersList.map((customer, index) => {
              const customerCity = customerCityMap.get(customer) || '';
              const isCompletelyTransferred = isCustomerCompletelyTransferred(
                customer, 
                customerCity,
                orders, 
                returns, 
                scheduleId
              );
              const isAgent99Customer = agent99Customers.has(customer);
              
              return (
                <div key={index} className={`truncate font-medium ${isCompletelyTransferred ? 'line-through' : ''} ${
                  isAgent99Customer ? 'text-pink-600' : 'text-gray-600'
                }`}>
                  • {customer}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`border-t pt-1 space-y-0.5 text-xs`}>
          <div className="flex justify-between font-bold">
            <span>סה"כ נקודות:</span>
            <span className="font-bold">{uniqueCustomersList.length}</span>
          </div>
          
          {/* Only show financial amounts for admin (agent "4") */}
          {isAdmin && (
            <>
              <div className="flex justify-between text-green-600 font-bold">
                <span>הזמנות:</span>
                <span className="font-bold">₪{totalOrdersAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold">
                <span>החזרות:</span>
                <span className="font-bold">₪{totalReturnsAmount.toLocaleString()}</span>
              </div>
            </>
          )}
          
          {/* Show driver information for both modes */}
          <div className={`text-xs text-gray-700 font-bold`}>
            נהג: {driver?.nahag || 'לא מוגדר'}
          </div>
          
          <div className={`text-xs text-gray-500 font-bold`}>
            {totalOrders} הזמנות, {totalReturns} החזרות
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
