
import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Monitor, X, Map, Undo2 } from 'lucide-react';
import { SirenButton } from './SirenButton';
import { MessageBadge } from './MessageBadge';
import { OrderMapDialog } from '../map/OrderMapDialog';
import { supabase } from '@/integrations/supabase/client';

// Path for prominent customer blue/red icons
import BlueCustomerIcon from '/blue-customer.svg';
import RedCustomerIcon from '/red-customer.svg';
import { getAreaColor } from '@/utils/areaColors';
import { getCityArea } from '@/utils/scheduleUtils';
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
  message_alert?: boolean | null;
  copied_to_hashavshevet?: boolean | null;
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
  message_alert?: boolean | null;
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
  customerCoordinatesMap?: Record<string, { lat: number; lng: number }>;
  
  // new prop for siren functionality
  onSirenToggle?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  
  // message props - support up to 2 messages
  messagesInfo?: Array<{ subject: string; content?: string; tagAgent?: string; agentName?: string }>;
  onMessageBadgeClick?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;

  // cancellation overlay prop
  hasCancellationMessage?: boolean;
  
  // "order on another customer" overlay details
  orderOnAnotherCustomerDetails?: {
    correctCustomer: string;
    city: string;
    newArea?: string;
    existsInSystem: boolean;
    customerData?: {
      customername: string;
      customernumber: string;
      address: string;
      city: string;
      supplydetails?: string;
    };
  };
  
  // callback for local completion status updates
  onLocalCompletionChange?: (ordernumber: number, isCompleted: boolean) => void;
  
  // horizontal kanban flag
  isHorizontalKanban?: boolean;
  
  // return to horizontal kanban button
  onReturnToHorizontal?: () => void;
}
export const OrderCard: React.FC<OrderCardProps> = ({
  type,
  data,
  onDragStart,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
  customerCoordinatesMap = {},
  onSirenToggle,
  messagesInfo,
  onMessageBadgeClick,
  hasCancellationMessage = false,
  orderOnAnotherCustomerDetails,
  onLocalCompletionChange,
  isHorizontalKanban = false,
  onReturnToHorizontal
}) => {
  // Initialize state from data
  useEffect(() => {
    if (type === 'order') {
      const orderData = data as Order;
      setEndPickingTimeState(orderData.end_picking_time || null);
      setHashavshevtState(orderData.hashavshevet || null);
    }
  }, [data, type]);

  // Local state for button states to ensure proper re-rendering
  const [endPickingTimeState, setEndPickingTimeState] = useState<string | null>(
    type === 'order' ? (data as Order).end_picking_time || null : null
  );
  const [hashavshevtState, setHashavshevtState] = useState<string | null>(
    type === 'order' ? (data as Order).hashavshevet || null : null
  );
  const [setAsideState, setSetAsideState] = useState<boolean>(
    type === 'order' ? (data as any).set_aside || false : false
  );
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
  
  // Get customer coordinates
  const customerCoordinates = data.customernumber ? customerCoordinatesMap[data.customernumber] : undefined;

  // Smart icon logic
  const isMultiOrderActive = multiOrderActiveCustomerList.some(cust => cust.name === data.customername && cust.city === data.city);
  const isDualActiveOrderReturn = dualActiveOrderReturnCustomers.some(cust => cust.name === data.customername && cust.city === data.city);

  // Check if this is an "order on another customer" case
  const hasOrderOnAnotherCustomer = !!orderOnAnotherCustomerDetails;
  
  // State for manual customer area lookup
  const [manualCustomerArea, setManualCustomerArea] = useState<string>('');
  
  // State for map dialog
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);


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
  const handleEndPickingTimeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag interference
    console.log('End picking time toggle clicked');
    
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
    
    // Notify parent component about the local change
    if (onLocalCompletionChange) {
      onLocalCompletionChange(orderData.ordernumber, newValue !== null);
    }
  };

  // Handle hashavshevet toggle (for orders only)
  const handleHashavshevetToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag interference
    console.log('Hashavshevet toggle clicked');
    
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

  // Handle set aside toggle (for orders only in horizontal kanban)
  const handleSetAsideToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag interference
    console.log('Set aside toggle clicked');
    
    if (!isOrder) return;
    
    const orderData = data as Order;
    const newValue = !setAsideState;
    
    const { error } = await supabase
      .from('mainorder')
      .update({ set_aside: newValue })
      .eq('ordernumber', orderData.ordernumber);
    
    if (error) {
      console.error('Error updating set_aside:', error);
      return;
    }
    
    // Update local data and state
    (data as any).set_aside = newValue;
    setSetAsideState(newValue);
  };

  // Fetch area for manual customers (when they don't exist in system)
  useEffect(() => {
    const fetchManualCustomerArea = async () => {
      if (hasOrderOnAnotherCustomer && !orderOnAnotherCustomerDetails?.existsInSystem) {
        const area = await getCityArea(orderOnAnotherCustomerDetails?.city || '');
        setManualCustomerArea(area);
      }
    };
    
    fetchManualCustomerArea();
  }, [hasOrderOnAnotherCustomer, orderOnAnotherCustomerDetails]);

  return <Card ref={drag} className={`min-w-[250px] cursor-move relative ${isDragging ? 'opacity-50' : ''} ${isOrder ? `border-blue-200 ${setAsideState ? 'bg-orange-50' : 'bg-blue-50'}` : 'border-red-200 bg-red-50'} ${(hasInvoiceNumber || (data as Order).copied_to_hashavshevet) ? 'ring-2 ring-green-300' : ''} ${isCandyPlus ? 'ring-2 ring-pink-300 border-pink-200' : ''} ${data.alert_status ? 'ring-2 ring-red-500 shadow-lg shadow-red-200' : ''}`}>
      {/* Return to horizontal kanban button - only in area kanban */}
      {!isHorizontalKanban && onReturnToHorizontal && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 left-1 z-20 rounded-full p-1 h-auto w-auto transition-all duration-200 hover:scale-110 opacity-60 hover:opacity-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            onReturnToHorizontal();
          }}
          title="החזר לקנבן אופקי"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      )}
      {/* Red X overlay for cancellation */}
      {hasCancellationMessage && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-full h-1 bg-red-600 transform rotate-45 absolute"></div>
          <div className="w-full h-1 bg-red-600 transform -rotate-45 absolute"></div>
          <X className="w-12 h-12 text-red-600 bg-white rounded-full p-2 shadow-lg border-2 border-red-600" />
        </div>
      )}
      <CardContent className={`p-4 ${isOrder && setAsideState ? 'bg-orange-50' : 'bg-[#e8f6fb]'} relative ${hasOrderOnAnotherCustomer ? 'blur-[1px]' : ''}`}>
        {/* שורה ראשונה: מספר הזמנה/החזרה + תאריך + שעה + כפתור ארגז קרטון */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1">
            {/* כפתור "שים בצד" - רק בקנבן אופקי ולהזמנות */}
            {isOrder && isHorizontalKanban && (
              <Button
                variant="ghost"
                size="sm"
                className={`rounded p-0.5 h-auto transition-all duration-200 active:scale-95 pointer-events-auto relative z-10 ${
                  setAsideState 
                    ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' 
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                }`}
                onClick={handleSetAsideToggle}
                title={setAsideState ? 'החזר לרשימה' : 'שים בצד'}
              >
                <div className="w-1.5 h-4 bg-current rounded-full"></div>
              </Button>
            )}
            <span className={`text-sm font-semibold flex items-center gap-2 ${isOrder ? 'text-blue-600' : 'text-red-600'}`}>
              {isOrder ? <>#{number}
                  {date && <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>}
                  {hour && <span className="ml-1">{formatHour(hour)}</span>}
                  </> : <>החזרה #{number}
                  {date && <span className="ml-1">{new Date(date).toLocaleDateString('he-IL')}</span>}
                  {hour && <span className="ml-1">{formatHour(hour)}</span>}
                  </>}
            </span>
          </div>
          {/* כפתור ארגז קרטון - רק להזמנות */}
          {isOrder && (
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full p-1 h-auto transition-all duration-200 active:scale-95 pointer-events-auto relative z-10 ${
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
            <div className="flex flex-wrap gap-1 items-center">
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
                
                return (
                  <>
                    {areas.map((area, index) => (
                      <Badge 
                        key={index} 
                        className={`text-xs px-2 py-1 font-medium ${getAreaColor(area.name)}`}
                      >
                        {area.name} <span className="font-bold bg-white/20 px-1 rounded text-white shadow-sm">{area.day}</span>
                      </Badge>
                    ))}
                    {areas.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full p-1 h-auto transition-all duration-200 active:scale-95 pointer-events-auto relative z-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMapDialogOpen(true);
                        }}
                      >
                        <Map className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
            
            {/* כפתור מחשב */}
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full p-1 h-auto transition-all duration-200 active:scale-95 pointer-events-auto relative z-10 ${
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
        
        {/* שורה חמישית: הסכום ותווית הודעה ראשונה */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold">₪{total?.toLocaleString()}</span>
          {messagesInfo && messagesInfo[0] && (
            <MessageBadge
              subject={messagesInfo[0].subject}
              isBlinking={data.message_alert === true}
              onClick={() => onMessageBadgeClick && onMessageBadgeClick({ type, data })}
              content={messagesInfo[0].content}
              tagAgent={messagesInfo[0].tagAgent}
              agentName={messagesInfo[0].agentName}
            />
          )}
        </div>
        
        <div className="mt-2 space-y-1 flex flex-col">
          {/* שורה שישית: מספר לקוח + מספר סוכן + אייקונים + תווית הודעה שנייה */}
          <div className="flex items-center gap-2 justify-between">
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
            {/* תווית הודעה שנייה */}
            {messagesInfo && messagesInfo[1] && (
              <MessageBadge
                subject={messagesInfo[1].subject}
                isBlinking={data.message_alert === true}
                onClick={() => onMessageBadgeClick && onMessageBadgeClick({ type, data })}
                content={messagesInfo[1].content}
                tagAgent={messagesInfo[1].tagAgent}
                agentName={messagesInfo[1].agentName}
              />
            )}
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
      
      {/* White overlay for "order on another customer" details */}
      {hasOrderOnAnotherCustomer && orderOnAnotherCustomerDetails && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-white border border-gray-300 rounded-lg p-2 shadow-lg max-w-[180px] text-center">
            <h4 className="font-bold text-sm text-blue-800 mb-2">לקוח חדש:</h4>
            
            {orderOnAnotherCustomerDetails.existsInSystem && orderOnAnotherCustomerDetails.customerData ? (
              // Customer exists in database - show full details
              <div className="space-y-1 text-xs">
                <div className="font-medium">{orderOnAnotherCustomerDetails.customerData.customername}</div>
                <div>{orderOnAnotherCustomerDetails.customerData.address}</div>
                <div>{orderOnAnotherCustomerDetails.customerData.city}</div>
                <div className="text-gray-600">לקוח: {orderOnAnotherCustomerDetails.customerData.customernumber}</div>
                
                {/* Area from new customer's city */}
                <div className="mt-2">
                  <div className="text-blue-600 font-medium mb-1">אזור:</div>
                  <Badge className={`text-xs ${getAreaColor(orderOnAnotherCustomerDetails.customerData.city || '')}`}>
                    {orderOnAnotherCustomerDetails.customerData.city}
                  </Badge>
                </div>
                
                {/* Delivery time - only new customer's supply details */}
                {orderOnAnotherCustomerDetails.customerData.supplydetails && (
                  <div className="text-gray-600">
                    {orderOnAnotherCustomerDetails.customerData.supplydetails}
                  </div>
                )}
              </div>
            ) : (
              // Customer doesn't exist - show manual customer name, city and area from cities table
              <div className="space-y-1 text-xs">
                <div className="font-medium">{orderOnAnotherCustomerDetails.correctCustomer}</div>
                <div>{orderOnAnotherCustomerDetails.city}</div>
                <div className="text-red-600 mt-1">לא נמצא במערכת</div>
                {/* Show area from cities table */}
                {manualCustomerArea && (
                  <div className="mt-2">
                    <Badge className={`text-xs ${getAreaColor(manualCustomerArea)}`}>
                      {manualCustomerArea}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Map Dialog */}
      <OrderMapDialog
        isOpen={isMapDialogOpen}
        onClose={() => setIsMapDialogOpen(false)}
        customerName={data.customername}
        address={data.address || ''}
        city={data.city}
        lat={customerCoordinates?.lat}
        lng={customerCoordinates?.lng}
        scheduleId={data.schedule_id}
        customerNumber={data.customernumber}
      />
    </Card>;
};
