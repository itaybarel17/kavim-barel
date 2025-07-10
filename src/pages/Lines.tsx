import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { getAreaColor, getMainAreaFromSeparation } from '@/utils/areaColors';
import { Loader2 } from 'lucide-react';
import { WeekGrid } from '@/components/lines/WeekGrid';
import { CityPool } from '@/components/lines/CityPool';
import { AreaSchedule } from '@/components/lines/AreaSchedule';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch distribution groups
  const { data: distributionGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['lines-distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups for lines...');
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('groups_id, separation, days, freq');
      
      if (error) throw error;
      console.log('Lines distribution groups fetched:', data);
      return data as DistributionGroup[];
    }
  });

  // Fetch cities
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['lines-cities'],
    queryFn: async () => {
      console.log('Fetching cities for lines...');
      const { data, error } = await supabase
        .from('cities')
        .select('cityid, city, area, day')
        .order('area')
        .order('city');
      
      if (error) throw error;
      console.log('Lines cities fetched:', data);
      return data as City[];
    }
  });

  // Update city day assignment
  const updateCityDayMutation = useMutation({
    mutationFn: async ({ cityid, dayData }: { cityid: number; dayData: Record<string, any> | null }) => {
      const { error } = await supabase
        .from('cities')
        .update({ day: dayData })
        .eq('cityid', cityid);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines-cities'] });
      toast({
        title: "נשמר בהצלחה",
        description: "השיוך עודכן במערכת",
      });
    },
    onError: (error) => {
      console.error('Error updating city day:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לעדכן את השיוך",
        variant: "destructive",
      });
    }
  });

  // Calculate which areas appear in which weeks and days
  const areaSchedule = useMemo(() => {
    const schedule: Record<number, Record<string, string[]>> = {
      1: { 'א': [], 'ב': [], 'ג': [], 'ד': [], 'ה': [] },
      2: { 'א': [], 'ב': [], 'ג': [], 'ד': [], 'ה': [] },
      3: { 'א': [], 'ב': [], 'ג': [], 'ד': [], 'ה': [] },
      4: { 'א': [], 'ב': [], 'ג': [], 'ד': [], 'ה': [] }
    };

    distributionGroups.forEach(group => {
      if (!group.days || !group.freq || !group.separation) return;
      
      const mainArea = getMainAreaFromSeparation(group.separation);
      
      group.days.forEach(day => {
        if (['א', 'ב', 'ג', 'ד', 'ה'].includes(day)) {
          group.freq.forEach(week => {
            if ([1, 2, 3, 4].includes(week)) {
              schedule[week][day].push(mainArea);
            }
          });
        }
      });
    });

    return schedule;
  }, [distributionGroups]);

  // Group cities by area for the pool
  const citiesByArea = useMemo(() => {
    const grouped: Record<string, City[]> = {};
    cities.forEach(city => {
      const area = city.area || 'לא מוגדר';
      if (!grouped[area]) grouped[area] = [];
      grouped[area].push(city);
    });
    return grouped;
  }, [cities]);

  // Handle city assignment to day
  const handleCityAssign = (cityId: number, week: number, day: string) => {
    const city = cities.find(c => c.cityid === cityId);
    if (!city) return;

    const currentDay = city.day || {};
    const weekKey = `week${week}`;
    
    if (!currentDay[weekKey]) {
      currentDay[weekKey] = [];
    }
    
    if (!currentDay[weekKey].includes(day)) {
      currentDay[weekKey].push(day);
    }

    updateCityDayMutation.mutate({ cityid: cityId, dayData: currentDay });
  };

  // Handle city removal from day
  const handleCityRemove = (cityId: number, week: number, day: string) => {
    const city = cities.find(c => c.cityid === cityId);
    if (!city || !city.day) return;

    const currentDay = { ...city.day };
    const weekKey = `week${week}`;
    
    if (currentDay[weekKey]) {
      currentDay[weekKey] = currentDay[weekKey].filter((d: string) => d !== day);
      if (currentDay[weekKey].length === 0) {
        delete currentDay[weekKey];
      }
    }

    const dayData = Object.keys(currentDay).length > 0 ? currentDay : null;
    updateCityDayMutation.mutate({ cityid: cityId, dayData });
  };

  // Handle city move between days
  const handleCityMove = (cityId: number, fromWeek: number, fromDay: string, toWeek: number, toDay: string) => {
    const city = cities.find(c => c.cityid === cityId);
    if (!city) return;

    const currentDay = city.day || {};
    const fromWeekKey = `week${fromWeek}`;
    const toWeekKey = `week${toWeek}`;
    
    // Remove from source
    if (currentDay[fromWeekKey]) {
      currentDay[fromWeekKey] = currentDay[fromWeekKey].filter((d: string) => d !== fromDay);
      if (currentDay[fromWeekKey].length === 0) {
        delete currentDay[fromWeekKey];
      }
    }
    
    // Add to destination
    if (!currentDay[toWeekKey]) {
      currentDay[toWeekKey] = [];
    }
    if (!currentDay[toWeekKey].includes(toDay)) {
      currentDay[toWeekKey].push(toDay);
    }

    const dayData = Object.keys(currentDay).length > 0 ? currentDay : null;
    updateCityDayMutation.mutate({ cityid: cityId, dayData });
  };

  if (groupsLoading || citiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען נתוני קווים...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">ניהול קווי הפצה</h1>
          <p className="text-muted-foreground">גרור עירים לימים המתאימים על פי לוח החודש</p>
        </div>

        {/* City Pool */}
        <CityPool 
          citiesByArea={citiesByArea}
          cities={cities}
          onCityAssign={handleCityAssign}
        />

        {/* Weekly Grid */}
        <div className="space-y-8">
          {[1, 2, 3, 4].map(week => (
            <div key={week} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">שבוע {week}</h2>
                <AreaSchedule areas={areaSchedule[week]} />
              </div>
              
              <WeekGrid 
                week={week}
                cities={cities}
                onCityRemove={handleCityRemove}
                onCityMove={handleCityMove}
              />
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default Lines;