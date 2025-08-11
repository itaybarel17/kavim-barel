import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarCard } from './CalendarCard';
import { ProductionDialog } from './ProductionDialog';
import { Play } from 'lucide-react';
import { OrderWithSchedule, ReturnWithSchedule } from '@/utils/scheduleUtils';
import { getAreaColor, getMainAreaFromSeparation } from '@/utils/areaColors';
interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[];
  agents?: number[] | string;
  totalsupplyspots?: number | null;
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
interface CalendarGridProps {
  currentWeekStart: Date;
  distributionSchedules: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: OrderWithSchedule[];
  returns: ReturnWithSchedule[];
  onDropToDate: (scheduleId: number, date: Date) => void;
  currentUser?: {
    agentnumber: string;
    agentname: string;
  };
  onRefreshData?: () => void;
  customerReplacementMap?: Map<string, any>;
  selectedAgent?: string;
}

// Helper functions for day mapping
const getDayNumberFromHebrew = (hebrewLetter: string): number => {
  const dayMap: Record<string, number> = {
    'א': 0, // Sunday
    'ב': 1, // Monday 
    'ג': 2, // Tuesday
    'ד': 3, // Wednesday
    'ה': 4, // Thursday
    'ו': 5, // Friday
    'ש': 6  // Saturday
  };
  return dayMap[hebrewLetter] ?? -1;
};

