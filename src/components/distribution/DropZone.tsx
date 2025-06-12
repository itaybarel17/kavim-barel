
import React, { useState, useMemo, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface DropZoneProps {
  zoneNumber: number;
  distributionGroups: DistributionGroup[];
  distributionSchedules: DistributionSchedule[];
  onDrop: (groupId: number, item: { type: 'order' | 'return'; data: Order | Return }) => void;
  orders: Order[];
  returns: Return[];
  onScheduleDeleted: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  zoneNumber,
  distributionGroups,
  distributionSchedules,
  onDrop,
  orders,
  returns,
  onScheduleDeleted,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      console.log('Drop triggered with selectedGroupId:', selectedGroupId);
      console.log('Drop item:', item);
      if (selectedGroupId) {
        onDrop(selectedGroupId, item);
      } else {
        console.warn('No group selected for drop');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [selectedGroupId]);

  // Find schedule ID for selected group
  const scheduleId = useMemo(() => {
    if (!selectedGroupId) return null;
    const schedule = distributionSchedules.find(s => s.groups_id === selectedGroupId);
    return schedule?.schedule_id || null;
  }, [selectedGroupId, distributionSchedules]);

  // Get assigned items for this zone based on schedule_id
  const assignedOrders = orders.filter(order => 
    scheduleId && order.schedule_id === scheduleId
  );
  const assignedReturns = returns.filter(returnItem => 
    scheduleId && returnItem.schedule_id === scheduleId
  );

  // Load existing state for this zone based on assigned items
  useEffect(() => {
    console.log('DropZone effect - loading existing state for zone:', zoneNumber);
    console.log('Distribution schedules:', distributionSchedules);
    console.log('Orders:', orders);
    console.log('Returns:', returns);

    // Reset state first
    setSelectedGroupId(null);

    // Find items that are assigned to any schedule
    const assignedOrders = orders.filter(order => order.schedule_id);
    const assignedReturns = returns.filter(returnItem => returnItem.schedule_id);
    const allAssignedItems = [...assignedOrders, ...assignedReturns];

    console.log('All assigned items:', allAssignedItems);

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

    console.log('Schedule items map:', scheduleItemsMap);

    // Assign schedules to zones based on schedule_id order
    const sortedScheduleIds = Array.from(scheduleItemsMap.keys()).sort((a, b) => a - b);
    console.log('Sorted schedule IDs with items:', sortedScheduleIds);

    // Check if this zone should handle one of the assigned schedules
    if (sortedScheduleIds.length >= zoneNumber) {
      const targetScheduleId = sortedScheduleIds[zoneNumber - 1];
      console.log(`Zone ${zoneNumber} should handle schedule ${targetScheduleId}`);

      // Find the group for this schedule
      const correspondingSchedule = distributionSchedules.find(
        schedule => schedule.schedule_id === targetScheduleId
      );

      if (correspondingSchedule) {
        console.log('Setting selected group ID for zone', zoneNumber, ':', correspondingSchedule.groups_id);
        setSelectedGroupId(correspondingSchedule.groups_id);
        return;
      }
    }

    // If this is zone 1 and no assignments exist, check for any existing empty schedules
    if (zoneNumber === 1) {
      const unassignedSchedules = distributionSchedules.filter(schedule => {
        return !scheduleItemsMap.has(schedule.schedule_id);
      });

      console.log('Unassigned schedules:', unassignedSchedules);

      if (unassignedSchedules.length > 0) {
        // Take the first unassigned schedule for zone 1
        const firstUnassigned = unassignedSchedules[0];
        console.log('Assigning first unassigned schedule to zone 1:', firstUnassigned.schedule_id);
        setSelectedGroupId(firstUnassigned.groups_id);
      }
    }
  }, [distributionSchedules, orders, returns, zoneNumber]);

  const handleGroupSelection = (value: string) => {
    const groupId = value ? parseInt(value) : null;
    console.log('Group selected for zone', zoneNumber, ':', groupId);
    setSelectedGroupId(groupId);
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleId) return;

    try {
      console.log('Clearing assignments for schedule:', scheduleId);
      
      // Clear orders
      const { error: ordersError } = await supabase
        .from('mainorder')
        .update({ schedule_id: null })
        .eq('schedule_id', scheduleId);

      if (ordersError) {
        console.error('Error clearing order assignments:', ordersError);
        return;
      }

      // Clear returns
      const { error: returnsError } = await supabase
        .from('mainreturns')
        .update({ schedule_id: null })
        .eq('schedule_id', scheduleId);

      if (returnsError) {
        console.error('Error clearing return assignments:', returnsError);
        return;
      }

      // Then delete the schedule
      const { error: deleteError } = await supabase
        .from('distribution_schedule')
        .delete()
        .eq('schedule_id', scheduleId);

      if (deleteError) {
        console.error('Error deleting schedule:', deleteError);
        return;
      }

      console.log('Schedule deleted successfully');
      
      // Reset local state
      setSelectedGroupId(null);
      
      // Notify parent component to refresh data
      onScheduleDeleted();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  // Get the selected group name for display
  const selectedGroup = distributionGroups.find(group => group.groups_id === selectedGroupId);

  return (
    <Card
      ref={drop}
      className={`min-h-[300px] transition-colors relative ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">אזור {zoneNumber}</CardTitle>
          {scheduleId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteSchedule}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <Select
            value={selectedGroupId?.toString() || ''}
            onValueChange={handleGroupSelection}
          >
            <SelectTrigger className="w-full h-10 bg-background border border-input">
              <SelectValue placeholder="בחר אזור הפצה" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-md z-50 max-h-[200px] overflow-y-auto">
              {distributionGroups.map((group) => (
                <SelectItem 
                  key={group.groups_id} 
                  value={group.groups_id.toString()}
                  className="cursor-pointer hover:bg-accent focus:bg-accent"
                >
                  {group.separation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {scheduleId ? (
            <div className="text-sm text-muted-foreground">
              מזהה לוח זמנים: {scheduleId}
              {selectedGroup && (
                <div className="font-medium text-primary">
                  אזור נבחר: {selectedGroup.separation}
                </div>
              )}
            </div>
          ) : selectedGroupId ? (
            <div className="text-sm text-muted-foreground">
              יוצר מזהה לוח זמנים...
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              בחר אזור להצגת מזהה
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {assignedOrders.map((order) => (
          <div key={`order-${order.ordernumber}`} className="p-2 bg-blue-50 rounded text-xs">
            <div className="font-semibold">הזמנה #{order.ordernumber}</div>
            <div>{order.customername}</div>
          </div>
        ))}
        {assignedReturns.map((returnItem) => (
          <div key={`return-${returnItem.returnnumber}`} className="p-2 bg-red-50 rounded text-xs">
            <div className="font-semibold">החזרה #{returnItem.returnnumber}</div>
            <div>{returnItem.customername}</div>
          </div>
        ))}
        {assignedOrders.length === 0 && assignedReturns.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            {selectedGroupId ? 'גרור הזמנות או החזרות לכאן' : 'בחר אזור תחילה'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
