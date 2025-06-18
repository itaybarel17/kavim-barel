import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { HorizontalKanban } from '@/components/calendar/HorizontalKanban';
import { ProductionDialog } from '@/components/calendar/ProductionDialog';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { usePeriodicRefresh } from '@/hooks/usePeriodicRefresh';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
  totalinvoice?: number;
  hour?: string;
  remark?: string;
  done_mainorder?: string | null;
  ordercancel?: string | null;
  schedule_id_if_changed?: number | {
    schedule_id: number;
  } | number[];
}
interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
  hour?: string;
  remark?: string;
  done_return?: string | null;
  returncancel?: string | null;
  schedule_id_if_changed?: number | {
    schedule_id: number;
  } | number[];
}
interface DistributionGroup {
  groups_id: number;
  separation: string;
  agents?: any;
}
interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  distribution_date?: string;
  destinations?: number;
  driver_id?: number;
  dis_number?: number;
  done_schedule?: string;
}
interface Driver {
  id: number;
  nahag: string;
}
interface User {
  agentnumber: string;
  agentname: string;
}

const Calendar = () => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const {
    user: currentUser
  } = useAuth();
  const {
    toast
  } = useToast();

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Set up periodic refresh for calendar page too
  usePeriodicRefresh({
    refreshUnassignedInterval: 30000,
    // 30 seconds
    refreshAllInterval: 300000,
    // 5 minutes
    respectVisibility: true
  });
  const {
    data: distributionGroups = [],
    isLoading: groupsLoading
  } = useQuery({
    queryKey: ['calendar-distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups...');
      const {
        data,
        error
      } = await supabase.from('distribution_groups').select('groups_id, separation, agents');
      if (error) throw error;
      console.log('Distribution groups fetched:', data);
      return data as DistributionGroup[];
    }
  });
  const {
    data: distributionSchedules = [],
    refetch: refetchSchedules,
    isLoading: schedulesLoading
  } = useQuery({
    queryKey: ['calendar-distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching distribution schedules...');
      const {
        data,
        error
      } = await supabase.from('distribution_schedule').select('schedule_id, groups_id, create_at_schedule, distribution_date, destinations, driver_id, dis_number, done_schedule').order('schedule_id');
      if (error) throw error;
      console.log('Distribution schedules fetched:', data);
      return data as DistributionSchedule[];
    }
  });
  const {
    data: orders = [],
    refetch: refetchOrders,
    isLoading: ordersLoading
  } = useQuery({
    queryKey: ['calendar-orders'],
    queryFn: async () => {
      console.log('Fetching orders...');
      const {
        data,
        error
      } = await supabase.from('mainorder').select('ordernumber, customername, address, city, totalorder, schedule_id, icecream, customernumber, agentnumber, orderdate, invoicenumber, totalinvoice, totalinvoice, hour, remark, done_mainorder, ordercancel, schedule_id_if_changed').order('ordernumber', {
        ascending: false
      });
      if (error) throw error;
      console.log('Orders fetched:', data);
      return data as Order[];
    }
  });
  const {
    data: returns = [],
    refetch: refetchReturns,
    isLoading: returnsLoading
  } = useQuery({
    queryKey: ['calendar-returns'],
    queryFn: async () => {
      console.log('Fetching returns...');
      const {
        data,
        error
      } = await supabase.from('mainreturns').select('returnnumber, customername, address, city, totalreturn, schedule_id, icecream, customernumber, agentnumber, returndate, hour, remark, done_return, returncancel, schedule_id_if_changed').order('returnnumber', {
        ascending: false
      });
      if (error) throw error;
      console.log('Returns fetched:', data);
      return data as Return[];
    }
  });
  const {
    data: drivers = [],
    isLoading: driversLoading
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      console.log('Fetching drivers...');
      const {
        data,
        error
      } = await supabase.from('nahagim').select('id, nahag').order('nahag');
      if (error) throw error;
      console.log('Drivers fetched:', data);
      return data as Driver[];
    }
  });
  const handleUpdateDestinations = async scheduleId => {
    console.log('Updating destinations for schedule:', scheduleId);
    const schedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) {
      console.warn(`Schedule with ID ${scheduleId} not found.`);
      return;
    }
    const ordersForSchedule = orders.filter(order => order.schedule_id === scheduleId || order.schedule_id_if_changed === scheduleId || Array.isArray(order.schedule_id_if_changed) && order.schedule_id_if_changed.includes(scheduleId) || typeof order.schedule_id_if_changed === 'object' && order.schedule_id_if_changed !== null && order.schedule_id_if_changed.schedule_id === scheduleId);
    const returnsForSchedule = returns.filter(ret => ret.schedule_id === scheduleId || ret.schedule_id_if_changed === scheduleId || Array.isArray(ret.schedule_id_if_changed) && ret.schedule_id_if_changed.includes(scheduleId) || typeof ret.schedule_id_if_changed === 'object' && ret.schedule_id_if_changed !== null && ret.schedule_id_if_changed.schedule_id === scheduleId);
    const uniqueCustomers = new Set();
    ordersForSchedule.forEach(order => uniqueCustomers.add(`${order.customername}-${order.city}`));
    returnsForSchedule.forEach(ret => uniqueCustomers.add(`${ret.customername}-${ret.city}`));
    const newDestinationsCount = uniqueCustomers.size;
    console.log(`Schedule ${scheduleId} has ${newDestinationsCount} unique destinations.`);
    try {
      const {
        data,
        error
      } = await supabase.from('distribution_schedule').update({
        destinations: newDestinationsCount
      }).eq('schedule_id', scheduleId).select();
      if (error) {
        console.error('Error updating destinations:', error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בעדכון יעדים",
          variant: "destructive"
        });
      } else {
        console.log('Destinations updated successfully:', data);
        toast({
          title: "הצלחה",
          description: `יעדים עודכנו בהצלחה לקו חלוקה ${scheduleId}`
        });
        refetchSchedules();
      }
    } catch (error) {
      console.error('Error updating destinations:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון יעדים",
        variant: "destructive"
      });
    }
  };
  const handleDropToKanban = async scheduleId => {
    console.log('Setting distribution_date to null for schedule:', scheduleId);
    try {
      const {
        data,
        error
      } = await supabase.from('distribution_schedule').update({
        distribution_date: null
      }).eq('schedule_id', scheduleId).select();
      if (error) {
        console.error('Error setting distribution_date to null:', error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה באיפוס תאריך הפצה",
          variant: "destructive"
        });
      } else {
        console.log('distribution_date set to null successfully:', data);
        toast({
          title: "הצלחה",
          description: `תאריך הפצה אופס בהצלחה לקו חלוקה ${scheduleId}`
        });
        refetchSchedules();
      }
    } catch (error) {
      console.error('Error setting distribution_date to null:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באיפוס תאריך הפצה",
        variant: "destructive"
      });
    }
  };
  const isLoading = groupsLoading || schedulesLoading || ordersLoading || returnsLoading || driversLoading;
  if (isLoading) {
    return <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>;
  }
  return <div className="min-h-screen p-6 bg-[#f1f5f9]">
      <h1 className="text-3xl font-bold text-gray-700 mb-6">לוח שנה</h1>
      <HorizontalKanban distributionSchedules={distributionSchedules} distributionGroups={distributionGroups} drivers={drivers} orders={orders} returns={returns} onUpdateDestinations={handleUpdateDestinations} onDropToKanban={handleDropToKanban} currentUser={currentUser} />
      <CalendarGrid distributionSchedules={distributionSchedules} distributionGroups={distributionGroups} drivers={drivers} orders={orders} returns={returns} onUpdateDestinations={handleUpdateDestinations} onScheduleSelect={setSelectedScheduleId} currentUser={currentUser} />
      {selectedScheduleId && <ProductionDialog scheduleId={selectedScheduleId} onClose={() => setSelectedScheduleId(null)} refetchSchedules={refetchSchedules} refetchOrders={refetchOrders} refetchReturns={refetchReturns} />}
    </div>;
};
export default Calendar;
