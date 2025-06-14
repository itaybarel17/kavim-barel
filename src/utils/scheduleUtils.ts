
// Utility functions for handling schedule IDs with fallback logic

interface OrderWithSchedule {
  ordernumber: number;
  customername: string;
  totalorder: number;
  schedule_id?: number;
  schedule_id_if_changed?: any; // JSONB field that might contain schedule_id
}

interface ReturnWithSchedule {
  returnnumber: number;
  customername: string;
  totalreturn: number;
  schedule_id?: number;
  schedule_id_if_changed?: any; // JSONB field that might contain schedule_id
}

/**
 * Gets the effective schedule ID for an order or return
 * Prioritizes schedule_id_if_changed if it exists and contains a valid schedule_id
 */
export const getEffectiveScheduleId = (item: OrderWithSchedule | ReturnWithSchedule): number | undefined => {
  // Check if schedule_id_if_changed exists and contains a schedule_id
  if (item.schedule_id_if_changed) {
    // Handle both object format and direct number format
    if (typeof item.schedule_id_if_changed === 'object' && item.schedule_id_if_changed.schedule_id) {
      return item.schedule_id_if_changed.schedule_id;
    } else if (typeof item.schedule_id_if_changed === 'number') {
      return item.schedule_id_if_changed;
    }
  }
  
  // Fallback to regular schedule_id
  return item.schedule_id;
};

/**
 * Filters orders by effective schedule ID
 */
export const getOrdersByEffectiveScheduleId = (orders: OrderWithSchedule[], targetScheduleId: number): OrderWithSchedule[] => {
  return orders.filter(order => getEffectiveScheduleId(order) === targetScheduleId);
};

/**
 * Filters returns by effective schedule ID
 */
export const getReturnsByEffectiveScheduleId = (returns: ReturnWithSchedule[], targetScheduleId: number): ReturnWithSchedule[] => {
  return returns.filter(returnItem => getEffectiveScheduleId(returnItem) === targetScheduleId);
};

/**
 * Gets all unique customer names for a specific schedule ID (considering both regular and changed schedule IDs)
 */
export const getUniqueCustomersForSchedule = (
  orders: OrderWithSchedule[], 
  returns: ReturnWithSchedule[], 
  scheduleId: number
): Set<string> => {
  const scheduleOrders = getOrdersByEffectiveScheduleId(orders, scheduleId);
  const scheduleReturns = getReturnsByEffectiveScheduleId(returns, scheduleId);
  
  const uniqueCustomers = new Set([
    ...scheduleOrders.map(order => order.customername),
    ...scheduleReturns.map(returnItem => returnItem.customername)
  ]);
  
  return uniqueCustomers;
};

export type { OrderWithSchedule, ReturnWithSchedule };
