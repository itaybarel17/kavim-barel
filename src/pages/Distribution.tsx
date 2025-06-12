
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { DropZone } from '@/components/distribution/DropZone';
import { UnassignedArea } from '@/components/distribution/UnassignedArea';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Loader2 } from 'lucide-react';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
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

const Distribution = () => {
  const [draggedItem, setDraggedItem] = useState<{ type: 'order' | 'return'; data: Order | Return } | null>(null);

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Fetch orders (only include if icecream is NULL or empty)
  const { data: orders = [], refetch: refetchOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('Fetching orders...');
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, schedule_id, icecream')
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
        .select('returnnumber, customername, address, city, totalreturn, schedule_id, icecream')
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

  const handleDrop = async (groupId: number, item: { type: 'order' | 'return'; data: Order | Return }) => {
    try {
      console.log('handleDrop called with groupId:', groupId, 'item:', item);
      
      // Find the latest schedule for this group
      const groupSchedules = distributionSchedules
        .filter(schedule => schedule.groups_id === groupId)
        .sort((a, b) => b.schedule_id - a.schedule_id);

      let scheduleId;
      if (groupSchedules.length > 0) {
        scheduleId = groupSchedules[0].schedule_id;
        console.log('Using existing schedule ID:', scheduleId);
      } else {
        // Fallback: create a new schedule if none exists
        const { data: newScheduleId, error: scheduleError } = await supabase
          .rpc('get_or_create_schedule_for_group', { group_id: groupId });

        if (scheduleError) {
          console.error('Error creating schedule:', scheduleError);
          return;
        }
        scheduleId = newScheduleId;
        console.log('Created fallback schedule ID:', scheduleId);
      }

      if (item.type === 'order') {
        console.log('Updating order', (item.data as Order).ordernumber, 'with schedule_id:', scheduleId);
        const { error } = await supabase
          .from('mainorder')
          .update({ schedule_id: scheduleId })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error updating order:', error);
          throw error;
        }
        console.log('Order updated successfully');
        refetchOrders();
      } else {
        console.log('Updating return', (item.data as Return).returnnumber, 'with schedule_id:', scheduleId);
        const { error } = await supabase
          .from('mainreturns')
          .update({ schedule_id: scheduleId })
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

  // Filter unassigned items (those without schedule_id)
  const unassignedOrders = orders.filter(order => !order.schedule_id);
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id);

  // Create 12 drop zones (3 rows x 4 columns)
  const dropZones = Array.from({ length: 12 }, (_, index) => index + 1);

  console.log('Unassigned orders:', unassignedOrders.length);
  console.log('Unassigned returns:', unassignedReturns.length);
  console.log('Distribution groups:', distributionGroups.length);

  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading;

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
        <h1 className="text-3xl font-bold mb-6">ממשק הפצה</h1>
        
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
