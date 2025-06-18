
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UsePeriodicRefreshOptions {
  // Refresh unassigned data (orders/returns) every 30 seconds
  refreshUnassignedInterval?: number;
  // Refresh all data every 5 minutes
  refreshAllInterval?: number;
  // Only refresh when page is visible
  respectVisibility?: boolean;
}

export const usePeriodicRefresh = (options: UsePeriodicRefreshOptions = {}) => {
  const queryClient = useQueryClient();
  const {
    refreshUnassignedInterval = 30000, // 30 seconds
    refreshAllInterval = 300000, // 5 minutes
    respectVisibility = true
  } = options;

  const unassignedIntervalRef = useRef<NodeJS.Timeout>();
  const allDataIntervalRef = useRef<NodeJS.Timeout>();

  const isPageVisible = () => {
    if (!respectVisibility) return true;
    return !document.hidden;
  };

  const refreshUnassignedData = () => {
    if (!isPageVisible()) return;
    
    console.log('Refreshing unassigned data (30s interval)...');
    // Refresh queries related to unassigned orders and returns
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['returns'] });
    queryClient.invalidateQueries({ queryKey: ['distribution-schedules'] });
  };

  const refreshAllData = () => {
    if (!isPageVisible()) return;
    
    console.log('Refreshing all application data (5min interval)...');
    // Refresh all queries
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    // Set up interval for unassigned data refresh (30 seconds)
    unassignedIntervalRef.current = setInterval(refreshUnassignedData, refreshUnassignedInterval);

    // Set up interval for all data refresh (5 minutes)
    allDataIntervalRef.current = setInterval(refreshAllData, refreshAllInterval);

    // Handle visibility change - pause/resume refreshing based on page visibility
    const handleVisibilityChange = () => {
      if (respectVisibility) {
        if (document.hidden) {
          console.log('Page hidden - pausing periodic refresh');
          if (unassignedIntervalRef.current) {
            clearInterval(unassignedIntervalRef.current);
          }
          if (allDataIntervalRef.current) {
            clearInterval(allDataIntervalRef.current);
          }
        } else {
          console.log('Page visible - resuming periodic refresh');
          // Immediately refresh when page becomes visible
          refreshUnassignedData();
          // Restart intervals
          unassignedIntervalRef.current = setInterval(refreshUnassignedData, refreshUnassignedInterval);
          allDataIntervalRef.current = setInterval(refreshAllData, refreshAllInterval);
        }
      }
    };

    if (respectVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup
    return () => {
      if (unassignedIntervalRef.current) {
        clearInterval(unassignedIntervalRef.current);
      }
      if (allDataIntervalRef.current) {
        clearInterval(allDataIntervalRef.current);
      }
      if (respectVisibility) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [refreshUnassignedInterval, refreshAllInterval, respectVisibility]);

  // Return manual refresh functions in case they're needed
  return {
    refreshUnassignedData,
    refreshAllData
  };
};
