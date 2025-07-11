import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MapPin, Package, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapLegendProps {
  totalPoints: number;
  ordersCount: number;
  returnsCount: number;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  totalPoints,
  ordersCount,
  returnsCount
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Card className={`absolute ${isMobile ? 'top-2 left-2 right-2' : 'top-4 left-4'} z-10 shadow-lg ${isCollapsed ? 'w-auto' : isMobile ? 'w-auto' : 'min-w-64'}`}>
      <CardHeader className={`pb-2 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isMobile ? 'text-sm' : 'text-base'}`}>
            {isCollapsed ? 'מקרא' : 'מקרא המפה'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className={`${isMobile ? 'p-3 pt-0' : 'p-4 pt-0'} space-y-3`}>
          {/* Statistics */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-3'}`}>
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-500" size={isMobile ? 16 : 20} />
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>נקודות</p>
                <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>{totalPoints}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="text-green-500" size={isMobile ? 16 : 20} />
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>הזמנות</p>
                <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>{ordersCount}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <RotateCcw className="text-red-500" size={isMobile ? 16 : 20} />
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>החזרות</p>
                <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>{returnsCount}</p>
              </div>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>בראל אלון (התחלה/סיום)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">1</span>
              </div>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>נקודת לקוח (עם מספר סדר)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white opacity-80"></div>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>נקודת לקוח (ללא מסלול)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500 rounded"></div>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>מסלול אופטימלי</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};