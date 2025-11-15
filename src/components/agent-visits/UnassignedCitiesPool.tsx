import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAreaColor } from '@/utils/areaColors';

interface CitySchedule {
  id: string;
  city: string;
  agentnumber: string;
  visit_day: string | null;
  customer_count: number;
  averagesupplyweek?: number;
}

interface UnassignedCitiesPoolProps {
  cities: CitySchedule[];
  onCityDrop: (city: string, day: string | null) => void;
  cityAreaMap: Map<string, string>;
}

const CityBadge: React.FC<{
  city: string;
  customer_count: number;
  averagesupplyweek?: number;
  areaColor: string;
}> = ({ city, customer_count, averagesupplyweek, areaColor }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'city-visit-calendar',
    item: { city, sourceType: 'pool', type: 'city-visit-calendar' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`relative flex flex-col gap-1 text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${areaColor} hover:opacity-90`}
    >
      <span className="font-medium">{city}</span>
      <div className="flex gap-2">
        {customer_count > 0 && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 bg-white/95 text-gray-900 font-bold">
            {customer_count}
          </Badge>
        )}
        {averagesupplyweek !== undefined && averagesupplyweek > 0 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 bg-white/95 text-gray-900 border-gray-300 font-bold">
            {averagesupplyweek.toFixed(1)}
          </Badge>
        )}
      </div>
    </div>
  );
};

export const UnassignedCitiesPool: React.FC<UnassignedCitiesPoolProps> = ({
  cities,
  onCityDrop,
  cityAreaMap,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'city-visit-calendar',
    drop: (item: { city: string; sourceType: string; type: string }) => {
      if (item.sourceType === 'day') {
        onCityDrop(item.city, null);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const unassignedCities = cities
    .filter((c) => !c.visit_day)
    .sort((a, b) => b.customer_count - a.customer_count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">מאגר ערים (ביקור)</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={drop}
          className={`flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg transition-colors ${
            isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/30'
          }`}
        >
          {unassignedCities.length === 0 ? (
            <div className="text-muted-foreground text-sm w-full text-center py-4">
              כל הערים משויכות לימים
            </div>
          ) : (
            unassignedCities.map((item) => {
              const area = cityAreaMap.get(item.city);
              const areaColor = area ? getAreaColor(area) : 'bg-gray-400 text-white';
              return (
                <CityBadge
                  key={item.id}
                  city={item.city}
                  customer_count={item.customer_count}
                  averagesupplyweek={item.averagesupplyweek}
                  areaColor={areaColor}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
