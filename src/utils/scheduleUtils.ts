
export interface OrderWithSchedule {
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
  hour?: string;
  remark?: string;
  done_mainorder?: string | null;
  ordercancel?: string | null;
  schedule_id_if_changed?: number | { schedule_id: number } | null;
}

export interface ReturnWithSchedule {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
  hour?: string;
  remark?: string;
  done_return?: string | null;
  returncancel?: string | null;
  schedule_id_if_changed?: number | { schedule_id: number } | null;
}

export const getAllRelevantScheduleIds = (item: OrderWithSchedule | ReturnWithSchedule): number[] => {
  const scheduleIds: number[] = [];
  
  // Add main schedule ID
  if (item.schedule_id) {
    scheduleIds.push(item.schedule_id);
  }
  
  // Add schedule IDs from schedule_id_if_changed
  if (item.schedule_id_if_changed) {
    if (typeof item.schedule_id_if_changed === 'number') {
      scheduleIds.push(item.schedule_id_if_changed);
    } else if (typeof item.schedule_id_if_changed === 'object' && item.schedule_id_if_changed.schedule_id) {
      scheduleIds.push(item.schedule_id_if_changed.schedule_id);
    }
  }
  
  return scheduleIds;
};

export const getUniqueCustomersForSchedule = (
  orders: OrderWithSchedule[],
  returns: ReturnWithSchedule[],
  scheduleId: number
): Set<string> => {
  const uniqueCustomers = new Set<string>();

  // Process orders
  orders.forEach(order => {
    const relevantScheduleIds = getAllRelevantScheduleIds(order);
    if (relevantScheduleIds.includes(scheduleId)) {
      uniqueCustomers.add(`${order.customername}^^${order.city}`);
    }
  });

  // Process returns
  returns.forEach(returnItem => {
    const relevantScheduleIds = getAllRelevantScheduleIds(returnItem);
    if (relevantScheduleIds.includes(scheduleId)) {
      uniqueCustomers.add(`${returnItem.customername}^^${returnItem.city}`);
    }
  });

  return uniqueCustomers;
};
