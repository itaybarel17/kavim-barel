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
  totalsupplyspots: number | null;
}

interface UnassignedAreasPoolProps {
  distributionGroups: DistributionGroup[];
  onAreaDrop: (area: string, day: string | null) => void;
}

const AreaBadge: React.FC<{
  area: string;
  totalsupplyspots: number | null;
}> = ({ area, totalsupplyspots }) => {
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
      className={`${colorClass} px-4 py-2 rounded-md cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:scale-105'
      }`}
    >
      <span className="font-medium">
        {area}
        {totalsupplyspots !== null && totalsupplyspots > 0 && (
          <span className="text-xs opacity-75 mr-1"> ({totalsupplyspots})</span>
        )}
      </span>
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
      totalsupplyspots: group.totalsupplyspots,
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  console.log('UnassignedAreasPool - distributionGroups:', distributionGroups);
  console.log('UnassignedAreasPool - unassignedAreas:', unassignedAreas);

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
                totalsupplyspots={item.totalsupplyspots}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
