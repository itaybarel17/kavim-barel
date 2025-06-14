
import React, { useState, useMemo, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderCard } from './OrderCard';
import { pdf } from '@react-pdf/renderer';
import { ZonePDFDocument } from './ZonePDFDocument';

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

interface DropZoneProps {
  zoneNumber: number;
  distributionGroups: DistributionGroup[];
  distributionSchedules: DistributionSchedule[];
  drivers: Driver[];
  onDrop: (zoneNumber: number, item: { type: 'order' | 'return'; data: Order | Return }) => void;
  orders: Order[];
  returns: Return[];
  onScheduleDeleted: () => void;
  onScheduleCreated: () => void;
  onRemoveFromZone: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  zoneNumber,
  distributionGroups,
  distributionSchedules,
  drivers,
  onDrop,
  orders,
  returns,
  onScheduleDeleted,
  onScheduleCreated,
  onRemoveFromZone,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const navigate = useNavigate();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      console.log('Drop triggered in zone', zoneNumber, 'with item:', item);
      // Always allow drop - the handleDrop will create a new schedule if needed
      onDrop(zoneNumber, item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [zoneNumber]);

  // Get assigned items for this zone based on schedule_id - ONLY for ACTIVE schedules
  const assignedOrders = orders.filter(order => 
    scheduleId && order.schedule_id === scheduleId &&
    distributionSchedules.some(schedule => schedule.schedule_id === scheduleId)
  );
  const assignedReturns = returns.filter(returnItem => 
    scheduleId && returnItem.schedule_id === scheduleId &&
    distributionSchedules.some(schedule => schedule.schedule_id === scheduleId)
  );

  // Load existing state for this zone - ONLY considers ACTIVE schedules
  useEffect(() => {
    console.log('DropZone effect - loading existing state for zone:', zoneNumber);

    // Reset state first - this ensures complete reset after production
    setSelectedGroupId(null);
    setScheduleId(null);
    setSelectedDriverId(null);

    // Find items that are assigned to ACTIVE schedules only
    const activeAssignedOrders = orders.filter(order => order.schedule_id && 
      distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id));
    const activeAssignedReturns = returns.filter(returnItem => returnItem.schedule_id && 
      distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id));
    const allActiveAssignedItems = [...activeAssignedOrders, ...activeAssignedReturns];

    // Find the schedule for this zone - allow flexible assignment but ONLY for ACTIVE schedules
    const zoneSchedules = distributionSchedules
      .filter(schedule => {
        const hasItems = allActiveAssignedItems.some(item => item.schedule_id === schedule.schedule_id);
        return hasItems;
      })
      .sort((a, b) => a.schedule_id - b.schedule_id);

    if (zoneSchedules.length >= zoneNumber) {
      const targetSchedule = zoneSchedules[zoneNumber - 1];
      console.log(`Zone ${zoneNumber} assigned to active schedule ${targetSchedule.schedule_id}`);

      setSelectedGroupId(targetSchedule.groups_id);
      setScheduleId(targetSchedule.schedule_id);
      setSelectedDriverId(targetSchedule.driver_id || null);
      return;
    }

    // Check for empty ACTIVE schedules
    const emptyActiveSchedules = distributionSchedules
      .filter(schedule => {
        const hasItems = allActiveAssignedItems.some(item => item.schedule_id === schedule.schedule_id);
        return !hasItems;
      })
      .sort((a, b) => a.schedule_id - b.schedule_id);

    const emptyScheduleIndex = zoneNumber - 1 - zoneSchedules.length;
    if (emptyScheduleIndex >= 0 && emptyScheduleIndex < emptyActiveSchedules.length) {
      const targetSchedule = emptyActiveSchedules[emptyScheduleIndex];
      console.log(`Zone ${zoneNumber} assigned to empty active schedule ${targetSchedule.schedule_id}`);
      setSelectedGroupId(targetSchedule.groups_id);
      setScheduleId(targetSchedule.schedule_id);
      setSelectedDriverId(targetSchedule.driver_id || null);
      return;
    }

