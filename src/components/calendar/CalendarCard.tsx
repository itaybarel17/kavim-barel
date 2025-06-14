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
}) => {
  // Check if this schedule has produced based on done_schedule timestamp
  const isProduced = schedule?.done_schedule != null;
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'calendar-card',
    item: { scheduleId },
    canDrag: !isProduced, // Prevent dragging if produced
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

  // Calculate totals in money
  const totalOrdersAmount = scheduleOrders.reduce((sum, order) => sum + (order.totalorder || 0), 0);
  const totalReturnsAmount = scheduleReturns.reduce((sum, returnItem) => sum + (returnItem.totalreturn || 0), 0);
  const totalOrders = scheduleOrders.length;
  const totalReturns = scheduleReturns.length;

  // Check if this schedule has modified items - but only show for scheduled cards
  const hasModifiedItems = schedule?.distribution_date ? 
    [...scheduleOrders, ...scheduleReturns].some(item => isItemModified(item)) : false;
  
  // Enhanced styling for produced cards - remove modification styling for unscheduled cards
  const cardClasses = isCalendarMode 
    ? `w-full max-w-[160px] overflow-hidden ${
        isProduced 
          ? 'cursor-not-allowed border-4 border-green-500 bg-green-50 shadow-lg opacity-90' 
          : 'cursor-move border-blue-200 bg-blue-50'
      }`
    : `min-w-[250px] max-w-[280px] ${
        isProduced 
          ? 'cursor-not-allowed border-4 border-green-500 bg-green-50 shadow-lg opacity-90' 
          : 'cursor-move border-blue-200 bg-blue-50'
      }`;

  const contentPadding = isCalendarMode ? "p-1.5" : "p-3";
  const titleSize = isCalendarMode ? "text-[10px]" : "text-sm";
  const textSize = isCalendarMode ? "text-[9px]" : "text-xs";
  const spacing = isCalendarMode ? "mb-1" : "mb-2";
  const maxHeight = isCalendarMode ? "max-h-20" : "max-h-20";

  return (
    <Card
      ref={!isProduced ? drag : null}
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
          <div className={`${textSize} text-muted-foreground`}>
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
              
              return (
                <div key={index} className={`text-gray-600 truncate ${isCompletelyTransferred ? 'line-through' : ''}`}>
                  • {customer}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`border-t pt-1 space-y-0.5 ${textSize}`}>
          <div className="flex justify-between">
            <span>סה"כ נקודות:</span>
            <span className="font-medium">{uniqueCustomersList.length}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>הזמנות:</span>
            <span className="font-medium">₪{totalOrdersAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>החזרות:</span>
            <span className="font-medium">₪{totalReturnsAmount.toLocaleString()}</span>
          </div>
          
          {/* Show driver information for both modes */}
          <div className={`${textSize} text-gray-700 font-medium`}>
            נהג: {driver?.nahag || 'לא מוגדר'}
          </div>
          
          {isCalendarMode ? (
            <div className={`${textSize} text-gray-500`}>
              {totalOrders} הזמנות, {totalReturns} החזרות
            </div>
          ) : (
            <div className={`${textSize} text-gray-500`}>
              {totalOrders} הזמנות, {totalReturns} החזרות
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
