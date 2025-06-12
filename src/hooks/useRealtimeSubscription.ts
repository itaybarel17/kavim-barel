
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
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
