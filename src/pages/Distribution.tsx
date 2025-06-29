
import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { DropZone } from '@/components/distribution/DropZone';
import { UnassignedArea } from '@/components/distribution/UnassignedArea';
import { HorizontalKanban } from '@/components/calendar/HorizontalKanban';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Loader2, Calendar, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { CentralAlertBanner } from '@/components/distribution/CentralAlertBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { WarehouseMessageBanner } from '@/components/distribution/WarehouseMessageBanner';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
  totalinvoice?: number;
  hour?: string;
  remark?: string;
  done_mainorder?: string | null;
  ordercancel?: string | null;
  alert_status?: boolean;
}
interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
  hour?: string;
  remark?: string;
  done_return?: string | null;
  returncancel?: string | null;
  alert_status?: boolean;
}
interface DistributionGroup {
  groups_id: number;
  separation: string;
}
interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  driver_id?: number;
  distribution_date?: string;
  isPinned?: boolean;
}
interface Driver {
  id: number;
  nahag: string;
}
interface CustomerSupply {
  customernumber: string;
  supplydetails?: string;
}

const Distribution = () => {
  const [draggedItem, setDraggedItem] = useState<{
    type: 'order' | 'return';
    data: Order | Return;
  } | null>(null);
  
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user: currentUser
  } = useAuth();
  
  const isMobile = useIsMobile();

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Add simple page refresh every 10 minutes for desktop only
  useEffect(() => {
    if (!isMobile) {
      const interval = setInterval(() => {
        window.location.reload();
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearInterval(interval);
    }
  }, [isMobile]);

  // Helper function to filter orders based on user permissions
  const filterOrdersByUser = (orders: Order[]) => {
    // Agent 99 can only see their own orders
    if (currentUser?.agentnumber === '99') {
      return orders.filter(order => order.agentnumber === '99');
    }
    // All other agents can see everything
    return orders;
  };

  // Helper function to filter returns based on user permissions
  const filterReturnsByUser = (returns: Return[]) => {
    // Agent 99 can only see their own returns
    if (currentUser?.agentnumber === '99') {
      return returns.filter(returnItem => returnItem.agentnumber === '99');
    }
    // All other agents can see everything
    return returns;
  };

  // Fetch orders (exclude produced orders: done_mainorder IS NOT NULL and deleted orders: ordercancel IS NOT NULL)
  const {
    data: allOrders = [],
    refetch: refetchOrders,
    isLoading: ordersLoading
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('Fetching orders...');
      const {
        data,
        error
      } = await supabase.from('mainorder').select('ordernumber, customername, address, city, totalorder, schedule_id, icecream, customernumber, agentnumber, orderdate, invoicenumber, totalinvoice, hour, remark, alert_status').or('icecream.is.null,icecream.eq.').is('done_mainorder', null).is('ordercancel', null) // Exclude deleted orders
      .order('ordernumber', {
        ascending: false
      }).limit(50);
      if (error) throw error;
      console.log('Orders fetched:', data);
      return data as Order[];
    }
  });

  // Fetch returns (exclude produced returns: done_return IS NOT NULL and deleted returns: returncancel IS NOT NULL)
  const {
    data: allReturns = [],
    refetch: refetchReturns,
    isLoading: returnsLoading
  } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      console.log('Fetching returns...');
      const {
        data,
        error
      } = await supabase.from('mainreturns').select('returnnumber, customername, address, city, totalreturn, schedule_id, icecream, customernumber, agentnumber, returndate, hour, remark, alert_status').or('icecream.is.null,icecream.eq.').is('done_return', null).is('returncancel', null) // Exclude deleted returns
      .order('returnnumber', {
        ascending: false
      }).limit(50);
      if (error) throw error;
      console.log('Returns fetched:', data);
      return data as Return[];
    }
  });

  // Apply user permissions filtering
  const orders = filterOrdersByUser(allOrders);
  const returns = filterReturnsByUser(allReturns);

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
    queryKey: ['distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups...');
      const {
        data,
        error
      } = await supabase.from('distribution_groups').select('groups_id, separation');
      if (error) throw error;
      console.log('Distribution groups fetched:', data);
      return data as DistributionGroup[];
    }
  });

  // Fetch ONLY ACTIVE distribution schedules with isPinned - filter out produced ones (done_schedule IS NOT NULL)
  const {
    data: distributionSchedules = [],
    refetch: refetchSchedules,
    isLoading: schedulesLoading
  } = useQuery({
    queryKey: ['distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching active distribution schedules...');
      const {
        data,
        error
      } = await supabase.from('distribution_schedule').select('schedule_id, groups_id, create_at_schedule, driver_id, distribution_date, isPinned').is('done_schedule', null); // Only get active schedules, not produced ones

      if (error) throw error;
      console.log('Active distribution schedules fetched:', data);
      return data as DistributionSchedule[];
    }
  });

  // Fetch drivers
  const {
    data: drivers = [],
    isLoading: driversLoading
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      console.log('Fetching drivers...');
      const {
        data,
        error
      } = await supabase.from('nahagim').select('id, nahag').order('nahag');
      if (error) throw error;
      console.log('Drivers fetched:', data);
      return data as Driver[];
    }
  });

  // Create map for customer supply lookup
  const customerSupplyMap = customerSupplyData.reduce((map, customer) => {
    map[customer.customernumber] = customer.supplydetails || '';
    return map;
  }, {} as Record<string, string>);

  // --- BEGIN CUSTOMER STATUS LOGIC FOR ICONS ---
  // ACTIVE order: done_mainorder == null && ordercancel == null
  // ACTIVE return: done_return == null && returncancel == null
  function isOrderActive(order: Order) {
    return !order.done_mainorder && !order.ordercancel;
  }
  function isReturnActive(ret: Return) {
    return !ret.done_return && !ret.returncancel;
  }

  // 1. multi-active-order customers (blue icon)
  const activeOrders = orders.filter(isOrderActive);
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
  const activeReturns = returns.filter(isReturnActive);
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

  // Add query for warehouse messages (only for user 4)
  const { data: warehouseMessages = [] } = useQuery({
    queryKey: ['warehouse-messages'],
    queryFn: async () => {
      if (currentUser?.agentnumber !== "4") {
        return [];
      }
      
      console.log('Fetching warehouse messages...');
      const { data, error } = await supabase
        .from('messages')
        .select('messages_id, content, is_handled, created_at')
        .eq('subject', 'מחסן')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('Warehouse messages fetched:', data);
      return data;
    },
    enabled: currentUser?.agentnumber === "4"
  });

  const handleDrop = async (zoneNumber: number, item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('handleDrop called with zoneNumber:', zoneNumber, 'item:', item);

      // Find the schedule for this zone by looking at which schedules have items assigned to them
      // or use the zone number to find the schedule (simple mapping 1:1)
      const zoneSchedule = distributionSchedules.find(schedule => {
        // Check if this schedule has any items already assigned to it and should be in this zone
        const hasOrders = orders.some(order => order.schedule_id === schedule.schedule_id);
        const hasReturns = returns.some(returnItem => returnItem.schedule_id === schedule.schedule_id);
        return hasOrders || hasReturns;
      }) || distributionSchedules[zoneNumber - 1]; // Fallback to zone index

      if (!zoneSchedule) {
        console.log('No schedule found for zone', zoneNumber);
        return;
      }

      const scheduleId = zoneSchedule.schedule_id;
      console.log('Using schedule ID:', scheduleId, 'for zone:', zoneNumber);
      
      if (item.type === 'order') {
        console.log('Updating order', (item.data as Order).ordernumber, 'with schedule_id:', scheduleId);
        const {
          error
        } = await supabase.from('mainorder').update({
          schedule_id: scheduleId
        }).eq('ordernumber', (item.data as Order).ordernumber);
        if (error) {
          console.error('Error updating order:', error);
          throw error;
        }
        console.log('Order updated successfully');
        refetchOrders();
      } else {
        console.log('Updating return', (item.data as Return).returnnumber, 'with schedule_id:', scheduleId);
        const {
          error
        } = await supabase.from('mainreturns').update({
          schedule_id: scheduleId
        }).eq('returnnumber', (item.data as Return).returnnumber);
        if (error) {
          console.error('Error updating return:', error);
          throw error;
        }
        console.log('Return updated successfully');
        refetchReturns();
      }

      // Refresh schedules after assignment
      refetchSchedules();
    } catch (error) {
      console.error('Error updating distribution:', error);
    }
  };

  const handleDropToUnassigned = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('Removing item from assignment:', item);
      if (item.type === 'order') {
        const {
          error
        } = await supabase.from('mainorder').update({
          schedule_id: null
        }).eq('ordernumber', (item.data as Order).ordernumber);
        if (error) {
          console.error('Error removing order assignment:', error);
          throw error;
        }
        console.log('Order assignment removed successfully');
        refetchOrders();
      } else {
        const {
          error
        } = await supabase.from('mainreturns').update({
          schedule_id: null
        }).eq('returnnumber', (item.data as Return).returnnumber);
        if (error) {
          console.error('Error removing return assignment:', error);
          throw error;
        }
        console.log('Return assignment removed successfully');
        refetchReturns();
      }

      // Refresh schedules after removal
      refetchSchedules();
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  const handleScheduleDeleted = () => {
    console.log('Schedule deleted, refreshing all data...');
    refetchOrders();
    refetchReturns();
    refetchSchedules();
  };

  const handleScheduleCreated = (zoneNumber: number, newScheduleId: number) => {
    console.log('Schedule created for zone', zoneNumber, 'with ID:', newScheduleId);
    refetchSchedules();
  };

  const handleRemoveFromZone = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    await handleDropToUnassigned(item);
  };

  const handleDeleteItem = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('Deleting item:', item);
      if (item.type === 'order') {
        const {
          error
        } = await supabase.from('mainorder').update({
          ordercancel: new Date().toISOString()
        }).eq('ordernumber', (item.data as Order).ordernumber);
        if (error) {
          console.error('Error deleting order:', error);
          throw error;
        }
        console.log('Order deleted successfully');
        toast({
          title: "הזמנה נמחקה",
          description: `הזמנה #${(item.data as Order).ordernumber} הועברה לארכיון`
        });
        refetchOrders();
      } else {
        const {
          error
        } = await supabase.from('mainreturns').update({
          returncancel: new Date().toISOString()
        }).eq('returnnumber', (item.data as Return).returnnumber);
        if (error) {
          console.error('Error deleting return:', error);
          throw error;
        }
        console.log('Return deleted successfully');
        toast({
          title: "החזרה נמחקה",
          description: `החזרה #${(item.data as Return).returnnumber} הועברה לארכיון`
        });
        refetchReturns();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הפריט",
        variant: "destructive"
      });
    }
  };

  // Simplified helper function to get the current state of a zone
  const getZoneState = (zoneNumber: number) => {
    console.log('getZoneState called for zone:', zoneNumber);

    // First, try to find a schedule that already has items assigned to it for this zone
    // We'll look through all schedules and find which one has orders/returns that would logically belong to this zone
    let zoneSchedule = null;
    
    // Strategy 1: Find schedule with items that are already assigned and should be in this zone
    for (const schedule of distributionSchedules) {
      const scheduleOrders = orders.filter(order => order.schedule_id === schedule.schedule_id);
      const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === schedule.schedule_id);
      
      if (scheduleOrders.length > 0 || scheduleReturns.length > 0) {
        // This schedule has items - we need to determine which zone it belongs to
        // For now, we'll use a simple mapping based on schedule creation order and available zones
        const scheduleIndex = distributionSchedules.findIndex(s => s.schedule_id === schedule.schedule_id);
        const targetZone = (scheduleIndex % 12) + 1; // Distribute across 12 zones
        
        if (targetZone === zoneNumber) {
          zoneSchedule = schedule;
          break;
        }
      }
    }
    
    // Strategy 2: If no schedule found with items, look for pinned schedules first
    if (!zoneSchedule) {
      const pinnedSchedules = distributionSchedules.filter(s => s.isPinned);
      if (pinnedSchedules.length > 0) {
        const pinnedIndex = Math.min(zoneNumber - 1, pinnedSchedules.length - 1);
        if (pinnedSchedules[pinnedIndex]) {
          zoneSchedule = pinnedSchedules[pinnedIndex];
        }
      }
    }
    
    // Strategy 3: If still no schedule, use simple index-based assignment for remaining schedules
    if (!zoneSchedule) {
      const availableSchedules = [...distributionSchedules].sort((a, b) => a.schedule_id - b.schedule_id);
      const scheduleIndex = zoneNumber - 1;
      if (availableSchedules[scheduleIndex]) {
        zoneSchedule = availableSchedules[scheduleIndex];
      }
    }
    
    if (!zoneSchedule) {
      console.log(`No schedule available for zone ${zoneNumber}`);
      return {
        selectedGroupId: null,
        scheduleId: null,
        isPinned: false
      };
    }

    console.log(`Zone ${zoneNumber} using schedule:`, zoneSchedule);
    return {
      selectedGroupId: zoneSchedule.groups_id,
      scheduleId: zoneSchedule.schedule_id,
      isPinned: zoneSchedule.isPinned || false
    };
  };

  // Add toggle pin handler
  const handleTogglePin = async (zoneNumber: number) => {
    const zoneState = getZoneState(zoneNumber);
    const scheduleId = zoneState.scheduleId;
    
    if (!scheduleId) {
      console.log('No schedule ID found for zone, cannot toggle pin');
      return;
    }

    try {
      const currentSchedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
      const newPinnedStatus = !(currentSchedule?.isPinned || false);
      
      console.log(`Toggling pin for zone ${zoneNumber}, schedule ${scheduleId}:`, newPinnedStatus);
      
      const { error } = await supabase
        .from('distribution_schedule')
        .update({ isPinned: newPinnedStatus })
        .eq('schedule_id', scheduleId);
      
      if (error) {
        console.error('Error updating pin status:', error);
        throw error;
      }
      
      console.log('Pin status updated successfully');
      refetchSchedules();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הצימוד",
        variant: "destructive"
      });
    }
  };

  // Add siren toggle handler
  const handleSirenToggle = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      const newAlertStatus = !item.data.alert_status;
      console.log(`Toggling siren for ${item.type}:`, item.data, 'New status:', newAlertStatus);
      
      if (item.type === 'order') {
        const { error } = await supabase
          .from('mainorder')
          .update({ alert_status: newAlertStatus })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error updating order alert status:', error);
          throw error;
        }
        console.log('Order alert status updated successfully');
        refetchOrders();
      } else {
        const { error } = await supabase
          .from('mainreturns')
          .update({ alert_status: newAlertStatus })
          .eq('returnnumber', (item.data as Return).returnnumber);
        
        if (error) {
          console.error('Error updating return alert status:', error);
          throw error;
        }
        console.log('Return alert status updated successfully');
        refetchReturns();
      }
    } catch (error) {
      console.error('Error toggling siren:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון ההתראה",
        variant: "destructive"
      });
    }
  };

  // Filter unassigned items (those without schedule_id or with schedule_id pointing to produced schedules)
  const unassignedOrders = orders.filter(order => !order.schedule_id || !distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id));
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id || !distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id));

  // Create sorted drop zones (pinned first, then regular order)
  const dropZones = useMemo(() => {
    const allZones = Array.from({ length: 12 }, (_, index) => index + 1);
    
    return allZones.sort((a, b) => {
      const zoneStateA = getZoneState(a);
      const zoneStateB = getZoneState(b);
      const pinnedA = zoneStateA.isPinned;
      const pinnedB = zoneStateB.isPinned;
      
      // If one is pinned and the other isn't, pinned comes first
      if (pinnedA && !pinnedB) return -1;
      if (!pinnedA && pinnedB) return 1;
      
      // If both have the same pinned status, maintain numerical order
      return a - b;
    });
  }, [distributionSchedules]);

  console.log('Unassigned orders:', unassignedOrders.length);
  console.log('Unassigned returns:', unassignedReturns.length);
  console.log('Distribution groups:', distributionGroups.length);
  console.log('Active schedules:', distributionSchedules.length);
  console.log('Sorted drop zones:', dropZones);

  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading || driversLoading || customerSupplyLoading;

  // Check if there are any items with active sirens anywhere in the system
  const hasGlobalActiveSiren = useMemo(() => {
    // Check unassigned items
    const unassignedHasSiren = [
      ...unassignedOrders.filter(order => order.alert_status),
      ...unassignedReturns.filter(returnItem => returnItem.alert_status)
    ].length > 0;

    // Check items in zones (assigned to active schedules)
    const assignedHasSiren = [
      ...orders.filter(order => 
        order.schedule_id && 
        distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id) &&
        order.alert_status
      ),
      ...returns.filter(returnItem => 
        returnItem.schedule_id && 
        distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id) &&
        returnItem.alert_status
      )
    ].length > 0;

    return unassignedHasSiren || assignedHasSiren;
  }, [unassignedOrders, unassignedReturns, orders, returns, distributionSchedules]);

  // Periodic refresh for horizontal kanban every minute
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isLoading) {
        console.log('Refreshing horizontal kanban data...');
        refetchOrders();
        refetchReturns();
        refetchSchedules();
      }
    }, 60000); // 1 minute

    return () => {
      clearInterval(refreshInterval);
    };
  }, [refetchOrders, refetchReturns, refetchSchedules, isLoading]);

  if (isLoading) {
    return <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>;
  }

  return <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-6 bg-[#52a0e4]/15">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-700">ממשק הפצה</h1>
          <div className="flex gap-2">
            <CentralAlertBanner isVisible={hasGlobalActiveSiren} />
          </div>
        </div>
        
        {/* Warehouse message banner - only for user 4 */}
        {currentUser?.agentnumber === "4" && (
          <WarehouseMessageBanner messages={warehouseMessages} />
        )}
        
        {/* Unassigned items area without alert banner */}
        <UnassignedArea 
          unassignedOrders={unassignedOrders} 
          unassignedReturns={unassignedReturns} 
          onDragStart={setDraggedItem} 
          onDropToUnassigned={handleDropToUnassigned} 
          onDeleteItem={handleDeleteItem} 
          multiOrderActiveCustomerList={multiOrderActiveCustomerList} 
          dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} 
          customerSupplyMap={customerSupplyMap} 
          onSirenToggle={handleSirenToggle} 
        />

        {/* Mobile: single column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dropZones.map(zoneNumber => 
            <DropZone 
              key={zoneNumber} 
              zoneNumber={zoneNumber} 
              distributionGroups={distributionGroups} 
              distributionSchedules={distributionSchedules} 
              drivers={drivers} 
              onDrop={handleDrop} 
              orders={orders} 
              returns={returns} 
              onScheduleDeleted={handleScheduleDeleted} 
              onScheduleCreated={handleScheduleCreated} 
              onRemoveFromZone={handleRemoveFromZone} 
              getZoneState={getZoneState}
              multiOrderActiveCustomerList={multiOrderActiveCustomerList} 
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} 
              customerSupplyMap={customerSupplyMap} 
              onSirenToggle={handleSirenToggle}
              onTogglePin={handleTogglePin}
            />
          )}
        </div>
      </div>
    </DndProvider>;
};

export default Distribution;
