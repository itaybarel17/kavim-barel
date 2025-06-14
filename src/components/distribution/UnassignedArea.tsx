
import React from 'react';
import { useDrop } from 'react-dnd';
import { OrderCard } from './OrderCard';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
}

interface UnassignedAreaProps {
  unassignedOrders: Order[];
  unassignedReturns: Return[];
  onDragStart: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  onDropToUnassigned: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
}

export const UnassignedArea: React.FC<UnassignedAreaProps> = ({
  unassignedOrders,
  unassignedReturns,
  onDragStart,
  onDropToUnassigned,
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      console.log('Dropping item back to unassigned area:', item);
      onDropToUnassigned(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">הזמנות והחזרות ללא שיוך</h2>
      <div 
        ref={drop}
        className={`flex gap-4 overflow-x-auto pb-4 min-h-[120px] border-2 border-dashed rounded-lg p-4 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        {unassignedOrders.map((order) => (
          <OrderCard
            key={`order-${order.ordernumber}`}
            type="order"
            data={order}
            onDragStart={onDragStart}
          />
        ))}
        {unassignedReturns.map((returnItem) => (
          <OrderCard
            key={`return-${returnItem.returnnumber}`}
            type="return"
            data={returnItem}
            onDragStart={onDragStart}
          />
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
