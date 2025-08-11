import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CalendarCard } from '@/components/calendar/CalendarCard';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { HorizontalKanban } from '@/components/calendar/HorizontalKanban';
import { ViewOnlyUnassignedArea } from '@/components/calendar/ViewOnlyUnassignedArea';
import { useAuth } from '@/context/AuthContext';
import { getCustomerReplacementMap } from '@/utils/scheduleUtils';
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
  hour?: string;
  remark?: string;
  alert_status?: boolean;
  ezor1?: string;
  ezor2?: string;
  day1?: string;
  day2?: string;
  done_mainorder?: string | null;
  ordercancel?: string | null;
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
  hour?: string;
  remark?: string;
  alert_status?: boolean;
  done_return?: string | null;
  returncancel?: string | null;
}
interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[];
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

interface CustomerSupply {
  customernumber: string;
  supplydetails?: string;
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
  
  // Agent filter state - default to "משרד" (agent 4)
  const [selectedAgent, setSelectedAgent] = useState('4');
  
  // Show only my activity state for non-admin agents
  const [showOnlyMyActivity, setShowOnlyMyActivity] = useState(false);

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Utility function to clean brackets from area strings
  const cleanAreaString = (areaString: string | undefined | null): string => {
    if (!areaString) return '';
    return areaString.replace(/[\[\]{}]/g, '').trim();
  };

  // Helper function to filter orders based on user permissions and show my activity toggle
  const filterOrdersByUser = (orders: Order[]) => {
    // Agent 99 can only see their own orders
    if (currentUser?.agentnumber === '99') {
      return orders.filter(order => order.agentnumber === '99');
    }
    
    // For non-admin agents with "show only my activity" enabled
    if (currentUser?.agentnumber !== '4' && showOnlyMyActivity) {
      return orders.filter(order => order.agentnumber === currentUser?.agentnumber);
    }
    
    // All other agents can see everything
    return orders;
  };

  // Helper function to filter returns based on user permissions and show my activity toggle
  const filterReturnsByUser = (returns: Return[]) => {
    // Agent 99 can only see their own returns
    if (currentUser?.agentnumber === '99') {
      return returns.filter(returnItem => returnItem.agentnumber === '99');
    }
    
    // For non-admin agents with "show only my activity" enabled
    if (currentUser?.agentnumber !== '4' && showOnlyMyActivity) {
      return returns.filter(returnItem => returnItem.agentnumber === currentUser?.agentnumber);
    }
    
    // All other agents can see everything
    return returns;
  };

