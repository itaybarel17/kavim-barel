import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin, Package, RotateCcw, Clock } from 'lucide-react';
import { RouteMapComponent } from '@/components/map/RouteMapComponent';

interface Customer {
  customername: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
}

interface OrderData {
  customername: string;
  city: string;
  address: string;
  totalorder?: number;
  type: 'order' | 'return';
}

const ScheduleMap: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [departureTime, setDepartureTime] = useState('05:00');

  // Fetch orders and returns for this schedule
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['schedule-map-data', scheduleId],
    queryFn: async () => {
      if (!scheduleId) throw new Error('Schedule ID is required');

      // Get orders
      const { data: orders, error: ordersError } = await supabase
        .from('mainorder')
        .select('customername, city, address, totalorder')
        .eq('schedule_id', parseInt(scheduleId));

      if (ordersError) throw ordersError;

      // Get returns
      const { data: returns, error: returnsError } = await supabase
        .from('mainreturns')
        .select('customername, city, address, totalreturn')
        .eq('schedule_id', parseInt(scheduleId));

      if (returnsError) throw returnsError;

      // Combine orders and returns
      const allItems: OrderData[] = [
        ...(orders || []).map(order => ({ ...order, type: 'order' as const })),
        ...(returns || []).map(returnItem => ({ 
          ...returnItem, 
          totalorder: returnItem.totalreturn,
          type: 'return' as const 
        }))
      ];

      return allItems;
    },
    enabled: !!scheduleId
  });

  // Get customer coordinates
  useEffect(() => {
    const fetchCustomerCoordinates = async () => {
      if (!orderData || orderData.length === 0) return;

      const uniqueCustomers = Array.from(
        new Set(orderData.map(item => item.customername))
      );

      const { data: customerList, error } = await supabase
        .from('customerlist')
        .select('customername, city, address, lat, lng')
        .in('customername', uniqueCustomers)
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching customer coordinates:', error);
        return;
      }

      // Sort customers by city alphabetically
      const sortedCustomers = (customerList || []).sort((a, b) => 
        a.city.localeCompare(b.city, 'he')
      );

      setCustomers(sortedCustomers);
    };

    fetchCustomerCoordinates();
  }, [orderData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען נתוני מפה...</p>
        </div>
      </div>
    );
  }

  const ordersCount = orderData?.filter(item => item.type === 'order').length || 0;
  const returnsCount = orderData?.filter(item => item.type === 'return').length || 0;

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            חזרה לקלנדר
          </Button>
          <h1 className="text-2xl font-bold">מפת הפצה - לוח זמנים {scheduleId}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">סה"כ נקודות</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">הזמנות</p>
                <p className="text-2xl font-bold">{ordersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="text-red-500" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">החזרות</p>
                <p className="text-2xl font-bold">{returnsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
        {/* Customer List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">רשימת נקודות</CardTitle>
            <div className="space-y-2">
              <Label htmlFor="departure-time" className="text-sm font-medium">
                שעת יציאה
              </Label>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <Input
                  id="departure-time"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {customers.map((customer, index) => (
                <div
                  key={index}
                  className="p-2 border rounded-lg bg-background text-sm"
                >
                  <div className="font-semibold">{customer.customername}</div>
                  <div className="text-muted-foreground">{customer.address}</div>
                  <div className="text-muted-foreground">{customer.city}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              <RouteMapComponent 
                customers={customers}
                orderData={orderData || []}
                departureTime={departureTime}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMap;