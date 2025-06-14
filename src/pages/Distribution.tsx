import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { UnassignedArea } from '@/components/distribution/UnassignedArea';
import { DropZone } from '@/components/distribution/DropZone';
import { DeleteConfirmDialog } from '@/components/distribution/DeleteConfirmDialog';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { toast } from 'sonner';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
  return_reason?: any;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
  return_reason?: any;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
  day: string;
  frequency: string;
}

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  distribution_date: string;
  nahag_name?: string;
  dis_number?: number;
  done_schedule?: string;
}

const Distribution = () => {
  const [draggedItem, setDraggedItem] = useState<{ type: 'order' | 'return'; data: Order | Return } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: { type: 'order' | 'return'; data: Order | Return } | null;
  }>({ open: false, item: null });

  const queryClient = useQueryClient();
  
  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Fetch unassigned orders (including returned ones that are not done)
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainorder')
        .select('*')
        .is('done_mainorder', null)
        .order('ordernumber', { ascending: true });
      
      if (error) throw error;
      return data as Order[];
    },
  });

  // Fetch unassigned returns (including returned ones that are not done)
  const { data: returns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mainreturns')
        .select('*')
        .is('done_return', null)
        .order('returnnumber', { ascending: true });
      
      if (error) throw error;
      return data as Return[];
    },
  });

  // Fetch distribution groups
  const { data: distributionGroups = [] } = useQuery({
    queryKey: ['distribution-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('*')
        .order('groups_id', { ascending: true });
      
      if (error) throw error;
      return data as DistributionGroup[];
    },
  });

  // Fetch distribution schedules
  const { data: distributionSchedules = [] } = useQuery({
    queryKey: ['distribution-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('*')
        .order('schedule_id', { ascending: true });
      
      if (error) throw error;
      return data as DistributionSchedule[];
    },
  });

  // Separate unassigned and assigned items
  const unassignedOrders = orders.filter(order => !order.schedule_id);
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id);
  const assignedOrders = orders.filter(order => order.schedule_id);
  const assignedReturns = returns.filter(returnItem => returnItem.schedule_id);

  // Group assigned items by schedule_id
  const itemsBySchedule = [...assignedOrders, ...assignedReturns].reduce((acc, item) => {
    const scheduleId = 'ordernumber' in item ? item.schedule_id : item.schedule_id;
    if (!scheduleId) return acc;
    
    if (!acc[scheduleId]) {
      acc[scheduleId] = [];
    }
    acc[scheduleId].push({
      type: 'ordernumber' in item ? 'order' as const : 'return' as const,
      data: item
    });
    return acc;
  }, {} as Record<number, Array<{ type: 'order' | 'return'; data: Order | Return }>>);

  const handleDrop = (scheduleId: number, item: { type: 'order' | 'return'; data: Order | Return }) => {
    const isOrder = item.type === 'order';
    const table = isOrder ? 'mainorder' : 'mainreturns';
    const idField = isOrder ? 'ordernumber' : 'returnnumber';
    const itemData = item.data as Order | Return;
    
    assignItemMutation.mutate({
      table,
      idField,
      itemId: isOrder ? (itemData as Order).ordernumber : (itemData as Return).returnnumber,
      scheduleId,
    });
  };

  const handleDragStart = (item: { type: 'order' | 'return'; data: Order | Return }) => {
    setDraggedItem(item);
  };

  const handleDeleteClick = (item: { type: 'order' | 'return'; data: Order | Return }) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.item) {
      archiveItemMutation.mutate(deleteDialog.item);
    }
    setDeleteDialog({ open: false, item: null });
  };

  // Assign item mutation
  const assignItemMutation = useMutation({
    mutationFn: async ({ table, idField, itemId, scheduleId }: {
      table: string;
      idField: string;
      itemId: number;
      scheduleId: number;
    }) => {
      const { error } = await supabase
        .from(table)
        .update({ schedule_id: scheduleId })
        .eq(idField, itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('הפריט הוקצה בהצלחה');
    },
    onError: (error) => {
      console.error('Error assigning item:', error);
      toast.error('שגיאה בהקצאת הפריט');
    },
  });

  // Archive item mutation
  const archiveItemMutation = useMutation({
    mutationFn: async (item: { type: 'order' | 'return'; data: Order | Return }) => {
      const isOrder = item.type === 'order';
      const table = isOrder ? 'mainorder' : 'mainreturns';
      const idField = isOrder ? 'ordernumber' : 'returnnumber';
      const doneField = isOrder ? 'done_mainorder' : 'done_return';
      const itemData = item.data as Order | Return;

      const { error } = await supabase
        .from(table)
        .update({ [doneField]: new Date().toISOString() })
        .eq(idField, isOrder ? (itemData as Order).ordernumber : (itemData as Return).returnnumber);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('הפריט הועבר לארכיון');
    },
    onError: (error) => {
      console.error('Error archiving item:', error);
      toast.error('שגיאה בהעברת הפריט לארכיון');
    },
  });

  if (ordersLoading || returnsLoading) {
    return <div className="p-6">טוען...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">הפצה</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Unassigned Items Area */}
          <div className="lg:col-span-1">
            <UnassignedArea
              unassignedOrders={unassignedOrders}
              unassignedReturns={unassignedReturns}
              onDragStart={handleDragStart}
              onDropToUnassigned={handleDragStart}
              onDeleteItem={handleDeleteClick}
            />
          </div>

          {/* Distribution Zones */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {distributionGroups.map((group) => {
                const schedule = distributionSchedules.find(s => s.groups_id === group.groups_id);
                const items = schedule ? itemsBySchedule[schedule.schedule_id] || [] : [];
                
                return (
                  <DropZone
                    key={group.groups_id}
                    zoneNumber={group.groups_id}
                    distributionGroups={distributionGroups}
                    distributionSchedules={distributionSchedules}
                    drivers={[]}
                    onDrop={handleDrop}
                    orders={orders}
                    returns={returns}
                    onScheduleDeleted={() => {
                      queryClient.invalidateQueries({ queryKey: ['distribution-schedules'] });
                    }}
                    onScheduleCreated={() => {
                      queryClient.invalidateQueries({ queryKey: ['distribution-schedules'] });
                    }}
                    onRemoveFromZone={handleDeleteClick}
                    getZoneState={(zoneNumber) => {
                      const schedule = distributionSchedules.find(s => s.groups_id === zoneNumber);
                      return {
                        selectedGroupId: schedule?.groups_id || null,
                        scheduleId: schedule?.schedule_id || null
                      };
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <DeleteConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, item: null })}
          item={deleteDialog.item}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </DndProvider>
  );
};

export default Distribution;
