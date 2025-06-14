
import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';

// Path for prominent customer blue/red icons
import BlueCustomerIcon from '/blue-customer.svg';
import RedCustomerIcon from '/red-customer.svg';

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
  totalinvoice?: number;
  done_mainorder?: string | null;
  ordercancel?: string | null;
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
  done_return?: string | null;
  returncancel?: string | null;
}

interface OrderCardProps {
  type: 'order' | 'return';
  data: Order | Return;
  onDragStart: (item: { type: 'order' | 'return'; data: Order | Return }) => void;

  // lists for smarter customer icons
  multiOrderActiveCustomerList?: { name: string; city: string }[];
  dualActiveOrderReturnCustomers?: { name: string; city: string }[];
}

export const OrderCard: React.FC<OrderCardProps> = ({
  type,
  data,
  onDragStart,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
}) => {
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

  // For archive or future: check for invoicedate display.
  const invoicedate = isOrder ? (data as any).invoicedate : undefined;
  const hasInvoiceNumber = isOrder && (data as Order).invoicenumber != null;
  const totalInvoice = isOrder ? (data as Order).totalinvoice : undefined;

  // Smart icon logic
  // כאן השוואת שם + עיר (case/city-insensitive)
  const isMultiOrderActive = multiOrderActiveCustomerList.some(
    (cust) =>
      cust.name === data.customername && cust.city === data.city
  );
  const isDualActiveOrderReturn = dualActiveOrderReturnCustomers.some(
    (cust) =>
      cust.name === data.customername && cust.city === data.city
  );

  // Size for prominent icon
  const iconSize = 24;

  return (
    <Card
      ref={drag}
      className={`min-w-[250px] cursor-move ${isDragging ? 'opacity-50' : ''} ${
        isOrder ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
      } ${hasInvoiceNumber ? 'ring-2 ring-green-300' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-sm font-semibold flex items-center gap-2 ${isOrder ? 'text-blue-600' : 'text-red-600'}`}>
            {isOrder 
              ? 
                <>#{number}
                {date && (
                  <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>
                )}
                </>
              : 
                <>החזרה #{number}
                {date && (
                  <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>
                )}
                </>
            }
          </span>
          <span className="text-sm font-bold">₪{total?.toLocaleString()}</span>
        </div>
        <h3 className="font-medium text-sm mb-1 flex items-center gap-2">
          {data.customername}
        </h3>
        <p className="text-xs text-muted-foreground">{data.address}</p>
        <p className="text-xs text-muted-foreground">{data.city}</p>
        
        <div className="mt-2 space-y-1 flex flex-col">
          <div className="flex items-center gap-2">
            {data.customernumber && (
              <>
                <span className="text-xs text-muted-foreground">
                  לקוח: {data.customernumber}
                </span>
                {/* prominent icons logic */}
                {isOrder && isMultiOrderActive && (
                  <img
                    src={BlueCustomerIcon}
                    alt="לקוח עם כמה הזמנות פעילות"
                    style={{ width: iconSize, height: iconSize }}
                    className="inline align-middle"
                    title="ללקוח זה יש יותר מהזמנה אחת פעילה"
                  />
                )}
                {isDualActiveOrderReturn && (
                  <img
                    src={RedCustomerIcon}
                    alt="לקוח עם החזרה וגם הזמנה פעילים"
                    style={{ width: iconSize, height: iconSize }}
                    className="inline align-middle"
                    title="יש ללקוח זה הזמנה והחזרה פעילות"
                  />
                )}
              </>
            )}
          </div>
          {data.agentnumber && (
            <p className="text-xs text-muted-foreground">
              סוכן: {data.agentnumber}
            </p>
          )}
        </div>
        {/* Show archive invoice date in green if exists */}
        {invoicedate && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            {new Date(invoicedate).toLocaleDateString('he-IL')}
          </div>
        )}
        {/* show invoice number/total invoice as before */}
        {hasInvoiceNumber && (
          <div className="mt-2 text-xs text-green-600 font-medium space-y-1">
            <div>חשבונית: {(data as Order).invoicenumber}</div>
            {totalInvoice && (
              <div>סה"כ: ₪{totalInvoice.toLocaleString('he-IL')}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
