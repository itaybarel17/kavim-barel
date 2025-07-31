import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin, Package, RotateCcw, Clock, Route } from 'lucide-react';
import { RouteMapComponent } from '@/components/map/RouteMapComponent';
import { useIsMobile } from '@/hooks/use-mobile';

interface Customer {
  customername: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  isExcluded?: boolean;
  deliverHour?: string;
}

interface OrderData {
  customername: string;
  customernumber: string;
  city: string;
  address: string;
  totalorder?: number;
  type: 'order' | 'return';
}

const ScheduleMap: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>([]);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const isMobile = useIsMobile();
  const mapComponentRef = useRef<any>(null);

  // Function to format delivery hour from jsonb
  const formatDeliveryHour = (deliverHour: any): string => {
    if (!deliverHour || deliverHour === null) return '';
    
    let hours: string[] = [];
    if (typeof deliverHour === 'string') {
      try {
        hours = JSON.parse(deliverHour);
      } catch {
        return '';
      }
    } else if (Array.isArray(deliverHour)) {
      hours = deliverHour;
    } else {
      return '';
    }

    if (!hours || hours.length === 0 || (hours.length === 1 && hours[0] === '')) {
      return '';
    }

    const formattedHours = hours.map(hour => {
      if (hour.startsWith('-')) {
        // Format like "-10:00" to "עד 10:00"
        return `עד ${hour.substring(1)}`;
      } else if (hour.includes('-')) {
        // Format like "08:00-13:00" stays as is
        return hour;
      } else {
        // Format like "11:00" to "משעה 11:00"
        return `משעה ${hour}`;
      }
    });

    return `אספקה: ${formattedHours.join(', ')}`;
  };

  // Fetch orders and returns for this schedule
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['schedule-map-data', scheduleId],
    queryFn: async () => {
      if (!scheduleId) throw new Error('Schedule ID is required');

      // Get orders
      const { data: orders, error: ordersError } = await supabase
        .from('mainorder')
        .select('customername, customernumber, city, address, totalorder')
        .eq('schedule_id', parseInt(scheduleId));

      if (ordersError) throw ordersError;

      // Get returns
      const { data: returns, error: returnsError } = await supabase
        .from('mainreturns')
        .select('customername, customernumber, city, address, totalreturn')
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

      // Get unique customer numbers from order data
      const uniqueCustomerNumbers = Array.from(
        new Set(orderData.map(item => item.customernumber))
      );

      // Fetch customer coordinates using customernumber from both tables
      const { data: customerList, error: customerError } = await supabase
        .from('customerlist')
        .select('customernumber, customername, city, address, lat, lng, deliverhour')
        .in('customernumber', uniqueCustomerNumbers);

      if (customerError) {
        console.error('Error fetching customer coordinates:', customerError);
      }

      const { data: candyCustomerList, error: candyError } = await supabase
        .from('candycustomerlist')
        .select('customernumber, customername, city, address, lat, lng, deliverhour')
        .in('customernumber', uniqueCustomerNumbers);

      if (candyError) {
        console.error('Error fetching candy customer coordinates:', candyError);
      }

      // Create a map of customer numbers to their coordinates
      const customerCoordsMap = new Map();
      
      // Add coordinates from customerlist
      customerList?.forEach(customer => {
        if (customer.lat && customer.lng) {
          customerCoordsMap.set(customer.customernumber, {
            lat: Number(customer.lat),
            lng: Number(customer.lng),
            city: customer.city,
            address: customer.address,
            customername: customer.customername,
            deliverHour: formatDeliveryHour(customer.deliverhour)
          });
        }
      });

      // Add coordinates from candycustomerlist (will override if exists)
      candyCustomerList?.forEach(customer => {
        if (customer.lat && customer.lng) {
          customerCoordsMap.set(customer.customernumber, {
            lat: Number(customer.lat),
            lng: Number(customer.lng),
            city: customer.city,
            address: customer.address,
            customername: customer.customername,
            deliverHour: formatDeliveryHour(customer.deliverhour)
          });
        }
      });

      // Fetch city coordinates for fallback
      const uniqueCityNames = Array.from(
        new Set(orderData.map(item => item.city))
      );

      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('city, lat, lng')
        .in('city', uniqueCityNames);

      if (citiesError) {
        console.error('Error fetching cities coordinates:', citiesError);
      }

      const cityCoordsMap = new Map();
      citiesData?.forEach(city => {
        if (city.lat && city.lng) {
          cityCoordsMap.set(city.city, {
            lat: Number(city.lat),
            lng: Number(city.lng)
          });
        }
      });

      // Process customer data - include ALL customers
      const processedCustomers: Customer[] = [];
      
      for (const customerNumber of uniqueCustomerNumbers) {
        const orderDataItem = orderData.find(item => item.customernumber === customerNumber);
        if (!orderDataItem) continue;

        const coords = customerCoordsMap.get(customerNumber);
        const cityCoords = cityCoordsMap.get(orderDataItem.city);
        
        let lat, lng, isExcluded = false;
        
        if (coords) {
          // Use customer-specific coordinates
          lat = coords.lat;
          lng = coords.lng;
        } else if (cityCoords) {
          // Use city coordinates as fallback
          lat = cityCoords.lat;
          lng = cityCoords.lng;
        } else {
          // Mark as excluded if no coordinates found
          lat = 32.0853; // Default center of Israel for display
          lng = 34.7818;
          isExcluded = true;
        }
        
        const customer: Customer = {
          customername: coords?.customername || orderDataItem.customername,
          city: orderDataItem.city, // Use city name as-is from mainorder
          address: orderDataItem.address || coords?.address || 'כתובת לא זמינה',
          lat,
          lng,
          isExcluded,
          deliverHour: coords?.deliverHour
        };
        
        processedCustomers.push(customer);
      }

      // Sort customers by city alphabetically
      const sortedCustomers = processedCustomers.sort((a, b) => 
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

      {/* Mobile: Natural Legend and Stats */}
      {isMobile && (
        <div className="space-y-3">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-background border rounded-lg">
              <MapPin className="text-blue-500 mx-auto mb-1" size={16} />
              <p className="text-xs text-muted-foreground">נקודות</p>
              <p className="text-lg font-bold">{customers.length}</p>
            </div>
            <div className="text-center p-3 bg-background border rounded-lg">
              <Package className="text-green-500 mx-auto mb-1" size={16} />
              <p className="text-xs text-muted-foreground">הזמנות</p>
              <p className="text-lg font-bold">{ordersCount}</p>
            </div>
            <div className="text-center p-3 bg-background border rounded-lg">
              <RotateCcw className="text-red-500 mx-auto mb-1" size={16} />
              <p className="text-xs text-muted-foreground">החזרות</p>
              <p className="text-lg font-bold">{returnsCount}</p>
            </div>
          </div>
          
          {/* Map Legend */}
          <div className="p-3 bg-background border rounded-lg">
            <h3 className="font-medium mb-2 text-sm">מקרא המפה:</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>נקודת התחלה וסיום (בראל אלון)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>נקודות חלוקה</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-500 rounded"></div>
                <span>מסלול נסיעה אופטימלי</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <span>סדר ביקור (לאחר אופטימיזציה)</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-4 gap-4'} ${isMobile ? 'h-[calc(100vh-200px)]' : 'h-[600px]'}`}>
        {/* Customer List - Desktop only */}
        {!isMobile && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">רשימת נקודות</CardTitle>
              <div className="space-y-2">
                <Label htmlFor="departure-time" className="text-sm font-medium">
                  שעת יציאה (לתצוגה)
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
                <p className="text-xs text-muted-foreground">
                  המסלול מחושב לפי השעה הנוכחית, זמני ההגעה לפי שעה זו
                </p>
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
                      className={`p-2 border rounded-lg text-sm ${
                        customer.isExcluded 
                          ? 'bg-red-50 border-red-200 text-red-800' 
                          : 'bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {orderNumber && orderNumber > 0 && (
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {orderNumber}
                          </span>
                        )}
                        <div className="font-semibold flex items-center gap-1">
                          {customer.customername}
                          {customer.isExcluded && (
                            <span className="text-xs bg-red-500 text-white px-1 rounded">מוחרג</span>
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground">{customer.address}</div>
                      <div className="text-muted-foreground">{customer.city}</div>
                      {customer.deliverHour && (
                        <div className="text-xs text-blue-600 mt-1">
                          {customer.deliverHour}
                        </div>
                      )}
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
              <div className="space-y-2">
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
                <p className="text-xs text-muted-foreground">
                  המסלול מחושב לפי השעה הנוכחית, זמני ההגעה לפי שעה זו
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Controls - Mobile only */}
        {isMobile && (
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (mapComponentRef.current?.optimizeRoute) {
                      mapComponentRef.current.optimizeRoute();
                    }
                  }}
                  disabled={customers.length === 0}
                  className="flex items-center gap-2 flex-1"
                  size="sm"
                >
                  <Route size={14} />
                  מסלול אופטימלי
                </Button>
                
                {routeOptimized && (
                  <Button
                    onClick={() => {
                      if (mapComponentRef.current?.clearRoute) {
                        mapComponentRef.current.clearRoute();
                      }
                      handleRouteClear();
                    }}
                    variant="outline"
                    className="flex items-center gap-2 flex-1"
                    size="sm"
                  >
                    נקה מסלול
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map */}
        <div className={isMobile ? 'flex-1 min-h-[400px]' : 'lg:col-span-3'}>
          <Card className="h-full relative">
            <CardContent className={`${isMobile ? 'p-1' : 'p-4'} h-full`}>
              <RouteMapComponent 
                ref={mapComponentRef}
                customers={customers}
                orderData={orderData || []}
                departureTime={departureTime}
                onRouteOptimized={handleRouteOptimized}
                onRouteClear={handleRouteClear}
                isMobile={isMobile}
              />
            </CardContent>
          </Card>
        </div>

        {/* Customer List - Mobile only */}
        {isMobile && displayedCustomers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">רשימת נקודות ({displayedCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {displayedCustomers.map((customer, index) => {
                  const originalIndex = customers.findIndex(c => c.customername === customer.customername);
                  const orderNumber = routeOptimized ? optimizedOrder.indexOf(originalIndex) + 1 : null;
                  return (
                    <div
                      key={`${customer.customername}-${index}`}
                      className={`p-3 border rounded-lg ${
                        customer.isExcluded 
                          ? 'bg-red-50 border-red-200 text-red-800' 
                          : 'bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {orderNumber && orderNumber > 0 && (
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {orderNumber}
                          </span>
                        )}
                        <div className="font-semibold text-sm flex items-center gap-1">
                          {customer.customername}
                          {customer.isExcluded && (
                            <span className="text-xs bg-red-500 text-white px-1 rounded">מוחרג</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{customer.address}</div>
                      <div className="text-xs text-muted-foreground">{customer.city}</div>
                      {customer.deliverHour && (
                        <div className="text-xs text-blue-600 mt-1">
                          {customer.deliverHour}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScheduleMap;