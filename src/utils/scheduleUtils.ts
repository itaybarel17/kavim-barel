
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
 * Gets all relevant schedule IDs for an order or return
 * Returns array of all schedule IDs where this item should appear
 */
export const getAllRelevantScheduleIds = (item: OrderWithSchedule | ReturnWithSchedule): number[] => {
  const scheduleIds: number[] = [];
  
  // Add the main schedule_id if it exists
  if (item.schedule_id) {
    scheduleIds.push(item.schedule_id);
  }
  
  // Add schedule_id from schedule_id_if_changed if it exists
  if (item.schedule_id_if_changed) {
    if (typeof item.schedule_id_if_changed === 'object' && item.schedule_id_if_changed.schedule_id) {
      scheduleIds.push(item.schedule_id_if_changed.schedule_id);
    } else if (typeof item.schedule_id_if_changed === 'number') {
      scheduleIds.push(item.schedule_id_if_changed);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(scheduleIds)];
};

/**
 * Gets the effective schedule ID for an order or return (for backward compatibility)
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
 * Filters orders by schedule ID - checks if order belongs to the target schedule
 * An order belongs to a schedule if the schedule_id appears in any of its schedule fields
 */
export const getOrdersByScheduleId = (orders: OrderWithSchedule[], targetScheduleId: number): OrderWithSchedule[] => {
  return orders.filter(order => {
    const relevantScheduleIds = getAllRelevantScheduleIds(order);
    return relevantScheduleIds.includes(targetScheduleId);
  });
};

/**
 * Filters returns by schedule ID - checks if return belongs to the target schedule
 * A return belongs to a schedule if the schedule_id appears in any of its schedule fields
 */
export const getReturnsByScheduleId = (returns: ReturnWithSchedule[], targetScheduleId: number): ReturnWithSchedule[] => {
  return returns.filter(returnItem => {
    const relevantScheduleIds = getAllRelevantScheduleIds(returnItem);
    return relevantScheduleIds.includes(targetScheduleId);
  });
};

/**
 * Filters orders by effective schedule ID (backward compatibility)
 */
export const getOrdersByEffectiveScheduleId = (orders: OrderWithSchedule[], targetScheduleId: number): OrderWithSchedule[] => {
  return getOrdersByScheduleId(orders, targetScheduleId);
};

/**
 * Filters returns by effective schedule ID (backward compatibility)
 */
export const getReturnsByEffectiveScheduleId = (returns: ReturnWithSchedule[], targetScheduleId: number): ReturnWithSchedule[] => {
  return getReturnsByScheduleId(returns, targetScheduleId);
};

/**
 * Gets all unique customer names for a specific schedule ID (considering both regular and changed schedule IDs)
 */
export const getUniqueCustomersForSchedule = (
  orders: OrderWithSchedule[], 
  returns: ReturnWithSchedule[], 
  scheduleId: number
): Set<string> => {
  const scheduleOrders = getOrdersByScheduleId(orders, scheduleId);
  const scheduleReturns = getReturnsByScheduleId(returns, scheduleId);
  
  const uniqueCustomers = new Set([
    ...scheduleOrders.map(order => order.customername),
    ...scheduleReturns.map(returnItem => returnItem.customername)
  ]);
  
  return uniqueCustomers;
};

/**
 * Checks if an item has been modified (has schedule_id_if_changed)
 */
export const isItemModified = (item: OrderWithSchedule | ReturnWithSchedule): boolean => {
  return item.schedule_id_if_changed != null;
};

/**
 * Gets the original schedule ID for a modified item
 */
export const getOriginalScheduleId = (item: OrderWithSchedule | ReturnWithSchedule): number | undefined => {
  if (isItemModified(item)) {
    return item.schedule_id;
  }
  return undefined;
};

/**
 * Gets the new schedule ID for a modified item
 */
export const getNewScheduleId = (item: OrderWithSchedule | ReturnWithSchedule): number | undefined => {
  if (isItemModified(item)) {
    if (typeof item.schedule_id_if_changed === 'object' && item.schedule_id_if_changed.schedule_id) {
      return item.schedule_id_if_changed.schedule_id;
    } else if (typeof item.schedule_id_if_changed === 'number') {
      return item.schedule_id_if_changed;
    }
  }
  return undefined;
};

export type { OrderWithSchedule, ReturnWithSchedule };
