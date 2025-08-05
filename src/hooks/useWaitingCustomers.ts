
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
      console.log('Fetching waiting customers data (simplified logic) for agent:', currentUserAgent);
      
      // Get all orders that are waiting - with candycustomerlist JOIN for accurate Candy+ identification
      // A customer is "waiting" if they have an order that meets one of these conditions:
      // 1. schedule_id IS NULL AND done_mainorder IS NULL (unassigned)
      // 2. schedule_id IS NOT NULL AND done_mainorder IS NULL (assigned but not yet produced)
      
      // First get all waiting orders with a separate query to candycustomerlist
      const { data: waitingOrders, error } = await supabase
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
        .is('done_mainorder', null) // order not yet produced
        .is('icecream', null); // only orders where icecream is NULL

      if (error) {
        console.error('Error fetching waiting orders:', error);
        throw error;
      }

      // Get candycustomerlist data for agent mapping
      const { data: candyCustomers, error: candyError } = await supabase
        .from('candycustomerlist')
        .select('customernumber, agentnumber');

      if (candyError) {
        console.error('Error fetching candy customers:', candyError);
        // Continue without candy data rather than failing
      }

      console.log('All waiting orders fetched:', waitingOrders?.length || 0);

      // Create a map of candy customers for efficient lookup
      const candyMap = new Map();
      if (candyCustomers) {
        candyCustomers.forEach(candy => {
          candyMap.set(candy.customernumber, candy.agentnumber);
        });
      }

      // Filter orders based on current user agent
      let allWaitingOrders = waitingOrders || [];
      
      console.log('All waiting orders before agent filter:', allWaitingOrders.length);

      // Filter orders based on current user agent
      if (currentUserAgent && currentUserAgent !== '4') {
        if (currentUserAgent === '99') {
          // Kandi+ user - show only orders where candycustomerlist.agentnumber is 99
          allWaitingOrders = allWaitingOrders.filter(order => 
            candyMap.get(order.customernumber) === '99'
          );
        } else {
          // Regular agent - show only their orders, excluding Kandi+ customers
          allWaitingOrders = allWaitingOrders.filter(order => {
            // If customer exists in candycustomerlist, use that agent number
            const candyAgent = candyMap.get(order.customernumber);
            if (candyAgent) {
              return candyAgent === currentUserAgent;
            }
            // Otherwise fall back to mainorder.agentnumber
            return order.agentnumber === currentUserAgent && order.agentnumber !== '99';
          });
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
        
        // Check if customer is קנדי+ using candycustomerlist data first, fallback to mainorder
        const candyAgent = candyMap.get(order.customernumber);
        if (candyAgent === '99' || (candyAgent === undefined && order.agentnumber === '99')) {
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
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
};
