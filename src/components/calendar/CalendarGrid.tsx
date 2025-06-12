import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCard } from './CalendarCard';
import { ProductionDialog } from './ProductionDialog';
import { Play } from 'lucide-react';

interface Order {
  ordernumber: number;
  customername: string;
  totalorder: number;
  schedule_id?: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  totalreturn: number;
  schedule_id?: number;
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

interface CalendarGridProps {
  currentWeekStart: Date;
  distributionSchedules: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: Order[];
  returns: Return[];
  onDropToDate: (scheduleId: number, date: Date) => void;
}

const CalendarDay: React.FC<{
  date: Date;
  schedulesForDate: DistributionSchedule[];
  distributionGroups: DistributionGroup[];
  drivers: Driver[];
  orders: Order[];
  returns: Return[];
  onDropToDate: (scheduleId: number, date: Date) => void;
  onProductionDialogOpen: (date: Date) => void;
}> = ({ 
  date, 
  schedulesForDate, 
  distributionGroups, 
  drivers, 
  orders, 
  returns, 
  onDropToDate,
  onProductionDialogOpen
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'calendar-card',
    drop: (item: { scheduleId: number }) => {
      onDropToDate(item.scheduleId, date);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const dayName = dayNames[date.getDay()];
  const dateStr = date.getDate().toString().padStart(2, '0') + '/' + (date.getMonth() + 1).toString().padStart(2, '0');

  return (
    <Card
      ref={drop}
      className={`p-3 min-h-[250px] border-2 border-dashed ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <div className="font-medium text-sm">{dayName}</div>
          <div className="text-xs text-gray-500">{dateStr}</div>
        </div>
        {schedulesForDate.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onProductionDialogOpen(date)}
            className="flex items-center gap-1 text-xs px-2 py-1 h-6"
          >
            <Play className="h-3 w-3" />
            הפקה
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {schedulesForDate.map((schedule) => (
          <CalendarCard
            key={schedule.schedule_id}
            scheduleId={schedule.schedule_id}
            groupId={schedule.groups_id}
            distributionGroups={distributionGroups}
            drivers={drivers}
            orders={orders}
            returns={returns}
            driverId={schedule.driver_id}
            showAllCustomers={true}
            isCalendarMode={true}
          />
        ))}
      </div>
    </Card>
  );
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentWeekStart,
  distributionSchedules,
  distributionGroups,
  drivers,
  orders,
  returns,
  onDropToDate
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
  // Israeli work week: Sunday (leftmost) to Friday (rightmost) - natural order
  const firstWeekDays = allDays.slice(0, 6); // Sunday to Friday of first week
  const secondWeekDays = allDays.slice(6, 12); // Sunday to Friday of second week

  // Group schedules by date
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return distributionSchedules.filter(schedule => schedule.distribution_date === dateStr);
  };

  const handleProductionDialogOpen = (date: Date) => {
    setSelectedDate(date);
    setProductionDialogOpen(true);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">לוח שנה - שבועיים</h2>
      
      {/* Week 1 - Israeli work week: Sunday (leftmost) to Friday (rightmost) */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {firstWeekDays.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            schedulesForDate={getSchedulesForDate(date)}
            distributionGroups={distributionGroups}
            drivers={drivers}
            orders={orders}
            returns={returns}
            onDropToDate={onDropToDate}
            onProductionDialogOpen={handleProductionDialogOpen}
          />
        ))}
      </div>

      {/* Week 2 - Israeli work week: Sunday (leftmost) to Friday (rightmost) */}
      <div className="grid grid-cols-6 gap-4">
        {secondWeekDays.map((date, index) => (
          <CalendarDay
            key={index + 6}
            date={date}
            schedulesForDate={getSchedulesForDate(date)}
            distributionGroups={distributionGroups}
            drivers={drivers}
            orders={orders}
            returns={returns}
            onDropToDate={onDropToDate}
            onProductionDialogOpen={handleProductionDialogOpen}
          />
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
        onProduced={() => {
          // Trigger a refresh of the data if needed
          window.location.reload();
        }}
      />
    </div>
  );
};
