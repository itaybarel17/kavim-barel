
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WaitingCustomersData {
  regularCustomers: number;
  kandiPlusCustomers: number;
  totalCustomers: number;
}

export const useWaitingCustomers = (currentUserAgent?: string) => {
  return useQuery({
    queryKey: ['waiting-customers', currentUserAgent],
    queryFn: async (): Promise<WaitingCustomersData> => {
      console.log('Fetching waiting customers data for agent:', currentUserAgent);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDateString = today.toISOString().split('T')[0];
      
      // Get all orders that are assigned to schedules and waiting based on the new criteria
      const { data: assignedOrders, error: assignedError } = await supabase
        .from('mainorder')
        .select(`
          customernumber,
          agentnumber,
          done_mainorder,
          ordercancel,
          schedule_id,
          distribution_schedule!inner(
            done_schedule,
            distribution_date
          )
        `)
        .is('ordercancel', null) // ordercancel must be NULL
        .not('schedule_id', 'is', null); // only orders with schedule_id

      if (assignedError) {
        console.error('Error fetching assigned orders:', assignedError);
        throw assignedError;
      }

      // Get all unassigned orders (without schedule_id)
      const { data: unassignedOrders, error: unassignedError } = await supabase
        .from('mainorder')
        .select(`
          customernumber,
          agentnumber,
          done_mainorder,
          ordercancel,
          schedule_id
        `)
        .is('ordercancel', null) // ordercancel must be NULL
        .is('done_mainorder', null) // unassigned orders should not be produced
        .is('schedule_id', null); // only orders without schedule_id

      if (unassignedError) {
        console.error('Error fetching unassigned orders:', unassignedError);
        throw unassignedError;
      }

      // Filter assigned orders that are truly waiting based on the criteria
      const trulyWaitingAssignedOrders = (assignedOrders || []).filter(order => {
        const schedule = order.distribution_schedule;
        
        // Criteria 1: done_mainorder is NULL
        if (!order.done_mainorder) {
          return true;
        }
        
        // Criteria 2: done_mainorder has timestamp but distribution_date is today or later
        if (order.done_mainorder && schedule?.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          
          // If distribution date is today or later, it's still waiting
          if (distributionDate >= today) {
            return true;
          }
        }
        
        return false;
      });

      // All unassigned orders are considered waiting (they already have done_mainorder = NULL filter)
      const trulyWaitingUnassignedOrders = unassignedOrders || [];

      // Combine both types of waiting orders
      let allWaitingOrders = [...trulyWaitingAssignedOrders, ...trulyWaitingUnassignedOrders];

      // Filter orders based on current user agent
      if (currentUserAgent && currentUserAgent !== '4') {
        if (currentUserAgent === '99') {
          // Kandi+ user - show only orders with agent number 99
          allWaitingOrders = allWaitingOrders.filter(order => order.agentnumber === '99');
        } else {
          // Regular agent - show only their orders, excluding Kandi+ (99)
          allWaitingOrders = allWaitingOrders.filter(order => 
            order.agentnumber === currentUserAgent && order.agentnumber !== '99'
          );
        }
      }
      // Agent 4 (admin) sees all orders - no filtering

      // Get all returns that are assigned to schedules and waiting
      const { data: assignedReturns, error: assignedReturnsError } = await supabase
        .from('mainreturns')
        .select(`
          customernumber,
          agentnumber,
          done_return,
          returncancel,
          schedule_id,
          distribution_schedule!inner(
            done_schedule,
            distribution_date
          )
        `)
        .is('returncancel', null) // returncancel must be NULL
        .not('schedule_id', 'is', null); // only returns with schedule_id

      if (assignedReturnsError) {
        console.error('Error fetching assigned returns:', assignedReturnsError);
        throw assignedReturnsError;
      }

      // Get all unassigned returns (without schedule_id)
      const { data: unassignedReturns, error: unassignedReturnsError } = await supabase
        .from('mainreturns')
        .select(`
          customernumber,
          agentnumber,
          done_return,
          returncancel,
          schedule_id
        `)
        .is('returncancel', null) // returncancel must be NULL
        .is('done_return', null) // unassigned returns should not be produced
        .is('schedule_id', null); // only returns without schedule_id

      if (unassignedReturnsError) {
        console.error('Error fetching unassigned returns:', unassignedReturnsError);
        throw unassignedReturnsError;
      }

      // Filter assigned returns that are truly waiting
      const trulyWaitingAssignedReturns = (assignedReturns || []).filter(returnItem => {
        const schedule = returnItem.distribution_schedule;
        
        // Criteria 1: done_return is NULL
        if (!returnItem.done_return) {
          return true;
        }
        
        // Criteria 2: done_return has timestamp but distribution_date is today or later
        if (returnItem.done_return && schedule?.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          
          // If distribution date is today or later, it's still waiting
          if (distributionDate >= today) {
            return true;
          }
        }
        
        return false;
      });

      // All unassigned returns are considered waiting
      const trulyWaitingUnassignedReturns = unassignedReturns || [];

      // Combine both types of waiting returns
      let allWaitingReturns = [...trulyWaitingAssignedReturns, ...trulyWaitingUnassignedReturns];

      // Filter returns based on current user agent (same logic as orders)
      if (currentUserAgent && currentUserAgent !== '4') {
        if (currentUserAgent === '99') {
          // Kandi+ user - show only returns with agent number 99
          allWaitingReturns = allWaitingReturns.filter(returnItem => returnItem.agentnumber === '99');
        } else {
          // Regular agent - show only their returns, excluding Kandi+ (99)
          allWaitingReturns = allWaitingReturns.filter(returnItem => 
            returnItem.agentnumber === currentUserAgent && returnItem.agentnumber !== '99'
          );
        }
      }
      // Agent 4 (admin) sees all returns - no filtering

      // Combine orders and returns for final calculation
      const allWaitingItems = [...allWaitingOrders, ...allWaitingReturns];

      if (!allWaitingItems.length) {
        return { regularCustomers: 0, kandiPlusCustomers: 0, totalCustomers: 0 };
      }

      // Get unique customers
      const uniqueCustomers = new Set();
      const kandiPlusCustomers = new Set();

      allWaitingItems.forEach(item => {
        uniqueCustomers.add(item.customernumber);
        
        // Check if customer is קנדי+ (agent number '99')
        if (item.agentnumber === '99') {
          kandiPlusCustomers.add(item.customernumber);
        }
      });

      const totalCustomers = uniqueCustomers.size;
      const kandiPlusCount = kandiPlusCustomers.size;
      const regularCount = totalCustomers - kandiPlusCount;

      console.log('Waiting customers for agent', currentUserAgent, ':', {
        regular: regularCount,
        kandiPlus: kandiPlusCount,
        total: totalCustomers
      });

      return {
        regularCustomers: regularCount,
        kandiPlusCustomers: kandiPlusCount,
        totalCustomers: totalCustomers
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
};
