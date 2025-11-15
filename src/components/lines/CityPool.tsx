import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { CityTag } from './CityTag';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Component for area drop zone
const AreaDropZone: React.FC<{
  area: string;
  onCityAreaChange: (cityId: number, newArea: string) => void;
  children: React.ReactNode;
}> = ({ area, onCityAreaChange, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['city-from-pool'],
    drop: (item: any) => {
      if (item.currentArea !== area) {
        onCityAreaChange(item.cityId, area);
      }
    },
    canDrop: (item: any) => item.currentArea !== area,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`${
        isOver && canDrop ? 'bg-primary/10 border-2 border-primary/30 rounded-lg' : ''
      } transition-all duration-200`}
    >
      {children}
    </div>
  );
};

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
  totalsupplyspots: number | null;
}

interface CityPoolProps {
  citiesByArea: Record<string, City[]>;
  cities: City[];
  distributionGroups: DistributionGroup[];
  onCityAssign: (cityId: number, week: number, day: string, truck: number) => void;
  onCityAreaChange: (cityId: number, newArea: string) => void;
  onAreaOrderChange?: (area: string, direction: 'up' | 'down') => void;
}

export const CityPool: React.FC<CityPoolProps> = ({
  citiesByArea,
  cities,
  distributionGroups,
  onCityAssign,
  onCityAreaChange,
  onAreaOrderChange
}) => {
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [draggedCities, setDraggedCities] = useState<Set<number>>(new Set());

  const [{ isOver }, drop] = useDrop({
    accept: ['city-from-day'],
    drop: (item: any) => {
      // City dropped back to pool - remove from its assigned day
      setDraggedCities(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.cityId);
        return newSet;
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const toggleArea = (area: string) => {
    setOpenAreas(prev => ({
      ...prev,
      [area]: !prev[area]
    }));
  };

  const handleCityDrag = (cityId: number) => {
    setDraggedCities(prev => new Set([...prev, cityId]));
  };

  const handleRestoreCity = (cityId: number) => {
    setDraggedCities(prev => {
      const newSet = new Set(prev);
      newSet.delete(cityId);
      return newSet;
    });
  };

  // Check if city is assigned to any truck
  const isCityAssigned = (city: City) => {
    if (!city.day || Object.keys(city.day).length === 0) return false;
    
    // Check if any week has actual trucks assigned
    return Object.values(city.day).some(weekData => 
      weekData && typeof weekData === 'object' && 
      Object.values(weekData).some(dayData => 
        Array.isArray(dayData) && dayData.length > 0
      )
    );
  };

  // Sync draggedCities with actual assignment status
  useEffect(() => {
    setDraggedCities(prev => {
      const newSet = new Set<number>();
      prev.forEach(cityId => {
        const city = cities.find(c => c.cityid === cityId);
        if (city && isCityAssigned(city)) {
          newSet.add(cityId);
        }
      });
      return newSet;
    });
  }, [cities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ערים</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={drop}
          className={`space-y-4 transition-colors duration-200 ${
            isOver ? 'bg-primary/10 ring-2 ring-primary/30 rounded-lg p-2' : ''
          }`}
        >
          {Object.entries(citiesByArea).map(([area, areaCities], index) => {
            const allAreas = Object.keys(citiesByArea);
            const isFirst = index === 0;
            const isLast = index === allAreas.length - 1;
            
            return (
            <div key={area} className="border rounded-lg relative">
              {/* Order arrows */}
              {onAreaOrderChange && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-primary/10"
                    onClick={() => onAreaOrderChange(area, 'up')}
                    disabled={isFirst}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-primary/10"
                    onClick={() => onAreaOrderChange(area, 'down')}
                    disabled={isLast}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <Collapsible
                open={openAreas[area]}
                onOpenChange={() => toggleArea(area)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-between p-3 h-auto hover:bg-accent rounded-lg ${getAreaColor(area)} ${onAreaOrderChange ? 'pl-12' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-base">{area}</span>
                      <span className="text-sm text-muted-foreground">
                        ({areaCities.length} ערים)
                      </span>
                      {(() => {
                        // Find totalsupplyspots for this area
                        const areaGroup = distributionGroups.find(group => 
                          group.separation && group.separation.replace(/\s+\d+$/, '').trim() === area
                        );
                        const totalsupplyspots = areaGroup?.totalsupplyspots || 0;
                        
                        return (
                          <Badge variant="secondary" className="bg-white/90 text-gray-800 font-bold">
                            {totalsupplyspots}
                          </Badge>
                        );
                      })()}
                    </div>
                    {openAreas[area] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="p-3 pt-0">
                  {/* Area drop zone */}
                  <AreaDropZone 
                    area={area} 
                    onCityAreaChange={onCityAreaChange}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {areaCities.map(city => {
                      const isDragged = draggedCities.has(city.cityid);
                      const isAssigned = isCityAssigned(city);
                      
                      return (
                        <div key={city.cityid} className="relative">
                          <div 
                            className={`${
                              isDragged || isAssigned ? 'grayscale opacity-50' : ''
                            }`}
                            onDragStart={() => handleCityDrag(city.cityid)}
                          >
                            <CityTag
                              city={city}
                              week={0}
                              day=""
                              onRemove={() => {}}
                              isInPool={true}
                            />
                          </div>
                          
                          {(isDragged || isAssigned) && (
                            <div className="absolute top-0 right-0 -mt-1 -mr-1">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-5 w-5 p-0 rounded-full"
                                onClick={() => handleRestoreCity(city.cityid)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                     })}
                    </div>
                  </AreaDropZone>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )})}
        </div>
      </CardContent>
    </Card>
  );
};