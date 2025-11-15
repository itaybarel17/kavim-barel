import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapComponent } from '@/components/lines/MapComponent';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const MapFullscreen = () => {
  const { data: cities = [] } = useQuery({
    queryKey: ['fullscreen-map-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('cityid, city, area, lat, lng')
        .order('area')
        .order('city');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="p-4 border-b flex justify-between items-center bg-card">
        <h1 className="text-2xl font-bold">מפת ערים - מסך מלא</h1>
        <Button variant="ghost" onClick={() => window.close()}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1">
        <MapComponent cities={cities} fullscreen={true} />
      </div>
    </div>
  );
};

export default MapFullscreen;
