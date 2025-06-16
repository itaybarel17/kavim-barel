
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
      console.log('Fetching waiting customers data (orders only) for agent:', currentUserAgent);
      
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

      if (!allWaitingOrders.length) {
        return { regularCustomers: 0, kandiPlusCustomers: 0, totalCustomers: 0 };
      }

      // Get unique customers from orders only
      const uniqueCustomers = new Set();
      const kandiPlusCustomers = new Set();

      allWaitingOrders.forEach(order => {
        uniqueCustomers.add(order.customernumber);
        
        // Check if customer is קנדי+ (agent number '99')
        if (order.agentnumber === '99') {
          kandiPlusCustomers.add(order.customernumber);
        }
      });

      const totalCustomers = uniqueCustomers.size;
      const kandiPlusCount = kandiPlusCustomers.size;
      const regularCount = totalCustomers - kandiPlusCount;

      console.log('Waiting customers (orders only) for agent', currentUserAgent, ':', {
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
