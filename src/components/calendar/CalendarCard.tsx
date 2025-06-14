
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  invoicenumber?: number;
  return_reason?: any;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  return_reason?: any;
}

interface CalendarCardProps {
  type: 'order' | 'return';
  data: Order | Return;
  onClick?: () => void;
}

export const CalendarCard: React.FC<CalendarCardProps> = ({ type, data, onClick }) => {
  const isOrder = type === 'order';
  const number = isOrder ? (data as Order).ordernumber : (data as Return).returnnumber;
  const total = isOrder ? (data as Order).totalorder : (data as Return).totalreturn;
  
  // Check if this item was returned
  const wasReturned = data.return_reason != null;
  
  // Check if invoice number exists (for orders only)
  const hasInvoiceNumber = isOrder && (data as Order).invoicenumber != null;

  return (
    <Card
      className={`min-w-[200px] cursor-pointer transition-all hover:shadow-md ${
        isOrder ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
      } ${hasInvoiceNumber ? 'ring-2 ring-green-300' : ''} ${
        wasReturned ? 'opacity-75' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <span 
            className={`text-sm font-semibold ${
              isOrder ? 'text-blue-600' : 'text-red-600'
            } ${wasReturned ? 'line-through' : ''}`}
          >
            {isOrder ? `#${number}` : `החזרה #${number}`}
          </span>
          <span 
            className={`text-sm font-bold ${wasReturned ? 'line-through' : ''}`}
          >
            ₪{total?.toLocaleString()}
          </span>
        </div>
        
        <h3 
          className={`font-medium text-sm mb-1 ${wasReturned ? 'line-through' : ''}`}
        >
          {data.customername}
        </h3>
        
        <p 
          className={`text-xs text-muted-foreground ${wasReturned ? 'line-through' : ''}`}
        >
          {data.address}
        </p>
        
        <p 
          className={`text-xs text-muted-foreground ${wasReturned ? 'line-through' : ''}`}
        >
          {data.city}
        </p>

        {hasInvoiceNumber && !wasReturned && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            חשבונית: {(data as Order).invoicenumber}
          </div>
        )}

        {wasReturned && (
          <div className="mt-2 text-xs text-orange-600 font-medium">
            הוחזר: {data.return_reason.action} - {data.return_reason.entity}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
