
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WaitingCustomersData {
  regularCustomers: number;
  kandiPlusCustomers: number;
  totalCustomers: number;
}

export const useWaitingCustomers = () => {
  return useQuery({
    queryKey: ['waiting-customers'],
    queryFn: async (): Promise<WaitingCustomersData> => {
      console.log('Fetching waiting customers data...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDateString = today.toISOString().split('T')[0];
      
      // Get all orders that are waiting based on the new criteria
      const { data: waitingOrders, error } = await supabase
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
        .is('ordercancel', null); // ordercancel must be NULL

      if (error) {
        console.error('Error fetching waiting orders:', error);
        throw error;
      }

      // Get all unassigned orders (without schedule_id or with schedule_id pointing to produced schedules)
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
        .or('schedule_id.is.null,schedule_id.not.in.(select schedule_id from distribution_schedule where done_schedule is null)');

      if (unassignedError) {
        console.error('Error fetching unassigned orders:', unassignedError);
        throw unassignedError;
      }

      // Combine waiting orders and unassigned orders
      const allWaitingOrders = [...(waitingOrders || []), ...(unassignedOrders || [])];

      if (!allWaitingOrders.length) {
        return { regularCustomers: 0, kandiPlusCustomers: 0, totalCustomers: 0 };
      }

      // Filter orders that are truly waiting based on the criteria
      const trulyWaitingOrders = allWaitingOrders.filter(order => {
        // For unassigned orders, they are waiting if done_mainorder is NULL
        if (!order.schedule_id) {
          return !order.done_mainorder;
        }

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

      // Get unique customers
      const uniqueCustomers = new Set();
      const kandiPlusCustomers = new Set();

      trulyWaitingOrders.forEach(order => {
        uniqueCustomers.add(order.customernumber);
        
        // Check if customer is קנדי+ (agent number '99')
        if (order.agentnumber === '99') {
          kandiPlusCustomers.add(order.customernumber);
        }
      });

      const totalCustomers = uniqueCustomers.size;
      const kandiPlusCount = kandiPlusCustomers.size;
      const regularCount = totalCustomers - kandiPlusCount;

      console.log('Waiting customers:', {
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
