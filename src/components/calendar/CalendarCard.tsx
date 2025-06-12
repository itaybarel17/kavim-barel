import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';

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

interface Driver {
  id: number;
  nahag: string;
}

interface CalendarCardProps {
  scheduleId: number;
  groupId: number;
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: Order[];
  returns: Return[];
  driverId?: number;
  showAllCustomers?: boolean;
  onUpdateDestinations?: (scheduleId: number) => void;
  isCalendarMode?: boolean;
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
  isCalendarMode = false
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'calendar-card',
    item: { scheduleId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Find the group info
  const group = distributionGroups.find(g => g.groups_id === groupId);
  const driver = drivers.find(d => d.id === driverId);

  // Get orders and returns for this schedule
  const scheduleOrders = orders.filter(order => order.schedule_id === scheduleId);
  const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === scheduleId);

  // Calculate unique customers
  const uniqueCustomers = new Set([
    ...scheduleOrders.map(order => order.customername),
    ...scheduleReturns.map(returnItem => returnItem.customername)
  ]);
  const uniqueCustomersList = Array.from(uniqueCustomers);

  // Calculate totals in money
  const totalOrdersAmount = scheduleOrders.reduce((sum, order) => sum + (order.totalorder || 0), 0);
  const totalReturnsAmount = scheduleReturns.reduce((sum, returnItem) => sum + (returnItem.totalreturn || 0), 0);
  const totalOrders = scheduleOrders.length;
  const totalReturns = scheduleReturns.length;

  // Conditional styling for calendar mode
  const cardClasses = isCalendarMode 
    ? "w-full max-w-[160px] cursor-move border-blue-200 bg-blue-50 overflow-hidden"
    : "min-w-[250px] max-w-[280px] cursor-move border-blue-200 bg-blue-50";

  const contentPadding = isCalendarMode ? "p-1.5" : "p-3";
  const titleSize = isCalendarMode ? "text-[10px]" : "text-sm";
  const textSize = isCalendarMode ? "text-[9px]" : "text-xs";
  const spacing = isCalendarMode ? "mb-1" : "mb-2";
  const maxHeight = isCalendarMode ? "max-h-8" : "max-h-20";

  return (
    <Card
      ref={drag}
      className={`${cardClasses} ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardContent className={contentPadding}>
        <div className={spacing}>
          <h3 className={`font-semibold ${titleSize} text-blue-800 truncate`}>{group?.separation || 'אזור לא מוגדר'}</h3>
          <div className={`${textSize} text-muted-foreground`}>
            <div className="truncate">מזהה: {scheduleId}</div>
          </div>
        </div>

        <div className={spacing}>
          <div className={`${textSize} font-medium text-gray-700 mb-0.5`}>נקודות:</div>
          <div className={`${maxHeight} overflow-y-auto ${textSize} space-y-0.5`}>
            {uniqueCustomersList.slice(0, isCalendarMode ? 2 : undefined).map((customer, index) => (
              <div key={index} className="text-gray-600 truncate">• {customer}</div>
            ))}
            {isCalendarMode && uniqueCustomersList.length > 2 && (
              <div className="text-gray-500">...ועוד {uniqueCustomersList.length - 2}</div>
            )}
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
          {isCalendarMode && (
            <>
              <div className={`${textSize} text-gray-700 font-medium`}>
                נהג: {driver?.nahag || 'לא מוגדר'}
              </div>
              <div className={`${textSize} text-gray-500`}>
                {totalOrders} הזמנות, {totalReturns} החזרות
              </div>
            </>
          )}
          {!isCalendarMode && (
            <div className={`flex justify-between ${textSize} text-gray-500 mt-1`}>
              <span>({totalOrders} הזמנות, {totalReturns} החזרות)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
