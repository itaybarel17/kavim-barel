// Utility functions for handling schedule IDs with fallback logic
import { supabase } from '@/integrations/supabase/client';

// Cache for city area lookups to avoid repeated queries
const cityAreaCache = new Map<string, string>();

interface OrderWithSchedule {
  ordernumber: number;
  customername: string;
  totalorder: number;
  address: string;
  city: string;
  customernumber?: string;
  agentnumber?: string;
  icecream?: string;
  schedule_id?: number;
  schedule_id_if_changed?: any; // JSONB field that might contain schedule_id
}

interface ReturnWithSchedule {
  returnnumber: number;
  customername: string;
  totalreturn: number;
  address: string;
  city: string;
  customernumber?: string;
  agentnumber?: string;
  icecream?: string;
  schedule_id?: number;
  schedule_id_if_changed?: any; // JSONB field that might contain schedule_id
}

/**
 * Gets all relevant schedule IDs for an order or return
 * Returns array of all schedule IDs where this item should appear
 * Now supports array/JSON structure (e.g., [92]) as well
 */
export const getAllRelevantScheduleIds = (item: OrderWithSchedule | ReturnWithSchedule): number[] => {
  const scheduleIds: number[] = [];

  // Add the main schedule_id if it exists and is a number
  if (typeof item.schedule_id === 'number' && !isNaN(item.schedule_id)) {
    scheduleIds.push(item.schedule_id);
  }

  // Handle schedule_id_if_changed in all possible formats (number, object, array)
  const changed = item.schedule_id_if_changed;
  if (changed != null) {
    if (typeof changed === 'object') {
      // Array format: e.g., [92] or similar
      if (Array.isArray(changed)) {
        for (const v of changed) {
          if (typeof v === 'number' && !isNaN(v)) scheduleIds.push(v);
          else if (typeof v === 'object' && v?.schedule_id) scheduleIds.push(v.schedule_id);
        }
      } else if (changed.schedule_id) {
        scheduleIds.push(changed.schedule_id);
      }
    } else if (typeof changed === 'number' && !isNaN(changed)) {
      scheduleIds.push(changed);
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
 * An order belongs to a schedule if the schedule_id appears in any of its schedule fields, even if schedule_id is null.
 */
export const getOrdersByScheduleId = (orders: OrderWithSchedule[], targetScheduleId: number): OrderWithSchedule[] => {
  return orders.filter(order => {
    const relevantScheduleIds = getAllRelevantScheduleIds(order);
    return relevantScheduleIds.includes(targetScheduleId); // לא תלוי בזה שschedule_id יהיה שווה
  });
};

/**
 * Filters returns by schedule ID - checks if return belongs to the target schedule
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

/**
 * Checks if an item has been transferred from another schedule to the current one
 */
export const isTransferredItem = (item: OrderWithSchedule | ReturnWithSchedule, currentScheduleId: number): boolean => {
  if (!isItemModified(item)) return false;
  
  const originalScheduleId = getOriginalScheduleId(item);
  return originalScheduleId !== undefined && originalScheduleId !== currentScheduleId;
};

/**
 * Gets the original schedule ID that an item was transferred from
 */
export const getTransferredFromScheduleId = (item: OrderWithSchedule | ReturnWithSchedule): number | undefined => {
  if (!isItemModified(item)) return undefined;
  return getOriginalScheduleId(item);
};

/**
 * Checks if a customer has ALL their items transferred (for strikethrough logic)
 */
export const isCustomerCompletelyTransferred = (
  customerName: string, 
  customerCity: string, 
  allOrders: OrderWithSchedule[], 
  allReturns: ReturnWithSchedule[], 
  currentScheduleId: number
): boolean => {
  // Get all orders and returns for this customer in this schedule
  const customerOrders = allOrders.filter(order => 
    order.customername === customerName && 
    order.city === customerCity &&
    getAllRelevantScheduleIds(order).includes(currentScheduleId)
  );
  
  const customerReturns = allReturns.filter(returnItem => 
    returnItem.customername === customerName && 
    returnItem.city === customerCity &&
    getAllRelevantScheduleIds(returnItem).includes(currentScheduleId)
  );
  
  const allCustomerItems = [...customerOrders, ...customerReturns];
  
  // If no items, return false
  if (allCustomerItems.length === 0) return false;
  
  // Check if ALL items are transferred FROM other schedules (not original to this schedule)
  return allCustomerItems.every(item => isTransferredItem(item, currentScheduleId));
};

/**
 * Interface for customer replacement data
 */
export interface CustomerReplacement {
  ordernumber?: number;
  returnnumber?: number;
  correctcustomer: string;
  city?: string;
  existsInSystem: boolean;
  customerData?: {
    customername: string;
    customernumber: string;
    address: string;
    city: string;
    mobile?: string;
    phone?: string;
    supplydetails?: string;
  };
}

/**
 * Gets customer replacement map for orders and returns with "Order on another customer" messages
 */
export const getCustomerReplacementMap = (
  orderReplacements: CustomerReplacement[],
  customerDetails?: any[]
): Map<string, CustomerReplacement> => {
  const map = new Map<string, CustomerReplacement>();
  
  orderReplacements.forEach(replacement => {
    // Check if the replacement customer exists in the system
    const customerExists = customerDetails?.find(customer => 
      customer.customername === replacement.correctcustomer
    );
    
    const enrichedReplacement = {
      ...replacement,
      correctCustomer: replacement.correctcustomer, // Fix casing mismatch for TypeScript interface
      existsInSystem: !!customerExists,
      customerData: customerExists ? {
        customername: customerExists.customername,
        address: customerExists.address || '',
        city: customerExists.city_area || customerExists.city || '',
        mobile: customerExists.mobile,
        phone: customerExists.phone,
        supplydetails: customerExists.supplydetails,
        customernumber: customerExists.customernumber,
      } : undefined
    };
    
    if (replacement.ordernumber) {
      map.set(`order-${replacement.ordernumber}`, enrichedReplacement);
    }
    if (replacement.returnnumber) {
      map.set(`return-${replacement.returnnumber}`, enrichedReplacement);
    }
  });
  
  return map;
};

/**
 * Gets the area for a city from the cities table
 */
export const getCityArea = async (cityName: string): Promise<string> => {
  if (!cityName) return '';
  
  // Check cache first
  if (cityAreaCache.has(cityName)) {
    return cityAreaCache.get(cityName)!;
  }
  
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('area')
      .eq('city', cityName)
      .single();
    
    if (error || !data) {
      // Cache empty result to avoid repeated queries
      cityAreaCache.set(cityName, '');
      return '';
    }
    
    const area = data.area || '';
    cityAreaCache.set(cityName, area);
    return area;
  } catch (error) {
    console.error('Error fetching city area:', error);
    cityAreaCache.set(cityName, '');
    return '';
  }
};

/**
 * Gets the replacement customer name for display
 */
export const getReplacementCustomerName = (
  item: OrderWithSchedule | ReturnWithSchedule,
  replacementMap: Map<string, CustomerReplacement>
): string => {
  const key = 'ordernumber' in item ? `order-${item.ordernumber}` : `return-${item.returnnumber}`;
  const replacement = replacementMap.get(key);
  
  if (replacement) {
    return replacement.correctcustomer;
  }
  
  return item.customername;
};

/**
 * Gets the replacement customer details for production summary
 */
export const getReplacementCustomerDetails = (
  item: OrderWithSchedule | ReturnWithSchedule,
  replacementMap: Map<string, CustomerReplacement>
): {
  customername: string;
  address: string;
  city: string;
  mobile?: string;
  phone?: string;
  supplydetails?: string;
  customernumber?: string;
} => {
  const key = 'ordernumber' in item ? `order-${item.ordernumber}` : `return-${item.returnnumber}`;
  const replacement = replacementMap.get(key);
  
  if (replacement) {
    if (replacement.existsInSystem && replacement.customerData) {
      // Customer exists in system - use full details
      return replacement.customerData;
    } else {
      // Customer doesn't exist - use only name and city from message
      return {
        customername: replacement.correctcustomer,
        address: '', // Empty address
        city: replacement.city || item.city || '',
        mobile: undefined, // Empty mobile
        phone: undefined, // Empty phone
        supplydetails: undefined, // Empty supply details
        customernumber: undefined, // No customer number
      };
    }
  }
  
  // No replacement - return original data
  return {
    customername: item.customername || '',
    address: item.address || '',
    city: item.city || '',
    mobile: undefined,
    phone: undefined,
    supplydetails: undefined,
    customernumber: item.customernumber,
  };
};

export type { OrderWithSchedule, ReturnWithSchedule };
