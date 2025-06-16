import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCard } from './CalendarCard';
import { ProductionDialog } from './ProductionDialog';
import { Play } from 'lucide-react';
import { OrderWithSchedule, ReturnWithSchedule } from '@/utils/scheduleUtils';
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
}
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
}> = ({
  date,
  schedulesForDate,
  distributionGroups,
  drivers,
  orders,
  returns,
  onDropToDate,
  onProductionDialogOpen,
  currentUser
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

  // Hide production button for Agent 99
  const shouldShowProductionButton = schedulesForDate.length > 0 && currentUser?.agentnumber !== "99";
  return <Card ref={drop} className={`p-3 min-h-[250px] border-2 border-dashed ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <div className="font-medium text-sm">{dayNames[date.getDay()]}</div>
          <div className="text-xs text-gray-500">{dateStr}</div>
        </div>
        {/* Show production button to all users except Agent 99 when there are schedules */}
        {shouldShowProductionButton && <Button size="sm" variant="outline" onClick={() => onProductionDialogOpen(date)} className="flex items-center gap-1 text-xs px-2 py-1 h-6">
            <Play className="h-3 w-3" />
            הפקה
          </Button>}
      </div>
      <div className="space-y-2">
        {schedulesForDate.map(schedule => <CalendarCard key={schedule.schedule_id} scheduleId={schedule.schedule_id} groupId={schedule.groups_id} distributionGroups={distributionGroups} drivers={drivers} orders={orders} returns={returns} driverId={schedule.driver_id} showAllCustomers={true} isCalendarMode={true} schedule={schedule} currentUser={currentUser} />)}
      </div>
    </Card>;
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
  onRefreshData
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
