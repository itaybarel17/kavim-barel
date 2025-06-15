import React, { useState } from 'react';
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
}

interface Driver {
  id: number;
  nahag: string;
}

const Distribution = () => {
  const [draggedItem, setDraggedItem] = useState<{ type: 'order' | 'return'; data: Order | Return } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Fetch orders (exclude produced orders: done_mainorder IS NOT NULL and deleted orders: ordercancel IS NOT NULL)
  const { data: orders = [], refetch: refetchOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('Fetching orders...');
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, schedule_id, icecream, customernumber, agentnumber, orderdate, invoicenumber, totalinvoice')
        .or('icecream.is.null,icecream.eq.')
        .is('done_mainorder', null)
        .is('ordercancel', null) // Exclude deleted orders
        .order('ordernumber', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      console.log('Orders fetched:', data);
      return data as Order[];
    }
  });

  // Fetch returns (exclude produced returns: done_return IS NOT NULL and deleted returns: returncancel IS NOT NULL)
  const { data: returns = [], refetch: refetchReturns, isLoading: returnsLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      console.log('Fetching returns...');
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, schedule_id, icecream, customernumber, agentnumber, returndate')
        .or('icecream.is.null,icecream.eq.')
        .is('done_return', null)
        .is('returncancel', null) // Exclude deleted returns
        .order('returnnumber', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      console.log('Returns fetched:', data);
      return data as Return[];
    }
  });

  // Fetch distribution groups
  const { data: distributionGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups...');
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('groups_id, separation');
      
      if (error) throw error;
      console.log('Distribution groups fetched:', data);
      return data as DistributionGroup[];
    }
  });

  // Fetch ONLY ACTIVE distribution schedules - filter out produced ones (done_schedule IS NOT NULL)
  const { data: distributionSchedules = [], refetch: refetchSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching active distribution schedules...');
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('schedule_id, groups_id, create_at_schedule, driver_id')
        .is('done_schedule', null); // Only get active schedules, not produced ones
      
      if (error) throw error;
      console.log('Active distribution schedules fetched:', data);
      return data as DistributionSchedule[];
    }
  });

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      console.log('Fetching drivers...');
      const { data, error } = await supabase
        .from('nahagim')
        .select('id, nahag')
        .order('nahag');
      
      if (error) throw error;
      console.log('Drivers fetched:', data);
      return data as Driver[];
    }
  });

  // --- BEGIN CUSTOMER STATUS LOGIC FOR ICONS ---
  // ACTIVE order: done_mainorder == null && ordercancel == null
  // ACTIVE return: done_return == null && returncancel == null
  function isOrderActive(order) {
    return !order.done_mainorder && !order.ordercancel;
  }
  function isReturnActive(ret) {
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
  const multiOrderActiveCustomerList = Object.entries(customerMap)
    .filter(([_, arr]) => arr.length >= 2)
    .map(([key]) => {
      const [name, city] = key.split('^^');
      return { name, city };
    });

  // 2. customers with BOTH active order and active return (red icon)
  const activeReturns = returns.filter(isReturnActive);
  const orderKeys = new Set(activeOrders.map(o => `${o.customername}^^${o.city}`));
  const returnKeys = new Set(activeReturns.map(r => `${r.customername}^^${r.city}`));
  const dualActiveOrderReturnCustomers = [];
  orderKeys.forEach(k => {
    if (returnKeys.has(k)) {
      const [name, city] = k.split('^^');
      dualActiveOrderReturnCustomers.push({ name, city });
    }
  });

  const handleDrop = async (zoneNumber: number, item: { type: 'order' | 'return'; data: Order | Return }) => {
    try {
      console.log('handleDrop called with zoneNumber:', zoneNumber, 'item:', item);
      
      // Get the current zone state to find the schedule ID
      const currentZoneState = getZoneState(zoneNumber);
      
      if (!currentZoneState.scheduleId) {
        console.log('No schedule ID found for zone, cannot drop item');
        return;
      }

      console.log('Using existing schedule ID:', currentZoneState.scheduleId);

      if (item.type === 'order') {
        console.log('Updating order', (item.data as Order).ordernumber, 'with schedule_id:', currentZoneState.scheduleId);
        const { error } = await supabase
          .from('mainorder')
          .update({ schedule_id: currentZoneState.scheduleId })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error updating order:', error);
          throw error;
        }
        console.log('Order updated successfully');
        refetchOrders();
      } else {
        console.log('Updating return', (item.data as Return).returnnumber, 'with schedule_id:', currentZoneState.scheduleId);
        const { error } = await supabase
          .from('mainreturns')
          .update({ schedule_id: currentZoneState.scheduleId })
          .eq('returnnumber', (item.data as Return).returnnumber);
        
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

  const handleDropToUnassigned = async (item: { type: 'order' | 'return'; data: Order | Return }) => {
    try {
      console.log('Removing item from assignment:', item);

      if (item.type === 'order') {
        const { error } = await supabase
          .from('mainorder')
          .update({ schedule_id: null })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error removing order assignment:', error);
          throw error;
        }
        console.log('Order assignment removed successfully');
        refetchOrders();
      } else {
        const { error } = await supabase
          .from('mainreturns')
          .update({ schedule_id: null })
          .eq('returnnumber', (item.data as Return).returnnumber);
        
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

  const handleScheduleCreated = () => {
    console.log('Schedule created, refreshing schedules...');
    refetchSchedules();
  };

  const handleRemoveFromZone = async (item: { type: 'order' | 'return'; data: Order | Return }) => {
    await handleDropToUnassigned(item);
  };

  const handleDeleteItem = async (item: { type: 'order' | 'return'; data: Order | Return }) => {
    try {
      console.log('Deleting item:', item);

      if (item.type === 'order') {
        const { error } = await supabase
          .from('mainorder')
          .update({ ordercancel: new Date().toISOString() })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error deleting order:', error);
          throw error;
        }
        console.log('Order deleted successfully');
        toast({
          title: "הזמנה נמחקה",
          description: `הזמנה #${(item.data as Order).ordernumber} הועברה לארכיון`,
        });
        refetchOrders();
      } else {
        const { error } = await supabase
          .from('mainreturns')
          .update({ returncancel: new Date().toISOString() })
          .eq('returnnumber', (item.data as Return).returnnumber);
        
        if (error) {
          console.error('Error deleting return:', error);
          throw error;
        }
        console.log('Return deleted successfully');
        toast({
          title: "החזרה נמחקה",
          description: `החזרה #${(item.data as Return).returnnumber} הועברה לארכיון`,
        });
        refetchReturns();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הפריט",
        variant: "destructive",
      });
    }
  };

  // Updated helper function to get the current state of a zone - ONLY considers ACTIVE schedules
  const getZoneState = (zoneNumber: number) => {
    console.log('getZoneState called for zone:', zoneNumber);
    console.log('Available active schedules:', distributionSchedules);

    // Find items that are assigned to any ACTIVE schedule
    const assignedOrders = orders.filter(order => order.schedule_id && 
      distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id));
    const assignedReturns = returns.filter(returnItem => returnItem.schedule_id && 
      distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id));
    const allAssignedItems = [...assignedOrders, ...assignedReturns];

    // Group items by schedule_id
    const scheduleItemsMap = new Map();
    allAssignedItems.forEach(item => {
      const scheduleId = item.schedule_id;
      if (scheduleId) {
        if (!scheduleItemsMap.has(scheduleId)) {
          scheduleItemsMap.set(scheduleId, []);
        }
        scheduleItemsMap.get(scheduleId).push(item);
      }
    });

    // Get ACTIVE schedules with items, sorted by creation time
    const schedulesWithItems = distributionSchedules
      .filter(schedule => scheduleItemsMap.has(schedule.schedule_id))
      .sort((a, b) => a.schedule_id - b.schedule_id);

    console.log('Schedules with items:', schedulesWithItems);

    // Check if this zone should handle one of the assigned schedules
    if (schedulesWithItems.length >= zoneNumber) {
      const targetSchedule = schedulesWithItems[zoneNumber - 1];
      console.log(`Zone ${zoneNumber} mapped to schedule with items:`, targetSchedule);
      return {
        selectedGroupId: targetSchedule.groups_id,
        scheduleId: targetSchedule.schedule_id
      };
    }

    // Get all ACTIVE schedules (including empty ones), sorted by creation time
    const allActiveSchedules = distributionSchedules
      .sort((a, b) => a.schedule_id - b.schedule_id);

    console.log('All active schedules:', allActiveSchedules);

    // Calculate which schedule this zone should use
    const scheduleIndex = zoneNumber - 1;
    if (scheduleIndex >= 0 && scheduleIndex < allActiveSchedules.length) {
      const targetSchedule = allActiveSchedules[scheduleIndex];
      console.log(`Zone ${zoneNumber} mapped to schedule:`, targetSchedule);
      return {
        selectedGroupId: targetSchedule.groups_id,
        scheduleId: targetSchedule.schedule_id
      };
    }

    console.log(`Zone ${zoneNumber} has no schedule - completely empty`);
    // If no active schedule exists for this zone, return completely empty state
    return {
      selectedGroupId: null,
      scheduleId: null
    };
  };

  // Filter unassigned items (those without schedule_id or with schedule_id pointing to produced schedules)
  const unassignedOrders = orders.filter(order => !order.schedule_id || 
    !distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id));
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id || 
    !distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id));

  // Create 12 drop zones (3 rows x 4 columns)
  const dropZones = Array.from({ length: 12 }, (_, index) => index + 1);

  console.log('Unassigned orders:', unassignedOrders.length);
  console.log('Unassigned returns:', unassignedReturns.length);
  console.log('Distribution groups:', distributionGroups.length);
  console.log('Active schedules:', distributionSchedules.length);

  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading || driversLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-6 bg-background">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">ממשק הפצה</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/archive')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              ארכיון
            </Button>
            <Button 
              onClick={() => navigate('/calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              לוח שנה
            </Button>
          </div>
        </div>
        
        {/* Unassigned items area with drop functionality and delete buttons */}
        <UnassignedArea
          unassignedOrders={unassignedOrders}
          unassignedReturns={unassignedReturns}
          onDragStart={setDraggedItem}
          onDropToUnassigned={handleDropToUnassigned}
          onDeleteItem={handleDeleteItem}
          multiOrderActiveCustomerList={multiOrderActiveCustomerList}
          dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
        />

        {/* Mobile: single column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dropZones.map((zoneNumber) => (
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
              // icons data
              multiOrderActiveCustomerList={multiOrderActiveCustomerList}
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default Distribution;
