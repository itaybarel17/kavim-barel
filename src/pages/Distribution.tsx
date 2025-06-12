
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { OrderCard } from '@/components/distribution/OrderCard';
import { DropZone } from '@/components/distribution/DropZone';
import { useQuery } from '@tanstack/react-query';

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
}

const Distribution = () => {
  const [draggedItem, setDraggedItem] = useState<{ type: 'order' | 'return'; data: Order | Return } | null>(null);

  // Fetch orders (only include if icecream is NULL or empty)
  const { data: orders = [], refetch: refetchOrders } = useQuery({
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
  const { data: returns = [], refetch: refetchReturns } = useQuery({
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
  const { data: distributionGroups = [] } = useQuery({
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
  const { data: distributionSchedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching distribution schedules...');
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('schedule_id, groups_id');
      
      if (error) throw error;
      console.log('Distribution schedules fetched:', data);
      return data as DistributionSchedule[];
    }
  });

  const handleDrop = async (groupId: number, item: { type: 'order' | 'return'; data: Order | Return }) => {
    try {
      console.log('handleDrop called with groupId:', groupId, 'item:', item);
      
      // Use the function to get or create a schedule for this group
      const { data: scheduleId, error: scheduleError } = await supabase
        .rpc('get_or_create_schedule_for_group', { group_id: groupId });

      if (scheduleError) {
        console.error('Error getting/creating schedule:', scheduleError);
        return;
      }

      console.log('Got/created schedule ID:', scheduleId);

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

  const handleScheduleDeleted = () => {
    console.log('Schedule deleted, refreshing all data...');
    // Refresh all data when a schedule is deleted
    refetchOrders();
    refetchReturns();
    refetchSchedules();
  };

  // Filter unassigned items (those without schedule_id)
  const unassignedOrders = orders.filter(order => !order.schedule_id);
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id);

  // Create 12 drop zones (3 rows x 4 columns)
  const dropZones = Array.from({ length: 12 }, (_, index) => index + 1);

  console.log('Unassigned orders:', unassignedOrders.length);
  console.log('Unassigned returns:', unassignedReturns.length);
  console.log('Distribution groups:', distributionGroups.length);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-6 bg-background">
        <h1 className="text-3xl font-bold mb-6">ממשק הפצה</h1>
        
        {/* Horizontal scrollable row of cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">הזמנות והחזרות ללא שיוך</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {unassignedOrders.map((order) => (
              <OrderCard
                key={`order-${order.ordernumber}`}
                type="order"
                data={order}
                onDragStart={setDraggedItem}
              />
            ))}
            {unassignedReturns.map((returnItem) => (
              <OrderCard
                key={`return-${returnItem.returnnumber}`}
                type="return"
                data={returnItem}
                onDragStart={setDraggedItem}
              />
            ))}
          </div>
        </div>

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
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default Distribution;
