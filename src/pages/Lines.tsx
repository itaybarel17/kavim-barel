import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaPool } from '@/components/lines/AreaPool';
import { CityPool } from '@/components/lines/CityPool';
import { WeeklyAreaKanban } from '@/components/lines/WeeklyAreaKanban';
import { WeekGrid } from '@/components/lines/WeekGrid';
import { TruckGrid } from '@/components/lines/TruckGrid';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  freq: number[] | null;
}

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
}

const Lines = () => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [distributionGroups, setDistributionGroups] = useState<DistributionGroup[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Fetch distribution groups
  const { isLoading: isLoadingGroups } = useQuery({
    queryKey: ['distribution-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('*')
        .order('groups_id');

      if (error) {
        console.error('Error fetching distribution groups:', error);
        throw error;
      }

      setDistributionGroups(data as DistributionGroup[]);
      return data as DistributionGroup[];
    },
  });

  // Fetch cities
  const { isLoading: isLoadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('cityid');

      if (error) {
        console.error('Error fetching cities:', error);
        throw error;
      }

      setCities(data as City[]);
      return data as City[];
    },
  });

  // Organize cities by area
  const citiesByArea = cities.reduce((acc: Record<string, City[]>, city) => {
    const area = city.area || 'Unassigned';
    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(city);
    return acc;
  }, {});

  // Get weekly areas
  const getWeeklyAreas = () => {
    const weeklyAreas: Record<string, string[]> = {};

    distributionGroups.forEach(group => {
      if (!group.days || !group.separation) return;

      const mainArea = group.separation.replace(/\s+\d+$/, '').trim();

      group.days.forEach(dayString => {
        const daysArray = dayString.split(',').map(d => d.trim());
        daysArray.forEach(day => {
          if (!weeklyAreas[day]) {
            weeklyAreas[day] = [];
          }
          if (!weeklyAreas[day].includes(mainArea)) {
            weeklyAreas[day].push(mainArea);
          }
        });
      });
    });

    return weeklyAreas;
  };

  // Handlers for area assignment/removal
  const handleAreaAssign = async (area: string, day: string) => {
    // Find the distribution group for this area and day
    const group = distributionGroups.find(g => {
      if (!g.separation) return false;
      const mainArea = g.separation.replace(/\s+\d+$/, '').trim();
      return mainArea === area;
    });

    if (!group) {
      console.error(`Distribution group not found for area: ${area}`);
      return;
    }

    // Update the distribution group with the new day
    const updatedDays = group.days ? [...group.days, day] : [day];

    const { error } = await supabase
      .from('distribution_groups')
      .update({ days: updatedDays })
      .eq('groups_id', group.groups_id);

    if (error) {
      console.error('Error updating distribution group:', error);
    } else {
      // Optimistically update the state
      setDistributionGroups(prev =>
        prev.map(g =>
          g.groups_id === group.groups_id ? { ...g, days: updatedDays } : g
        )
      );
    }
  };

  const handleAreaRemove = async (area: string, day: string) => {
    // Find the distribution group for this area and day
    const group = distributionGroups.find(g => {
      if (!g.separation) return false;
      const mainArea = g.separation.replace(/\s+\d+$/, '').trim();
      return mainArea === area;
    });

    if (!group) {
      console.error(`Distribution group not found for area: ${area}`);
      return;
    }

    // Remove the day from the distribution group
    const updatedDays = group.days ? group.days.filter(d => d !== day) : [];

    const { error } = await supabase
      .from('distribution_groups')
      .update({ days: updatedDays })
      .eq('groups_id', group.groups_id);

    if (error) {
      console.error('Error updating distribution group:', error);
    } else {
      // Optimistically update the state
      setDistributionGroups(prev =>
        prev.map(g =>
          g.groups_id === group.groups_id ? { ...g, days: updatedDays } : g
        )
      );
    }
  };

  // Handlers for city assignment/removal
  const handleCityAssign = async (cityId: number, week: number, day: string) => {
    const weekKey = `week${week}`;
    const city = cities.find(c => c.cityid === cityId);

    if (!city) {
      console.error(`City not found with ID: ${cityId}`);
      return;
    }

    // Initialize the day object if it doesn't exist
    let updatedDay = city.day || {};

    // Initialize the week object if it doesn't exist
    if (!updatedDay[weekKey]) {
      updatedDay[weekKey] = [];
    }

    // Add the day to the week's array
    if (!updatedDay[weekKey].includes(day)) {
      updatedDay[weekKey].push(day);
    }

    const { error } = await supabase
      .from('cities')
      .update({ day: updatedDay })
      .eq('cityid', cityId);

    if (error) {
      console.error('Error updating city:', error);
    } else {
      // Optimistically update the state
      setCities(prev =>
        prev.map(c =>
          c.cityid === cityId ? { ...c, day: updatedDay } : c
        )
      );
    }
  };

  const handleCityRemove = async (cityId: number, week: number, day: string) => {
    const weekKey = `week${week}`;
    const city = cities.find(c => c.cityid === cityId);

    if (!city) {
      console.error(`City not found with ID: ${cityId}`);
      return;
    }

    if (!city.day || !city.day[weekKey]) {
      console.warn(`No data for city ${cityId} in week ${week}`);
      return;
    }

    // Remove the day from the week's array
    const updatedDays = city.day[weekKey].filter((d: string) => d !== day);

    // Update the city object
    let updatedDay = {
      ...city.day,
      [weekKey]: updatedDays.length > 0 ? updatedDays : null,
    };

    // If the week is now empty, remove it
    if (updatedDays.length === 0) {
      delete updatedDay[weekKey];
    }

    const { error } = await supabase
      .from('cities')
      .update({ day: Object.keys(updatedDay).length > 0 ? updatedDay : null })
      .eq('cityid', cityId);

    if (error) {
      console.error('Error updating city:', error);
    } else {
      // Optimistically update the state
      setCities(prev =>
        prev.map(c =>
          c.cityid === cityId ? { ...c, day: Object.keys(updatedDay).length > 0 ? updatedDay : null } : c
        )
      );
    }
  };

  const handleCityMove = async (cityId: number, fromWeek: number, fromDay: string, toWeek: number, toDay: string) => {
    // Remove city from old week/day
    await handleCityRemove(cityId, fromWeek, fromDay);

    // Assign city to new week/day
    await handleCityAssign(cityId, toWeek, toDay);
  };

  const handleCityAreaChange = async (cityId: number, newArea: string) => {
    const { error } = await supabase
      .from('cities')
      .update({ area: newArea })
      .eq('cityid', cityId);

    if (error) {
      console.error('Error updating city area:', error);
    } else {
      // Optimistically update the state
      setCities(prev =>
        prev.map(c =>
          c.cityid === cityId ? { ...c, area: newArea } : c
        )
      );
    }
  };

  // Truck handlers
  const handleCityAssignToTruck = async (cityId: number, week: number, day: string, truck: number) => {
    const weekKey = `week${week}`;
    const city = cities.find(c => c.cityid === cityId);

    if (!city) {
      console.error(`City not found with ID: ${cityId}`);
      return;
    }

    // Initialize the day object if it doesn't exist
    let updatedDay = city.day || {};

    // Initialize the week object if it doesn't exist
    if (!updatedDay[weekKey]) {
      updatedDay[weekKey] = {};
    }

    // Initialize the day object if it doesn't exist
    if (!updatedDay[weekKey][day]) {
      updatedDay[weekKey][day] = [];
    }

    // Add the truck to the day's array
    if (!updatedDay[weekKey][day].includes(truck)) {
      updatedDay[weekKey][day].push(truck);
    }

    const { error } = await supabase
      .from('cities')
      .update({ day: updatedDay })
      .eq('cityid', cityId);

    if (error) {
      console.error('Error updating city:', error);
    } else {
      // Optimistically update the state
      setCities(prev =>
        prev.map(c =>
          c.cityid === cityId ? { ...c, day: updatedDay } : c
        )
      );
    }
  };

  const handleCityRemoveFromTruck = async (cityId: number, week: number, day: string, truck: number) => {
    const weekKey = `week${week}`;
    const city = cities.find(c => c.cityid === cityId);

    if (!city) {
      console.error(`City not found with ID: ${cityId}`);
      return;
    }

    if (!city.day || !city.day[weekKey] || !city.day[weekKey][day]) {
      console.warn(`No data for city ${cityId} in week ${week}, day ${day}`);
      return;
    }

    // Remove the truck from the day's array
    const updatedTrucks = city.day[weekKey][day].filter((t: number) => t !== truck);

    // Update the city object
    let updatedDay = { ...city.day };
    updatedDay[weekKey][day] = updatedTrucks.length > 0 ? updatedTrucks : null;

    // If the day is now empty, remove it
    if (updatedTrucks.length === 0) {
      delete updatedDay[weekKey][day];
    }

    // If the week is now empty, remove it
    if (Object.keys(updatedDay[weekKey]).length === 0) {
      delete updatedDay[weekKey];
    }

    const { error } = await supabase
      .from('cities')
      .update({ day: Object.keys(updatedDay).length > 0 ? updatedDay : null })
      .eq('cityid', cityId);

    if (error) {
      console.error('Error updating city:', error);
    } else {
      // Optimistically update the state
      setCities(prev =>
        prev.map(c =>
          c.cityid === cityId ? { ...c, day: Object.keys(updatedDay).length > 0 ? updatedDay : null } : c
        )
      );
    }
  };

  const handleCityMoveToTruck = async (cityId: number, fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => {
    // Remove city from old week/day/truck
    await handleCityRemoveFromTruck(cityId, fromWeek, fromDay, fromTruck);

    // Assign city to new week/day/truck
    await handleCityAssignToTruck(cityId, toWeek, toDay, toTruck);
  };

  const handleCopyTruck = async (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => {
    const weekKey = `week${fromWeek}`;
    const targetWeekKey = `week${toWeek}`;

    // Get cities in the source truck
    const citiesToCopy = cities.filter(city => {
      if (!city.day) return false;
      const dayData = city.day[weekKey];
      if (!dayData || typeof dayData !== 'object') return false;
      const truckData = dayData[fromDay];
      return Array.isArray(truckData) && truckData.includes(fromTruck);
    });

    // Assign each city to the target truck
    for (const city of citiesToCopy) {
      // Initialize the day object if it doesn't exist
      let updatedDay = city.day || {};

      // Initialize the week object if it doesn't exist
      if (!updatedDay[targetWeekKey]) {
        updatedDay[targetWeekKey] = {};
      }

      // Initialize the day object if it doesn't exist
      if (!updatedDay[targetWeekKey][toDay]) {
        updatedDay[targetWeekKey][toDay] = [];
      }

      // Add the truck to the day's array
      if (!updatedDay[targetWeekKey][toDay].includes(toTruck)) {
        updatedDay[targetWeekKey][toDay].push(toTruck);
      }

      const { error } = await supabase
        .from('cities')
        .update({ day: updatedDay })
        .eq('cityid', city.cityid);

      if (error) {
        console.error('Error updating city:', error);
      } else {
        // Optimistically update the state
        setCities(prev =>
          prev.map(c =>
            c.cityid === city.cityid ? { ...c, day: updatedDay } : c
          )
        );
      }
    }
  };

  const handleMoveTruck = async (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => {
    await handleCopyTruck(fromWeek, fromDay, fromTruck, toWeek, toDay, toTruck);

    const weekKey = `week${fromWeek}`;

    // Get cities in the source truck
    const citiesToRemove = cities.filter(city => {
      if (!city.day) return false;
      const dayData = city.day[weekKey];
      if (!dayData || typeof dayData !== 'object') return false;
      const truckData = dayData[fromDay];
      return Array.isArray(truckData) && truckData.includes(fromTruck);
    });

    // Remove each city from the source truck
    for (const city of citiesToRemove) {
      // Remove the truck from the day's array
      const updatedTrucks = city.day[weekKey][fromDay].filter((t: number) => t !== fromTruck);

      // Update the city object
      let updatedDay = { ...city.day };
      updatedDay[weekKey][fromDay] = updatedTrucks.length > 0 ? updatedTrucks : null;

      // If the day is now empty, remove it
      if (updatedTrucks.length === 0) {
        delete updatedDay[weekKey][fromDay];
      }

      // If the week is now empty, remove it
      if (Object.keys(updatedDay[weekKey]).length === 0) {
        delete updatedDay[weekKey];
      }

      const { error } = await supabase
        .from('cities')
        .update({ day: Object.keys(updatedDay).length > 0 ? updatedDay : null })
        .eq('cityid', city.cityid);

      if (error) {
        console.error('Error updating city:', error);
      } else {
        // Optimistically update the state
        setCities(prev =>
          prev.map(c =>
            c.cityid === city.cityid ? { ...c, day: Object.keys(updatedDay).length > 0 ? updatedDay : null } : c
          )
        );
      }
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">קווי חלוקה</h1>
      </div>

      <Tabs defaultValue="areas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="areas">אזורים</TabsTrigger>
          <TabsTrigger value="cities">ערים</TabsTrigger>
          <TabsTrigger value="trucks">משאיות</TabsTrigger>
        </TabsList>

        <TabsContent value="areas" className="space-y-6">
          <AreaPool 
            distributionGroups={distributionGroups}
            onAreaAssign={handleAreaAssign}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>תכנון שבועי לפי אזורים</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyAreaKanban 
                distributionGroups={distributionGroups}
                onAreaAssign={handleAreaAssign}
                onAreaRemove={handleAreaRemove}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities" className="space-y-6">
          <CityPool 
            citiesByArea={citiesByArea}
            cities={cities}
            onCityAssign={handleCityAssign}
            onCityAreaChange={handleCityAreaChange}
          />
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>תכנון שבועי - שבוע {currentWeek}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
                  >
                    שבוע קודם
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(prev => prev + 1)}
                  >
                    שבוע הבא
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WeekGrid 
                week={currentWeek}
                cities={cities}
                areas={getWeeklyAreas()}
                onCityRemove={handleCityRemove}
                onCityMove={handleCityMove}
                onCityAssign={handleCityAssign}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trucks" className="space-y-6">
          <CityPool 
            citiesByArea={citiesByArea}
            cities={cities}
            onCityAssign={handleCityAssignToTruck}
            onCityAreaChange={handleCityAreaChange}
          />
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>תכנון משאיות - שבוע {currentWeek}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
                  >
                    שבוע קודם
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(prev => prev + 1)}
                  >
                    שבוע הבא
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TruckGrid 
                week={currentWeek}
                cities={cities}
                areas={getWeeklyAreas()}
                onCityRemove={handleCityRemoveFromTruck}
                onCityMove={handleCityMoveToTruck}
                onCityAssign={handleCityAssignToTruck}
                onCopyTruck={handleCopyTruck}
                onMoveTruck={handleMoveTruck}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Lines;
