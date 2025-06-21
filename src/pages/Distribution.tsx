
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

  // Listen for real-time updates
  useRealtimeSubscription(['mainorder', 'mainreturns', 'distribution_schedule'], () => {
    queryClient.invalidateQueries({ queryKey: ['unassigned-orders'] });
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
    queryClient.invalidateQueries({ queryKey: ['warehouse-messages'] });
  });

  const isAdmin = user?.agentnumber === "4";

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

  // Fetch distribution schedules
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['schedules', user?.agentnumber],
    queryFn: async () => {
      console.log('Fetching schedules for agent:', user?.agentnumber);

      const { data, error } = await supabase
        .from('distribution_schedule')
        .select(`
          *,
          mainorder!mainorder_schedule_id_fkey(*),
          mainreturns!mainreturns_schedule_id_fkey(*)
        `)
        .is('done_schedule', null)
        .order('distribution_date', { ascending: true });

      if (error) throw error;

      // Filter schedules by agent unless admin
      let filteredSchedules = data || [];
      if (!isAdmin && user?.agentnumber) {
        filteredSchedules = filteredSchedules.filter(schedule => {
          const hasUserOrders = schedule.mainorder?.some((order: any) => order.agentnumber === user.agentnumber);
          const hasUserReturns = schedule.mainreturns?.some((returnItem: any) => returnItem.agentnumber === user.agentnumber);
          return hasUserOrders || hasUserReturns;
        });
      }

      console.log('Fetched schedules:', filteredSchedules.length);
      return filteredSchedules;
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
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
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

  const handleToggleAlert = useCallback((orderId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setAlertStates(prev => ({ ...prev, [orderId]: newStatus }));
    toggleAlertMutation.mutate({ orderId, isAlert: newStatus });
  }, [toggleAlertMutation]);

  const hasAlerts = schedules?.some(schedule => 
    schedule.mainorder?.some((order: any) => order.alert_status) ||
    schedule.mainreturns?.some((returnItem: any) => returnItem.alert_status)
  ) || unassignedItems?.orders?.some(order => order.alert_status);

  const isLoading = isLoadingUnassigned || isLoadingSchedules;

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
      {schedules?.map(schedule => (
        <ZoneAlertBanner
          key={schedule.schedule_id}
          schedule={schedule}
          onToggleAlert={handleToggleAlert}
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
              orders={unassignedItems?.orders || []}
              returns={unassignedItems?.returns || []}
              isAdmin={isAdmin}
              onToggleAlert={handleToggleAlert}
              alertStates={alertStates}
            />
          </CardContent>
        </Card>

        {/* Distribution Zones */}
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {schedules?.map(schedule => (
              <DropZone
                key={schedule.schedule_id}
                schedule={schedule}
                isAdmin={isAdmin}
                onToggleAlert={handleToggleAlert}
                alertStates={alertStates}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
