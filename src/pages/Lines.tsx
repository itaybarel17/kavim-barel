import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAreaColor, getMainAreaFromSeparation } from '@/utils/areaColors';
import { Loader2 } from 'lucide-react';
import { TruckGrid } from '@/components/lines/TruckGrid';
import { CityPool } from '@/components/lines/CityPool';
import { AreaSchedule } from '@/components/lines/AreaSchedule';
import { AreaPool } from '@/components/lines/AreaPool';
import { WeeklyAreaKanban } from '@/components/lines/WeeklyAreaKanban';
import { MapComponent } from '@/components/lines/MapComponent';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  lat: number | null;
  lng: number | null;
}

const Lines = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
        .select('cityid, city, area, day, lat, lng')
        .order('area')
        .order('city');
      
      if (error) throw error;
      console.log('Lines cities fetched:', data);
      return data as City[];
    }
  });

  // Update area assignment
  const updateAreaDaysMutation = useMutation({
    mutationFn: async ({ groupId, newDays }: { groupId: number; newDays: string[] }) => {
      const { error } = await supabase
        .from('distribution_groups')
        .update({ days: newDays })
        .eq('groups_id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines-distribution-groups'] });
      toast({
        title: "נשמר בהצלחה",
        description: "שיוך האזור עודכן במערכת",
      });
    },
    onError: (error) => {
      console.error('Error updating area days:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לעדכן את שיוך האזור",
        variant: "destructive",
      });
    }
  });

  // Update city truck assignment
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

  // Update city area assignment
  const updateCityAreaMutation = useMutation({
    mutationFn: async ({ cityid, newArea }: { cityid: number; newArea: string }) => {
      const { error } = await supabase
        .from('cities')
        .update({ area: newArea })
        .eq('cityid', cityid);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines-cities'] });
      toast({
        title: "נשמר בהצלחה",
        description: "האזור עודכן במערכת",
      });
    },
    onError: (error) => {
      console.error('Error updating city area:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לעדכן את האזור",
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
      
      group.days.forEach(dayString => {
        // Split comma-separated days and process each one
        const daysArray = dayString.split(',').map(d => d.trim());
        daysArray.forEach(day => {
          if (['א', 'ב', 'ג', 'ד', 'ה'].includes(day)) {
            group.freq.forEach(week => {
              if ([1, 2, 3, 4].includes(week)) {
                schedule[week][day].push(mainArea);
              }
            });
          }
        });
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

  // Handle city assignment to truck
  const handleCityAssign = (cityId: number, week: number, day: string, truck: number) => {
    const city = cities.find(c => c.cityid === cityId);
    if (!city) return;

    const currentDay = city.day || {};
    const weekKey = `week${week}`;
    
    if (!currentDay[weekKey]) {
      currentDay[weekKey] = {};
    }
    
    if (!currentDay[weekKey][day]) {
      currentDay[weekKey][day] = [];
    }
    
    // Add truck to the day if not already there
    if (!currentDay[weekKey][day].includes(truck)) {
      currentDay[weekKey][day].push(truck);
    }

    updateCityDayMutation.mutate({ cityid: cityId, dayData: currentDay });
  };

  // Handle city removal from truck
  const handleCityRemove = (cityId: number, week: number, day: string, truck: number) => {
    const city = cities.find(c => c.cityid === cityId);
    if (!city || !city.day) return;

    const currentDay = { ...city.day };
    const weekKey = `week${week}`;
    
    if (currentDay[weekKey] && currentDay[weekKey][day]) {
      currentDay[weekKey][day] = currentDay[weekKey][day].filter((t: number) => t !== truck);
      if (currentDay[weekKey][day].length === 0) {
        delete currentDay[weekKey][day];
      }
      if (Object.keys(currentDay[weekKey]).length === 0) {
        delete currentDay[weekKey];
      }
    }

    const dayData = Object.keys(currentDay).length > 0 ? currentDay : null;
    updateCityDayMutation.mutate({ cityid: cityId, dayData });
  };

  // Handle city move between trucks
  const handleCityMove = (cityId: number, fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => {
    const city = cities.find(c => c.cityid === cityId);
    if (!city) return;

    const currentDay = city.day || {};
    const fromWeekKey = `week${fromWeek}`;
    const toWeekKey = `week${toWeek}`;
    
    // Remove from source
    if (currentDay[fromWeekKey] && currentDay[fromWeekKey][fromDay]) {
      currentDay[fromWeekKey][fromDay] = currentDay[fromWeekKey][fromDay].filter((t: number) => t !== fromTruck);
      if (currentDay[fromWeekKey][fromDay].length === 0) {
        delete currentDay[fromWeekKey][fromDay];
      }
      if (Object.keys(currentDay[fromWeekKey]).length === 0) {
        delete currentDay[fromWeekKey];
      }
    }
    
    // Add to destination
    if (!currentDay[toWeekKey]) {
      currentDay[toWeekKey] = {};
    }
    if (!currentDay[toWeekKey][toDay]) {
      currentDay[toWeekKey][toDay] = [];
    }
    if (!currentDay[toWeekKey][toDay].includes(toTruck)) {
      currentDay[toWeekKey][toDay].push(toTruck);
    }

    const dayData = Object.keys(currentDay).length > 0 ? currentDay : null;
    updateCityDayMutation.mutate({ cityid: cityId, dayData });
  };

  // Handle copying all cities from one truck to another
  const handleCopyTruck = (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => {
    const citiesToCopy = cities.filter(city => {
      if (!city.day) return false;
      const weekKey = `week${fromWeek}`;
      const dayData = city.day[weekKey];
      if (!dayData || typeof dayData !== 'object') return false;
      const truckData = dayData[fromDay];
      return Array.isArray(truckData) && truckData.includes(fromTruck);
    });

    citiesToCopy.forEach(city => {
      const currentDay = { ...city.day };
      const toWeekKey = `week${toWeek}`;
      
      if (!currentDay[toWeekKey]) {
        currentDay[toWeekKey] = {};
      }
      if (!currentDay[toWeekKey][toDay]) {
        currentDay[toWeekKey][toDay] = [];
      }
      if (!currentDay[toWeekKey][toDay].includes(toTruck)) {
        currentDay[toWeekKey][toDay].push(toTruck);
      }

      updateCityDayMutation.mutate({ cityid: city.cityid, dayData: currentDay });
    });
  };

  // Handle area assignment to day
  const handleAreaAssign = (area: string, day: string) => {
    const groupsForArea = distributionGroups.filter(group => {
      if (!group.separation) return false;
      const mainArea = group.separation.replace(/\s+\d+$/, '').trim();
      return mainArea === area;
    });

    groupsForArea.forEach(group => {
      const currentDays = group.days || [];
      const newDays = [...currentDays];
      
      // Check if this day is already included in any day string
      let dayExists = false;
      newDays.forEach((dayString, index) => {
        const daysArray = dayString.split(',').map(d => d.trim());
        if (daysArray.includes(day)) {
          dayExists = true;
        }
      });
      
      if (!dayExists) {
        // Add the day to the first day string, or create a new one
        if (newDays.length > 0) {
          const firstDayString = newDays[0];
          const daysArray = firstDayString.split(',').map(d => d.trim());
          if (!daysArray.includes(day)) {
            daysArray.push(day);
            newDays[0] = daysArray.join(',');
          }
        } else {
          newDays.push(day);
        }
        
        updateAreaDaysMutation.mutate({ groupId: group.groups_id, newDays });
      }
    });
  };

  // Handle area removal from day
  const handleAreaRemove = (area: string, day: string) => {
    const groupsForArea = distributionGroups.filter(group => {
      if (!group.separation) return false;
      const mainArea = group.separation.replace(/\s+\d+$/, '').trim();
      return mainArea === area;
    });

    groupsForArea.forEach(group => {
      const currentDays = group.days || [];
      const newDays = currentDays.map(dayString => {
        const daysArray = dayString.split(',').map(d => d.trim());
        const filteredDays = daysArray.filter(d => d !== day);
        return filteredDays.join(',');
      }).filter(dayString => dayString.length > 0);
      
      updateAreaDaysMutation.mutate({ groupId: group.groups_id, newDays });
    });
  };

  // Handle moving all cities from one truck to another
  const handleMoveTruck = (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => {
    const citiesToMove = cities.filter(city => {
      if (!city.day) return false;
      const weekKey = `week${fromWeek}`;
      const dayData = city.day[weekKey];
      if (!dayData || typeof dayData !== 'object') return false;
      const truckData = dayData[fromDay];
      return Array.isArray(truckData) && truckData.includes(fromTruck);
    });

    citiesToMove.forEach(city => {
      handleCityMove(city.cityid, fromWeek, fromDay, fromTruck, toWeek, toDay, toTruck);
    });
  };

  // Handle city area change
  const handleCityAreaChange = (cityId: number, newArea: string) => {
    updateCityAreaMutation.mutate({ cityid: cityId, newArea });
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
      <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'} space-y-4`}>
        <div className="text-center">
          <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold mb-2`}>ניהול קווי הפצה</h1>
          {!isMobile && <p className="text-muted-foreground">גרור עירים לימים המתאימים על פי לוח החודש</p>}
          {isMobile && <p className="text-sm text-muted-foreground">שיוך ערים לימי הפצה</p>}
        </div>

        {/* Area Pool */}
        <AreaPool 
          distributionGroups={distributionGroups}
          onAreaAssign={handleAreaAssign}
        />

        {/* Weekly Area Kanban */}
        <div className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} bg-card`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-4`}>שיוך אזורים לימים</h2>
          <WeeklyAreaKanban 
            distributionGroups={distributionGroups}
            onAreaAssign={handleAreaAssign}
            onAreaRemove={handleAreaRemove}
          />
        </div>

        {/* Map Component */}
        <MapComponent cities={cities} />

        {/* City Pool */}
        <CityPool 
          citiesByArea={citiesByArea}
          cities={cities}
          onCityAssign={handleCityAssign}
          onCityAreaChange={handleCityAreaChange}
        />

        {/* Weekly Grid */}
        <div className={`space-y-${isMobile ? '4' : '8'}`}>
          {[1, 2, 3, 4].map(week => (
            <div key={week} className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} bg-card`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>שבוע {week}</h2>
              </div>
              
              <TruckGrid 
                week={week}
                cities={cities}
                areas={areaSchedule[week]}
                onCityRemove={handleCityRemove}
                onCityMove={handleCityMove}
                onCityAssign={handleCityAssign}
                onCopyTruck={handleCopyTruck}
                onMoveTruck={handleMoveTruck}
              />
            </div>
          ))}
        </div>
      </div>
    );
};

export default Lines;