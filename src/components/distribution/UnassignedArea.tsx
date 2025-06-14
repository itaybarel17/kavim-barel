
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
}

interface UnassignedAreaProps {
  unassignedOrders: Order[];
  unassignedReturns: Return[];
  onDragStart: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  onDropToUnassigned: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  onDeleteItem?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  // new props for icons
  multiOrderActiveCustomerList?: { name: string; city: string }[];
  dualActiveOrderReturnCustomers?: { name: string; city: string }[];
}

export const UnassignedArea: React.FC<UnassignedAreaProps> = ({
  unassignedOrders,
  unassignedReturns,
  onDragStart,
  onDropToUnassigned,
  onDeleteItem,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'order' | 'return'; data: Order | Return } | null>(null);

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

  const handleDeleteClick = (item: { type: 'order' | 'return'; data: Order | Return }, e: React.MouseEvent) => {
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

  // Helper function to check if an item has special icons
  const hasSpecialIcon = (item: Order | Return, type: 'order' | 'return') => {
    const isMultiOrderActive = multiOrderActiveCustomerList.some(
      (cust) => cust.name === item.customername && cust.city === item.city
    );
    const isDualActiveOrderReturn = dualActiveOrderReturnCustomers.some(
      (cust) => cust.name === item.customername && cust.city === item.city
    );
    
    return isMultiOrderActive || isDualActiveOrderReturn;
  };

  // Sort orders - prioritize those with special icons
  const sortedOrders = [...unassignedOrders].sort((a, b) => {
    const aHasIcon = hasSpecialIcon(a, 'order');
    const bHasIcon = hasSpecialIcon(b, 'order');
    
    if (aHasIcon && !bHasIcon) return -1;
    if (!aHasIcon && bHasIcon) return 1;
    return 0;
  });

  // Sort returns - prioritize those with special icons
  const sortedReturns = [...unassignedReturns].sort((a, b) => {
    const aHasIcon = hasSpecialIcon(a, 'return');
    const bHasIcon = hasSpecialIcon(b, 'return');
    
    if (aHasIcon && !bHasIcon) return -1;
    if (!aHasIcon && bHasIcon) return 1;
    return 0;
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">הזמנות והחזרות ללא שיוך</h2>
      <div 
        ref={drop}
        className={`flex gap-4 overflow-x-auto pb-4 min-h-[120px] border-2 border-dashed rounded-lg p-4 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        {sortedOrders.map((order) => (
          <div key={`order-${order.ordernumber}`} className="relative group">
            <OrderCard
              type="order"
              data={order}
              onDragStart={onDragStart}
              multiOrderActiveCustomerList={multiOrderActiveCustomerList}
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
            />
            {onDeleteItem && (
              <button
                onClick={(e) => handleDeleteClick({ type: 'order', data: order }, e)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-transparent hover:bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="מחק הזמנה"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            )}
          </div>
        ))}
        {sortedReturns.map((returnItem) => (
          <div key={`return-${returnItem.returnnumber}`} className="relative group">
            <OrderCard
              type="return"
              data={returnItem}
              onDragStart={onDragStart}
              multiOrderActiveCustomerList={multiOrderActiveCustomerList}
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
            />
            {onDeleteItem && (
              <button
                onClick={(e) => handleDeleteClick({ type: 'return', data: returnItem }, e)}
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
