
import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Users, MapPin } from 'lucide-react';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  invoicenumber?: number;
  return_reason?: any;
  schedule_id?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  return_reason?: any;
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

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  distribution_date?: string;
  destinations?: number;
  driver_id?: number;
  dis_number?: number;
  done_schedule?: string;
}

// Simple card props for individual order/return display
interface SimpleCalendarCardProps {
  type: 'order' | 'return';
  data: Order | Return;
  onClick?: () => void;
}

// Complex card props for schedule display
interface ComplexCalendarCardProps {
  scheduleId: number;
  groupId: number;
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: Order[];
  returns: Return[];
  driverId?: number;
  showAllCustomers?: boolean;
  onUpdateDestinations?: (scheduleId: number) => void;
  isCalendarMode?: boolean;
  schedule?: DistributionSchedule;
}

export type CalendarCardProps = SimpleCalendarCardProps | ComplexCalendarCardProps;

// Type guard to check if props are for complex card
function isComplexCard(props: CalendarCardProps): props is ComplexCalendarCardProps {
  return 'scheduleId' in props;
}

export const CalendarCard: React.FC<CalendarCardProps> = (props) => {
  // Handle simple card (individual order/return)
  if (!isComplexCard(props)) {
    const { type, data, onClick } = props;
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
  }

  // Handle complex card (schedule display)
  const {
    scheduleId,
    groupId,
    distributionGroups,
    drivers,
    orders,
    returns,
    driverId,
    showAllCustomers = false,
    onUpdateDestinations,
    isCalendarMode = false,
    schedule
  } = props;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'calendar-card',
    item: { scheduleId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Find the distribution group
  const group = distributionGroups.find(g => g.groups_id === groupId);
  const driver = drivers.find(d => d.id === driverId);

  // Filter orders and returns for this schedule
  const scheduleOrders = orders.filter(order => order.schedule_id === scheduleId);
  const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === scheduleId);

  // Count unique customers
  const allCustomers = new Set([
    ...scheduleOrders.map(o => o.customername),
    ...scheduleReturns.map(r => r.customername)
  ]);

  // Calculate totals
  const totalValue = scheduleOrders.reduce((sum, order) => sum + (order.totalorder || 0), 0) +
                    scheduleReturns.reduce((sum, returnItem) => sum + (returnItem.totalreturn || 0), 0);

  const totalItems = scheduleOrders.length + scheduleReturns.length;

  // Check if schedule is produced
  const isProduced = schedule?.done_schedule != null;

  return (
    <Card
      ref={drag}
      className={`min-w-[250px] transition-all duration-200 cursor-move ${
        isDragging ? 'opacity-50 transform rotate-2' : 'hover:shadow-lg'
      } ${isProduced ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} ${
        isCalendarMode ? 'mb-2' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={isProduced ? "default" : "secondary"} className="text-xs">
              {group?.separation || `קבוצה ${groupId}`}
            </Badge>
            {isProduced && schedule?.dis_number && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                משלוח #{schedule.dis_number}
              </Badge>
            )}
          </div>
          <span className="text-sm font-bold text-gray-700">
            ₪{totalValue.toLocaleString()}
          </span>
        </div>

        {driver && (
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{driver.nahag}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{allCustomers.size} לקוחות</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{totalItems} פריטים</span>
            </div>
          </div>
        </div>

        {showAllCustomers && totalItems > 0 && (
          <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
            {scheduleOrders.map((order) => (
              <div key={`order-${order.ordernumber}`} className="text-xs text-gray-600 truncate">
                📦 {order.customername} - ₪{order.totalorder?.toLocaleString()}
              </div>
            ))}
            {scheduleReturns.map((returnItem) => (
              <div key={`return-${returnItem.returnnumber}`} className="text-xs text-gray-600 truncate">
                🔄 {returnItem.customername} - ₪{returnItem.totalreturn?.toLocaleString()}
              </div>
            ))}
          </div>
        )}

        {onUpdateDestinations && !isProduced && (
          <Button
            onClick={() => onUpdateDestinations(scheduleId)}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            עדכן יעדים
          </Button>
        )}

        {isProduced && (
          <div className="text-xs text-green-600 font-medium text-center">
            ✅ הופק בהצלחה
          </div>
        )}
      </CardContent>
    </Card>
  );
};
