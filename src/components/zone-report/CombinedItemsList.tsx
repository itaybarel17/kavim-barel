import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CombinedItem, Order, Return } from './utils';
import { getReplacementCustomerDetails } from '@/utils/scheduleUtils';

interface CombinedItemsListProps {
  combinedItems: CombinedItem[];
  numberedOrdersCount: number;
  returnsCount: number;
  customerSupplyMap: Record<string, string>;
  replacementMap?: Map<string, any>;
}

export const CombinedItemsList: React.FC<CombinedItemsListProps> = ({
  combinedItems,
  numberedOrdersCount,
  returnsCount,
  customerSupplyMap,
  replacementMap = new Map()
}) => {
  const renderItem = (item: CombinedItem) => {
    if (item.type === 'returns-header') {
      return <div key="returns-header" className="mb-2">
          <h3 className="text-sm font-bold text-red-700 border-b border-red-300 pb-1">
            החזרות ({returnsCount})
          </h3>
        </div>;
    }
    const isOrder = item.type === 'order';
    const data = item.data!;
    const order = data as Order;
    const returnItem = data as Return;

    // Safe handling of null/undefined values
    const totalAmount = isOrder ? order.totalorder ?? 0 : returnItem.totalreturn ?? 0;

    // Check if this is a Candy+ order (agent 99)
    const isCandyPlus = data.agentnumber === '99';

    // Get supply details for this customer from customerlist table
    const supplyDetails = data.customernumber ? customerSupplyMap[data.customernumber] : '';

    // Check if this is a manually entered customer (replacement customer that doesn't exist in system)
    const replacementKey = isOrder ? `order-${order.ordernumber}` : `return-${returnItem.returnnumber}`;
    const replacementInfo = replacementMap.get(replacementKey);
    const isManualCustomer = replacementInfo && !replacementInfo.existsInSystem;

    // Format hour without seconds
    const formatHour = (hour: string | undefined) => {
      if (!hour) return '';
      return hour.substring(0, 5); // Remove seconds (13:10:00 -> 13:10)
    };

    return <div key={`${item.type}-${isOrder ? order.ordernumber : returnItem.returnnumber}`} className={`p-1 border rounded text-xs mb-1 ${isOrder ? 'border-blue-300' : 'border-red-300'}`}>
        <div className="flex items-start justify-between mb-1">
          <span className={`font-medium text-xs ${isOrder ? 'text-blue-900' : 'text-red-900'}`}>
            {item.index ? `${item.index}. ` : ''}{data.customername}
          </span>
          <span className={`font-bold text-xs ${isOrder ? 'text-blue-700' : 'text-red-700'}`}>
            ₪{totalAmount.toLocaleString('he-IL')}
          </span>
        </div>
        <div className={`text-xs ${isOrder ? 'text-blue-800' : 'text-red-800'}`}>
          <div className="flex items-center justify-between">
            {/* For manual customers, show only city; for system customers, show address and city */}
            <span>
              {isManualCustomer ? data.city : `${data.address}, ${data.city}`}
            </span>
            {data.remark && <span className="text-gray-600 italic text-xs mr-2">
                <span className="font-bold">הערה: </span>{data.remark}
              </span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>
                {isOrder ? 'הזמנה' : 'החזרה'}: {isOrder ? order.ordernumber : returnItem.returnnumber}
              </span>
              {data.agentnumber && <span>{data.agentnumber}</span>}
              {/* Hide customer number for manual customers */}
              {data.customernumber && !isManualCustomer && <span>{data.customernumber}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1">
                {(isOrder ? order.orderdate : returnItem.returndate) && <div className="flex items-center gap-1">
                    <span>{new Date(isOrder ? order.orderdate! : returnItem.returndate!).toLocaleDateString('he-IL')}</span>
                    {(isOrder ? order.hour : returnItem.hour) && <span className="text-blue-800">
                        {formatHour(isOrder ? order.hour : returnItem.hour)}
                      </span>}
                  </div>}
              </div>
              {isOrder && isCandyPlus && <Badge className="bg-pink-200 text-pink-800 border-pink-300 text-xs px-2 py-1 font-bold">
                  קנדי+
                </Badge>}
            </div>
          </div>
          {supplyDetails && <div className="mt-1 text-right text-gray-600 italic text-xs">
              אספקה: {supplyDetails}
            </div>}
        </div>
      </div>;
  };

  if (combinedItems.length === 0) return null;

  // Split combined items into two columns
  const midPoint = Math.ceil(combinedItems.length / 2);
  const leftColumn = combinedItems.slice(0, midPoint);
  const rightColumn = combinedItems.slice(midPoint);
  return <Card className="mb-3 border">
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
    </Card>;
};
