
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
  zone_id: number;
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
  const [currentScheduleId, setCurrentScheduleId] = useState<number | null>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      if (selectedGroupId) {
        onDrop(selectedGroupId, item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Find schedule ID for selected group
  const scheduleId = useMemo(() => {
    if (!selectedGroupId) return null;
    const schedule = distributionSchedules.find(s => s.groups_id === selectedGroupId);
    return schedule?.schedule_id || null;
  }, [selectedGroupId, distributionSchedules]);

  // Create schedule immediately when group is selected
  useEffect(() => {
    if (selectedGroupId && !scheduleId) {
      const createSchedule = async () => {
        try {
          console.log('Creating schedule for group:', selectedGroupId);
          const { data: newScheduleId, error } = await supabase
            .rpc('get_or_create_schedule_for_group', { group_id: selectedGroupId });

          if (error) {
            console.error('Error creating schedule:', error);
            return;
          }

          console.log('Created schedule ID:', newScheduleId);
          setCurrentScheduleId(newScheduleId);
        } catch (error) {
          console.error('Error creating schedule:', error);
        }
      };

      createSchedule();
    } else if (scheduleId) {
      setCurrentScheduleId(scheduleId);
    }
  }, [selectedGroupId, scheduleId]);

  // Get the actual schedule ID to display
  const displayScheduleId = scheduleId || currentScheduleId;

  // Get assigned items for this zone based on schedule_id
  const assignedOrders = orders.filter(order => 
    displayScheduleId && order.schedule_id === displayScheduleId
  );
  const assignedReturns = returns.filter(returnItem => 
    displayScheduleId && returnItem.schedule_id === displayScheduleId
  );

  const handleGroupSelection = (value: string) => {
    const groupId = value ? parseInt(value) : null;
    setSelectedGroupId(groupId);
    if (!groupId) {
      setCurrentScheduleId(null);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!displayScheduleId) return;

    try {
      // First, clear all assignments (set schedule_id to null)
      console.log('Clearing assignments for schedule:', displayScheduleId);
      
      // Clear orders
      const { error: ordersError } = await supabase
        .from('mainorder')
        .update({ schedule_id: null })
        .eq('schedule_id', displayScheduleId);

      if (ordersError) {
        console.error('Error clearing order assignments:', ordersError);
        return;
      }

      // Clear returns
      const { error: returnsError } = await supabase
        .from('mainreturns')
        .update({ schedule_id: null })
        .eq('schedule_id', displayScheduleId);

      if (returnsError) {
        console.error('Error clearing return assignments:', returnsError);
        return;
      }

      // Then delete the schedule
      const { error: deleteError } = await supabase
        .from('distribution_schedule')
        .delete()
        .eq('schedule_id', displayScheduleId);

      if (deleteError) {
        console.error('Error deleting schedule:', deleteError);
        return;
      }

      console.log('Schedule deleted successfully');
      
      // Reset local state
      setSelectedGroupId(null);
      setCurrentScheduleId(null);
      
      // Notify parent component to refresh data
      onScheduleDeleted();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

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
          {displayScheduleId && (
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
            <SelectTrigger className="w-full">
              <SelectValue placeholder="בחר אזור הפצה" />
            </SelectTrigger>
            <SelectContent>
              {distributionGroups.map((group) => (
                <SelectItem key={group.groups_id} value={group.groups_id.toString()}>
                  {group.separation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {displayScheduleId ? (
            <div className="text-sm text-muted-foreground">
              מזהה לוח זמנים: {displayScheduleId}
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
            גרור הזמנות או החזרות לכאן
          </div>
        )}
      </CardContent>
    </Card>
  );
};
