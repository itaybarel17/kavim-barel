
import React from 'react';
import { useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { CalendarCard } from './CalendarCard';

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
}> = ({ date, schedulesForDate, distributionGroups, drivers, orders, returns, onDropToDate }) => {
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
      <div className="text-center mb-3">
        <div className="font-medium text-sm">{dayName}</div>
        <div className="text-xs text-gray-500">{dateStr}</div>
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
  // Generate 14 days (2 weeks) starting from Monday
  const days = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    
    // Only include Monday-Friday (1-5)
    if (date.getDay() >= 1 && date.getDay() <= 5) {
      days.push(date);
    }
  }

  // Group schedules by date
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return distributionSchedules.filter(schedule => schedule.distribution_date === dateStr);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">לוח שנה - שבועיים</h2>
      
      {/* Week 1 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {days.slice(0, 5).map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            schedulesForDate={getSchedulesForDate(date)}
            distributionGroups={distributionGroups}
            drivers={drivers}
            orders={orders}
            returns={returns}
            onDropToDate={onDropToDate}
          />
        ))}
      </div>

      {/* Week 2 */}
      <div className="grid grid-cols-5 gap-4">
        {days.slice(5, 10).map((date, index) => (
          <CalendarDay
            key={index + 5}
            date={date}
            schedulesForDate={getSchedulesForDate(date)}
            distributionGroups={distributionGroups}
            drivers={drivers}
            orders={orders}
            returns={returns}
            onDropToDate={onDropToDate}
          />
        ))}
      </div>
    </div>
  );
};
