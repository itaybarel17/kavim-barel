import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getAreaColor } from '@/utils/areaColors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  orderlabelinkavim: number | null;
  totalsupplyspots_barelcandy: number | null;
  totalsupplyspots: number | null;
  totalsupplyspots_candy: number | null;
}

interface UnassignedAreasPoolProps {
  distributionGroups: DistributionGroup[];
  onAreaDrop: (area: string, day: string | null) => void;
}

const AreaBadge: React.FC<{
  area: string;
  totalsupplyspots_barelcandy: number | null;
  totalsupplyspots: number | null;
  totalsupplyspots_candy: number | null;
}> = ({ area, totalsupplyspots_barelcandy, totalsupplyspots, totalsupplyspots_candy }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'area-delivery',
    item: { area, sourceType: 'pool', type: 'area-delivery' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const colorClass = getAreaColor(area);

  return (
    <div
      ref={drag}
      className={`relative inline-flex items-center gap-2 text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${colorClass}`}
    >
      <span className="font-medium">{area}</span>
      {totalsupplyspots_barelcandy !== null && totalsupplyspots_barelcandy > 0 && (
        <div className="flex items-center gap-1">
          <Badge 
            variant="secondary" 
            className="bg-white/90 text-gray-800 font-bold cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            {totalsupplyspots_barelcandy}
          </Badge>
          {showDetails && (
            <span className="text-xs">
              (בראל: {totalsupplyspots || 0}, קנדי: {totalsupplyspots_candy || 0})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const UnassignedAreasPool: React.FC<UnassignedAreasPoolProps> = ({
  distributionGroups,
  onAreaDrop,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'area-delivery',
    drop: (item: { area: string; sourceType: string; type: string }) => {
      if (item.sourceType === 'day') {
        onAreaDrop(item.area, null);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const unassignedAreas = distributionGroups
    .filter((group) => !group.days || group.days.length === 0)
    .map((group) => ({
      area: group.separation,
      orderlabelinkavim: group.orderlabelinkavim || 0,
      totalsupplyspots_barelcandy: group.totalsupplyspots_barelcandy,
      totalsupplyspots: group.totalsupplyspots,
      totalsupplyspots_candy: group.totalsupplyspots_candy,
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">מאגר אזורים (אספקה)</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={drop}
          className={`flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg transition-colors ${
            isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/30'
          }`}
        >
          {unassignedAreas.length === 0 ? (
            <div className="text-muted-foreground text-sm w-full text-center py-4">
              כל האזורים משויכים לימים
            </div>
          ) : (
            unassignedAreas.map((item) => (
              <AreaBadge
                key={item.area}
                area={item.area}
                totalsupplyspots_barelcandy={item.totalsupplyspots_barelcandy}
                totalsupplyspots={item.totalsupplyspots}
                totalsupplyspots_candy={item.totalsupplyspots_candy}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
