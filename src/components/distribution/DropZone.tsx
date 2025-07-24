import React, { useState, useMemo, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { X, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderCard } from './OrderCard';
import { pdf } from '@react-pdf/renderer';
import { ZonePDFDocument } from './ZonePDFDocument';
import { ScheduleResetConfirmDialog } from './ScheduleResetConfirmDialog';
import { ImportantMessageBadge } from './ImportantMessageBadge';
import { getAreaColor, getMainAreaFromSeparation } from '@/utils/areaColors';
import { formatDistributionDays } from '@/utils/dateUtils';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  totalinvoice?: number;
  end_picking_time?: string | null;
  schedule_id?: number;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
  hour?: string;
  remark?: string;
  alert_status?: boolean;
  ezor1?: string;
  ezor2?: string;
  day1?: string;
  day2?: string;
  message_alert?: boolean | null;
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
  hour?: string;
  remark?: string;
  alert_status?: boolean;
  message_alert?: boolean | null;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days?: any; // JSONB array
  day?: string | null; // Text field
}
interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  driver_id?: number;
  distribution_date?: string;
  message_alert?: boolean;
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
  onDrop: (zoneNumber: number, item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => void;
  orders: Order[];
  returns: Return[];
  onScheduleDeleted: () => void;
  onScheduleCreated: (zoneNumber: number, newScheduleId: number) => void;
  onRemoveFromZone: (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => void;
  getZoneState: (zoneNumber: number) => {
    selectedGroupId: number | null;
    scheduleId: number | null;
    isPinned: boolean;
  };
  // existing props for icons
  multiOrderActiveCustomerList?: any[];
  dualActiveOrderReturnCustomers?: any[];
  // new props for supply details - removed agentNameMap
  customerSupplyMap?: Record<string, string>;
  
  // new prop for siren functionality
  onSirenToggle?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  // new prop for pin toggle functionality
  onTogglePin?: (zoneNumber: number) => void;
  // message props - support up to 2 messages
  messageMap?: Record<string, Array<{ subject: string; content?: string; tagAgent?: string; agentName?: string }>>;
  onMessageBadgeClick?: (item: { type: 'order' | 'return'; data: Order | Return }) => void;
  
  // cancellation map for red X overlay
  cancellationMap?: Set<string>;
  
  // customer replacement map for "order on another customer" functionality
  customerReplacementMap?: Map<string, any>;
  
  // schedule message props
  scheduleMessageMap?: Record<string, { subject: string; content?: string; tagAgent?: string; agentName?: string }>;
  onScheduleImportantMessageClick?: (scheduleId: number) => void;
}

/**
 * Sorts items with active sirens (alert_status: true) to the top
 * while preserving the original order within each group
 */
const sortBySirenStatus = <T extends { alert_status?: boolean }>(items: T[]): T[] => {
  const withSiren = items.filter(item => item.alert_status === true);
  const withoutSiren = items.filter(item => item.alert_status !== true);
  return [...withSiren, ...withoutSiren];
};


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
  getZoneState,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
  onSirenToggle,
  onTogglePin,
  messageMap = {},
  onMessageBadgeClick,
  cancellationMap = new Set(),
  customerReplacementMap = new Map(),
  scheduleMessageMap = {},
  onScheduleImportantMessageClick
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const navigate = useNavigate();

  // Get current zone state from parent
  const currentZoneState = getZoneState(zoneNumber);
  const [{
    isOver
  }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: {
      type: 'order' | 'return';
      data: Order | Return;
    }) => {
      console.log('Drop triggered in zone', zoneNumber, 'with item:', item);
      console.log('Current zone state:', currentZoneState);

      // Only allow drop if there's a valid schedule
      if (currentZoneState.scheduleId) {
        onDrop(zoneNumber, item);
      } else {
        console.log('Cannot drop - no schedule available for zone', zoneNumber);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  }), [zoneNumber, currentZoneState.scheduleId]);

  // Get assigned items for this zone based on schedule_id - ONLY for ACTIVE schedules
  const assignedOrders = orders.filter(order => scheduleId && order.schedule_id === scheduleId && distributionSchedules.some(schedule => schedule.schedule_id === scheduleId));
  const assignedReturns = returns.filter(returnItem => scheduleId && returnItem.schedule_id === scheduleId && distributionSchedules.some(schedule => schedule.schedule_id === scheduleId));

  // Sort items with siren status at the top
  const sortedOrders = useMemo(() => sortBySirenStatus(assignedOrders), [assignedOrders]);
  const sortedReturns = useMemo(() => sortBySirenStatus(assignedReturns), [assignedReturns]);

  // Check if any items in this zone have active sirens
  const hasActiveSiren = useMemo(() => {
    return assignedOrders.some(order => order.alert_status === true) || 
           assignedReturns.some(returnItem => returnItem.alert_status === true);
  }, [assignedOrders, assignedReturns]);

  // Calculate unique customer points (נקודות)
  const uniqueCustomerPoints = useMemo(() => {
    const uniqueCustomers = new Set<string>();

    // Add customer numbers from orders
    assignedOrders.forEach(order => {
      if (order.customernumber) {
        uniqueCustomers.add(order.customernumber);
      }
    });

    // Add customer numbers from returns
    assignedReturns.forEach(returnItem => {
      if (returnItem.customernumber) {
        uniqueCustomers.add(returnItem.customernumber);
      }
    });
    return uniqueCustomers.size;
  }, [assignedOrders, assignedReturns]);

  // Calculate prepared orders count and total orders count
  const completedOrdersCount = useMemo(() => {
    return assignedOrders.filter(order => order.end_picking_time != null && order.end_picking_time !== '').length;
  }, [assignedOrders]);

  const totalOrdersCount = useMemo(() => {
    return assignedOrders.length;
  }, [assignedOrders]);

  // Calculate total orders sum (without decimals)
  const totalOrdersSum = useMemo(() => {
    const sum = assignedOrders
      .filter(order => order.totalorder != null && order.totalorder !== undefined)
      .reduce((sum, order) => sum + order.totalorder, 0);
    return Math.floor(sum);
  }, [assignedOrders]);

  // Calculate total invoices sum (without decimals)
  const totalInvoicesSum = useMemo(() => {
    const sum = assignedOrders
      .filter(order => order.totalinvoice != null && order.totalinvoice !== undefined)
      .reduce((sum, order) => sum + order.totalinvoice, 0);
    return Math.floor(sum);
  }, [assignedOrders]);

  // Get delivery date for display
  const currentSchedule = distributionSchedules.find(schedule => schedule.schedule_id === scheduleId);
  const deliveryDate = currentSchedule?.distribution_date;
  
  // Format delivery date to DD/MM
  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  // Update local state based on zone state from parent
  useEffect(() => {
    console.log('DropZone effect - updating state for zone:', zoneNumber);
    console.log('Zone state from parent:', currentZoneState);
    setSelectedGroupId(currentZoneState.selectedGroupId);
    setScheduleId(currentZoneState.scheduleId);

    // Update driver selection if we have a schedule
    if (currentZoneState.scheduleId) {
      const schedule = distributionSchedules.find(s => s.schedule_id === currentZoneState.scheduleId);
      setSelectedDriverId(schedule?.driver_id || null);
    } else {
      setSelectedDriverId(null);
    }
  }, [currentZoneState.selectedGroupId, currentZoneState.scheduleId, distributionSchedules, zoneNumber]);

  // Updated print function to navigate to report page
  const handlePrint = () => {
    if (!scheduleId) return;
    const selectedGroup = distributionGroups.find(group => group.groups_id === selectedGroupId);
    const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);

    // Navigate to the report page with data including customerSupplyMap
    const reportData = {
      zoneNumber,
      scheduleId,
      groupName: selectedGroup?.separation || '',
      driverName: selectedDriver?.nahag || '',
      orders: assignedOrders,
      returns: assignedReturns,
      customerSupplyMap // Add customerSupplyMap to the report data
    };

    // Use navigate to go to the report page
    navigate(`/zone-report/${zoneNumber}`, {
      state: reportData
    });
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
      // Check if we already have a schedule for this zone
      if (scheduleId) {
        // Update existing schedule with new group
        console.log('Updating existing schedule', scheduleId, 'with new group:', groupId);
        const { error } = await supabase
          .from('distribution_schedule')
          .update({ groups_id: groupId })
          .eq('schedule_id', scheduleId);
        
        if (error) {
          console.error('Error updating schedule with new group:', error);
          return;
        }
        console.log('Schedule updated successfully with new group');
        setSelectedGroupId(groupId);
        // Keep the same scheduleId
        setSelectedDriverId(null); // Reset driver when changing group
      } else {
        // Create new schedule as before
        console.log('Creating new schedule for group:', groupId);
        const {
          data: newScheduleId,
          error
        } = await supabase.rpc('get_or_create_schedule_for_group', {
          group_id: groupId
        });
        if (error) {
          console.error('Error creating schedule:', error);
          return;
        }
        console.log('Created new schedule ID:', newScheduleId);
        setSelectedGroupId(groupId);
        setScheduleId(newScheduleId);
        setSelectedDriverId(null);
        onScheduleCreated(zoneNumber, newScheduleId);
      }
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
      const {
        error
      } = await supabase.from('distribution_schedule').update({
        driver_id: driverId
      }).eq('schedule_id', scheduleId);
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

  const handleDeleteSchedule = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = async () => {
    if (!scheduleId) return;
    try {
      console.log('Clearing assignments for schedule:', scheduleId);

      // Clear orders
      const {
        error: ordersError
      } = await supabase.from('mainorder').update({
        schedule_id: null
      }).eq('schedule_id', scheduleId);
      if (ordersError) {
        console.error('Error clearing order assignments:', ordersError);
        return;
      }

      // Clear returns
      const {
        error: returnsError
      } = await supabase.from('mainreturns').update({
        schedule_id: null
      }).eq('schedule_id', scheduleId);
      if (returnsError) {
        console.error('Error clearing return assignments:', returnsError);
        return;
      }

      // Then delete the schedule
      const {
        error: deleteError
      } = await supabase.from('distribution_schedule').delete().eq('schedule_id', scheduleId);
      if (deleteError) {
        console.error('Error deleting schedule:', deleteError);
        return;
      }
      console.log('Schedule deleted successfully');

      // Reset local state to completely empty
      setSelectedGroupId(null);
      setScheduleId(null);
      setSelectedDriverId(null);
      setShowResetDialog(false);
      onScheduleDeleted();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleItemDragStart = (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    console.log('Item drag started from zone:', item);
  };

  // Get the selected group name for display
  const selectedGroup = distributionGroups.find(group => group.groups_id === selectedGroupId);
  const selectedDriver = drivers.find(driver => driver.id === selectedDriverId);
  
  // Debug logging for distribution days
  console.log('Selected group ID:', selectedGroupId);
  console.log('Selected group object:', selectedGroup);
  console.log('Selected group days:', selectedGroup?.days);
  console.log('Distribution groups:', distributionGroups);
  console.log('formatDistributionDays result:', formatDistributionDays(selectedGroup?.days));
  
  return (
    <Card ref={drop} className={`min-h-[300px] transition-colors relative ${isOver && currentZoneState.scheduleId ? 'border-primary bg-primary/5' : 'border-border'} ${!currentZoneState.scheduleId && isOver ? 'border-red-300 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">אזור {zoneNumber}</CardTitle>
          <div className="flex gap-2">
            {scheduleId && onTogglePin && (
              <Toggle
                pressed={currentZoneState.isPinned}
                onPressedChange={() => onTogglePin(zoneNumber)}
                size="sm"
                className="h-6 w-6 rounded-full data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=off]:bg-gray-200 relative"
                title={currentZoneState.isPinned ? "בטל צימוד" : "צמד לראש"}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${currentZoneState.isPinned ? 'translate-x-1' : '-translate-x-1'}`} />
              </Toggle>
            )}
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
          <Select value={selectedGroupId?.toString() || ''} onValueChange={handleGroupSelection}>
            <SelectTrigger className={`w-full h-10 border border-input ${
              selectedGroupId ? (() => {
                const selectedGroup = distributionGroups.find(g => g.groups_id === selectedGroupId);
                if (selectedGroup) {
                  const mainArea = getMainAreaFromSeparation(selectedGroup.separation || '');
                  return getAreaColor(mainArea) + ' font-bold';
                }
                return 'bg-background';
              })() : 'bg-background'
            }`}>
              <SelectValue placeholder="בחר אזור הפצה" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-md z-50 max-h-[200px] overflow-y-auto">
              {distributionGroups.map(group => (
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
            <Select value={selectedDriverId?.toString() || ''} onValueChange={handleDriverSelection}>
              <SelectTrigger className="w-full h-10 bg-background border border-input">
                <SelectValue placeholder="בחר נהג" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-md z-50 max-h-[200px] overflow-y-auto">
                {drivers.map(driver => (
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
                 <div className="font-medium text-primary" dir="rtl">
                   ימי הפצה: {formatDistributionDays(selectedGroup.days)}
                 </div>
               )}
              {selectedDriver && (
                <div className="font-medium text-secondary-foreground">
                  נהג נבחר: {selectedDriver.nahag}
                </div>
              )}
              {/* Important Message Badge */}
              {scheduleId && scheduleMessageMap[`schedule-${scheduleId}`] && onScheduleImportantMessageClick && (
                <div className="flex justify-center mt-2 mb-2">
                  <ImportantMessageBadge
                    onClick={() => onScheduleImportantMessageClick(scheduleId)}
                    content={scheduleMessageMap[`schedule-${scheduleId}`]?.content}
                    tagAgent={scheduleMessageMap[`schedule-${scheduleId}`]?.tagAgent}
                    agentName={scheduleMessageMap[`schedule-${scheduleId}`]?.agentName}
                    shouldBlink={distributionSchedules.find(s => s.schedule_id === scheduleId)?.message_alert === true}
                  />
                </div>
              )}
              {scheduleId && totalOrdersCount > 0 && (
                <div className="font-medium text-green-600 mt-1 text-sm">
                  הוכנו {completedOrdersCount} הזמנות מתוך {totalOrdersCount}
                </div>
              )}
              {scheduleId && (
                <div className="font-medium text-blue-600 mt-1">
                  סה"כ נקודות: {uniqueCustomerPoints}
                </div>
              )}
              {scheduleId && (totalOrdersSum > 0 || totalInvoicesSum > 0) && (
                <div className="font-medium text-blue-600 mt-1 text-sm">
                  סה"כ: הזמנה: {totalOrdersSum.toLocaleString('he-IL')} | חש': {totalInvoicesSum.toLocaleString('he-IL')}
                </div>
              )}
              {deliveryDate && (
                <div className="font-medium text-green-600 mt-1">
                  אספקה: {formatDeliveryDate(deliveryDate)}
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
      <CardContent className="space-y-2 px-[4px]">
        {sortedOrders.map(order => (
          <OrderCard
            key={`order-${order.ordernumber}`}
            type="order"
            data={order}
            onDragStart={handleItemDragStart}
            multiOrderActiveCustomerList={multiOrderActiveCustomerList}
            dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
            customerSupplyMap={customerSupplyMap}
            onSirenToggle={onSirenToggle}
            messagesInfo={messageMap[`order-${order.ordernumber}`]}
            onMessageBadgeClick={onMessageBadgeClick}
            hasCancellationMessage={cancellationMap.has(`order-${order.ordernumber}`)}
            orderOnAnotherCustomerDetails={customerReplacementMap.get(`order-${order.ordernumber}`)}
          />
        ))}
        {sortedReturns.map(returnItem => (
          <OrderCard
            key={`return-${returnItem.returnnumber}`}
            type="return"
            data={returnItem}
            onDragStart={handleItemDragStart}
            multiOrderActiveCustomerList={multiOrderActiveCustomerList}
            dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
            customerSupplyMap={customerSupplyMap}
            onSirenToggle={onSirenToggle}
            messagesInfo={messageMap[`return-${returnItem.returnnumber}`]}
            onMessageBadgeClick={onMessageBadgeClick}
            hasCancellationMessage={cancellationMap.has(`return-${returnItem.returnnumber}`)}
            orderOnAnotherCustomerDetails={customerReplacementMap.get(`return-${returnItem.returnnumber}`)}
          />
        ))}
        {assignedOrders.length === 0 && assignedReturns.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            {selectedGroupId ? 'גרור הזמנות או החזרות לכאן' : 'בחר אזור ליצירת מזהה'}
          </div>
        )}
      </CardContent>
      
      <ScheduleResetConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleConfirmReset}
        zoneNumber={zoneNumber}
      />
    </Card>
  );
};