    // If no active schedule exists for this zone, it remains completely empty
    console.log(`Zone ${zoneNumber} has no active schedule - completely empty`);
  }, [distributionSchedules, orders, returns, zoneNumber]);

  // Updated print function to navigate to report page
  const handlePrint = () => {
    if (!scheduleId) return;

    const selectedGroup = distributionGroups.find(group => group.groups_id === selectedGroupId);
    const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);

    // Navigate to the report page with data
    const reportData = {
      zoneNumber,
      scheduleId,
      groupName: selectedGroup?.separation || '',
      driverName: selectedDriver?.nahag || '',
      orders: assignedOrders,
      returns: assignedReturns,
    };

    // Use navigate to go to the report page
    navigate(`/zone-report/${zoneNumber}`, { state: reportData });
  };

  const handleGroupSelection = async (value: string) => {
    const groupId = value ? parseInt(value) : null;
    console.log('Group selected for zone', zoneNumber, ':', groupId);
    
    if (!groupId) {
      setSelectedGroupId(null);
      setScheduleId(null);
      setSelectedDriverId(null);
      return;
    }

    try {
      console.log('Creating new schedule for group:', groupId);
      const { data: newScheduleId, error } = await supabase
        .rpc('get_or_create_schedule_for_group', { group_id: groupId });

      if (error) {
        console.error('Error creating schedule:', error);
        return;
      }

      console.log('Created new schedule ID:', newScheduleId);
      setSelectedGroupId(groupId);
      setScheduleId(newScheduleId);
      setSelectedDriverId(null);
      
      onScheduleCreated();
    } catch (error) {
      console.error('Error in group selection:', error);
    }
  };

  const handleDriverSelection = async (value: string) => {
    const driverId = value ? parseInt(value) : null;
    console.log('Driver selected for zone', zoneNumber, ':', driverId);
    
    if (!scheduleId) {
      console.warn('No schedule ID available for driver assignment');
      return;
    }

    try {
      const { error } = await supabase
        .from('distribution_schedule')
        .update({ driver_id: driverId })
        .eq('schedule_id', scheduleId);

      if (error) {
        console.error('Error updating driver:', error);
        return;
      }

      console.log('Driver updated successfully');
      setSelectedDriverId(driverId);
    } catch (error) {
      console.error('Error in driver selection:', error);
    }
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
      
      // Reset local state to completely empty
      setSelectedGroupId(null);
      setScheduleId(null);
      setSelectedDriverId(null);
      
      onScheduleDeleted();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleItemDragStart = (item: { type: 'order' | 'return'; data: Order | Return }) => {
    console.log('Item drag started from zone:', item);
  };

  // Get the selected group name for display
  const selectedGroup = distributionGroups.find(group => group.groups_id === selectedGroupId);
  const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);

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
          <div className="flex gap-2">
            {scheduleId && (assignedOrders.length > 0 || assignedReturns.length > 0) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrint}
                className="h-6 w-6 text-muted-foreground hover:text-blue-600"
                title="הדפס דוח"
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
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

          {selectedGroupId && (
            <Select
              value={selectedDriverId?.toString() || ''}
              onValueChange={handleDriverSelection}
            >
              <SelectTrigger className="w-full h-10 bg-background border border-input">
                <SelectValue placeholder="בחר נהג" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-md z-50 max-h-[200px] overflow-y-auto">
                {drivers.map((driver) => (
                  <SelectItem 
                    key={driver.id} 
                    value={driver.id.toString()}
                    className="cursor-pointer hover:bg-accent focus:bg-accent"
                  >
                    {driver.nahag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scheduleId ? (
            <div className="text-sm text-muted-foreground">
              מזהה לוח זמנים: {scheduleId}
              {selectedGroup && (
                <div className="font-medium text-primary">
                  אזור נבחר: {selectedGroup.separation}
                </div>
              )}
              {selectedDriver && (
                <div className="font-medium text-secondary-foreground">
                  נהג נבחר: {selectedDriver.nahag}
                </div>
              )}
            </div>
          ) : selectedGroupId ? (
            <div className="text-sm text-muted-foreground">
              יוצר מזהה לוח זמנים...
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              בחר אזור ליצירת מזהה
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {assignedOrders.map((order) => (
          <OrderCard
            key={`order-${order.ordernumber}`}
            type="order"
            data={order}
            onDragStart={handleItemDragStart}
          />
        ))}
        {assignedReturns.map((returnItem) => (
          <OrderCard
            key={`return-${returnItem.returnnumber}`}
            type="return"
            data={returnItem}
            onDragStart={handleItemDragStart}
          />
        ))}
        {assignedOrders.length === 0 && assignedReturns.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            {selectedGroupId ? 'גרור הזמנות או החזרות לכאן' : 'בחר אזור ליצירת מזהה'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
