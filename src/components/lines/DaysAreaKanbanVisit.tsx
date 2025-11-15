import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X } from 'lucide-react';
import { getAreaColor } from '@/utils/areaColors';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  dayvisit: string[] | null;
  orderlabelinkavim: number | null;
  totalsupplyspots_barelcandy: number | null;
  totalsupplyspots: number | null;
  totalsupplyspots_candy: number | null;
  agentsworkarea: number[] | null;
}

interface DaysAreaKanbanVisitProps {
  distributionGroups: DistributionGroup[];
  onAreaDrop: (area: string, day: string | null) => void;
}

const AreaTag: React.FC<{
  area: string;
  day: string;
  totalsupplyspots_barelcandy: number | null;
  totalsupplyspots: number | null;
  totalsupplyspots_candy: number | null;
  agentsworkarea: number[] | null;
  onRemove: () => void;
}> = ({ area, day, totalsupplyspots_barelcandy, totalsupplyspots, totalsupplyspots_candy, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'area-visit',
    item: { area, day, sourceType: 'day', type: 'area-visit' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const colorClass = getAreaColor(area);

  return (
    <div
      ref={drag}
      className={`relative flex items-center justify-between text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${colorClass}`}
    >
      <div className="flex items-center gap-2 flex-1">
        <span className="font-medium">{area}</span>
        {totalsupplyspots_barelcandy !== null && totalsupplyspots_barelcandy > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="secondary" className="bg-white/90 text-gray-800 font-bold cursor-pointer">
                {totalsupplyspots_barelcandy}
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="top">
              <div className="text-sm space-y-1">
                <div>בראל: {totalsupplyspots || 0}</div>
                <div>קנדי: {totalsupplyspots_candy || 0}</div>
              </div>
            </PopoverContent>
          </Popover>
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
  areas: {
    area: string;
    totalsupplyspots_barelcandy: number | null;
    totalsupplyspots: number | null;
    totalsupplyspots_candy: number | null;
    agentsworkarea: number[] | null;
  }[];
  onDrop: (area: string, day: string) => void;
  onRemove: (area: string) => void;
}> = ({ day, dayName, areas, onDrop, onRemove }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'area-visit',
    drop: (item: { area: string; day?: string; sourceType: string }) => {
      onDrop(item.area, day);
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
          {areas.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-8">
              אין אזורים מוקצים
            </div>
          ) : (
            areas.map((item) => (
              <AreaTag
                key={item.area}
                area={item.area}
                day={day}
                totalsupplyspots_barelcandy={item.totalsupplyspots_barelcandy}
                totalsupplyspots={item.totalsupplyspots}
                totalsupplyspots_candy={item.totalsupplyspots_candy}
                agentsworkarea={item.agentsworkarea}
                onRemove={() => onRemove(item.area)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const DaysAreaKanbanVisit: React.FC<DaysAreaKanbanVisitProps> = ({
  distributionGroups,
  onAreaDrop,
}) => {
  const days = ['א', 'ב', 'ג', 'ד', 'ה'];
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

  const getAreasForDay = (targetDay: string) => {
    return distributionGroups
      .filter(
        (group) =>
          group.dayvisit &&
          group.dayvisit.length > 0 &&
          group.dayvisit.includes(targetDay)
      )
      .map((group) => ({
        area: group.separation,
        totalsupplyspots_barelcandy: group.totalsupplyspots_barelcandy,
        totalsupplyspots: group.totalsupplyspots,
        totalsupplyspots_candy: group.totalsupplyspots_candy,
        agentsworkarea: group.agentsworkarea,
      }));
  };

  const handleDrop = (area: string, day: string) => {
    onAreaDrop(area, day);
  };

  const handleRemove = (area: string) => {
    onAreaDrop(area, null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">שיוך אזורים לימי ביקור</h3>
      <div className="grid grid-cols-5 gap-4" dir="rtl">
        {days.map((day, index) => (
          <DayColumn
            key={day}
            day={day}
            dayName={dayNames[index]}
            areas={getAreasForDay(day)}
            onDrop={handleDrop}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
};
