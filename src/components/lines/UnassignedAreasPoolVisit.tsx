import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getAreaColor } from '@/utils/areaColors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface UnassignedAreasPoolVisitProps {
  distributionGroups: DistributionGroup[];
  onAreaDrop: (area: string, day: string | null) => void;
}

const AreaBadge: React.FC<{
  area: string;
  totalsupplyspots_barelcandy: number | null;
  totalsupplyspots: number | null;
  totalsupplyspots_candy: number | null;
  agentsworkarea: number[] | null;
}> = ({ area, totalsupplyspots_barelcandy, totalsupplyspots, totalsupplyspots_candy }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'area-visit',
    item: { area, sourceType: 'pool', type: 'area-visit' },
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="mr-2 bg-white/90 text-gray-800 font-bold cursor-help">
              {totalsupplyspots_barelcandy}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div>בראל: {totalsupplyspots || 0}</div>
              <div>קנדי: {totalsupplyspots_candy || 0}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export const UnassignedAreasPoolVisit: React.FC<UnassignedAreasPoolVisitProps> = ({
  distributionGroups,
  onAreaDrop,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'area-visit',
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
    .filter((group) => !group.dayvisit || group.dayvisit.length === 0)
    .map((group) => ({
      area: group.separation,
      orderlabelinkavim: group.orderlabelinkavim || 0,
      totalsupplyspots_barelcandy: group.totalsupplyspots_barelcandy,
      totalsupplyspots: group.totalsupplyspots,
      totalsupplyspots_candy: group.totalsupplyspots_candy,
      agentsworkarea: group.agentsworkarea,
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">מאגר אזורים (ביקורים)</CardTitle>
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
                  agentsworkarea={item.agentsworkarea}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
