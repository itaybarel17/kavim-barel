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
import { MapLegend } from '@/components/map/MapLegend';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>([]);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const isMobile = useIsMobile();

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

  // Get displayed customers in order (optimized or alphabetical)
  const getDisplayedCustomers = () => {
    if (routeOptimized && optimizedOrder.length > 0) {
      return optimizedOrder.map(index => customers[index]);
    }
    return customers;
  };

  const handleRouteOptimized = (order: number[]) => {
    setOptimizedOrder(order);
    setRouteOptimized(true);
  };

  const handleRouteClear = () => {
    setOptimizedOrder([]);
    setRouteOptimized(false);
  };

  const displayedCustomers = getDisplayedCustomers();

  return (
    <div className={`container mx-auto ${isMobile ? 'p-2' : 'p-4'} space-y-4`}>
      {/* Header */}
      <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
        <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-4'}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-2"
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft size={16} />
            {isMobile ? 'חזרה' : 'חזרה לקלנדר'}
          </Button>
          <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
            מפת הפצה {isMobile ? '' : '- לוח זמנים'} {scheduleId}
          </h1>
        </div>
      </div>

      {/* Stats */}
      {!isMobile && (
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
      )}

      {/* Map */}
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-4 gap-4'} ${isMobile ? 'h-[70vh]' : 'h-[600px]'}`}>
        {/* Customer List - Mobile: collapsed by default */}
        {!isMobile && (
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
                {displayedCustomers.map((customer, index) => {
                  const originalIndex = customers.findIndex(c => c.customername === customer.customername);
                  const orderNumber = routeOptimized ? optimizedOrder.indexOf(originalIndex) + 1 : null;
                  return (
                    <div
                      key={`${customer.customername}-${index}`}
                      className="p-2 border rounded-lg bg-background text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {orderNumber && orderNumber > 0 && (
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {orderNumber}
                          </span>
                        )}
                        <div className="font-semibold">{customer.customername}</div>
                      </div>
                      <div className="text-muted-foreground">{customer.address}</div>
                      <div className="text-muted-foreground">{customer.city}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Departure Time - Mobile only */}
        {isMobile && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Label htmlFor="departure-time-mobile" className="text-sm font-medium whitespace-nowrap">
                  שעת יציאה:
                </Label>
                <div className="flex items-center gap-2 flex-1">
                  <Clock size={16} className="text-muted-foreground" />
                  <Input
                    id="departure-time-mobile"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map */}
        <div className={isMobile ? 'flex-1' : 'lg:col-span-3'}>
          <Card className="h-full relative">
            <CardContent className={`${isMobile ? 'p-2' : 'p-4'} h-full`}>
              <RouteMapComponent 
                customers={customers}
                orderData={orderData || []}
                departureTime={departureTime}
                onRouteOptimized={handleRouteOptimized}
                onRouteClear={handleRouteClear}
              />
              {/* Add legend overlay */}
              <MapLegend 
                totalPoints={customers.length}
                ordersCount={ordersCount}
                returnsCount={returnsCount}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMap;