import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Loader2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CalendarCard } from '@/components/calendar/CalendarCard';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { HorizontalKanban } from '@/components/calendar/HorizontalKanban';
import { useAuth } from '@/context/AuthContext';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  schedule_id_if_changed?: any;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
}
interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  schedule_id_if_changed?: any;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
}
interface DistributionGroup {
  groups_id: number;
  separation: string;
  agents?: any; // JSONB in DB, יכול להיות string[] או string
}
interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  distribution_date?: string;
  destinations?: number;
  driver_id?: number;
  dis_number?: number;
  done_schedule?: string;
}
interface Driver {
  id: number;
  nahag: string;
}
const Calendar = () => {
  const navigate = useNavigate();
  const {
    user: currentUser
  } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const sunday = new Date(today);
    // Calculate days back to Sunday (Israeli week start)
    sunday.setDate(today.getDate() - dayOfWeek);
    return sunday;
  });

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Fetch orders with schedule_id_if_changed
  const {
    data: orders = [],
    refetch: refetchOrders,
    isLoading: ordersLoading
  } = useQuery({
    queryKey: ['calendar-orders'],
    queryFn: async () => {
      console.log('Fetching orders for calendar...');
      const {
        data,
        error
      } = await supabase.from('mainorder').select('ordernumber, customername, address, city, totalorder, schedule_id, schedule_id_if_changed, icecream, customernumber, agentnumber, orderdate, invoicenumber').order('ordernumber', {
        ascending: false
      });
      if (error) throw error;
      console.log('Calendar orders fetched:', data);
      return data as Order[];
    }
  });

  // Fetch returns with schedule_id_if_changed
  const {
    data: returns = [],
    refetch: refetchReturns,
    isLoading: returnsLoading
  } = useQuery({
    queryKey: ['calendar-returns'],
    queryFn: async () => {
      console.log('Fetching returns for calendar...');
      const {
        data,
        error
      } = await supabase.from('mainreturns').select('returnnumber, customername, address, city, totalreturn, schedule_id, schedule_id_if_changed, icecream, customernumber, agentnumber, returndate').order('returnnumber', {
        ascending: false
      });
      if (error) throw error;
      console.log('Calendar returns fetched:', data);
      return data as Return[];
    }
  });

  // Fetch distribution groups
  const {
    data: distributionGroups = [],
    isLoading: groupsLoading
  } = useQuery({
    queryKey: ['calendar-distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups for calendar...');
      const {
        data,
        error
      } = await supabase.from('distribution_groups').select('groups_id, separation, agents'); // נוסיף agents כאן

      if (error) throw error;
      console.log('Calendar distribution groups fetched:', data);
      return data as DistributionGroup[];
    }
  });

  // Fetch distribution schedules with driver_id, dis_number, and done_schedule
  const {
    data: distributionSchedules = [],
    refetch: refetchSchedules,
    isLoading: schedulesLoading
  } = useQuery({
    queryKey: ['calendar-distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching distribution schedules for calendar...');
      const {
        data,
        error
      } = await supabase.from('distribution_schedule').select('schedule_id, groups_id, create_at_schedule, distribution_date, destinations, driver_id, dis_number, done_schedule');
      if (error) throw error;
      console.log('Calendar distribution schedules fetched:', data);
      return data as DistributionSchedule[];
    }
  });

  // Fetch drivers
  const {
    data: drivers = [],
    isLoading: driversLoading
  } = useQuery({
    queryKey: ['calendar-drivers'],
    queryFn: async () => {
      console.log('Fetching drivers for calendar...');
      const {
        data,
        error
      } = await supabase.from('nahagim').select('id, nahag').order('nahag');
      if (error) throw error;
      console.log('Calendar drivers fetched:', data);
      return data as Driver[];
    }
  });

  // AUTHORIZE: Get allowed group ids or schedule ids for this user (except admin "4" sees all)
  const allowedGroupIds = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.agentnumber === "4") return null; // 4 ("משרד") sees all
    
    // Special logic for Agent 99 - only see specific schedule_ids that have his orders/returns
    if (currentUser.agentnumber === "99") {
      const agent99ScheduleIds = new Set<number>();
      distributionSchedules.forEach(schedule => {
        const hasAgent99Orders = orders.some(order => {
          const relevantScheduleIds = [];
          if (typeof order.schedule_id === 'number') relevantScheduleIds.push(order.schedule_id);
          if (order.schedule_id_if_changed) {
            if (typeof order.schedule_id_if_changed === 'number') {
              relevantScheduleIds.push(order.schedule_id_if_changed);
            } else if (Array.isArray(order.schedule_id_if_changed)) {
              order.schedule_id_if_changed.forEach(sid => {
                if (typeof sid === 'number') relevantScheduleIds.push(sid);
              });
            } else if (typeof order.schedule_id_if_changed === 'object' && order.schedule_id_if_changed.schedule_id) {
              relevantScheduleIds.push(order.schedule_id_if_changed.schedule_id);
            }
          }
          
          return relevantScheduleIds.includes(schedule.schedule_id) && order.agentnumber === '99';
        });
        
        const hasAgent99Returns = returns.some(returnItem => {
          const relevantScheduleIds = [];
          if (typeof returnItem.schedule_id === 'number') relevantScheduleIds.push(returnItem.schedule_id);
          if (returnItem.schedule_id_if_changed) {
            if (typeof returnItem.schedule_id_if_changed === 'number') {
              relevantScheduleIds.push(returnItem.schedule_id_if_changed);
            } else if (Array.isArray(returnItem.schedule_id_if_changed)) {
              returnItem.schedule_id_if_changed.forEach(sid => {
                if (typeof sid === 'number') relevantScheduleIds.push(sid);
              });
            } else if (typeof returnItem.schedule_id_if_changed === 'object' && returnItem.schedule_id_if_changed.schedule_id) {
              relevantScheduleIds.push(returnItem.schedule_id_if_changed.schedule_id);
            }
          }
          
          return relevantScheduleIds.includes(schedule.schedule_id) && returnItem.agentnumber === '99';
        });

        if (hasAgent99Orders || hasAgent99Returns) {
          agent99ScheduleIds.add(schedule.schedule_id);
        }
      });
      return Array.from(agent99ScheduleIds);
    }
    
    // Allow only groups where agent is in distribution_groups.agents (array of agentnumbers in jsonb)
    return distributionGroups.filter(group => {
      if (!group.agents) return false;
      if (Array.isArray(group.agents)) {
        // Convert currentUser.agentnumber to integer for comparison
        return group.agents.includes(parseInt(currentUser.agentnumber));
      }
      // fallback in case agents is not an array (shouldn't happen)
      if (typeof group.agents === "string") {
        try {
          const arr = JSON.parse(group.agents);
          return arr.includes(parseInt(currentUser.agentnumber));
        } catch {
          return false;
        }
      }
      return false;
    }).map(group => group.groups_id);
  }, [currentUser, distributionGroups, distributionSchedules, orders, returns]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.agentnumber === "4") return distributionSchedules;
    if (!allowedGroupIds || allowedGroupIds.length === 0) return [];
    
    // For Agent 99, allowedGroupIds actually contains schedule_ids
    if (currentUser.agentnumber === "99") {
      return distributionSchedules.filter(sch => allowedGroupIds.includes(sch.schedule_id));
    }
    
    return distributionSchedules.filter(sch => allowedGroupIds.includes(sch.groups_id));
  }, [distributionSchedules, allowedGroupIds, currentUser]);

  // Filtered orders + returns. Show only those whose schedule/group is allowed.
  const filteredOrders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.agentnumber === "4") return orders;
    if (!allowedGroupIds || allowedGroupIds.length === 0) return [];
    
    let filteredResults;
    
    // Special filtering for Agent 99 - check schedule_id directly
    if (currentUser.agentnumber === "99") {
      filteredResults = orders.filter(o => {
        // For Agent 99, check if any of the order's schedule_ids are in allowedGroupIds (which contains schedule_ids for Agent 99)
        const allScheduleIds = [];
        if (typeof o.schedule_id === 'number') allScheduleIds.push(o.schedule_id);
        if (typeof o.schedule_id_if_changed === 'number') allScheduleIds.push(o.schedule_id_if_changed);
        if (Array.isArray(o.schedule_id_if_changed)) o.schedule_id_if_changed.forEach(sid => {
          if (typeof sid === 'number') allScheduleIds.push(sid);
        });
        
        return allScheduleIds.some(sid => allowedGroupIds.includes(sid)) && o.agentnumber === '99';
      });
    } else {
      // For other agents, use the original logic with groups_id
      filteredResults = orders.filter(o => {
        // Find to which group this order belongs, via its schedule_id or schedule_id_if_changed
        const allScheduleIds = [];
        if (typeof o.schedule_id === 'number') allScheduleIds.push(o.schedule_id);
        if (typeof o.schedule_id_if_changed === 'number') allScheduleIds.push(o.schedule_id_if_changed);
        if (Array.isArray(o.schedule_id_if_changed)) o.schedule_id_if_changed.forEach(sid => {
          if (typeof sid === 'number') allScheduleIds.push(sid);
        });
        // For each schedule_id in this order, find its group via distributionSchedules
        const inAllowed = allScheduleIds.some(sid => {
          const sch = distributionSchedules.find(s => s.schedule_id === sid);
          return sch && allowedGroupIds.includes(sch.groups_id);
        });
        return inAllowed;
      });
    }
    
    return filteredResults;
  }, [orders, allowedGroupIds, currentUser, distributionSchedules]);
  
  const filteredReturns = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.agentnumber === "4") return returns;
    if (!allowedGroupIds || allowedGroupIds.length === 0) return [];
    
    let filteredResults;
    
    // Special filtering for Agent 99 - check schedule_id directly
    if (currentUser.agentnumber === "99") {
      filteredResults = returns.filter(o => {
        // For Agent 99, check if any of the return's schedule_ids are in allowedGroupIds (which contains schedule_ids for Agent 99)
        const allScheduleIds = [];
        if (typeof o.schedule_id === 'number') allScheduleIds.push(o.schedule_id);
        if (typeof o.schedule_id_if_changed === 'number') allScheduleIds.push(o.schedule_id_if_changed);
        if (Array.isArray(o.schedule_id_if_changed)) o.schedule_id_if_changed.forEach(sid => {
          if (typeof sid === 'number') allScheduleIds.push(sid);
        });
        
        return allScheduleIds.some(sid => allowedGroupIds.includes(sid)) && o.agentnumber === '99';
      });
    } else {
      // For other agents, use the original logic with groups_id
      filteredResults = returns.filter(o => {
        // Find to which group this return belongs, via its schedule_id or schedule_id_if_changed
        const allScheduleIds = [];
        if (typeof o.schedule_id === 'number') allScheduleIds.push(o.schedule_id);
        if (typeof o.schedule_id_if_changed === 'number') allScheduleIds.push(o.schedule_id_if_changed);
        if (Array.isArray(o.schedule_id_if_changed)) o.schedule_id_if_changed.forEach(sid => {
          if (typeof sid === 'number') allScheduleIds.push(sid);
        });
        // For each schedule_id in this return, find its group via distributionSchedules
        const inAllowed = allScheduleIds.some(sid => {
          const sch = distributionSchedules.find(s => s.schedule_id === sid);
          return sch && allowedGroupIds.includes(sch.groups_id);
        });
        return inAllowed;
      });
    }
    
    return filteredResults;
  }, [returns, allowedGroupIds, currentUser, distributionSchedules]);

  // Update destinations count immediately when orders/returns change
  useEffect(() => {
    const updateAllDestinationsCount = async () => {
      // Import the utility functions
      const {
        getUniqueCustomersForSchedule
      } = await import('@/utils/scheduleUtils');

      // Only update for schedules that have assigned items
      const schedulesWithItems = distributionSchedules.filter(schedule => {
        const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, schedule.schedule_id);
        return uniqueCustomers.size > 0;
      });
      for (const schedule of schedulesWithItems) {
        const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, schedule.schedule_id);

        // Update destinations count immediately if it has changed
        if (schedule.destinations !== uniqueCustomers.size) {
          try {
            const {
              error
            } = await supabase.from('distribution_schedule').update({
              destinations: uniqueCustomers.size
            }).eq('schedule_id', schedule.schedule_id);
            if (error) {
              console.error('Error updating destinations count:', error);
            } else {
              console.log(`Updated destinations for schedule ${schedule.schedule_id}: ${uniqueCustomers.size}`);
              // Immediately refetch schedules to update the UI
              refetchSchedules();
            }
          } catch (error) {
            console.error('Error updating destinations count:', error);
          }
        }
      }
    };
    if (distributionSchedules.length > 0 && (orders.length > 0 || returns.length > 0)) {
      updateAllDestinationsCount();
    }
  }, [orders, returns, distributionSchedules, refetchSchedules]);
  const handleDropToDate = async (scheduleId: number, date: Date) => {
    try {
      console.log('Dropping schedule', scheduleId, 'to date', date);

      // Build date string directly from date components to avoid timezone issues
      // This ensures the exact date displayed is what gets saved
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      console.log('Date being saved to database:', dateString);
      console.log('Original date object:', date);
      console.log('Display format:', `${day}/${month}`);

      // Calculate unique destinations count for this schedule
      const scheduleOrders = orders.filter(order => order.schedule_id === scheduleId);
      const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === scheduleId);
      const uniqueCustomers = new Set([...scheduleOrders.map(order => order.customername), ...scheduleReturns.map(returnItem => returnItem.customername)]);
      const {
        error
      } = await supabase.from('distribution_schedule').update({
        distribution_date: dateString,
        destinations: uniqueCustomers.size
      }).eq('schedule_id', scheduleId);
      if (error) {
        console.error('Error updating schedule date:', error);
        throw error;
      }
      console.log('Schedule date updated successfully to:', dateString);
      refetchSchedules();
    } catch (error) {
      console.error('Error updating schedule date:', error);
    }
  };
  const handleDropToKanban = async (scheduleId: number) => {
    try {
      console.log('Returning schedule', scheduleId, 'to kanban');
      const {
        error
      } = await supabase.from('distribution_schedule').update({
        distribution_date: null
      }).eq('schedule_id', scheduleId);
      if (error) {
        console.error('Error returning schedule to kanban:', error);
        throw error;
      }
      console.log('Schedule returned to kanban successfully');
      refetchSchedules();
    } catch (error) {
      console.error('Error returning schedule to kanban:', error);
    }
  };

  // Add function to update destinations count when items are removed
  const updateDestinationsCount = async (scheduleId: number) => {
    try {
      const {
        getUniqueCustomersForSchedule
      } = await import('@/utils/scheduleUtils');
      const uniqueCustomers = getUniqueCustomersForSchedule(orders, returns, scheduleId);
      const {
        error
      } = await supabase.from('distribution_schedule').update({
        destinations: uniqueCustomers.size
      }).eq('schedule_id', scheduleId);
      if (error) {
        console.error('Error updating destinations count:', error);
        throw error;
      }
      console.log('Destinations count updated successfully');
      refetchSchedules();
    } catch (error) {
      console.error('Error updating destinations count:', error);
    }
  };

  // Function to refresh all data
  const handleRefreshData = () => {
    refetchOrders();
    refetchReturns();
    refetchSchedules();
  };

  const navigateWeeks = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 14 : -14));
    setCurrentWeekStart(newDate);
  };

  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading || driversLoading;
  if (isLoading) {
    return <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>;
  }
  return <div className="min-h-screen p-6 bg-background">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">לוח שנה הפצה</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/distribution')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            ממשק הפצה
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => navigate('/archive')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            ארכיון
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Kanban */}
      <HorizontalKanban distributionSchedules={filteredSchedules} distributionGroups={distributionGroups} drivers={drivers} orders={filteredOrders} returns={filteredReturns} onUpdateDestinations={updateDestinationsCount} onDropToKanban={currentUser?.agentnumber === "4" ? handleDropToKanban : undefined} currentUser={currentUser} />

      {/* Calendar Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button onClick={() => navigateWeeks('prev')} variant="outline" size="sm">
          <ChevronRight className="h-4 w-4" />
          שבועיים אחורה
        </Button>
        
        <span className="text-lg font-medium">
          {currentWeekStart.toLocaleDateString('he-IL')} - {new Date(currentWeekStart.getTime() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')}
        </span>
        
        <Button onClick={() => navigateWeeks('next')} variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4" />
          שבועיים קדימה
        </Button>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid 
        currentWeekStart={currentWeekStart} 
        distributionSchedules={filteredSchedules} 
        distributionGroups={distributionGroups} 
        drivers={drivers} 
        orders={filteredOrders} 
        returns={filteredReturns} 
        onDropToDate={currentUser?.agentnumber === "4" ? handleDropToDate : undefined} 
        currentUser={currentUser}
        onRefreshData={handleRefreshData}
      />
    </div>;
};

export default Calendar;
