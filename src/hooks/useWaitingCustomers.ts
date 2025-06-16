
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
      
      // Get all orders that are waiting (not done and not cancelled)
      const { data: waitingOrders, error } = await supabase
        .from('mainorder')
        .select(`
          customernumber,
          customergroup,
          done_mainorder,
          ordercancel,
          schedule_id,
          distribution_schedule!inner(
            done_schedule,
            distribution_date
          )
        `)
        .is('done_mainorder', null)
        .is('ordercancel', null)
        .not('schedule_id', 'is', null);

      if (error) {
        console.error('Error fetching waiting orders:', error);
        throw error;
      }

      if (!waitingOrders) {
        return { regularCustomers: 0, kandiPlusCustomers: 0, totalCustomers: 0 };
      }

      // Filter orders that are truly waiting (schedule not done or distribution date not passed)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const trulyWaitingOrders = waitingOrders.filter(order => {
        const schedule = order.distribution_schedule;
        if (!schedule) return true;

        // If schedule is not done, it's waiting
        if (!schedule.done_schedule) return true;

        // If distribution date is in the future, it's waiting
        if (schedule.distribution_date) {
          const distributionDate = new Date(schedule.distribution_date);
          distributionDate.setHours(0, 0, 0, 0);
          if (distributionDate >= today) return true;
        }

        return false;
      });

      // Get unique customers
      const uniqueCustomers = new Set();
      const kandiPlusCustomers = new Set();

      trulyWaitingOrders.forEach(order => {
        uniqueCustomers.add(order.customernumber);
        
        // Check if customer is קנדי+
        if (order.customergroup && order.customergroup.includes('קנדי+')) {
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