  // Fetch all orders (including unassigned ones for the unassigned area)
  const {
    data: allOrders = [],
    refetch: refetchOrders,
    isLoading: ordersLoading
  } = useQuery({
    queryKey: ['calendar-orders'],
    queryFn: async () => {
      console.log('Fetching orders for calendar...');
      // All agents now see both produced and unproduced orders
      let query = supabase.from('mainorder').select('ordernumber, customername, address, city, totalorder, schedule_id, schedule_id_if_changed, icecream, customernumber, agentnumber, orderdate, invoicenumber, hour, remark, alert_status, ezor1, ezor2, day1, day2, done_mainorder').or('icecream.is.null,icecream.eq.').is('ordercancel', null).order('ordernumber', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      console.log('Calendar orders fetched:', data);
      return data as Order[];
    }
  });

  // Apply user permissions and toggle filtering
  const orders = filterOrdersByUser(allOrders);

  // Fetch all returns (including unassigned ones for the unassigned area)
  const {
    data: allReturns = [],
    refetch: refetchReturns,
    isLoading: returnsLoading
  } = useQuery({
    queryKey: ['calendar-returns'],
    queryFn: async () => {
      console.log('Fetching returns for calendar...');
      // All agents now see both produced and unproduced returns
      let query = supabase.from('mainreturns').select('returnnumber, customername, address, city, totalreturn, schedule_id, schedule_id_if_changed, icecream, customernumber, agentnumber, returndate, hour, remark, alert_status, done_return').or('icecream.is.null,icecream.eq.').is('returncancel', null).order('returnnumber', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      console.log('Calendar returns fetched:', data);
      return data as Return[];
    }
  });

  // Apply user permissions and toggle filtering
  const returns = filterReturnsByUser(allReturns);

  // Fetch order replacement details for "הזמנה על לקוח אחר" messages
  const { data: orderReplacementData = [] } = useQuery({
    queryKey: ['order-replacement-details'],
    queryFn: async () => {
      console.log('Fetching order replacement details...');
      const { data, error } = await supabase
        .from('messages')
        .select(`
          ordernumber,
          returnnumber,
          correctcustomer,
          city
        `)
        .eq('subject', 'הזמנה על לקוח אחר')
        .or('ordernumber.not.is.null,returnnumber.not.is.null');
      
      if (error) throw error;
      console.log('Order replacement details fetched:', data);
      return data;
    }
  });

  // Fetch customer details for replacement validation
  const { data: customerDetails = [] } = useQuery({
    queryKey: ['customer-details-for-replacement'],
    queryFn: async () => {
      console.log('Fetching customer details for replacement...');
      const { data, error } = await supabase
        .from('customerlist')
        .select('customernumber, customername, address, city, mobile, phone, supplydetails');
      
      if (error) throw error;
      console.log('Customer details for replacement fetched:', data);
      return data;
    }
  });

  // Create customer replacement map
  const orderOnAnotherCustomerDetails = useMemo(() => {
    if (orderReplacementData.length === 0) return new Map();
    
    // Transform the query data to match CustomerReplacement interface
    const transformedData = orderReplacementData.map(item => ({
      ordernumber: item.ordernumber,
      returnnumber: item.returnnumber,
      correctcustomer: item.correctcustomer,
      city: item.city,
      existsInSystem: false, // Will be determined in getCustomerReplacementMap
    }));
    
    return getCustomerReplacementMap(transformedData, customerDetails);
  }, [orderReplacementData, customerDetails]);

  // Fetch customer supply details
  const {
    data: customerSupplyData = [],
    isLoading: customerSupplyLoading
  } = useQuery({
    queryKey: ['customer-supply'],
    queryFn: async () => {
      console.log('Fetching customer supply details...');
      const {
        data,
        error
      } = await supabase.from('customerlist').select('customernumber, supplydetails');
      if (error) throw error;
      console.log('Customer supply data fetched:', data);
      return data as CustomerSupply[];
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
      } = await supabase.from('distribution_groups').select('groups_id, separation, agents, days');

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

  // Fetch agents for the filter dropdown
  const {
    data: agents = [],
    isLoading: agentsLoading
  } = useQuery({
    queryKey: ['calendar-agents'],
    queryFn: async () => {
      console.log('Fetching agents for calendar filter...');
      const {
        data,
        error
      } = await supabase.from('agents').select('agentnumber, agentname').order('agentname');
      if (error) throw error;
      console.log('Calendar agents fetched:', data);
      return data as { agentnumber: string; agentname: string }[];
    }
  });


  // AUTHORIZE: Get allowed group ids or schedule ids for this user (except admin "4" sees all)
  // Create map for customer supply lookup
  const customerSupplyMap = customerSupplyData.reduce((map, customer) => {
    map[customer.customernumber] = customer.supplydetails || '';
    return map;
  }, {} as Record<string, string>);

  // Agent filtering functions
  const filterOrdersByAgent = (orders: Order[]) => {
    if (selectedAgent === '4') return orders; // "משרד" shows all
    return orders.filter(order => order.agentnumber === selectedAgent);
  };

  const filterReturnsByAgent = (returns: Return[]) => {
    if (selectedAgent === '4') return returns; // "משרד" shows all
    return returns.filter(returnItem => returnItem.agentnumber === selectedAgent);
  };

  // --- BEGIN CUSTOMER STATUS LOGIC FOR ICONS ---
  // ACTIVE order: done_mainorder == null && ordercancel == null
  // ACTIVE return: done_return == null && returncancel == null
  function isOrderActive(order: Order) {
    return !order.done_mainorder && !order.ordercancel;
  }
  function isReturnActive(ret: Return) {
    return !ret.done_return && !ret.returncancel;
  }

  // Apply agent filtering to customer icon calculations
  const filteredOrdersForIcons = filterOrdersByAgent(orders);
  const filteredReturnsForIcons = filterReturnsByAgent(returns);

  // 1. multi-active-order customers (blue icon)
  const activeOrders = filteredOrdersForIcons.filter(isOrderActive);
  const customerMap: Record<string, Order[]> = {};
  activeOrders.forEach(order => {
    const key = `${order.customername}^^${order.city}`;
    if (!customerMap[key]) customerMap[key] = [];
    customerMap[key].push(order);
  });
  const multiOrderActiveCustomerList = Object.entries(customerMap).filter(([_, arr]) => arr.length >= 2).map(([key]) => {
    const [name, city] = key.split('^^');
    return {
      name,
      city
    };
  });

  // 2. customers with BOTH active order and active return (red icon)
  const activeReturns = filteredReturnsForIcons.filter(isReturnActive);
  const orderKeys = new Set(activeOrders.map(o => `${o.customername}^^${o.city}`));
  const returnKeys = new Set(activeReturns.map(r => `${r.customername}^^${r.city}`));
  const dualActiveOrderReturnCustomers: {
    name: string;
    city: string;
  }[] = [];
  orderKeys.forEach(k => {
    if (returnKeys.has(k)) {
      const [name, city] = k.split('^^');
      dualActiveOrderReturnCustomers.push({
        name,
        city
      });
    }
  });


  // Calculate unassigned orders and returns with agent filtering
  const unassignedOrders = orders.filter(order => {
    // Only include orders that have no schedule_id at all
    if (!order.schedule_id) {
      if (currentUser?.agentnumber === "4") {
        // Admin sees all, but filter by selected agent
        return selectedAgent === '4' || order.agentnumber === selectedAgent;
      }
      return order.agentnumber === currentUser?.agentnumber; // Others see only their own
    }
    return false;
  });
  const unassignedReturns = returns.filter(returnItem => {
    // Only include returns that have no schedule_id at all
    if (!returnItem.schedule_id) {
      if (currentUser?.agentnumber === "4") {
        // Admin sees all, but filter by selected agent
        return selectedAgent === '4' || returnItem.agentnumber === selectedAgent;
      }
      return returnItem.agentnumber === currentUser?.agentnumber; // Others see only their own
    }
    return false;
  });

  // Simplified: Admin and Agent 99 see all groups, others see their assigned groups
  const allowedGroupIds = useMemo(() => {
    if (!currentUser) return [];
    
    // Admin sees all groups
    if (currentUser.agentnumber === "4") {
      return null; // Show all groups
    }
    
    // Agent 99 sees all groups (Candy Plus orders should appear everywhere they're scheduled)
    if (currentUser.agentnumber === '99') {
      return null; // Show all groups
    }
    
    // Other agents see groups where they're explicitly assigned
    const agentAllowedGroups = distributionGroups.filter(group => {
      if (!group.agents) return false;
      if (Array.isArray(group.agents)) {
        return group.agents.includes(parseInt(currentUser.agentnumber));
      }
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
    
    return agentAllowedGroups;
  }, [currentUser, distributionGroups]);

  // Apply group filtering to schedules
  const filteredSchedules = distributionSchedules.filter(schedule => {
    // Group authorization filtering - if allowedGroupIds is null, show all groups
    if (allowedGroupIds !== null && !allowedGroupIds.includes(schedule.groups_id)) {
      return false;
    }
    return true;
  });

  // Simplified filtering: Use all orders for scheduled items
  const filteredOrdersForSchedules = orders;
  // Simplified filtering: Use all returns for scheduled items
  const filteredReturnsForSchedules = returns;

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
  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading || driversLoading || customerSupplyLoading;
  if (isLoading) {
    return <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>;
  }
  return (
    <div className="min-h-screen p-6 bg-[#52a0e4]/15">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-700">לוח שנה</h1>
        <div className="flex gap-2">
          
          
        </div>
      </div>

      {/* View-Only Unassigned Area */}
      <ViewOnlyUnassignedArea 
        unassignedOrders={unassignedOrders}
        unassignedReturns={unassignedReturns}
        multiOrderActiveCustomerList={multiOrderActiveCustomerList}
        dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
        customerSupplyMap={customerSupplyMap}
      />

      {/* Horizontal Kanban */}
      <HorizontalKanban 
        distributionSchedules={filteredSchedules} 
        distributionGroups={distributionGroups} 
        drivers={drivers} 
        orders={filteredOrdersForSchedules} 
        returns={filteredReturnsForSchedules} 
        onUpdateDestinations={updateDestinationsCount} 
        onDropToKanban={currentUser?.agentnumber === "4" ? handleDropToKanban : undefined} 
        currentUser={currentUser} 
        customerReplacementMap={orderOnAnotherCustomerDetails}
        multiOrderActiveCustomerList={multiOrderActiveCustomerList}
        dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
        agents={agents}
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
        showOnlyMyActivity={showOnlyMyActivity}
        onShowMyActivityChange={setShowOnlyMyActivity}
      />

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
      <CalendarGrid currentWeekStart={currentWeekStart} distributionSchedules={filteredSchedules} distributionGroups={distributionGroups} drivers={drivers} orders={filteredOrdersForSchedules} returns={filteredReturnsForSchedules} onDropToDate={currentUser?.agentnumber === "4" ? handleDropToDate : undefined} currentUser={currentUser} onRefreshData={handleRefreshData} customerReplacementMap={orderOnAnotherCustomerDetails} selectedAgent={selectedAgent}  />
    </div>
  );
};
export default Calendar;