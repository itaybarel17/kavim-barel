import React from 'react';
import { AreaTagVisit } from './AreaTagVisit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  dayvisit: string[] | null;
  freq: number[] | null;
  orderlabelinkavim: number | null;
  agentsworkarea: number[] | null;
  totalsupplyspots: number | null;
}

interface AreaPoolVisitProps {
  distributionGroups: DistributionGroup[];
  onAreaAssign: (area: string, day: string) => void;
}

export const AreaPoolVisit: React.FC<AreaPoolVisitProps> = ({
  distributionGroups,
  onAreaAssign
}) => {
  // Get all areas with their order, agents, and totalsupplyspots
  const areasWithOrder = distributionGroups
    .filter(group => group.separation)
    .map(group => ({
      area: group.separation!,
      orderlabelinkavim: group.orderlabelinkavim || 0,
      agentsworkarea: group.agentsworkarea,
      totalsupplyspots: group.totalsupplyspots || 0
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">מאגר אזורים (ביקורים)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {areasWithOrder.map((areaItem) => (
            <AreaTagVisit
              key={areaItem.area}
              area={areaItem.area}
              day=""
              onRemove={() => {}}
              isInPool={true}
              agentsWorkArea={areaItem.agentsworkarea}
              totalsupplyspots={areaItem.totalsupplyspots}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
