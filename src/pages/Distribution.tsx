import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { DropZone } from '@/components/distribution/DropZone';
import { UnassignedArea } from '@/components/distribution/UnassignedArea';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
}

interface Driver {
  id: number;
  nahag: string;
}

const Distribution = () => {
  const [draggedItem, setDraggedItem] = useState<{ type: 'order' | 'return'; data: Order | Return } | null>(null);
  const navigate = useNavigate();

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Fetch orders (only include if icecream is NULL or empty)
  const { data: orders = [], refetch: refetchOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('Fetching orders...');
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, schedule_id, icecream, customernumber, agentnumber, orderdate, invoicenumber')
        .or('icecream.is.null,icecream.eq.')
        .order('ordernumber', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      console.log('Orders fetched:', data);
      return data as Order[];
    }
  });

  // Fetch returns (only include if icecream is NULL or empty)
  const { data: returns = [], refetch: refetchReturns, isLoading: returnsLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      console.log('Fetching returns...');
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, schedule_id, icecream, customernumber, agentnumber, returndate')
        .or('icecream.is.null,icecream.eq.')
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

  // Fetch distribution schedules
  const { data: distributionSchedules = [], refetch: refetchSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching distribution schedules...');
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('schedule_id, groups_id, create_at_schedule');
      
      if (error) throw error;
      console.log('Distribution schedules fetched:', data);
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

  const handleDrop = async (zoneNumber: number, item: { type: 'order' | 'return'; data: Order | Return }) => {
    try {
      console.log('handleDrop called with zoneNumber:', zoneNumber, 'item:', item);
      
      // Get the current zone state to find the target schedule ID
      const currentZoneState = getZoneState(zoneNumber);
      
      let targetScheduleId = currentZoneState.scheduleId;
      
      // If the zone doesn't have a schedule ID, we need to create one
      if (!targetScheduleId) {
        console.log('Zone has no schedule, cannot drop item');
        return;
      }

      console.log('Using target schedule ID:', targetScheduleId);

      if (item.type === 'order') {
        console.log('Updating order', (item.data as Order).ordernumber, 'with schedule_id:', targetScheduleId);
        const { error } = await supabase
          .from('mainorder')
          .update({ schedule_id: targetScheduleId })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error updating order:', error);
          throw error;
        }
        console.log('Order updated successfully');
        refetchOrders();
      } else {
        console.log('Updating return', (item.data as Return).returnnumber, 'with schedule_id:', targetScheduleId);
        const { error } = await supabase
          .from('mainreturns')
          .update({ schedule_id: targetScheduleId })
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

  // Helper function to get the current state of a zone
  const getZoneState = (zoneNumber: number) => {
    // Find items that are assigned to any schedule
    const assignedOrders = orders.filter(order => order.schedule_id);
    const assignedReturns = returns.filter(returnItem => returnItem.schedule_id);
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

    // Get schedules with items, sorted by creation time
    const schedulesWithItems = distributionSchedules
      .filter(schedule => scheduleItemsMap.has(schedule.schedule_id))
      .sort((a, b) => a.schedule_id - b.schedule_id);

    // Check if this zone should handle one of the assigned schedules
    if (schedulesWithItems.length >= zoneNumber) {
      const targetSchedule = schedulesWithItems[zoneNumber - 1];
      return {
        selectedGroupId: targetSchedule.groups_id,
        scheduleId: targetSchedule.schedule_id
      };
    }

    // Check for empty schedules
    const emptySchedules = distributionSchedules
      .filter(schedule => !scheduleItemsMap.has(schedule.schedule_id))
      .sort((a, b) => a.schedule_id - b.schedule_id);

    const emptyScheduleIndex = zoneNumber - 1 - schedulesWithItems.length;
    if (emptyScheduleIndex >= 0 && emptyScheduleIndex < emptySchedules.length) {
      const targetSchedule = emptySchedules[emptyScheduleIndex];
      return {
        selectedGroupId: targetSchedule.groups_id,
        scheduleId: targetSchedule.schedule_id
      };
    }

    return {
      selectedGroupId: null,
      scheduleId: null
    };
  };

  // Filter unassigned items (those without schedule_id)
  const unassignedOrders = orders.filter(order => !order.schedule_id);
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id);

  // Create 12 drop zones (3 rows x 4 columns)
  const dropZones = Array.from({ length: 12 }, (_, index) => index + 1);

  console.log('Unassigned orders:', unassignedOrders.length);
  console.log('Unassigned returns:', unassignedReturns.length);
  console.log('Distribution groups:', distributionGroups.length);

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
          <Button 
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            לוח שנה
          </Button>
        </div>
        
        {/* Unassigned items area with drop functionality */}
        <UnassignedArea
          unassignedOrders={unassignedOrders}
          unassignedReturns={unassignedReturns}
          onDragStart={setDraggedItem}
          onDropToUnassigned={handleDropToUnassigned}
        />

        {/* 3x4 Grid of drop zones */}
        <div className="grid grid-cols-4 gap-4">
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
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default Distribution;
