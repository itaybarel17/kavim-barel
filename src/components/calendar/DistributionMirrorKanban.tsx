import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Printer } from 'lucide-react';
import { UnassignedArea } from '@/components/distribution/UnassignedArea';
import { OrderCard } from '@/components/distribution/OrderCard';
import { ImportantMessageBadge } from '@/components/distribution/ImportantMessageBadge';
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

interface DistributionMirrorKanbanProps {
  distributionSchedules: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: Order[];
  returns: Return[];
  multiOrderActiveCustomerList?: { name: string; city: string; }[];
  dualActiveOrderReturnCustomers?: { name: string; city: string; }[];
  customerSupplyMap?: Record<string, string>;
  customerCoordinatesMap?: Record<string, { lat: number; lng: number }>;
  messageMap?: Record<string, Array<{ subject: string; content?: string; tagAgent?: string; agentName?: string }>>;
  cancellationMap?: Set<string>;
  customerReplacementMap?: Map<string, any>;
  scheduleMessageMap?: Record<string, { subject: string; content?: string; tagAgent?: string; agentName?: string }>;
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

export const DistributionMirrorKanban: React.FC<DistributionMirrorKanbanProps> = ({
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns,
  multiOrderActiveCustomerList = [],
  dualActiveOrderReturnCustomers = [],
  customerSupplyMap = {},
  customerCoordinatesMap = {},
  messageMap = {},
  cancellationMap = new Set(),
  customerReplacementMap,
  scheduleMessageMap = {}
}) => {
  // Initialize customerReplacementMap if not provided
  const safeCustomerReplacementMap = customerReplacementMap || ({
    get: () => undefined,
    has: () => false
  } as unknown as Map<string, any>);
  // Get unassigned orders and returns (no schedule_id)
  const unassignedOrders = orders.filter(order => !order.schedule_id);
  const unassignedReturns = returns.filter(returnItem => !returnItem.schedule_id);

  // Create zone state mapping
  const zoneStates = useMemo(() => {
    const states: Record<number, {
      selectedGroupId: number | null;
      scheduleId: number | null;
      isPinned: boolean;
    }> = {};

    // Initialize zones 1-12
    for (let i = 1; i <= 12; i++) {
      states[i] = {
        selectedGroupId: null,
        scheduleId: null,
        isPinned: false
      };
    }

    // Fill with actual schedule data - map schedules to zones based on groups_id
    distributionSchedules.forEach((schedule, index) => {
      const zoneNumber = (index % 12) + 1; // Simple mapping for display
      if (schedule.groups_id) {
        states[zoneNumber] = {
          selectedGroupId: schedule.groups_id,
          scheduleId: schedule.schedule_id,
          isPinned: false // No pinning data in this context
        };
      }
    });

    return states;
  }, [distributionSchedules]);

  // Dummy handlers for read-only mode
  const dummyHandler = () => {};

  // Read-only zone component
  const ReadOnlyZone: React.FC<{ zoneNumber: number }> = ({ zoneNumber }) => {
    const zoneState = zoneStates[zoneNumber];
    const selectedGroup = distributionGroups.find(group => group.groups_id === zoneState.selectedGroupId);
    const selectedDriver = drivers.find(driver => driver.id === zoneState.scheduleId); // Simplified mapping

    // Get assigned items for this zone
    const assignedOrders = orders.filter(order => order.schedule_id === zoneState.scheduleId);
    const assignedReturns = returns.filter(returnItem => returnItem.schedule_id === zoneState.scheduleId);

    // Sort items with siren status at the top
    const sortedOrders = useMemo(() => sortBySirenStatus(assignedOrders), [assignedOrders]);
    const sortedReturns = useMemo(() => sortBySirenStatus(assignedReturns), [assignedReturns]);

    // Check if any items in this zone have active sirens
    const hasActiveSiren = useMemo(() => {
      return assignedOrders.some(order => order.alert_status === true) || 
             assignedReturns.some(returnItem => returnItem.alert_status === true);
    }, [assignedOrders, assignedReturns]);

    // Calculate unique customer points
    const uniqueCustomerPoints = useMemo(() => {
      const uniqueCustomers = new Set<string>();
      assignedOrders.forEach(order => {
        if (order.customernumber) uniqueCustomers.add(order.customernumber);
      });
      assignedReturns.forEach(returnItem => {
        if (returnItem.customernumber) uniqueCustomers.add(returnItem.customernumber);
      });
      return uniqueCustomers.size;
    }, [assignedOrders, assignedReturns]);

    const completedOrdersCount = assignedOrders.filter(order => order.end_picking_time != null && order.end_picking_time !== '').length;
    const totalOrdersCount = assignedOrders.length;

    // Calculate totals
    const totalOrdersSum = Math.floor(assignedOrders
      .filter(order => order.totalorder != null)
      .reduce((sum, order) => sum + order.totalorder, 0));

    const totalInvoicesSum = Math.floor(assignedOrders
      .filter(order => order.totalinvoice != null)
      .reduce((sum, order) => sum + order.totalinvoice, 0));

    const currentSchedule = distributionSchedules.find(schedule => schedule.schedule_id === zoneState.scheduleId);
    const deliveryDate = currentSchedule?.distribution_date;

    const formatDeliveryDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    };

    return (
      <Card className="min-h-[300px] border-border pointer-events-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">אזור {zoneNumber}</CardTitle>
            <div className="flex gap-2">
              {/* Read-only buttons - disabled */}
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                <Map className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Group and driver selectors - read-only */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">קבוצה: </span>
              {selectedGroup ? (
                <span className={`px-2 py-1 rounded text-white text-xs ${getAreaColor(getMainAreaFromSeparation(selectedGroup.separation))}`}>
                  {selectedGroup.separation} - {formatDistributionDays(selectedGroup.days)}
                </span>
              ) : (
                <span className="text-muted-foreground">לא נבחרה</span>
              )}
            </div>
            
            <div className="text-sm">
              <span className="font-medium">נהג: </span>
              <span className="text-muted-foreground">
                {selectedDriver?.nahag || 'לא נבחר'}
              </span>
            </div>
          </div>

          {/* Stats display */}
          {zoneState.scheduleId && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-medium text-blue-800">נקודות</div>
                <div className="text-lg font-bold text-blue-600">{uniqueCustomerPoints}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="font-medium text-green-800">הזמנות מוכנות</div>
                <div className="text-lg font-bold text-green-600">{completedOrdersCount}/{totalOrdersCount}</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="font-medium text-purple-800">סכום הזמנות</div>
                <div className="text-lg font-bold text-purple-600">₪{totalOrdersSum.toLocaleString()}</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="font-medium text-orange-800">סכום חשבוניות</div>
                <div className="text-lg font-bold text-orange-600">₪{totalInvoicesSum.toLocaleString()}</div>
              </div>
              {deliveryDate && (
                <div className="bg-gray-50 p-2 rounded col-span-2">
                  <div className="font-medium text-gray-800">תאריך משלוח</div>
                  <div className="text-lg font-bold text-gray-600">{formatDeliveryDate(deliveryDate)}</div>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Important message badge */}
          {zoneState.scheduleId && scheduleMessageMap[zoneState.scheduleId.toString()] && (
            <ImportantMessageBadge
              onClick={dummyHandler} // Disabled in read-only mode
              content={scheduleMessageMap[zoneState.scheduleId.toString()].content}
              tagAgent={scheduleMessageMap[zoneState.scheduleId.toString()].tagAgent}
              agentName={scheduleMessageMap[zoneState.scheduleId.toString()].agentName}
              shouldBlink={false}
            />
          )}

          {/* Orders */}
          <div className="space-y-2">
            {sortedOrders.map(order => (
              <div key={`order-${order.ordernumber}`} className="pointer-events-none">
                <OrderCard
                  type="order"
                  data={order}
                  onDragStart={dummyHandler}
                  multiOrderActiveCustomerList={multiOrderActiveCustomerList}
                  dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
                  customerSupplyMap={customerSupplyMap}
                  customerCoordinatesMap={customerCoordinatesMap}
                  onSirenToggle={undefined} // Disabled
                  messagesInfo={messageMap[`order-${order.ordernumber}`]}
                  onMessageBadgeClick={undefined} // Disabled
                  hasCancellationMessage={cancellationMap.has(`order-${order.ordernumber}`)}
                  orderOnAnotherCustomerDetails={safeCustomerReplacementMap.get(`order-${order.ordernumber}`)}
                />
              </div>
            ))}
          </div>

          {/* Returns */}
          <div className="space-y-2">
            {sortedReturns.map(returnItem => (
              <div key={`return-${returnItem.returnnumber}`} className="pointer-events-none">
                <OrderCard
                  type="return"
                  data={returnItem}
                  onDragStart={dummyHandler}
                  multiOrderActiveCustomerList={multiOrderActiveCustomerList}
                  dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
                  customerSupplyMap={customerSupplyMap}
                  customerCoordinatesMap={customerCoordinatesMap}
                  onSirenToggle={undefined} // Disabled
                  messagesInfo={messageMap[`return-${returnItem.returnnumber}`]}
                  onMessageBadgeClick={undefined} // Disabled
                  hasCancellationMessage={cancellationMap.has(`return-${returnItem.returnnumber}`)}
                  orderOnAnotherCustomerDetails={safeCustomerReplacementMap.get(`return-${returnItem.returnnumber}`)}
                />
              </div>
            ))}
          </div>

          {/* Empty state */}
          {sortedOrders.length === 0 && sortedReturns.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              {zoneState.scheduleId ? 'אין הזמנות או החזרות באזור זה' : 'בחר קבוצה כדי להתחיל'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pointer-events-none">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">מראת חלוקה (מצב קריאה בלבד)</h2>
        <p className="text-muted-foreground text-sm">
          תצוגה בלתי-פעילה של עמוד החלוקה - נתונים בסנכרון מלא
        </p>
      </div>

      {/* Unassigned Area - Read Only */}
      <div className="pointer-events-none">
        <UnassignedArea
          unassignedOrders={unassignedOrders}
          unassignedReturns={unassignedReturns}
          onDragStart={dummyHandler}
          onDropToUnassigned={dummyHandler}
          onDeleteItem={undefined} // Disabled
          multiOrderActiveCustomerList={multiOrderActiveCustomerList}
          dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
          customerSupplyMap={customerSupplyMap}
          customerCoordinatesMap={customerCoordinatesMap}
          onSirenToggle={undefined} // Disabled
          messageMap={messageMap}
          onMessageBadgeClick={undefined} // Disabled
          cancellationMap={cancellationMap}
          customerReplacementMap={safeCustomerReplacementMap}
        />
      </div>

      {/* Grid of 12 zones (4x3) - Read Only */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, index) => (
          <ReadOnlyZone key={index + 1} zoneNumber={index + 1} />
        ))}
      </div>
    </div>
  );
};