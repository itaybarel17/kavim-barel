import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getAreaColor } from '@/utils/areaColors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  dayvisit: string[] | null;
  orderlabelinkavim: number | null;
  totalsupplyspots: number | null;
  agentsworkarea: number[] | null;
}

interface UnassignedAreasPoolVisitProps {
  distributionGroups: DistributionGroup[];
  onAreaDrop: (area: string, day: string | null) => void;
}

const AreaBadge: React.FC<{
  area: string;
  totalsupplyspots: number | null;
  agentsworkarea: number[] | null;
}> = ({ area, totalsupplyspots, agentsworkarea }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'area-visit',
    item: { area, sourceType: 'pool', type: 'area-visit' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const colorClass = getAreaColor(area);

  const getAgentNumbers = () => {
    if (!agentsworkarea || !Array.isArray(agentsworkarea) || agentsworkarea.length === 0) return '';
    return ` (${agentsworkarea.join(', ')})`;
  };

  return (
    <div
      ref={drag}
      className={`${colorClass} px-4 py-2 rounded-md cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:scale-105'
      }`}
    >
      <span className="font-medium">
        {area}{getAgentNumbers()}
        {totalsupplyspots !== null && totalsupplyspots > 0 && (
          <span className="text-xs opacity-75 mr-1"> ({totalsupplyspots})</span>
        )}
      </span>
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
      totalsupplyspots: group.totalsupplyspots,
      agentsworkarea: group.agentsworkarea,
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  return (
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
                totalsupplyspots={item.totalsupplyspots}
                agentsworkarea={item.agentsworkarea}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
