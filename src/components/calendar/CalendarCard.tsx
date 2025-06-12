
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
}

export const CalendarCard: React.FC<CalendarCardProps> = ({
  scheduleId,
  groupId,
  distributionGroups,
  drivers,
  orders,
  returns,
  driverId
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

  return (
    <Card
      ref={drag}
      className={`min-w-[220px] max-w-[250px] cursor-move border-blue-200 bg-blue-50 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <CardContent className="p-3">
        <div className="mb-2">
          <h3 className="font-semibold text-sm text-blue-800">{group?.separation || 'אזור לא מוגדר'}</h3>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>מזהה: {scheduleId}</span>
            <span>נהג: {driver?.nahag || 'לא מוגדר'}</span>
          </div>
        </div>

        <div className="mb-2">
          <div className="text-xs font-medium text-gray-700 mb-1">נקודות:</div>
          <div className="max-h-16 overflow-y-auto text-xs space-y-0.5">
            {uniqueCustomersList.slice(0, 4).map((customer, index) => (
              <div key={index} className="text-gray-600">• {customer}</div>
            ))}
            {uniqueCustomersList.length > 4 && (
              <div className="text-gray-500 italic">ועוד {uniqueCustomersList.length - 4}...</div>
            )}
          </div>
        </div>

        <div className="border-t pt-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>סה"כ נקודות:</span>
            <span className="font-medium">{uniqueCustomersList.length}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>סה"כ הזמנות:</span>
            <span className="font-medium">₪{totalOrdersAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>סה"כ החזרות:</span>
            <span className="font-medium">₪{totalReturnsAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>({totalOrders} הזמנות, {totalReturns} החזרות)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
