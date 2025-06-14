import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Loader2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CalendarCard } from '@/components/calendar/CalendarCard';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { HorizontalKanban } from '@/components/calendar/HorizontalKanban';

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
  dis_number?: number;
  done_schedule?: string;
}

interface Driver {
  id: number;
  nahag: string;
}

const Calendar = () => {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const sunday = new Date(today);
    // Calculate days back to Sunday (Israeli week start)
    sunday.setDate(today.getDate() - dayOfWeek);
    return sunday;
  });

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Fetch orders
  const { data: orders = [], refetch: refetchOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['calendar-orders'],
    queryFn: async () => {
      console.log('Fetching orders for calendar...');
      const { data, error } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, address, city, totalorder, schedule_id, icecream, customernumber, agentnumber, orderdate, invoicenumber')
        .order('ordernumber', { ascending: false });
      
      if (error) throw error;
      console.log('Calendar orders fetched:', data);
      return data as Order[];
    }
  });

  // Fetch returns
  const { data: returns = [], refetch: refetchReturns, isLoading: returnsLoading } = useQuery({
    queryKey: ['calendar-returns'],
    queryFn: async () => {
      console.log('Fetching returns for calendar...');
      const { data, error } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername, address, city, totalreturn, schedule_id, icecream, customernumber, agentnumber, returndate')
        .order('returnnumber', { ascending: false });
      
      if (error) throw error;
      console.log('Calendar returns fetched:', data);
      return data as Return[];
    }
  });

  // Fetch distribution groups
  const { data: distributionGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['calendar-distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups for calendar...');
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('groups_id, separation');
      
      if (error) throw error;
      console.log('Calendar distribution groups fetched:', data);
      return data as DistributionGroup[];
    }
  });

  // Fetch distribution schedules with driver_id, dis_number, and done_schedule
  const { data: distributionSchedules = [], refetch: refetchSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['calendar-distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching distribution schedules for calendar...');
      const { data, error } = await supabase
        .from('distribution_schedule')
        .select('schedule_id, groups_id, create_at_schedule, distribution_date, destinations, driver_id, dis_number, done_schedule');
      
      if (error) throw error;
      console.log('Calendar distribution schedules fetched:', data);
      return data as DistributionSchedule[];
    }
  });

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['calendar-drivers'],
    queryFn: async () => {
      console.log('Fetching drivers for calendar...');
      const { data, error } = await supabase
        .from('nahagim')
        .select('id, nahag')
        .order('nahag');
      
      if (error) throw error;
      console.log('Calendar drivers fetched:', data);
      return data as Driver[];
    }
  });

  // Update destinations count immediately when orders/returns change
  useEffect(() => {
    const updateAllDestinationsCount = async () => {
      // Only update for schedules that have assigned items
      const schedulesWithItems = distributionSchedules.filter(schedule => {
        const hasOrders = orders.some(order => order.schedule_id === schedule.schedule_id);
        const hasReturns = returns.some(returnItem => returnItem.schedule_id === schedule.schedule_id);
        return hasOrders || hasReturns;
      });

      for (const schedule of schedulesWithItems) {
        const scheduleOrders = orders.filter(order => order.schedule_id === schedule.schedule_id);
        const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === schedule.schedule_id);
        
        const uniqueCustomers = new Set([
          ...scheduleOrders.map(order => order.customername),
          ...scheduleReturns.map(returnItem => returnItem.customername)
        ]);

        // Update destinations count immediately if it has changed
        if (schedule.destinations !== uniqueCustomers.size) {
          try {
            const { error } = await supabase
              .from('distribution_schedule')
              .update({ destinations: uniqueCustomers.size })
              .eq('schedule_id', schedule.schedule_id);
            
            if (error) {
              console.error('Error updating destinations count:', error);
            } else {
              console.log(`Updated destinations for schedule ${schedule.schedule_id}: ${uniqueCustomers.size}`);
              // Immediately refetch schedules to update the UI
              refetchSchedules();
            }
          } catch (error) {
            console.error('Error updating destinations count:', error);
          }
        }
      }
    };

    if (distributionSchedules.length > 0 && (orders.length > 0 || returns.length > 0)) {
      updateAllDestinationsCount();
    }
  }, [orders, returns, distributionSchedules, refetchSchedules]);

  const handleDropToDate = async (scheduleId: number, date: Date) => {
    try {
      console.log('Dropping schedule', scheduleId, 'to date', date);
      
      // Build date string directly from date components to avoid timezone issues
      // This ensures the exact date displayed is what gets saved
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      console.log('Date being saved to database:', dateString);
      console.log('Original date object:', date);
      console.log('Display format:', `${day}/${month}`);
      
      // Calculate unique destinations count for this schedule
      const scheduleOrders = orders.filter(order => order.schedule_id === scheduleId);
      const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === scheduleId);
      
      const uniqueCustomers = new Set([
        ...scheduleOrders.map(order => order.customername),
        ...scheduleReturns.map(returnItem => returnItem.customername)
      ]);

      const { error } = await supabase
        .from('distribution_schedule')
        .update({ 
          distribution_date: dateString,
          destinations: uniqueCustomers.size
        })
        .eq('schedule_id', scheduleId);
      
      if (error) {
        console.error('Error updating schedule date:', error);
        throw error;
      }
      
      console.log('Schedule date updated successfully to:', dateString);
      refetchSchedules();
    } catch (error) {
      console.error('Error updating schedule date:', error);
    }
  };

  const handleDropToKanban = async (scheduleId: number) => {
    try {
      console.log('Returning schedule', scheduleId, 'to kanban');
      
      const { error } = await supabase
        .from('distribution_schedule')
        .update({ distribution_date: null })
        .eq('schedule_id', scheduleId);
      
      if (error) {
        console.error('Error returning schedule to kanban:', error);
        throw error;
      }
      
      console.log('Schedule returned to kanban successfully');
      refetchSchedules();
    } catch (error) {
      console.error('Error returning schedule to kanban:', error);
    }
  };

  // Add function to update destinations count when items are removed
  const updateDestinationsCount = async (scheduleId: number) => {
    try {
      const scheduleOrders = orders.filter(order => order.schedule_id === scheduleId);
      const scheduleReturns = returns.filter(returnItem => returnItem.schedule_id === scheduleId);
      
      const uniqueCustomers = new Set([
        ...scheduleOrders.map(order => order.customername),
        ...scheduleReturns.map(returnItem => returnItem.customername)
      ]);

      const { error } = await supabase
        .from('distribution_schedule')
        .update({ destinations: uniqueCustomers.size })
        .eq('schedule_id', scheduleId);
      
      if (error) {
        console.error('Error updating destinations count:', error);
        throw error;
      }
      
      console.log('Destinations count updated successfully');
      refetchSchedules();
    } catch (error) {
      console.error('Error updating destinations count:', error);
    }
  };

  const navigateWeeks = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 14 : -14));
    setCurrentWeekStart(newDate);
  };

  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading || driversLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-6 bg-background">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">לוח שנה הפצה</h1>
          <Button 
            onClick={() => navigate('/distribution')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה לממשק הפצה
          </Button>
        </div>

        {/* Horizontal Kanban */}
        <HorizontalKanban
          distributionSchedules={distributionSchedules}
          distributionGroups={distributionGroups}
          drivers={drivers}
          orders={orders}
          returns={returns}
          onUpdateDestinations={updateDestinationsCount}
          onDropToKanban={handleDropToKanban}
        />

        {/* Calendar Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button 
            onClick={() => navigateWeeks('prev')}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
            שבועיים אחורה
          </Button>
          
          <span className="text-lg font-medium">
            {currentWeekStart.toLocaleDateString('he-IL')} - {
              new Date(currentWeekStart.getTime() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')
            }
          </span>
          
          <Button 
            onClick={() => navigateWeeks('next')}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
            שבועיים קדימה
          </Button>
        </div>

        {/* Calendar Grid */}
        <CalendarGrid
          currentWeekStart={currentWeekStart}
          distributionSchedules={distributionSchedules}
          distributionGroups={distributionGroups}
          drivers={drivers}
          orders={orders}
          returns={returns}
          onDropToDate={handleDropToDate}
        />
      </div>
    </DndProvider>
  );
};

export default Calendar;
