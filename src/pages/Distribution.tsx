import React, { useState, useEffect } from 'react';
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
  
  // Add state for zone-schedule mapping
  const [zoneScheduleMapping, setZoneScheduleMapping] = useState<Record<number, number | null>>({});
  
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user: currentUser
  } = useAuth();

  // Set up realtime subscriptions
  useRealtimeSubscription();

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

  // Fetch ONLY ACTIVE distribution schedules - filter out produced ones (done_schedule IS NOT NULL)
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
      } = await supabase.from('distribution_schedule').select('schedule_id, groups_id, create_at_schedule, driver_id, distribution_date').is('done_schedule', null); // Only get active schedules, not produced ones

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

  // Update zone-schedule mapping when schedules change
  useEffect(() => {
    console.log('Updating zone-schedule mapping based on schedules:', distributionSchedules);
    
    const newMapping: Record<number, number | null> = {};
    
    // First, preserve existing mappings that still have valid schedules
    Object.entries(zoneScheduleMapping).forEach(([zoneStr, scheduleId]) => {
      const zoneNumber = parseInt(zoneStr);
      if (scheduleId && distributionSchedules.some(s => s.schedule_id === scheduleId)) {
        newMapping[zoneNumber] = scheduleId;
      }
    });
    
    // Then assign unassigned schedules to zones without schedules
    const assignedScheduleIds = new Set(Object.values(newMapping).filter(Boolean));
    const unassignedSchedules = distributionSchedules
      .filter(schedule => !assignedScheduleIds.has(schedule.schedule_id))
      .sort((a, b) => a.schedule_id - b.schedule_id);
    
    // Find zones without schedules and assign them
    for (let zone = 1; zone <= 12; zone++) {
      if (!newMapping[zone] && unassignedSchedules.length > 0) {
        const schedule = unassignedSchedules.shift();
        if (schedule) {
          newMapping[zone] = schedule.schedule_id;
        }
      }
    }
    
    // Ensure all zones exist in mapping (even if null)
    for (let zone = 1; zone <= 12; zone++) {
      if (!(zone in newMapping)) {
        newMapping[zone] = null;
      }
    }
    
    console.log('New zone-schedule mapping:', newMapping);
    setZoneScheduleMapping(newMapping);
  }, [distributionSchedules]);

  const handleDrop = async (zoneNumber: number, item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('handleDrop called with zoneNumber:', zoneNumber, 'item:', item);

      // Get the schedule ID for this zone from our mapping
      const scheduleId = zoneScheduleMapping[zoneNumber];
      if (!scheduleId) {
        console.log('No schedule ID found for zone, cannot drop item');
        return;
      }
      
      console.log('Using schedule ID from mapping:', scheduleId);
      
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
    
    // Update the zone-schedule mapping immediately
    setZoneScheduleMapping(prev => ({
      ...prev,
      [zoneNumber]: newScheduleId
    }));
    
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

  const handleAlertStatusChange = () => {
    refetchOrders();
    refetchReturns();
  };

  // Updated helper function to get the current state of a zone using stable mapping
  const getZoneState = (zoneNumber: number) => {
    console.log('getZoneState called for zone:', zoneNumber);
    console.log('Current zone-schedule mapping:', zoneScheduleMapping);

    const scheduleId = zoneScheduleMapping[zoneNumber];
    
    if (!scheduleId) {
      console.log(`Zone ${zoneNumber} has no schedule - completely empty`);
      return {
        selectedGroupId: null,
        scheduleId: null
      };
    }

    // Find the schedule details
    const schedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) {
      console.log(`Schedule ${scheduleId} not found for zone ${zoneNumber}`);
      return {
        selectedGroupId: null,
        scheduleId: null
      };
    }

    console.log(`Zone ${zoneNumber} mapped to schedule:`, schedule);
    return {
      selectedGroupId: schedule.groups_id,
      scheduleId: schedule.schedule_id
    };
  };

  // Filter unassigned items (those without schedule_id or with schedule_id pointing to produced schedules)
  const unassignedOrders = orders.filter(order => !order.schedule_id || !distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id));
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id || !distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id));

  // Create 12 drop zones (3 rows x 4 columns)
  const dropZones = Array.from({
    length: 12
  }, (_, index) => index + 1);
  console.log('Unassigned orders:', unassignedOrders.length);
  console.log('Unassigned returns:', unassignedReturns.length);
  console.log('Distribution groups:', distributionGroups.length);
  console.log('Active schedules:', distributionSchedules.length);
  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading || driversLoading || customerSupplyLoading;

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
            
            
          </div>
        </div>
        
        {/* Unassigned items area with drop functionality and delete buttons */}
        <UnassignedArea unassignedOrders={unassignedOrders} unassignedReturns={unassignedReturns} onDragStart={setDraggedItem} onDropToUnassigned={handleDropToUnassigned} onDeleteItem={handleDeleteItem} multiOrderActiveCustomerList={multiOrderActiveCustomerList} dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} customerSupplyMap={customerSupplyMap} onAlertStatusChange={handleAlertStatusChange} />

        {/* Mobile: single column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dropZones.map(zoneNumber => <DropZone key={zoneNumber} zoneNumber={zoneNumber} distributionGroups={distributionGroups} distributionSchedules={distributionSchedules} drivers={drivers} onDrop={handleDrop} orders={orders} returns={returns} onScheduleDeleted={handleScheduleDeleted} onScheduleCreated={handleScheduleCreated} onRemoveFromZone={handleRemoveFromZone} getZoneState={getZoneState}
        // icons data
        multiOrderActiveCustomerList={multiOrderActiveCustomerList} dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers} customerSupplyMap={customerSupplyMap} onAlertStatusChange={handleAlertStatusChange} />)}
        </div>
      </div>
    </DndProvider>;
};

export default Distribution;
