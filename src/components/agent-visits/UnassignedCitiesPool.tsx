import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CitySchedule {
  id: string;
  city: string;
  agentnumber: string;
  visit_day: string | null;
  customer_count: number;
}

interface UnassignedCitiesPoolProps {
  cities: CitySchedule[];
  onCityDrop: (city: string, day: string | null) => void;
}

const CityBadge: React.FC<{
  city: string;
  customer_count: number;
}> = ({ city, customer_count }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'city-visit',
    item: { city, sourceType: 'pool', type: 'city-visit' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`relative inline-flex items-center gap-2 text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200`}
    >
      <span className="font-medium">{city}</span>
      {customer_count > 0 && (
        <Badge variant="secondary" className="bg-white/90 text-gray-800 font-bold">
          {customer_count}
        </Badge>
      )}
    </div>
  );
};

export const UnassignedCitiesPool: React.FC<UnassignedCitiesPoolProps> = ({
  cities,
  onCityDrop,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'city-visit',
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
            unassignedCities.map((item) => (
              <CityBadge
                key={item.id}
                city={item.city}
                customer_count={item.customer_count}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
