import React from 'react';
import { OrderCard } from '../distribution/OrderCard';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  customernumber?: string;
  done_mainorder?: string | null;
  ordercancel?: string | null;
  hour?: string;
  remark?: string;
  alert_status?: boolean;
  ezor1?: string;
  ezor2?: string;
  day1?: string;
  day2?: string;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  customernumber?: string;
  done_return?: string | null;
  returncancel?: string | null;
  hour?: string;
  remark?: string;
  alert_status?: boolean;
}

interface ViewOnlyUnassignedAreaProps {
  unassignedOrders: Order[];
  unassignedReturns: Return[];
  multiOrderActiveCustomerList?: {
    name: string;
    city: string;
  }[];
  dualActiveOrderReturnCustomers?: {
    name: string;
    city: string;
  }[];
  customerSupplyMap?: Record<string, string>;
}

export const ViewOnlyUnassignedArea: React.FC<ViewOnlyUnassignedAreaProps> = ({
  unassignedOrders,
  unassignedReturns,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
}) => {
  // Dummy function for drag start (won't be used)
  const handleDragStart = () => {};

  return (
    <div className="mb-8 bg-white/50 border border-dashed border-gray-300 rounded-lg">
      <div className="flex items-center justify-between mb-4 mx-[8px] pt-4">
        <h2 className="text-xl font-semibold">הזמנות והחזרות ללא שיוך (תצוגה בלבד)</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[120px] border-2 border-dashed rounded-lg p-4 bg-gray-50/50">
        {unassignedOrders.map(order => (
          <div key={`order-${order.ordernumber}`} className="opacity-80 pointer-events-none">
            <OrderCard 
              type="order" 
              data={order} 
              onDragStart={handleDragStart}
              multiOrderActiveCustomerList={multiOrderActiveCustomerList} 
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} 
              customerSupplyMap={customerSupplyMap} 
            />
          </div>
        ))}
        {unassignedReturns.map(returnItem => (
          <div key={`return-${returnItem.returnnumber}`} className="opacity-80 pointer-events-none">
            <OrderCard 
              type="return" 
              data={returnItem} 
              onDragStart={handleDragStart}
              multiOrderActiveCustomerList={multiOrderActiveCustomerList} 
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} 
              customerSupplyMap={customerSupplyMap} 
            />
          </div>
        ))}
        {unassignedOrders.length === 0 && unassignedReturns.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8 w-full">
            כל ההזמנות וההחזרות משויכות לאזורים
          </div>
        )}
      </div>
    </div>
  );
};