const getAreasForDay = (distributionGroups: DistributionGroup[], dayNumber: number): DistributionGroup[] => {
  return distributionGroups.filter(group => {
    if (!group.days || !Array.isArray(group.days)) return false;
    
    // Check if any of the days match our target day
    return group.days.some(dayEntry => {
      // Each dayEntry might be a single letter or multiple letters separated by commas
      const individualDays = dayEntry.split(',').map(d => d.trim());
      return individualDays.some(day => getDayNumberFromHebrew(day) === dayNumber);
    });
  });
};
const CalendarDay: React.FC<{
  date: Date;
  schedulesForDate: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: OrderWithSchedule[];
  returns: ReturnWithSchedule[];
  onDropToDate: (scheduleId: number, date: Date) => void;
  onProductionDialogOpen: (date: Date) => void;
  currentUser?: {
    agentnumber: string;
    agentname: string;
  };
  customerReplacementMap?: Map<string, any>;
  selectedAgent?: string;
  
}> = ({
  date,
  schedulesForDate,
  distributionGroups,
  drivers,
  orders,
  returns,
  onDropToDate,
  onProductionDialogOpen,
  currentUser,
  customerReplacementMap,
  selectedAgent,
}) => {
  // Only admin can drop
  const isAdmin = currentUser?.agentnumber === "4";
  const [{
    isOver
  }, drop] = useDrop(() => ({
    accept: isAdmin ? 'calendar-card' : [],
    drop: (item: {
      scheduleId: number;
    }) => {
      if (!isAdmin) return;
      const schedule = schedulesForDate.find(s => s.schedule_id === item.scheduleId);
      if (schedule?.done_schedule != null) {
        console.log('Cannot drop produced schedule');
        return;
      }
      onDropToDate(item.scheduleId, date);
    },
    collect: monitor => ({
      isOver: isAdmin && monitor.isOver()
    })
  }), [isAdmin, onDropToDate, date, schedulesForDate]);
  const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const dateStr = date.getDate().toString().padStart(2, '0') + '/' + (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateForComparison = `${year}-${month}-${day}`;

  // Show production button when there are schedules
  const shouldShowProductionButton = schedulesForDate.length > 0;
  
  // Get areas for this specific day
  const allAreasForDay = getAreasForDay(distributionGroups, date.getDay());
  
  // Filter areas shown based on user permissions and selected agent
  const areasForDay = allAreasForDay.filter(area => {
    if (currentUser?.agentnumber === "4") {
      // Admin can filter by selected agent using actual orders/returns
      if (selectedAgent && selectedAgent !== '4') {
        // Check if this area has any schedules with actual orders/returns for selected agent
        const areaSchedules = schedulesForDate.filter(s => s.groups_id === area.groups_id);
        return areaSchedules.some(schedule => {
          return orders.some(order => {
            const relevantScheduleIds = [];
            if (typeof order.schedule_id === 'number') relevantScheduleIds.push(order.schedule_id);
            if (order.schedule_id_if_changed) {
              if (typeof order.schedule_id_if_changed === 'number') {
                relevantScheduleIds.push(order.schedule_id_if_changed);
              } else if (Array.isArray(order.schedule_id_if_changed)) {
                order.schedule_id_if_changed.forEach(sid => {
                  if (typeof sid === 'number') relevantScheduleIds.push(sid);
                });
              } else if (typeof order.schedule_id_if_changed === 'object' && order.schedule_id_if_changed.schedule_id) {
                relevantScheduleIds.push(order.schedule_id_if_changed.schedule_id);
              }
            }
            return relevantScheduleIds.includes(schedule.schedule_id) && order.agentnumber === selectedAgent;
          }) || returns.some(returnItem => {
            const relevantScheduleIds = [];
            if (typeof returnItem.schedule_id === 'number') relevantScheduleIds.push(returnItem.schedule_id);
            if (returnItem.schedule_id_if_changed) {
              if (typeof returnItem.schedule_id_if_changed === 'number') {
                relevantScheduleIds.push(returnItem.schedule_id_if_changed);
              } else if (Array.isArray(returnItem.schedule_id_if_changed)) {
                returnItem.schedule_id_if_changed.forEach(sid => {
                  if (typeof sid === 'number') relevantScheduleIds.push(sid);
                });
              } else if (typeof returnItem.schedule_id_if_changed === 'object' && returnItem.schedule_id_if_changed.schedule_id) {
                relevantScheduleIds.push(returnItem.schedule_id_if_changed.schedule_id);
              }
            }
            return relevantScheduleIds.includes(schedule.schedule_id) && returnItem.agentnumber === selectedAgent;
          });
        });
      }
      return true; // Show all when "משרד" is selected
    }
    
    if (!area.agents) return false;
    const agents = Array.isArray(area.agents) ? area.agents : 
      typeof area.agents === 'string' ? JSON.parse(area.agents) : [];
    return agents.includes(parseInt(currentUser?.agentnumber || "0"));
  });
  
  return (
    <div className="space-y-1">
      {/* Areas box for this day - always shown with fixed height */}
      <Card className="p-2 bg-white border border-gray-200 shadow-sm h-[128px]">
        <div className="flex flex-col gap-1">
          {areasForDay.map((group, index) => {
            const areaName = getMainAreaFromSeparation(group.separation);
            const areaColorClass = getAreaColor(areaName);
            return (
              <Badge 
                key={index}
                className={`${areaColorClass} text-xs px-2 py-1 font-bold border rounded-sm`}
              >
                {group.separation}
                <span className="text-xs ml-1 opacity-75">
                  ({group.totalsupplyspots || 0})
                </span>
              </Badge>
            );
          })}
        </div>
      </Card>
      
      {/* Main day card */}
      <Card ref={drop} className={`p-3 min-h-[250px] border-2 border-dashed ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <div className="font-medium text-sm">{dayNames[date.getDay()]}</div>
            <div className="text-xs text-gray-500">{dateStr}</div>
          </div>
          {/* Show production button when there are schedules */}
          {shouldShowProductionButton && <Button size="sm" variant="outline" onClick={() => onProductionDialogOpen(date)} className="flex items-center gap-1 text-xs px-2 py-1 h-6">
              <Play className="h-3 w-3" />
              הפקה
            </Button>}
        </div>
        <div className="space-y-2">
          {schedulesForDate.map(schedule => <CalendarCard key={schedule.schedule_id} scheduleId={schedule.schedule_id} groupId={schedule.groups_id} distributionGroups={distributionGroups} drivers={drivers} orders={orders} returns={returns} driverId={schedule.driver_id} showAllCustomers={true} isCalendarMode={true} schedule={schedule} currentUser={currentUser} customerReplacementMap={customerReplacementMap} selectedAgent={selectedAgent}  />)}
        </div>
      </Card>
    </div>
  );
};
export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentWeekStart,
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns,
  onDropToDate,
  currentUser,
  onRefreshData,
  customerReplacementMap,
  selectedAgent,
  
}) => {
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate Israeli work week days (Sunday to Friday) for 2 weeks
  const getWorkDaysForTwoWeeks = () => {
    const days = [];

    // First week - Sunday to Friday
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);

      // Only include Sunday (0) through Friday (5)
      if (date.getDay() >= 0 && date.getDay() <= 5) {
        days.push(date);
      }
    }

    // Second week - Sunday to Friday
    for (let i = 7; i < 14; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);

      // Only include Sunday (0) through Friday (5)
      if (date.getDay() >= 0 && date.getDay() <= 5) {
        days.push(date);
      }
    }
    return days;
  };
  const allDays = getWorkDaysForTwoWeeks();
  console.log('All days generated:', allDays.map(d => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return {
      dayOfWeek: d.getDay(),
      dateStr: dateStr,
      displayStr: day + '/' + month
    };
  }));
  const firstWeekDays = allDays.slice(0, 6);
  const secondWeekDays = allDays.slice(6, 12);

  // Group schedules by date - using consistent date string building
  const getSchedulesForDate = (date: Date) => {
    // Build date string consistently using date components (avoiding toISOString timezone issues)
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log('getSchedulesForDate - comparing dateStr:', dateStr);
    const filteredSchedules = distributionSchedules.filter(schedule => {
      console.log('  schedule.distribution_date:', schedule.distribution_date);
      return schedule.distribution_date === dateStr;
    });
    console.log('  filtered schedules count:', filteredSchedules.length);
    return filteredSchedules;
  };
  const handleProductionDialogOpen = (date: Date) => {
    setSelectedDate(date);
    setProductionDialogOpen(true);
  };
  const handleProduced = () => {
    // Simply call the refresh function instead of reloading the page
    if (onRefreshData) {
      onRefreshData();
    }
  };
  return (
    <div className="space-y-6">
      <h2 className="text-lg lg:text-xl font-semibold text-gray-700 px-2 lg:px-0">
        לוח שנה - שבועיים
      </h2>
      
      {/* Week 1 - Mobile: single column, Desktop: 6 columns */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-6 lg:gap-4" dir="rtl">
        {firstWeekDays.map((date, index) => (
          <div key={`week1-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`} className="w-full">
            <CalendarDay 
              date={date}
              schedulesForDate={getSchedulesForDate(date)}
              distributionGroups={distributionGroups}
              drivers={drivers}
              orders={orders}
              returns={returns}
              onDropToDate={onDropToDate}
              onProductionDialogOpen={handleProductionDialogOpen}
              currentUser={currentUser}
              customerReplacementMap={customerReplacementMap}
              selectedAgent={selectedAgent}
            />
          </div>
        ))}
      </div>

      {/* Week 2 - Mobile: single column, Desktop: 6 columns */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-6 lg:gap-4" dir="rtl">
        {secondWeekDays.map((date, index) => (
          <div key={`week2-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`} className="w-full">
            <CalendarDay 
              date={date}
              schedulesForDate={getSchedulesForDate(date)}
              distributionGroups={distributionGroups}
              drivers={drivers}
              orders={orders}
              returns={returns}
              onDropToDate={onDropToDate}
              onProductionDialogOpen={handleProductionDialogOpen}
              currentUser={currentUser}
              customerReplacementMap={customerReplacementMap}
              selectedAgent={selectedAgent}
            />
          </div>
        ))}
      </div>

      <ProductionDialog 
        isOpen={productionDialogOpen}
        onClose={() => setProductionDialogOpen(false)}
        selectedDate={selectedDate}
        distributionSchedules={distributionSchedules}
        distributionGroups={distributionGroups}
        drivers={drivers}
        orders={orders}
        returns={returns}
        onProduced={handleProduced}
        currentUser={currentUser}
      />
    </div>
  );
};
