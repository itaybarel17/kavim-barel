import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import { CityTag } from './CityTag';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
}

interface CityPoolProps {
  citiesByArea: Record<string, City[]>;
  cities: City[];
  onCityAssign: (cityId: number, week: number, day: string, truck: number) => void;
}

export const CityPool: React.FC<CityPoolProps> = ({
  citiesByArea,
  cities,
  onCityAssign
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
          className={`space-y-4 ${isOver ? 'bg-muted/50 rounded-lg p-2' : ''}`}
        >
          {Object.entries(citiesByArea).map(([area, areaCities]) => (
            <div key={area} className="border rounded-lg">
              <Collapsible
                open={openAreas[area]}
                onOpenChange={() => toggleArea(area)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-between p-3 h-auto ${getAreaColor(area)}`}
                  >
                    <span className="font-medium">{area}</span>
                    <span className="text-xs">
                      {areaCities.length} עירים
                    </span>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="p-3 pt-0">
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
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};