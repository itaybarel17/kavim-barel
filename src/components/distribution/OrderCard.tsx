
import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
}

interface OrderCardProps {
  type: 'order' | 'return';
  data: Order | Return;
  onDragStart: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ type, data, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { type, data },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      onDragStart({ type, data });
    },
  }));

  const isOrder = type === 'order';
  const number = isOrder ? (data as Order).ordernumber : (data as Return).returnnumber;
  const total = isOrder ? (data as Order).totalorder : (data as Return).totalreturn;

  return (
    <Card
      ref={drag}
      className={`min-w-[250px] cursor-move ${isDragging ? 'opacity-50' : ''} ${
        isOrder ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-sm font-semibold ${isOrder ? 'text-blue-600' : 'text-red-600'}`}>
            {isOrder ? 'הזמנה' : 'החזרה'} #{number}
          </span>
          <span className="text-sm font-bold">₪{total?.toLocaleString()}</span>
        </div>
        <h3 className="font-medium text-sm mb-1">{data.customername}</h3>
        <p className="text-xs text-muted-foreground">{data.address}</p>
        <p className="text-xs text-muted-foreground">{data.city}</p>
      </CardContent>
    </Card>
  );
};
