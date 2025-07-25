import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { OrderCard } from './OrderCard';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { X } from 'lucide-react';

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
  message_alert?: boolean | null;
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
  message_alert?: boolean | null;
}
interface UnassignedAreaProps {
  unassignedOrders: Order[];
  unassignedReturns: Return[];
  onDragStart: (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => void;
  onDropToUnassigned: (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => void;
  onDeleteItem?: (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => void;
  // new props for icons
  multiOrderActiveCustomerList?: {
    name: string;
    city: string;
  }[];
  dualActiveOrderReturnCustomers?: {
    name: string;
    city: string;
  }[];
  // new props for supply details - removed agentNameMap
  customerSupplyMap?: Record<string, string>;
  customerCoordinatesMap?: Record<string, { lat: number; lng: number }>;
  
  // new prop for siren functionality
  onSirenToggle?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  // message props - support up to 2 messages
  messageMap?: Record<string, Array<{ subject: string; content?: string; tagAgent?: string; agentName?: string }>>;
  onMessageBadgeClick?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  
  // cancellation map for red X overlay
  cancellationMap?: Set<string>;
  
  // customer replacement map for "order on another customer" functionality
  customerReplacementMap?: Map<string, any>;
}
export const UnassignedArea: React.FC<UnassignedAreaProps> = ({
  unassignedOrders,
  unassignedReturns,
  onDragStart,
  onDropToUnassigned,
  onDeleteItem,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
  customerCoordinatesMap = {},
  onSirenToggle,
  messageMap = {},
  onMessageBadgeClick,
  cancellationMap = new Set(),
  customerReplacementMap = new Map()
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'order' | 'return';
    data: Order | Return;
  } | null>(null);
  const [{
    isOver
  }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: {
      type: 'order' | 'return';
      data: Order | Return;
    }) => {
      console.log('Dropping item back to unassigned area:', item);
      onDropToUnassigned(item);
    },
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  }));
  const handleDeleteClick = (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = () => {
    if (itemToDelete && onDeleteItem) {
      onDeleteItem(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="mb-8 bg-white">
      <div className="flex items-center justify-between mb-4 mx-[8px]">
        <h2 className="text-xl font-semibold">הזמנות והחזרות ללא שיוך</h2>
      </div>
      <div ref={drop} className={`flex gap-4 overflow-x-auto pb-4 min-h-[120px] border-2 border-dashed rounded-lg p-4 transition-colors ${isOver ? 'border-primary bg-primary/5' : 'border-border'}`}>
        {unassignedOrders.map(order => (
          <div key={`order-${order.ordernumber}`} className="relative group">
            <OrderCard 
              type="order" 
              data={order} 
              onDragStart={onDragStart} 
              multiOrderActiveCustomerList={multiOrderActiveCustomerList} 
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} 
              customerSupplyMap={customerSupplyMap} 
              customerCoordinatesMap={customerCoordinatesMap}
              onSirenToggle={onSirenToggle}
              messagesInfo={messageMap[`order-${order.ordernumber}`]}
              onMessageBadgeClick={onMessageBadgeClick}
              hasCancellationMessage={cancellationMap.has(`order-${order.ordernumber}`)}
              orderOnAnotherCustomerDetails={customerReplacementMap.get(`order-${order.ordernumber}`)}
            />
            {onDeleteItem && (
              <button
                onClick={e => handleDeleteClick({ type: 'order', data: order }, e)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-transparent hover:bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="מחק הזמנה"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            )}
          </div>
        ))}
        {unassignedReturns.map(returnItem => (
          <div key={`return-${returnItem.returnnumber}`} className="relative group">
            <OrderCard 
              type="return" 
              data={returnItem} 
              onDragStart={onDragStart} 
              multiOrderActiveCustomerList={multiOrderActiveCustomerList} 
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} 
              customerSupplyMap={customerSupplyMap} 
              customerCoordinatesMap={customerCoordinatesMap}
              onSirenToggle={onSirenToggle}
              messagesInfo={messageMap[`return-${returnItem.returnnumber}`]}
              onMessageBadgeClick={onMessageBadgeClick}
              hasCancellationMessage={cancellationMap.has(`return-${returnItem.returnnumber}`)}
              orderOnAnotherCustomerDetails={customerReplacementMap.get(`return-${returnItem.returnnumber}`)}
            />
            {onDeleteItem && (
              <button
                onClick={e => handleDeleteClick({ type: 'return', data: returnItem }, e)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-transparent hover:bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="מחק החזרה"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            )}
          </div>
        ))}
        {unassignedOrders.length === 0 && unassignedReturns.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8 w-full">
            כל ההזמנות וההחזרות משויכות לאזורים
          </div>
        )}
      </div>
      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        item={itemToDelete} 
        onConfirm={handleConfirmDelete} 
      />
    </div>
  );
};
