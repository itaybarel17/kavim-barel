import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CitySchedule {
  id: string;
  city: string;
  agentnumber: string;
  visit_day: string | null;
  customer_count: number;
}

interface DaysCityKanbanProps {
  cities: CitySchedule[];
  onCityDrop: (city: string, day: string | null) => void;
}

const CityTag: React.FC<{
  city: string;
  day: string;
  customer_count: number;
  onRemove: () => void;
}> = ({ city, day, customer_count, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'city-visit',
    item: { city, day, sourceType: 'day', type: 'city-visit' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`relative flex items-center justify-between text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200`}
    >
      <div className="flex items-center gap-2 flex-1">
        <span className="font-medium">{city}</span>
        {customer_count > 0 && (
          <Badge variant="secondary" className="bg-white/90 text-gray-800 font-bold">
            {customer_count}
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-4 w-4 p-0 text-current hover:bg-white/20 mr-2"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

const DayColumn: React.FC<{
  day: string;
  dayName: string;
  cities: {
    city: string;
    customer_count: number;
  }[];
  onDrop: (city: string, day: string) => void;
  onRemove: (city: string) => void;
}> = ({ day, dayName, cities, onDrop, onRemove }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'city-visit',
    drop: (item: { city: string; day?: string; sourceType: string }) => {
      onDrop(item.city, day);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center font-bold mb-3 text-lg">{dayName}</div>
        <div
          ref={drop}
          className={`space-y-2 min-h-[120px] p-2 rounded-lg transition-colors ${
            isOver && canDrop
              ? 'bg-primary/10 ring-2 ring-primary/30'
              : 'bg-muted/20'
          }`}
        >
          {cities.length === 0 ? (
            <div className="text-muted-foreground text-xs text-center py-8">
              גרור עיר לכאן
            </div>
          ) : (
            cities.map((cityItem, idx) => (
              <CityTag
                key={`${cityItem.city}-${idx}`}
                city={cityItem.city}
                day={day}
                customer_count={cityItem.customer_count}
                onRemove={() => onRemove(cityItem.city)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const DaysCityKanban: React.FC<DaysCityKanbanProps> = ({
  cities,
  onCityDrop,
}) => {
  const days = [
    { value: 'א', label: 'יום א' },
    { value: 'ב', label: 'יום ב' },
    { value: 'ג', label: 'יום ג' },
    { value: 'ד', label: 'יום ד' },
    { value: 'ה', label: 'יום ה' },
  ];

  const getCitiesForDay = (day: string) => {
    return cities
      .filter((c) => c.visit_day === day)
      .map((c) => ({
        city: c.city,
        customer_count: c.customer_count,
      }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" dir="rtl">
      {days.map((day) => (
        <DayColumn
          key={day.value}
          day={day.value}
          dayName={day.label}
          cities={getCitiesForDay(day.value)}
          onDrop={onCityDrop}
          onRemove={(city) => onCityDrop(city, null)}
        />
      ))}
    </div>
  );
};
