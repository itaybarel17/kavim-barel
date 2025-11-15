import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UnassignedCitiesPool } from '@/components/agent-visits/UnassignedCitiesPool';
import { DaysCityKanban } from '@/components/agent-visits/DaysCityKanban';
import { WeeklyCalendar } from '@/components/agent-visits/WeeklyCalendar';
import { DaysAreaKanban } from '@/components/lines/DaysAreaKanban';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Agent {
  agentnumber: string;
  agentname: string;
}

interface CitySchedule {
  id: string;
  city: string;
  agentnumber: string;
  visit_day: string | null;
  customer_count: number;
  averagesupplyweek?: number;
}

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  dayvisit: string[] | null;
  orderlabelinkavim: number | null;
  totalsupplyspots_barelcandy: number | null;
  totalsupplyspots: number | null;
  totalsupplyspots_candy: number | null;
  agentsworkarea: number[] | null;
}

const AgentVisits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('agentnumber, agentname')
        .order('agentname');
      
      if (error) throw error;
      return data as Agent[];
    }
  });

  // Fetch distribution groups for read-only display
  const { data: distributionGroups = [] } = useQuery({
    queryKey: ['distribution-groups-readonly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_groups')
        .select('groups_id, separation, days, dayvisit, orderlabelinkavim, totalsupplyspots_barelcandy, totalsupplyspots, totalsupplyspots_candy, agentsworkarea')
        .order('orderlabelinkavim', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as DistributionGroup[];
    }
  });

  // Fetch city schedules for selected agent with city data
  const { data: citySchedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['city-agent-schedules', selectedAgent],
    queryFn: async () => {
      if (!selectedAgent) return [];
      
      // First get the city schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('city_agent_visit_schedule')
        .select('id, city, agentnumber, visit_day, customer_count')
        .eq('agentnumber', selectedAgent)
        .order('customer_count', { ascending: false });
      
      if (schedulesError) throw schedulesError;
      
      // Then get the cities data with averagesupplyweek
      const cities = schedules.map(s => s.city);
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('city, averagesupplyweek')
        .in('city', cities);
      
      if (citiesError) throw citiesError;
      
      // Create a map of city to averagesupplyweek
      const citySupplyMap = new Map(
        citiesData.map(c => [c.city, c.averagesupplyweek || 0])
      );
      
      // Merge the data
      return schedules.map(schedule => ({
        ...schedule,
        averagesupplyweek: citySupplyMap.get(schedule.city) || 0
      })) as (CitySchedule & { averagesupplyweek: number })[];
    },
    enabled: !!selectedAgent,
  });

  // Mutation to update city visit day
  const updateCityVisitDayMutation = useMutation({
    mutationFn: async ({ city, agentnumber, visit_day }: { city: string; agentnumber: string; visit_day: string | null }) => {
      const { error } = await supabase
        .from('city_agent_visit_schedule')
        .upsert({
          city,
          agentnumber,
          visit_day,
        }, {
          onConflict: 'city,agentnumber'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['city-agent-schedules'] });
      toast({
        title: 'עודכן בהצלחה',
        description: 'יום הביקור עודכן לכל הלקוחות',
      });
    },
    onError: (error) => {
      console.error('Error updating city visit day:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון יום הביקור',
        variant: 'destructive',
      });
    },
  });

  const handleCityDrop = (city: string, day: string | null, week?: number) => {
    if (!selectedAgent) return;
    
    updateCityVisitDayMutation.mutate({
      city,
      agentnumber: selectedAgent,
      visit_day: day,
    });
  };

  const isLoading = agentsLoading || schedulesLoading;

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">ניהול ימי ביקור סוכנים</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['city-agent-schedules'] });
              queryClient.invalidateQueries({ queryKey: ['distribution-groups-readonly'] });
            }}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            רענון
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/lines')}>
            חזרה לקווים
          </Button>
        </div>
      </div>

      {/* Read-only delivery days display - always open */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>תצוגת שיוך אזורים (קריאה בלבד)</CardTitle>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="בחר סוכן" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.agentnumber} value={agent.agentnumber}>
                  {agent.agentname} ({agent.agentnumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">📦 ימי אספקה (days)</h3>
            <DaysAreaKanban 
              distributionGroups={distributionGroups}
              onAreaDrop={() => {}}
              readOnly={true}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && selectedAgent && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>לוח שנה דו-שבועי - שיוך ערים לימי ביקור</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyCalendar
                cities={citySchedules}
                onCityDrop={handleCityDrop}
                selectedAgent={selectedAgent}
              />
            </CardContent>
          </Card>

          <UnassignedCitiesPool
            cities={citySchedules}
            onCityDrop={handleCityDrop}
          />
        </>
      )}

      {!isLoading && !selectedAgent && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>בחר סוכן כדי להתחיל</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentVisits;
