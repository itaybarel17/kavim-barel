
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
          icecream,
          ordernumber,
          distribution_schedule!inner(
            done_schedule,
            distribution_date
          )
        `)
        .is('ordercancel', null) // ordercancel must be NULL
        .not('schedule_id', 'is', null) // only orders with schedule_id
        .is('icecream', null); // only orders where icecream is NULL

      if (assignedError) {
        console.error('Error fetching assigned orders:', assignedError);
        throw assignedError;
      }

      console.log('Assigned orders fetched (before filtering):', assignedOrders?.length || 0);

      // Get all unassigned orders (without schedule_id)
      const { data: unassignedOrders, error: unassignedError } = await supabase
        .from('mainorder')
        .select(`
          customernumber,
          agentnumber,
          done_mainorder,
          ordercancel,
          schedule_id,
          icecream,
          ordernumber
        `)
        .is('ordercancel', null) // ordercancel must be NULL
        .is('done_mainorder', null) // unassigned orders should not be produced
        .is('schedule_id', null) // only orders without schedule_id
        .is('icecream', null); // only orders where icecream is NULL

      if (unassignedError) {
        console.error('Error fetching unassigned orders:', unassignedError);
        throw unassignedError;
      }

      console.log('Unassigned orders fetched:', unassignedOrders?.length || 0);

      // Filter assigned orders that are truly waiting based on the criteria
      const trulyWaitingAssignedOrders = (assignedOrders || []).filter(order => {
        const schedule = order.distribution_schedule;
        
        // Criteria 1: done_mainorder is NULL
        if (!order.done_mainorder) {
          return true;
        }
        
        // Criteria 2: done_mainorder has timestamp but done_schedule is null and distribution_date is today or later
        if (order.done_mainorder && !schedule?.done_schedule && schedule?.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          
          // If distribution date is today or later and not yet distributed, it's still waiting
          if (distributionDate >= today) {
            return true;
          }
        }
        
        return false;
      });

      console.log('Truly waiting assigned orders:', trulyWaitingAssignedOrders.length);

      // All unassigned orders are considered waiting (they already have done_mainorder = NULL filter)
      const trulyWaitingUnassignedOrders = unassignedOrders || [];

      console.log('Truly waiting unassigned orders:', trulyWaitingUnassignedOrders.length);

      // Combine both types of waiting orders
      let allWaitingOrders = [...trulyWaitingAssignedOrders, ...trulyWaitingUnassignedOrders];

      console.log('All waiting orders before agent filter:', allWaitingOrders.length);

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

      console.log('All waiting orders after agent filter:', allWaitingOrders.length);

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

      console.log('Final waiting customers (orders only, icecream=NULL only) for agent', currentUserAgent, ':', {
        regular: regularCount,
        kandiPlus: kandiPlusCount,
        total: totalCustomers,
        orderNumbers: allWaitingOrders.map(order => order.ordernumber || 'no order number')
      });

      return {
        regularCustomers: regularCount,
        kandiPlusCustomers: kandiPlusCount,
        totalCustomers: totalCustomers
      };
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 55000, // Consider data stale after 55 seconds
  });
};
