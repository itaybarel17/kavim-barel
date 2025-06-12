import React, { useState, useMemo, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderCard } from './OrderCard';
import jsPDF from 'jspdf';

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

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      console.log('Drop triggered in zone', zoneNumber, 'with scheduleId:', scheduleId);
      console.log('Drop item:', item);
      if (scheduleId) {
        onDrop(zoneNumber, item);
      } else {
        console.warn('No schedule ID available for drop in zone', zoneNumber);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [scheduleId, zoneNumber]);

  // Get assigned items for this zone based on schedule_id
  const assignedOrders = orders.filter(order => 
    scheduleId && order.schedule_id === scheduleId
  );
  const assignedReturns = returns.filter(returnItem => 
    scheduleId && returnItem.schedule_id === scheduleId
  );

  // Load existing state for this zone - FIXED to include driver_id
  useEffect(() => {
    console.log('DropZone effect - loading existing state for zone:', zoneNumber);

    // Reset state first
    setSelectedGroupId(null);
    setScheduleId(null);
    setSelectedDriverId(null);

    // Find the schedule for this zone
    const zoneSchedules = distributionSchedules
      .filter(schedule => {
        const hasItems = [...orders, ...returns].some(item => item.schedule_id === schedule.schedule_id);
        return hasItems;
      })
      .sort((a, b) => a.schedule_id - b.schedule_id);

    if (zoneSchedules.length >= zoneNumber) {
      const targetSchedule = zoneSchedules[zoneNumber - 1];
      console.log(`Zone ${zoneNumber} assigned to schedule ${targetSchedule.schedule_id}`);

      setSelectedGroupId(targetSchedule.groups_id);
      setScheduleId(targetSchedule.schedule_id);
      setSelectedDriverId(targetSchedule.driver_id || null); // FIX: Load driver_id from schedule
      return;
    }

    // Check for empty schedules
    const emptySchedules = distributionSchedules
      .filter(schedule => {
        const hasItems = [...orders, ...returns].some(item => item.schedule_id === schedule.schedule_id);
        return !hasItems;
      })
      .sort((a, b) => a.schedule_id - b.schedule_id);

    const emptyScheduleIndex = zoneNumber - 1 - zoneSchedules.length;
    if (emptyScheduleIndex >= 0 && emptyScheduleIndex < emptySchedules.length) {
      const targetSchedule = emptySchedules[emptyScheduleIndex];
      console.log(`Zone ${zoneNumber} assigned to empty schedule ${targetSchedule.schedule_id}`);
      setSelectedGroupId(targetSchedule.groups_id);
      setScheduleId(targetSchedule.schedule_id);
      setSelectedDriverId(targetSchedule.driver_id || null); // FIX: Load driver_id from schedule
    }
  }, [distributionSchedules, orders, returns, zoneNumber]);

  // NEW: Print function
  const handlePrint = () => {
    if (!scheduleId) return;

    const selectedGroup = distributionGroups.find(group => group.groups_id === selectedGroupId);
    const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);

    // Create PDF
    const doc = new jsPDF();
    
    // Configure font (Hebrew support)
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(20);
    doc.text(`אזור ${zoneNumber} - ${selectedGroup?.separation || 'לא מוגדר'}`, 105, 20, { align: 'center' });
    
    // Schedule info
    doc.setFontSize(12);
    let yPos = 40;
    doc.text(`מזהה לוח זמנים: ${scheduleId}`, 20, yPos);
    yPos += 10;
    doc.text(`נהג: ${selectedDriver?.nahag || 'לא מוגדר'}`, 20, yPos);
    yPos += 20;

    // Orders section
    if (assignedOrders.length > 0) {
      doc.setFontSize(14);
      doc.text('הזמנות:', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      assignedOrders.forEach((order, index) => {
        if (yPos > 270) { // New page if needed
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${order.customername} - ${order.address}, ${order.city}`, 20, yPos);
        yPos += 5;
        doc.text(`   הזמנה #${order.ordernumber} - ₪${order.totalorder.toLocaleString()}`, 20, yPos);
        yPos += 10;
      });
      yPos += 10;
    }

    // Returns section
    if (assignedReturns.length > 0) {
      if (yPos > 250) { // New page if needed
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('החזרות:', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      assignedReturns.forEach((returnItem, index) => {
        if (yPos > 270) { // New page if needed
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${returnItem.customername} - ${returnItem.address}, ${returnItem.city}`, 20, yPos);
        yPos += 5;
        doc.text(`   החזרה #${returnItem.returnnumber} - ₪${returnItem.totalreturn.toLocaleString()}`, 20, yPos);
        yPos += 10;
      });
    }

    // Summary
    const totalOrdersAmount = assignedOrders.reduce((sum, order) => sum + order.totalorder, 0);
    const totalReturnsAmount = assignedReturns.reduce((sum, returnItem) => sum + returnItem.totalreturn, 0);
    
    yPos += 20;
    doc.setFontSize(12);
    doc.text('סיכום:', 20, yPos);
    yPos += 10;
    doc.text(`סה"כ הזמנות: ${assignedOrders.length} (₪${totalOrdersAmount.toLocaleString()})`, 20, yPos);
    yPos += 8;
    doc.text(`סה"כ החזרות: ${assignedReturns.length} (₪${totalReturnsAmount.toLocaleString()})`, 20, yPos);

    // Open print dialog
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
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
      
      // Reset local state
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
                title="הדפס"
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

          {scheduleId && (
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
            {scheduleId ? 'גרור הזמנות או החזרות לכאן' : 'בחר אזור ליצירת מזהה'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
