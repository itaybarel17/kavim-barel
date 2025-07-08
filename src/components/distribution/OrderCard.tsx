
import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Monitor } from 'lucide-react';
import { SirenButton } from './SirenButton';
import { supabase } from '@/integrations/supabase/client';

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
  alert_status?: boolean;
  end_picking_time?: string | null;
  hashavshevet?: string | null;
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
  agentnumber?: string;
  returndate?: string;
  done_return?: string | null;
  returncancel?: string | null;
  hour?: string;
  remark?: string;
  alert_status?: boolean;
}
interface OrderCardProps {
  type: 'order' | 'return';
  data: Order | Return;
  onDragStart: (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => void;

  // lists for smarter customer icons
  multiOrderActiveCustomerList?: {
    name: string;
    city: string;
  }[];
  dualActiveOrderReturnCustomers?: {
    name: string;
    city: string;
  }[];

  // new props for supply details - removed agentNameMap as we'll display agentnumber directly
  customerSupplyMap?: Record<string, string>;
  
  // new prop for siren functionality
  onSirenToggle?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
}
export const OrderCard: React.FC<OrderCardProps> = ({
  type,
  data,
  onDragStart,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
  onSirenToggle
}) => {
  // Local state for button states to ensure proper re-rendering
  const [endPickingTimeState, setEndPickingTimeState] = useState<string | null>(null);
  const [hashavshevtState, setHashavshevtState] = useState<string | null>(null);
  
  // Initialize state from data
  useEffect(() => {
    if (type === 'order') {
      const orderData = data as Order;
      setEndPickingTimeState(orderData.end_picking_time || null);
      setHashavshevtState(orderData.hashavshevet || null);
    }
  }, [data, type]);
  const [{
    isDragging
  }, drag] = useDrag(() => ({
    type: 'card',
    item: {
      type,
      data
    },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    }),
    end: () => {
      onDragStart({
        type,
        data
      });
    }
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

  // Get supply details
  const customerSupplyDetails = data.customernumber ? customerSupplyMap[data.customernumber] : '';

  // Smart icon logic
  const isMultiOrderActive = multiOrderActiveCustomerList.some(cust => cust.name === data.customername && cust.city === data.city);
  const isDualActiveOrderReturn = dualActiveOrderReturnCustomers.some(cust => cust.name === data.customername && cust.city === data.city);

  // Function to get area color
  const getAreaColor = (areaName: string) => {
    const areaColors: Record<string, string> = {
      'תל אביב': 'bg-blue-500 text-white',
      'חיפה': 'bg-green-500 text-white', 
      'ירושלים': 'bg-purple-500 text-white',
      'רמת גן': 'bg-orange-500 text-white',
      'שרון': 'bg-pink-500 text-white',
      'ראשון לציון': 'bg-indigo-500 text-white',
      'שפלה': 'bg-teal-500 text-white',
      'צפון רחוק': 'bg-red-500 text-white',
      'צפון קרוב': 'bg-cyan-500 text-white',
      'דרום': 'bg-amber-500 text-white',
      'אילת': 'bg-lime-500 text-white',
      'פתח תקווה': 'bg-violet-500 text-white',
      'חדרה': 'bg-rose-500 text-white'
    };
    return areaColors[areaName] || 'bg-gray-500 text-white';
  };

  // Size for prominent icon
  const iconSize = 24;

  // Format hour to show only hours:minutes
  const formatHour = (timeString: string) => {
    if (!timeString) return '';
    // Remove seconds from time string (e.g., "12:40:00" -> "12:40")
    return timeString.substring(0, 5);
  };

  // Handle siren toggle
  const handleSirenToggle = () => {
    if (onSirenToggle) {
      onSirenToggle({ type, data });
    }
  };

  // Handle end picking time toggle (for orders only)
  const handleEndPickingTimeToggle = async () => {
    if (!isOrder) return;
    
    const orderData = data as Order;
    const newValue = endPickingTimeState ? null : new Date().toISOString();
    
    const { error } = await supabase
      .from('mainorder')
      .update({ end_picking_time: newValue })
      .eq('ordernumber', orderData.ordernumber);
    
    if (error) {
      console.error('Error updating end_picking_time:', error);
      return;
    }
    
    // Update local data and state
    (data as Order).end_picking_time = newValue;
    setEndPickingTimeState(newValue);
  };

  // Handle hashavshevet toggle (for orders only)
  const handleHashavshevetToggle = async () => {
    if (!isOrder) return;
    
    const orderData = data as Order;
    const newValue = hashavshevtState ? null : new Date().toISOString();
    
    const { error } = await supabase
      .from('mainorder')
      .update({ hashavshevet: newValue })
      .eq('ordernumber', orderData.ordernumber);
    
    if (error) {
      console.error('Error updating hashavshevet:', error);
      return;
    }
    
    // Update local data and state
    (data as Order).hashavshevet = newValue;
    setHashavshevtState(newValue);
  };

  return <Card ref={drag} className={`min-w-[250px] cursor-move ${isDragging ? 'opacity-50' : ''} ${isOrder ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'} ${hasInvoiceNumber ? 'ring-2 ring-green-300' : ''} ${isCandyPlus ? 'ring-2 ring-pink-300 border-pink-200' : ''} ${data.alert_status ? 'ring-2 ring-red-500 shadow-lg shadow-red-200' : ''}`}>
      <CardContent className="p-4 bg-[#e8f6fb]">
        {/* שורה ראשונה: מספר הזמנה/החזרה + תאריך + שעה + כפתור ארגז קרטון */}
        <div className="flex justify-between items-start mb-2">
          <span className={`text-sm font-semibold flex items-center gap-2 ${isOrder ? 'text-blue-600' : 'text-red-600'}`}>
            {isOrder ? <>#{number}
                {date && <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>}
                {hour && <span className="ml-1">{formatHour(hour)}</span>}
                </> : <>החזרה #{number}
                {date && <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>}
                {hour && <span className="ml-1">{formatHour(hour)}</span>}
                </>}
          </span>
          {/* כפתור ארגז קרטון - רק להזמנות */}
          {isOrder && (
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full p-1 h-auto transition-all duration-200 active:scale-95 ${
                endPickingTimeState 
                  ? 'text-white bg-purple-500 shadow-lg shadow-purple-200 ring-2 ring-purple-300' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              onClick={handleEndPickingTimeToggle}
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* אזורי הפצה וכפתור מחשב באותה שורה - רק להזמנות */}
        {isOrder && (
          <div className="flex justify-between items-center mb-2">
            {/* אזורי הפצה */}
            <div className="flex flex-wrap gap-1">
              {(() => {
                const orderData = data as Order;
                
                // Parse ezor1 and ezor2 from mainorder data
                const parseArea = (ezorString: string) => {
                  if (!ezorString) return '';
                  // Remove brackets from format like "[צפון רחוק]" or "[צפון רחוק, אילת]"
                  return ezorString.replace(/[\[\]]/g, '').trim();
                };
                
                // Parse day format {א, ה} to extract day letters
                const parseDayLetters = (dayString: string) => {
                  if (!dayString) return '';
                  // Remove curly braces and split by comma
                  const cleaned = dayString.replace(/[{}]/g, '').trim();
                  if (!cleaned) return '';
                  // Split by comma and join with comma and space
                  return cleaned.split(',').map(d => d.trim()).join(', ');
                };
                
                const areas = [];
                
                // Primary area from ezor1 and day1
                const area1 = parseArea(orderData.ezor1 || '');
                const day1 = parseDayLetters(orderData.day1 || '');
                if (area1) {
                  // If ezor1 contains multiple areas, split them
                  const areaList = area1.split(',').map(a => a.trim());
                  areaList.forEach(areaName => {
                    areas.push({ name: areaName, day: day1 });
                  });
                }
                
                // Secondary area from ezor2 and day2
                const area2 = parseArea(orderData.ezor2 || '');
                const day2 = parseDayLetters(orderData.day2 || '');
                if (area2) {
                  areas.push({ name: area2, day: day2 });
                }
                
                return areas.map((area, index) => (
                  <Badge 
                    key={index} 
                    className={`text-xs px-2 py-1 font-medium ${getAreaColor(area.name)}`}
                  >
                    {area.name} <span className="font-bold bg-white/20 px-1 rounded text-white shadow-sm">{area.day}</span>
                  </Badge>
                ));
              })()}
            </div>
            
            {/* כפתור מחשב */}
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full p-1 h-auto transition-all duration-200 active:scale-95 ${
                hashavshevtState 
                  ? 'text-white bg-orange-500 shadow-lg shadow-orange-200 ring-2 ring-orange-300' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              onClick={handleHashavshevetToggle}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* שורה שנייה: שם הלקוח */}
        <h3 className="font-medium text-sm mb-1">
          {data.customername}
        </h3>
        
        {/* שורה שלישית: כתובת */}
        <p className="text-xs text-muted-foreground">{data.address}</p>
        
        {/* שורה רביעית: עיר + כפתור סירנה */}
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-muted-foreground">{data.city}</p>
          {onSirenToggle && (
            <SirenButton 
              isActive={data.alert_status || false} 
              onToggle={handleSirenToggle} 
            />
          )}
        </div>
        
        {/* שורה חמישית: הסכום */}
        <div className="mb-2">
          <span className="text-xs font-bold">₪{total?.toLocaleString()}</span>
        </div>
        
        <div className="mt-2 space-y-1 flex flex-col">
          {/* שורה שישית: מספר לקוח + מספר סוכן + אייקונים */}
          <div className="flex items-center gap-2">
            {data.customernumber && <>
                <span className="text-xs text-muted-foreground">
                  לקוח: {data.customernumber}
                </span>
                {data.agentnumber && <span className="text-xs text-muted-foreground">
                    | סוכן: {data.agentnumber}
                  </span>}
                {isCandyPlus && <Badge className="bg-pink-200 text-pink-800 border-pink-300 text-xs font-bold">
                    קנדי+
                  </Badge>}
                {/* prominent icons logic */}
                {isOrder && isMultiOrderActive && <img src={BlueCustomerIcon} alt="לקוח עם כמה הזמנות פעילות" style={{
              width: iconSize,
              height: iconSize
            }} className="inline align-middle" title="ללקוח זה יש יותר מהזמנה אחת פעילה" />}
                {isDualActiveOrderReturn && <img src={RedCustomerIcon} alt="לקוח עם החזרה וגם הזמנה פעילים" style={{
              width: iconSize,
              height: iconSize
            }} className="inline align-middle" title="יש ללקוח זה הזמנה והחזרה פעילות" />}
              </>}
          </div>
          
          {/* שורה שביעית: הערת סוכן */}
          {remark && <div className="text-xs text-gray-600">
              הערת סוכן: {remark}
            </div>}
          
          {/* שורה שמינית: פרטי אספקה */}
          {customerSupplyDetails && <div className="text-xs text-gray-600">
              אספקה: {customerSupplyDetails}
            </div>}
        </div>
        
        {/* Show archive invoice date in green if exists */}
        {invoicedate && <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-2">
            <span>{new Date(invoicedate).toLocaleDateString('he-IL')}</span>
            {isCandyPlus && <span className="text-xs font-medium text-pink-600">קנדי+</span>}
          </div>}
        {/* show invoice number/total invoice as before */}
        {hasInvoiceNumber && <div className="mt-2 text-xs text-green-600 font-medium space-y-1">
            <div>חשבונית: {(data as Order).invoicenumber}</div>
            {totalInvoice && <div>סה"כ: ₪{totalInvoice.toLocaleString('he-IL')}</div>}
          </div>}
      </CardContent>
    </Card>;
};
