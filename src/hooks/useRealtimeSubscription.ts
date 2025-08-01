
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up realtime subscriptions...');

    // Create a single channel for all table changes
    const channel = supabase
      .channel('distribution-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mainorder'
        },
        (payload) => {
          console.log('mainorder changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-orders'] });
          queryClient.invalidateQueries({ queryKey: ['customer-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mainreturns'
        },
        (payload) => {
          console.log('mainreturns changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['returns'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-returns'] });
          queryClient.invalidateQueries({ queryKey: ['customer-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'distribution_schedule'
        },
        (payload) => {
          console.log('distribution_schedule changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['distribution-schedules'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-distribution-schedules'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'distribution_groups'
        },
        (payload) => {
          console.log('distribution_groups changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['distribution-groups'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-distribution-groups'] });
          queryClient.invalidateQueries({ queryKey: ['lines-distribution-groups'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('messages changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['warehouse-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cities'
        },
        (payload) => {
          console.log('cities changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['cities'] });
          queryClient.invalidateQueries({ queryKey: ['lines-cities'] });
          queryClient.invalidateQueries({ queryKey: ['lines-distribution-groups'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
