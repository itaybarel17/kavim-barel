
import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
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
  const date = isOrder ? (data as Order).orderdate : (data as Return).returndate;
  
  // Check if invoice number exists (for orders only)
  const hasInvoiceNumber = isOrder && (data as Order).invoicenumber != null;

  return (
    <Card
      ref={drag}
      className={`min-w-[250px] cursor-move ${isDragging ? 'opacity-50' : ''} ${
        isOrder ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
      } ${hasInvoiceNumber ? 'ring-2 ring-green-300' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-sm font-semibold ${isOrder ? 'text-blue-600' : 'text-red-600'}`}>
            {isOrder ? `#${number}` : `החזרה #${number}`}
          </span>
          <span className="text-sm font-bold">₪{total?.toLocaleString()}</span>
        </div>
        <h3 className="font-medium text-sm mb-1">{data.customername}</h3>
        <p className="text-xs text-muted-foreground">{data.address}</p>
        <p className="text-xs text-muted-foreground">{data.city}</p>
        
        <div className="mt-2 space-y-1">
          {data.customernumber && (
            <p className="text-xs text-muted-foreground">
              לקוח: {data.customernumber}
            </p>
          )}
          {data.agentnumber && (
            <p className="text-xs text-muted-foreground">
              סוכן: {data.agentnumber}
            </p>
          )}
          {date && (
            <p className="text-xs text-muted-foreground">
              תאריך: {new Date(date).toLocaleDateString('he-IL')}
            </p>
          )}
        </div>

        {hasInvoiceNumber && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            חשבונית: {(data as Order).invoicenumber}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
