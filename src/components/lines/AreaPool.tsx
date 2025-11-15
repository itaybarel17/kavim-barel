import React from 'react';
import { AreaTag } from './AreaTag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  freq: number[] | null;
  orderlabelinkavim: number | null;
  totalsupplyspots: number | null;
}

interface AreaPoolProps {
  distributionGroups: DistributionGroup[];
  onAreaAssign: (area: string, day: string) => void;
}

export const AreaPool: React.FC<AreaPoolProps> = ({
  distributionGroups,
  onAreaAssign
}) => {
  // Get all areas with their order and totalsupplyspots
  const areasWithOrder = distributionGroups
    .filter(group => group.separation)
    .map(group => ({
      area: group.separation!,
      orderlabelinkavim: group.orderlabelinkavim || 0,
      totalsupplyspots: group.totalsupplyspots || 0
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">מאגר אזורים</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {areasWithOrder.map((areaItem) => (
            <AreaTag
              key={areaItem.area}
              area={areaItem.area}
              day=""
              onRemove={() => {}}
              isInPool={true}
              totalsupplyspots={areaItem.totalsupplyspots}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
