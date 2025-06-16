
import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  hour?: string;
  remark?: string;
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
  hour?: string;
  remark?: string;
}

interface OrderCardProps {
  type: 'order' | 'return';
  data: Order | Return;
  onDragStart: (item: { type: 'order' | 'return'; data: Order | Return }) => void;

  // lists for smarter customer icons
  multiOrderActiveCustomerList?: { name: string; city: string }[];
  dualActiveOrderReturnCustomers?: { name: string; city: string }[];
  
  // new props for supply details and agent names
  customerSupplyMap?: Record<string, string>;
  agentNameMap?: Record<string, string>;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  type,
  data,
  onDragStart,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
  agentNameMap = {},
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
  const hour = data.hour;
  const remark = data.remark;

  // For archive or future: check for invoicedate display.
  const invoicedate = isOrder ? (data as any).invoicedate : undefined;
  const hasInvoiceNumber = isOrder && (data as Order).invoicenumber != null;
  const totalInvoice = isOrder ? (data as Order).totalinvoice : undefined;

  // Check if this is a Candy+ order (agent 99)
  const isCandyPlus = data.agentnumber === '99';

  // Get supply details and agent name
  const customerSupplyDetails = data.customernumber ? customerSupplyMap[data.customernumber] : '';
  const agentName = data.agentnumber ? agentNameMap[data.agentnumber] : '';

  // Smart icon logic
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

  // Format hour to show only hours:minutes
  const formatHour = (timeString: string) => {
    if (!timeString) return '';
    // Remove seconds from time string (e.g., "12:40:00" -> "12:40")
    return timeString.substring(0, 5);
  };

  return (
    <Card
      ref={drag}
      className={`min-w-[250px] cursor-move ${isDragging ? 'opacity-50' : ''} ${
        isOrder ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
      } ${hasInvoiceNumber ? 'ring-2 ring-green-300' : ''} ${
        isCandyPlus ? 'ring-2 ring-pink-300 border-pink-200' : ''
      }`}
    >
      <CardContent className="p-4">
        {/* שורה ראשונה: מספר הזמנה/החזרה + תאריך + שעה */}
        <div className="flex justify-between items-start mb-2">
          <span className={`text-sm font-semibold flex items-center gap-2 ${isOrder ? 'text-blue-600' : 'text-red-600'}`}>
            {isOrder 
              ? 
                <>#{number}
                {date && (
                  <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>
                )}
                {hour && (
                  <span className="ml-1">{formatHour(hour)}</span>
                )}
                </>
              : 
                <>החזרה #{number}
                {date && (
                  <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>
                )}
                {hour && (
                  <span className="ml-1">{formatHour(hour)}</span>
                )}
                </>
            }
          </span>
        </div>
        
        {/* שורה שנייה: שם הלקוח */}
        <h3 className="font-medium text-sm mb-1">
          {data.customername}
        </h3>
        
        {/* שורה שלישית: כתובת */}
        <p className="text-xs text-muted-foreground">{data.address}</p>
        
        {/* שורה רביעית: עיר */}
        <p className="text-xs text-muted-foreground mb-2">{data.city}</p>
        
        {/* שורה חמישית: הסכום */}
        <div className="mb-2">
          <span className="text-xs font-bold">₪{total?.toLocaleString()}</span>
        </div>
        
        <div className="mt-2 space-y-1 flex flex-col">
          {/* שורה שישית: מספר לקוח + שם סוכן + אייקונים */}
          <div className="flex items-center gap-2">
            {data.customernumber && (
              <>
                <span className="text-xs text-muted-foreground">
                  לקוח: {data.customernumber}
                </span>
                {agentName && (
                  <span className="text-xs text-muted-foreground">
                    | סוכן: {agentName}
                  </span>
                )}
                {isCandyPlus && (
                  <Badge className="bg-pink-200 text-pink-800 border-pink-300 text-xs font-bold">
                    קנדי+
                  </Badge>
                )}
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
          
          {/* שורה שביעית: הערת סוכן */}
          {remark && (
            <div className="text-xs text-gray-600">
              הערת סוכן: {remark}
            </div>
          )}
          
          {/* שורה שמינית: פרטי אספקה */}
          {customerSupplyDetails && (
            <div className="text-xs text-gray-600">
              אספקה: {customerSupplyDetails}
            </div>
          )}
        </div>
        
        {/* Show archive invoice date in green if exists */}
        {invoicedate && (
          <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-2">
            <span>{new Date(invoicedate).toLocaleDateString('he-IL')}</span>
            {isCandyPlus && (
              <span className="text-xs font-medium text-pink-600">קנדי+</span>
            )}
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
