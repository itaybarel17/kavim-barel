import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getAreaColor } from '@/utils/areaColors';

interface CitySchedule {
  id: string;
  city: string;
  agentnumber: string;
  visit_day: string | null;
  customer_count: number;
  averagesupplyweek?: number;
}

interface WeeklyCalendarProps {
  cities: CitySchedule[];
  onCityDrop: (city: string, day: string | null, week: number) => void;
  selectedAgent: string;
}

const CityTag: React.FC<{
  city: string;
  customer_count: number;
  averagesupplyweek?: number;
  areaColor: string;
}> = ({ city, customer_count, averagesupplyweek, areaColor }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'city-visit-calendar',
    item: { city, type: 'city-visit-calendar' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${areaColor}`}
    >
      <div className="font-medium">{city}</div>
      <div className="flex gap-2 mt-1.5">
        {customer_count > 0 && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 bg-white/95 text-gray-900 font-bold">
            לקוחות: {customer_count}
          </Badge>
        )}
        {averagesupplyweek !== undefined && averagesupplyweek > 0 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 bg-white/95 text-gray-900 border-gray-300 font-bold">
            אספקה: {averagesupplyweek.toFixed(1)}
          </Badge>
        )}
      </div>
    </div>
  );
};

const DayCell: React.FC<{
  day: string;
  week: number;
  cities: CitySchedule[];
  onDrop: (city: string, day: string, week: number) => void;
  cityAreaMap: Map<string, string>;
}> = ({ day, week, cities, onDrop, cityAreaMap }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'city-visit-calendar',
    drop: (item: { city: string }) => {
      onDrop(item.city, day, week);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`min-h-[80px] p-2 rounded-lg border transition-colors ${
        isOver && canDrop
          ? 'bg-primary/10 ring-2 ring-primary/30 border-primary'
          : 'bg-muted/20 border-border'
      }`}
    >
      <div className="space-y-1.5">
        {cities.map((cityItem) => {
          const area = cityAreaMap.get(cityItem.city);
          const areaColor = area ? getAreaColor(area) : 'bg-gray-400 text-white';
          return (
            <CityTag
              key={`${cityItem.city}-${week}`}
              city={cityItem.city}
              customer_count={cityItem.customer_count}
              averagesupplyweek={cityItem.averagesupplyweek}
              areaColor={areaColor}
            />
          );
        })}
      </div>
    </div>
  );
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  cities,
  onCityDrop,
  selectedAgent,
}) => {
  const days = [
    { value: 'א', label: 'א' },
    { value: 'ב', label: 'ב' },
    { value: 'ג', label: 'ג' },
    { value: 'ד', label: 'ד' },
    { value: 'ה', label: 'ה' },
  ];

  // Fetch customer data to get area assignments
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-areas', selectedAgent],
    queryFn: async () => {
      if (!selectedAgent) return [];
      const { data, error } = await supabase
        .from('customerlist')
        .select('city, newarea')
        .eq('agentnumber', selectedAgent);
      
      if (error) throw error;
      return data as { city: string; newarea: string | null }[];
    },
    enabled: !!selectedAgent,
  });

  // Create a map of city to area for color coding
  const cityAreaMap = new Map<string, string>();
  customers.forEach(customer => {
    if (customer.newarea && !cityAreaMap.has(customer.city)) {
      cityAreaMap.set(customer.city, customer.newarea);
    }
  });

  const getCitiesForDayAndWeek = (day: string, week: number) => {
    // For now, week 1 is visit_day matching the day, week 2 is empty (future implementation)
    if (week === 1) {
      return cities.filter((c) => c.visit_day === day);
    }
    return [];
  };

  const handleDrop = (city: string, day: string, week: number) => {
    // For now, only support week 1 (current week)
    if (week === 1) {
      onCityDrop(city, day, week);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Week 1 */}
      <div>
        <h4 className="text-sm font-semibold mb-2">שבוע 1</h4>
        <div className="grid grid-cols-5 gap-2">
          {days.map((day) => (
            <div key={`week1-${day.value}`}>
              <div className="text-center font-bold mb-2 text-sm">{day.label}</div>
              <DayCell
                day={day.value}
                week={1}
                cities={getCitiesForDayAndWeek(day.value, 1)}
                onDrop={handleDrop}
                cityAreaMap={cityAreaMap}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Week 2 */}
      <div>
        <h4 className="text-sm font-semibold mb-2">שבוע 2</h4>
        <div className="grid grid-cols-5 gap-2">
          {days.map((day) => (
            <div key={`week2-${day.value}`}>
              <div className="text-center font-bold mb-2 text-sm">{day.label}</div>
              <DayCell
                day={day.value}
                week={2}
                cities={getCitiesForDayAndWeek(day.value, 2)}
                onDrop={handleDrop}
                cityAreaMap={cityAreaMap}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
