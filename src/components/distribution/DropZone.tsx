import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User, Printer } from 'lucide-react';
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
  distribution_date?: string;
  destinations?: number;
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
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [destinations, setDestinations] = useState<number | null>(null);

  useEffect(() => {
    // Get the initial state of the zone
    const initialState = getZoneState();
    setSelectedGroupId(initialState.selectedGroupId);
    setScheduleId(initialState.scheduleId);

    // Find the corresponding schedule and set the driver
    if (initialState.scheduleId) {
      const schedule = distributionSchedules.find(s => s.schedule_id === initialState.scheduleId);
      setSelectedDriverId(schedule?.driver_id || null);
      setDestinations(schedule?.destinations || null);
    }
  }, [zoneNumber, distributionGroups, distributionSchedules, orders, returns]);

  // Find assigned orders and returns based on scheduleId
  const assignedOrders = orders.filter(order => order.schedule_id === scheduleId);
  const assignedReturns = returns.filter(returnItem => returnItem.schedule_id === scheduleId);
  const hasItems = assignedOrders.length > 0 || assignedReturns.length > 0;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { type: 'order' | 'return'; data: Order | Return }) => {
      console.log('Dropping item to zone:', zoneNumber, item);
      onDrop(zoneNumber, item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleGroupChange = async (groupId: number) => {
    try {
      console.log('handleGroupChange called with groupId:', groupId);
      setSelectedGroupId(groupId);

      // Find existing schedule or create a new one
      const { data, error } = await supabase.rpc('get_or_create_schedule_for_group', {
        group_id: groupId
      });

      if (error) {
        console.error('Error getting or creating schedule:', error);
        throw error;
      }

      const newScheduleId = data;
      console.log('New schedule ID:', newScheduleId);
      setScheduleId(newScheduleId);
      onScheduleCreated();
    } catch (error) {
      console.error('Error updating distribution:', error);
    }
  };

  const handleDriverChange = async (driverId: number) => {
    try {
      console.log('handleDriverChange called with driverId:', driverId, 'and scheduleId:', scheduleId);
      setSelectedDriverId(driverId);

      if (!scheduleId) {
        console.warn('No schedule ID available to update.');
        return;
      }

      const { error } = await supabase
        .from('distribution_schedule')
        .update({ driver_id: driverId })
        .eq('schedule_id', scheduleId);

      if (error) {
        console.error('Error updating driver:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating driver:', error);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      console.log('handleDeleteSchedule called for scheduleId:', scheduleId);

      if (!scheduleId) {
        console.warn('No schedule ID available to delete.');
        return;
      }

      // Delete the schedule
      const { error } = await supabase
        .from('distribution_schedule')
        .delete()
        .eq('schedule_id', scheduleId);

      if (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }

      // Reset state
      setSelectedGroupId(null);
      setSelectedDriverId(null);
      setScheduleId(null);
      setDestinations(null);

      // Notify parent component
      onScheduleDeleted();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleRemoveFromZoneClick = async (item: { type: 'order' | 'return'; data: Order | Return }) => {
    await onRemoveFromZone(item);
  };

  // Helper function to get the current state of a zone
  const getZoneState = () => {
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

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Set font to support Hebrew (use Arial Unicode MS or similar)
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(20);
    const title = `Distribution Zone ${zoneNumber} Report`;
    doc.text(title, 20, 20);
    
    // Zone info
    doc.setFontSize(12);
    let yPosition = 40;
    
    if (selectedGroup) {
      const groupText = `Area: ${selectedGroup.separation}`;
      doc.text(groupText, 20, yPosition);
      yPosition += 10;
    }
    
    if (selectedDriver) {
      const driverText = `Driver: ${selectedDriver.nahag}`;
      doc.text(driverText, 20, yPosition);
      yPosition += 10;
    }
    
    yPosition += 10;
    
    // Orders section
    if (assignedOrders.length > 0) {
      doc.setFontSize(16);
      doc.text('Orders:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      assignedOrders.forEach((order, index) => {
        const orderText = `${index + 1}. Order #${order.ordernumber} - ${order.customername}`;
        doc.text(orderText, 25, yPosition);
        yPosition += 5;
        
        const addressText = `   Address: ${order.address}, ${order.city}`;
        doc.text(addressText, 25, yPosition);
        yPosition += 5;
        
        const amountText = `   Amount: ₪${order.totalorder?.toLocaleString()}`;
        doc.text(amountText, 25, yPosition);
        yPosition += 8;
        
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }
    
    // Returns section
    if (assignedReturns.length > 0) {
      yPosition += 10;
      doc.setFontSize(16);
      doc.text('Returns:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      assignedReturns.forEach((returnItem, index) => {
        const returnText = `${index + 1}. Return #${returnItem.returnnumber} - ${returnItem.customername}`;
        doc.text(returnText, 25, yPosition);
        yPosition += 5;
        
        const addressText = `   Address: ${returnItem.address}, ${returnItem.city}`;
        doc.text(addressText, 25, yPosition);
        yPosition += 5;
        
        const amountText = `   Amount: ₪${returnItem.totalreturn?.toLocaleString()}`;
        doc.text(amountText, 25, yPosition);
        yPosition += 8;
        
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }
    
    // Summary
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('Summary:', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Total Orders: ${assignedOrders.length}`, 25, yPosition);
    yPosition += 8;
    doc.text(`Total Returns: ${assignedReturns.length}`, 25, yPosition);
    yPosition += 8;
    
    const totalOrderAmount = assignedOrders.reduce((sum, order) => sum + (order.totalorder || 0), 0);
    const totalReturnAmount = assignedReturns.reduce((sum, returnItem) => sum + (returnItem.totalreturn || 0), 0);
    
    doc.text(`Total Order Amount: ₪${totalOrderAmount.toLocaleString()}`, 25, yPosition);
    yPosition += 8;
    doc.text(`Total Return Amount: ₪${totalReturnAmount.toLocaleString()}`, 25, yPosition);
    
    // Save the PDF
    const fileName = `Zone_${zoneNumber}_Distribution_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <Card
      ref={drop}
      className={`h-[400px] transition-colors ${
        isOver ? 'border-primary bg-primary/5' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">אזור {zoneNumber}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePDF}
              disabled={assignedOrders.length === 0 && assignedReturns.length === 0}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              הדפס
            </Button>
            
            {hasItems && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSchedule}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Select value={selectedGroupId ? selectedGroupId.toString() : 'default'} onValueChange={(value) => handleGroupChange(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="בחר איזור" />
            </SelectTrigger>
            <SelectContent>
              {distributionGroups.map((group) => (
                <SelectItem key={group.groups_id} value={group.groups_id.toString()}>
                  {group.separation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDriverId ? selectedDriverId.toString() : 'default'} onValueChange={(value) => handleDriverChange(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="בחר נהג" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id.toString()}>
                  {driver.nahag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <div>
            <Badge variant="secondary">
              הזמנות: {assignedOrders.length}
            </Badge>
            <Badge variant="secondary">
              החזרות: {assignedReturns.length}
            </Badge>
          </div>
          {destinations !== null && (
            <div>
              <Badge variant="outline">
                יעדים: {destinations}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto h-[220px] p-4">
        {assignedOrders.map((order) => (
          <div key={`order-${order.ordernumber}`} className="mb-2">
            <OrderCard
              type="order"
              data={order}
              onDragStart={() => {}}
            />
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => handleRemoveFromZoneClick({ type: 'order', data: order })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {assignedReturns.map((returnItem) => (
          <div key={`return-${returnItem.returnnumber}`} className="mb-2">
            <OrderCard
              type="return"
              data={returnItem}
              onDragStart={() => {}}
            />
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => handleRemoveFromZoneClick({ type: 'return', data: returnItem })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {assignedOrders.length === 0 && assignedReturns.length === 0 && (
          <div className="text-center text-muted-foreground">
            גרור לכאן הזמנות או החזרות
          </div>
        )}
      </CardContent>
    </Card>
  );
};
