
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CombinedItem, Order, Return } from './utils';

interface CombinedItemsListProps {
  combinedItems: CombinedItem[];
  numberedOrdersCount: number;
  returnsCount: number;
}

export const CombinedItemsList: React.FC<CombinedItemsListProps> = ({
  combinedItems,
  numberedOrdersCount,
  returnsCount
}) => {
  const renderItem = (item: CombinedItem) => {
    if (item.type === 'returns-header') {
      return (
        <div key="returns-header" className="mb-2">
          <h3 className="text-sm font-bold text-red-700 border-b border-red-300 pb-1">
            החזרות ({returnsCount})
          </h3>
        </div>
      );
    }

    const isOrder = item.type === 'order';
    const data = item.data!;
    const order = data as Order;
    const returnItem = data as Return;
    
    // Safe handling of null/undefined values
    const totalAmount = isOrder 
      ? (order.totalorder ?? 0) 
      : (returnItem.totalreturn ?? 0);
    
    return (
      <div
        key={`${item.type}-${isOrder ? order.ordernumber : returnItem.returnnumber}`}
        className={`p-1 border rounded text-xs mb-1 ${
          isOrder ? 'border-blue-300' : 'border-red-300'
        }`}
      >
        <div className="flex items-start justify-between mb-1">
          <span className={`font-medium text-xs ${
            isOrder ? 'text-blue-900' : 'text-red-900'
          }`}>
            {item.index ? `${item.index}. ` : ''}{data.customername}
          </span>
          <span className={`font-bold text-xs ${
            isOrder ? 'text-blue-700' : 'text-red-700'
          }`}>
            ₪{totalAmount.toLocaleString('he-IL')}
          </span>
        </div>
        <div className={`text-xs ${isOrder ? 'text-blue-800' : 'text-red-800'}`}>
          <div>{data.address}, {data.city}</div>
          <div className="flex items-center gap-2">
            <span>
              {isOrder ? 'הזמנה' : 'החזרה'}: {isOrder ? order.ordernumber : returnItem.returnnumber}
            </span>
            {data.agentnumber && <span>{data.agentnumber}</span>}
            {data.customernumber && <span>{data.customernumber}</span>}
            {(isOrder ? order.orderdate : returnItem.returndate) && (
              <span>{new Date(isOrder ? order.orderdate! : returnItem.returndate!).toLocaleDateString('he-IL')}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (combinedItems.length === 0) return null;

  // Split combined items into two columns
  const midPoint = Math.ceil(combinedItems.length / 2);
  const leftColumn = combinedItems.slice(0, midPoint);
  const rightColumn = combinedItems.slice(midPoint);

  return (
    <Card className="mb-3 border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          הזמנות וחזרות - סה"כ {numberedOrdersCount + returnsCount} פריטים ממוספרים
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {/* Left Column */}
          <div className="space-y-1">
            {leftColumn.map(renderItem)}
          </div>
          
          {/* Right Column */}
          <div className="space-y-1">
            {rightColumn.map(renderItem)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
