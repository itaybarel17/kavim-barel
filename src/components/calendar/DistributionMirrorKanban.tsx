import React, { useMemo } from 'react';
import { UnassignedArea } from '@/components/distribution/UnassignedArea';
import { DropZone } from '@/components/distribution/DropZone';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  customernumber?: string;
  done_mainorder?: string | null;
  ordercancel?: string | null;
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
  done_return?: string | null;
  returncancel?: string | null;
  hour?: string;
  remark?: string;
  alert_status?: boolean;
  message_alert?: boolean | null;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days?: any;
}

interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  driver_id?: number;
  distribution_date?: string;
  isPinned?: boolean;
  message_alert?: boolean;
}

interface Driver {
  id: number;
  nahag: string;
}

interface DistributionMirrorKanbanProps {
  orders: Order[];
  returns: Return[];
  distributionGroups: DistributionGroup[];
  distributionSchedules: DistributionSchedule[];
  drivers: Driver[];
  multiOrderActiveCustomerList?: { name: string; city: string }[];
  dualActiveOrderReturnCustomers?: { name: string; city: string }[];
  customerSupplyMap?: Record<string, string>;
  customerCoordinatesMap?: Record<string, { lat: number; lng: number }>;
  messageMap?: Record<string, Array<{ subject: string; content?: string; tagAgent?: string; agentName?: string }>>;
  cancellationMap?: Set<string>;
  customerReplacementMap?: Map<string, any>;
  scheduleMessageMap?: Record<string, { subject: string; content?: string; tagAgent?: string; agentName?: string }>;
}

export const DistributionMirrorKanban: React.FC<DistributionMirrorKanbanProps> = ({
  orders,
  returns,
  distributionGroups,
  distributionSchedules,
  drivers,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
  customerCoordinatesMap = {},
  messageMap = {},
  cancellationMap = new Set(),
  customerReplacementMap = new Map(),
  scheduleMessageMap = {}
}) => {
  // Calculate unassigned orders and returns (those without schedule_id)
  const unassignedOrders = useMemo(() => {
    return orders.filter(order => !order.schedule_id);
  }, [orders]);

  const unassignedReturns = useMemo(() => {
    return returns.filter(returnItem => !returnItem.schedule_id);
  }, [returns]);

  // Create zone-schedule mapping for the 12 zones
  const zoneScheduleMapping = useMemo(() => {
    const mapping: Record<number, number | null> = {};
    
    // Initialize all 12 zones
    for (let i = 1; i <= 12; i++) {
      mapping[i] = null;
    }
    
    // Assign schedules to zones based on groups_id
    distributionSchedules.forEach(schedule => {
      const zoneNumber = schedule.groups_id;
      if (zoneNumber >= 1 && zoneNumber <= 12) {
        mapping[zoneNumber] = schedule.schedule_id;
      }
    });
    
    return mapping;
  }, [distributionSchedules]);

  // Get zone state function
  const getZoneState = (zoneNumber: number) => {
    const scheduleId = zoneScheduleMapping[zoneNumber];
    const schedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
    
    return {
      selectedGroupId: schedule?.groups_id || null,
      scheduleId: scheduleId,
      isPinned: schedule?.isPinned || false
    };
  };

  // Dummy handlers for read-only mode
  const dummyDragStart = () => {};
  const dummyDropToUnassigned = () => {};
  const dummyDrop = () => {};
  const dummyScheduleDeleted = () => {};
  const dummyScheduleCreated = () => {};
  const dummyRemoveFromZone = () => {};
  
  return (
    <div className="space-y-6 pointer-events-none select-none" style={{ cursor: 'default' }}>
      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
          מראה של עמוד ההפצה (קריאה בלבד)
        </h2>
        
        {/* Unassigned Area Mirror */}
        <div className="mb-6">
          <UnassignedArea
            unassignedOrders={unassignedOrders}
            unassignedReturns={unassignedReturns}
            onDragStart={dummyDragStart}
            onDropToUnassigned={dummyDropToUnassigned}
            multiOrderActiveCustomerList={multiOrderActiveCustomerList}
            dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
            customerSupplyMap={customerSupplyMap}
            customerCoordinatesMap={customerCoordinatesMap}
            messageMap={messageMap}
            cancellationMap={cancellationMap}
            customerReplacementMap={customerReplacementMap}
          />
        </div>

        {/* Distribution Zones Grid (4x3) */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, index) => {
            const zoneNumber = index + 1;
            return (
              <DropZone
                key={zoneNumber}
                zoneNumber={zoneNumber}
                distributionGroups={distributionGroups}
                distributionSchedules={distributionSchedules}
                drivers={drivers}
                onDrop={dummyDrop}
                orders={orders}
                returns={returns}
                onScheduleDeleted={dummyScheduleDeleted}
                onScheduleCreated={dummyScheduleCreated}
                onRemoveFromZone={dummyRemoveFromZone}
                getZoneState={getZoneState}
                multiOrderActiveCustomerList={multiOrderActiveCustomerList}
                dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
                customerSupplyMap={customerSupplyMap}
                customerCoordinatesMap={customerCoordinatesMap}
                messageMap={messageMap}
                cancellationMap={cancellationMap}
                customerReplacementMap={customerReplacementMap}
                scheduleMessageMap={scheduleMessageMap}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};