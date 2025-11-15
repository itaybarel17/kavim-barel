import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAreaColor, getMainAreaFromSeparation } from '@/utils/areaColors';
import { Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TruckGrid } from '@/components/lines/TruckGrid';
import { CityPool } from '@/components/lines/CityPool';
import { AreaSchedule } from '@/components/lines/AreaSchedule';
import { AreaPool } from '@/components/lines/AreaPool';
import { WeeklyAreaKanban } from '@/components/lines/WeeklyAreaKanban';
import { AreaPoolVisit } from '@/components/lines/AreaPoolVisit';
import { WeeklyAreaKanbanVisit } from '@/components/lines/WeeklyAreaKanbanVisit';
import { MapComponent } from '@/components/lines/MapComponent';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  dayvisit: string[] | null;
  freq: number[] | null;
  orderlabelinkavim: number | null;
  agentsworkarea: number[] | null;
  totalsupplyspots: number | null;
}

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
  lat: number | null;
  lng: number | null;
  averagesupplyweek: number | null;
}

const Lines = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Fetch distribution groups
  const { data: distributionGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['lines-distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups for lines...');
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('groups_id, separation, days, dayvisit, freq, orderlabelinkavim, agentsworkarea, totalsupplyspots')
        .order('orderlabelinkavim', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      console.log('Lines distribution groups fetched:', data);
      return data as any as DistributionGroup[];
    }
  });

  // Fetch cities
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['lines-cities'],
    queryFn: async () => {
      console.log('Fetching cities for lines...');
      const { data, error } = await supabase
        .from('cities')
        .select('cityid, city, area, day, lat, lng, averagesupplyweek')
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

  // Update area visit assignment
  const updateAreaDayVisitMutation = useMutation({
    mutationFn: async ({ groupId, newDays }: { groupId: number; newDays: string[] }) => {
      const { error } = await supabase
        .from('distribution_groups')
        .update({ dayvisit: newDays } as any)
        .eq('groups_id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines-distribution-groups'] });
      toast({
        title: "נשמר בהצלחה",
        description: "שיוך הביקור עודכן במערכת",
      });
    },
    onError: (error) => {
      console.error('Error updating area day visit:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לעדכן את שיוך הביקור",
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

  // Update area order mutation
  const updateAreaOrderMutation = useMutation({
    mutationFn: async ({ area1GroupId, area1Order, area2GroupId, area2Order }: { 
      area1GroupId: number; 
      area1Order: number; 
      area2GroupId: number; 
      area2Order: number; 
    }) => {
      console.log('Swapping area orders:', { area1GroupId, area1Order, area2GroupId, area2Order });
      
      // Use a temporary negative value to avoid duplicate constraint violation
      const tempValue = -Math.max(area1Order, area2Order) - 1;
      
      // Step 1: Set first area to temporary value
      const { error: error1 } = await supabase
        .from('distribution_groups')
        .update({ orderlabelinkavim: tempValue } as any)
        .eq('groups_id', area1GroupId);
      
      if (error1) throw error1;

      // Step 2: Set second area to first area's original order
      const { error: error2 } = await supabase
        .from('distribution_groups')
        .update({ orderlabelinkavim: area1Order } as any)
        .eq('groups_id', area2GroupId);
      
      if (error2) throw error2;

      // Step 3: Set first area to second area's original order
      const { error: error3 } = await supabase
        .from('distribution_groups')
        .update({ orderlabelinkavim: area2Order } as any)
        .eq('groups_id', area1GroupId);
      
      if (error3) throw error3;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines-distribution-groups'] });
      toast({
        title: "נשמר בהצלחה",
        description: "סדר האזורים עודכן במערכת",
      });
    },
    onError: (error) => {
      console.error('Error updating area order:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לעדכן את סדר האזורים",
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

  // Group cities by area with sorted areas by orderlabelinkavim
  const citiesByArea = useMemo(() => {
    const grouped: Record<string, City[]> = {};
    cities.forEach(city => {
      const area = city.area || 'לא מוגדר';
      if (!grouped[area]) {
        grouped[area] = [];
      }
      grouped[area].push(city);
    });
    
    // Sort areas by orderlabelinkavim from distribution_groups
    const sortedGrouped: Record<string, City[]> = {};
    const areaOrderMap = new Map<string, number>();
    
    distributionGroups.forEach(group => {
      if (group.separation) {
        // Use separation directly without stripping numbers to match the area exactly
        areaOrderMap.set(group.separation, group.orderlabelinkavim || 0);
      }
    });
    
    const sortedAreas = Object.keys(grouped).sort((a, b) => {
      const orderA = areaOrderMap.get(a) || 0;
      const orderB = areaOrderMap.get(b) || 0;
      return orderA - orderB;
    });
    
    sortedAreas.forEach(area => {
      sortedGrouped[area] = grouped[area];
    });
    
    return sortedGrouped;
  }, [cities, distributionGroups]);

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
  const handleAreaAssign = (area: string, day: string, isDayToDay: boolean = false, groupId?: number) => {
    if (isDayToDay && groupId) {
      // For day-to-day moves with specific groupId, update only that group
      updateAreaDaysMutation.mutate({ groupId, newDays: [day] });
    } else {
      // For pool-to-day moves
      const groupsForArea = distributionGroups.filter(group => {
        if (!group.separation) return false;
        const mainArea = group.separation.replace(/\s+\d+$/, '').trim();
        return mainArea === area;
      });

      groupsForArea.forEach(group => {
        const currentDays = group.days || [];
        // Add day only if not already present
        if (!currentDays.includes(day)) {
          const newDays = [...currentDays, day];
          updateAreaDaysMutation.mutate({ groupId: group.groups_id, newDays });
        }
      });
    }
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
      const newDays = currentDays.filter(d => d !== day);
      updateAreaDaysMutation.mutate({ groupId: group.groups_id, newDays });
    });
  };

  // Handle area visit assignment to day
  const handleAreaAssignVisit = (area: string, day: string, isDayToDay: boolean = false, groupId?: number) => {
    if (isDayToDay && groupId) {
      // For day-to-day moves with specific groupId, update only that group
      updateAreaDayVisitMutation.mutate({ groupId, newDays: [day] });
    } else {
      // For pool-to-day moves
      const groupsForArea = distributionGroups.filter(group => {
        if (!group.separation) return false;
        const mainArea = group.separation.replace(/\s+\d+$/, '').trim();
        return mainArea === area;
      });

      groupsForArea.forEach(group => {
        const currentDays = group.dayvisit || [];
        // Add day only if not already present
        if (!currentDays.includes(day)) {
          const newDays = [...currentDays, day];
          updateAreaDayVisitMutation.mutate({ groupId: group.groups_id, newDays });
        }
      });
    }
  };

  // Handle area visit removal from day
  const handleAreaRemoveVisit = (area: string, day: string) => {
    const groupsForArea = distributionGroups.filter(group => {
      if (!group.separation) return false;
      const mainArea = group.separation.replace(/\s+\d+$/, '').trim();
      return mainArea === area;
    });

    groupsForArea.forEach(group => {
      const currentDays = group.dayvisit || [];
      const newDays = currentDays.filter(d => d !== day);
      updateAreaDayVisitMutation.mutate({ groupId: group.groups_id, newDays });
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

  // Handle area order change
  const handleAreaOrderChange = (area: string, direction: 'up' | 'down') => {
    console.log('handleAreaOrderChange called:', { area, direction });
    
    // Get all unique areas with their order values - use separation directly without stripping numbers
    const areaGroups = distributionGroups
      .filter(group => group.separation)
      .map(group => ({
        area: group.separation!,
        groups_id: group.groups_id,
        orderlabelinkavim: group.orderlabelinkavim || 0
      }))
      .filter((value, index, self) => 
        index === self.findIndex(item => item.area === value.area)
      )
      .sort((a, b) => (a.orderlabelinkavim || 0) - (b.orderlabelinkavim || 0));

    console.log('Available area groups:', areaGroups);
    
    const currentIndex = areaGroups.findIndex(group => group.area === area);
    if (currentIndex === -1) {
      console.log('Area not found:', area);
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= areaGroups.length) {
      console.log('Cannot move area - out of bounds');
      return;
    }

    const currentGroup = areaGroups[currentIndex];
    const targetGroup = areaGroups[targetIndex];
    
    console.log('Swapping:', { currentGroup, targetGroup });

    updateAreaOrderMutation.mutate({
      area1GroupId: currentGroup.groups_id,
      area1Order: currentGroup.orderlabelinkavim || 0,
      area2GroupId: targetGroup.groups_id,
      area2Order: targetGroup.orderlabelinkavim || 0,
    });
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1" />
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold flex-1 text-center`}>ניהול קווי הפצה</h1>
            <div className="flex-1 flex justify-end">
              <Button 
                onClick={() => navigate('/customer-list')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                {!isMobile && 'רשימת לקוחות'}
              </Button>
            </div>
          </div>
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

        {/* Area Pool Visit */}
        <AreaPoolVisit 
          distributionGroups={distributionGroups}
          onAreaAssign={handleAreaAssignVisit}
        />

        {/* Weekly Area Kanban Visit */}
        <div className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} bg-card`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-4`}>שיוך אזורים לימים (ביקורים)</h2>
          <WeeklyAreaKanbanVisit 
            distributionGroups={distributionGroups}
            onAreaAssign={handleAreaAssignVisit}
            onAreaRemove={handleAreaRemoveVisit}
          />
        </div>

        {/* Map Component */}
        <MapComponent cities={cities} />

        {/* City Pool */}
        <CityPool 
          citiesByArea={citiesByArea}
          cities={cities}
          distributionGroups={distributionGroups}
          onCityAssign={handleCityAssign}
          onCityAreaChange={handleCityAreaChange}
          onAreaOrderChange={handleAreaOrderChange}
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