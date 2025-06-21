
import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CentralAlertBanner } from "@/components/distribution/CentralAlertBanner";
import { WarehouseMessageBanner } from "@/components/distribution/WarehouseMessageBanner";
import { ZoneAlertBanner } from "@/components/distribution/ZoneAlertBanner";
import { UnassignedArea } from "@/components/distribution/UnassignedArea";
import { DropZone } from "@/components/distribution/DropZone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function Distribution() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [alertStates, setAlertStates] = useState<Record<number, boolean>>({});
  const [zoneStates, setZoneStates] = useState<Record<number, { selectedGroupId: number | null; scheduleId: number | null; isPinned: boolean }>>({});

  // Listen for real-time updates - no parameters needed
  useRealtimeSubscription();

  const isAdmin = user?.agentnumber === "4";

  // Fetch distribution groups
  const { data: distributionGroups = [] } = useQuery({
    queryKey: ['distribution-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('*')
        .order('groups_id');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nahagim')
        .select('*')
        .order('nahag');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch distribution schedules
  const { data: distributionSchedules = [] } = useQuery({
    queryKey: ['distribution-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('*')
        .order('create_at_schedule', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch unassigned orders and returns
  const { data: unassignedItems, isLoading: isLoadingUnassigned } = useQuery({
    queryKey: ['unassigned-orders', user?.agentnumber],
    queryFn: async () => {
      console.log('Fetching unassigned items for agent:', user?.agentnumber);
      
      let ordersQuery = supabase
        .from('mainorder')
        .select('*')
        .is('schedule_id', null)
        .is('done_mainorder', null)
        .is('ordercancel', null);

      let returnsQuery = supabase
        .from('mainreturns')
        .select('*')
        .is('schedule_id', null)
        .is('done_return', null)
        .is('returncancel', null);

      // Filter by agent unless admin
      if (!isAdmin && user?.agentnumber) {
        ordersQuery = ordersQuery.eq('agentnumber', user.agentnumber);
        returnsQuery = returnsQuery.eq('agentnumber', user.agentnumber);
      }

      const [ordersResult, returnsResult] = await Promise.all([
        ordersQuery,
        returnsQuery
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (returnsResult.error) throw returnsResult.error;

      const orders = ordersResult.data || [];
      const returns = returnsResult.data || [];

      console.log('Fetched unassigned orders:', orders.length, 'returns:', returns.length);

      return { orders, returns };
    }
  });

  // Fetch assigned orders and returns
  const { data: assignedData } = useQuery({
    queryKey: ['assigned-items'],
    queryFn: async () => {
      const [ordersResult, returnsResult] = await Promise.all([
        supabase.from('mainorder').select('*').not('schedule_id', 'is', null),
        supabase.from('mainreturns').select('*').not('schedule_id', 'is', null)
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (returnsResult.error) throw returnsResult.error;

      return {
        orders: ordersResult.data || [],
        returns: returnsResult.data || []
      };
    }
  });

  // Toggle alert mutation
  const toggleAlertMutation = useMutation({
    mutationFn: async ({ orderId, isAlert }: { orderId: number; isAlert: boolean }) => {
      const { error } = await supabase
        .from('mainorder')
        .update({ alert_status: isAlert })
        .eq('ordernumber', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unassigned-orders'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-items'] });
    },
    onError: (error) => {
      console.error('Error toggling alert:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את סטטוס האזעקה",
        variant: "destructive",
      });
    }
  });

  // Handle drop function
  const handleDrop = useCallback((zoneNumber: number, item: { type: 'order' | 'return'; data: any }) => {
    const zoneState = zoneStates[zoneNumber];
    if (!zoneState?.scheduleId) {
      console.log('Cannot drop - no schedule for zone', zoneNumber);
      return;
    }

    const table = item.type === 'order' ? 'mainorder' : 'mainreturns';
    const idField = item.type === 'order' ? 'ordernumber' : 'returnnumber';
    
    supabase
      .from(table)
      .update({ schedule_id: zoneState.scheduleId })
      .eq(idField, item.data[idField])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['unassigned-orders'] });
        queryClient.invalidateQueries({ queryKey: ['assigned-items'] });
      });
  }, [zoneStates, queryClient]);

  // Handle remove from zone
  const handleRemoveFromZone = useCallback((item: { type: 'order' | 'return'; data: any }) => {
    const table = item.type === 'order' ? 'mainorder' : 'mainreturns';
    const idField = item.type === 'order' ? 'ordernumber' : 'returnnumber';
    
    supabase
      .from(table)
      .update({ schedule_id: null })
      .eq(idField, item.data[idField])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['unassigned-orders'] });
        queryClient.invalidateQueries({ queryKey: ['assigned-items'] });
      });
  }, [queryClient]);

  // Get zone state function
  const getZoneState = useCallback((zoneNumber: number) => {
    return zoneStates[zoneNumber] || { selectedGroupId: null, scheduleId: null, isPinned: false };
  }, [zoneStates]);

  // Handle schedule created
  const handleScheduleCreated = useCallback((zoneNumber: number, newScheduleId: number) => {
    setZoneStates(prev => ({
      ...prev,
      [zoneNumber]: {
        ...prev[zoneNumber],
        scheduleId: newScheduleId
      }
    }));
    queryClient.invalidateQueries({ queryKey: ['distribution-schedules'] });
  }, [queryClient]);

  // Handle schedule deleted
  const handleScheduleDeleted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['distribution-schedules'] });
    queryClient.invalidateQueries({ queryKey: ['unassigned-orders'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-items'] });
  }, [queryClient]);

  // Handle toggle pin
  const handleTogglePin = useCallback((zoneNumber: number) => {
    setZoneStates(prev => ({
      ...prev,
      [zoneNumber]: {
        ...prev[zoneNumber],
        isPinned: !prev[zoneNumber]?.isPinned
      }
    }));
  }, []);

  // Updated handleToggleAlert to match the expected signature
  const handleToggleAlert = useCallback((item: { type: 'order' | 'return'; data: any }) => {
    const id = item.type === 'order' ? item.data.ordernumber : item.data.returnnumber;
    const currentStatus = item.data.alert_status || false;
    const newStatus = !currentStatus;
    
    setAlertStates(prev => ({ ...prev, [id]: newStatus }));
    
    if (item.type === 'order') {
      toggleAlertMutation.mutate({ orderId: id, isAlert: newStatus });
    }
    // Handle returns if needed in the future
  }, [toggleAlertMutation]);

  // Simple function for ZoneAlertBanner that matches its expected signature
  const handleZoneToggleAlert = useCallback((orderId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setAlertStates(prev => ({ ...prev, [orderId]: newStatus }));
    toggleAlertMutation.mutate({ orderId, isAlert: newStatus });
  }, [toggleAlertMutation]);

  const hasAlerts = assignedData?.orders?.some(order => order.alert_status) ||
                   assignedData?.returns?.some(returnItem => returnItem.alert_status) ||
                   unassignedItems?.orders?.some(order => order.alert_status);

  const isLoading = isLoadingUnassigned;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">מסך הפצה</h1>
        <div className="text-sm text-gray-600">
          {user?.agentname} ({user?.agentnumber})
        </div>
      </div>

      {/* Warehouse Messages Banner - Only for admin */}
      <WarehouseMessageBanner />

      {/* Central Alert Banner */}
      <CentralAlertBanner isVisible={hasAlerts || false} />

      {/* Zone Alert Banners */}
      {distributionSchedules?.map(schedule => (
        <ZoneAlertBanner
          key={schedule.schedule_id}
          schedule={schedule}
          onToggleAlert={handleZoneToggleAlert}
        />
      ))}

      {/* Main Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Orders */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>הזמנות לא משויכות</CardTitle>
          </CardHeader>
          <CardContent>
            <UnassignedArea
              unassignedOrders={unassignedItems?.orders || []}
              unassignedReturns={unassignedItems?.returns || []}
              onDragStart={() => {}}
              onDropToUnassigned={() => {}}
              onDeleteItem={() => {}}
              multiOrderActiveCustomerList={[]}
              dualActiveOrderReturnCustomers={[]}
              customerSupplyMap={{}}
              onSirenToggle={handleToggleAlert}
            />
          </CardContent>
        </Card>

        {/* Distribution Zones */}
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map(zoneNumber => (
              <DropZone
                key={zoneNumber}
                zoneNumber={zoneNumber}
                distributionGroups={distributionGroups}
                distributionSchedules={distributionSchedules}
                drivers={drivers}
                onDrop={handleDrop}
                orders={assignedData?.orders || []}
                returns={assignedData?.returns || []}
                onScheduleDeleted={handleScheduleDeleted}
                onScheduleCreated={handleScheduleCreated}
                onRemoveFromZone={handleRemoveFromZone}
                getZoneState={getZoneState}
                multiOrderActiveCustomerList={[]}
                dualActiveOrderReturnCustomers={[]}
                customerSupplyMap={{}}
                onSirenToggle={handleToggleAlert}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
