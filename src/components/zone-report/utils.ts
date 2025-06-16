export interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
  remark?: string;
}

export interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
  remark?: string;
}

export interface ZoneReportData {
  zoneNumber: number;
  scheduleId: number;
  groupName: string;
  driverName: string;
  orders: Order[];
  returns: Return[];
}

export interface CombinedItem {
  type: 'order' | 'return' | 'returns-header';
  data?: Order | Return;
  index?: number;
}

export const sortOrdersByLocationAndCustomer = (orders: Order[]): Order[] => {
  return [...orders].sort((a, b) => {
    const cityComparison = a.city.localeCompare(b.city, 'he');
    if (cityComparison !== 0) return cityComparison;
    return a.customername.localeCompare(b.customername, 'he');
  });
};

export const sortReturnsByLocationAndCustomer = (returns: Return[]): Return[] => {
  return [...returns].sort((a, b) => {
    const cityComparison = a.city.localeCompare(b.city, 'he');
    if (cityComparison !== 0) return cityComparison;
    return a.customername.localeCompare(b.customername, 'he');
  });
};

export const createNumberedOrdersList = (sortedOrders: Order[]) => {
  const customerOrderCount: { [key: string]: number } = {};
  let numberedCount = 0;
  
  return sortedOrders.map((order) => {
    const customerKey = `${order.customername}-${order.city}`;
    customerOrderCount[customerKey] = (customerOrderCount[customerKey] || 0) + 1;
    
    const shouldNumber = customerOrderCount[customerKey] === 1;
    if (shouldNumber) {
      numberedCount++;
    }
    
    return {
      ...order,
      displayIndex: shouldNumber ? numberedCount : undefined
    };
  });
};

export const createCombinedItemsList = (
  numberedOrders: (Order & { displayIndex?: number })[],
  sortedReturns: Return[]
): CombinedItem[] => {
  const ordersItems: CombinedItem[] = numberedOrders.map((order) => ({
    type: 'order' as const,
    data: order,
    index: order.displayIndex
  }));

  const returnsItems: CombinedItem[] = [
    ...(sortedReturns.length > 0 ? [{ type: 'returns-header' as const }] : []),
    ...sortedReturns.map((returnItem, index) => ({
      type: 'return' as const,
      data: returnItem,
      index: index + 1
    }))
  ];

  return [...ordersItems, ...returnsItems];
};

export const calculateTotals = (orders: Order[], returns: Return[]) => {
  const totalOrdersAmount = orders.reduce((sum, order) => sum + order.totalorder, 0);
  const totalReturnsAmount = returns.reduce((sum, returnItem) => sum + returnItem.totalreturn, 0);
  const netTotal = totalOrdersAmount - totalReturnsAmount;
  
  return { totalOrdersAmount, totalReturnsAmount, netTotal };
};
