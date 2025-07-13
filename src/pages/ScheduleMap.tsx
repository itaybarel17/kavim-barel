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
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>([]);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const isMobile = useIsMobile();
  const mapComponentRef = useRef<any>(null);

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

      // First, get customer replacements from messages
      const orderNumbers = orderData.filter(item => item.type === 'order').map(item => ({ customername: item.customername }));
      const returnNumbers = orderData.filter(item => item.type === 'return').map(item => ({ customername: item.customername }));
      
      let replacementMap = new Map();
      
      if (orderNumbers.length > 0 || returnNumbers.length > 0) {
        // Get replacement data for orders and returns
        const allOrderNumbers = orderData.filter(item => item.type === 'order').map(item => item.customername);
        const allReturnNumbers = orderData.filter(item => item.type === 'return').map(item => item.customername);
        
        // Find all relevant order and return numbers from the database
        const { data: orderIds } = await supabase
          .from('mainorder')
          .select('ordernumber, customername')
          .eq('schedule_id', parseInt(scheduleId!))
          .in('customername', allOrderNumbers);
          
        const { data: returnIds } = await supabase
          .from('mainreturns')
          .select('returnnumber, customername')
          .eq('schedule_id', parseInt(scheduleId!))
          .in('customername', allReturnNumbers);

        const orderNumbersForMessages = orderIds?.map(o => o.ordernumber) || [];
        const returnNumbersForMessages = returnIds?.map(r => r.returnnumber) || [];

        if (orderNumbersForMessages.length > 0 || returnNumbersForMessages.length > 0) {
          const { data: replacements } = await supabase
            .from('messages')
            .select('ordernumber, returnnumber, correctcustomer, city')
            .eq('subject', 'הזמנה על לקוח אחר')
            .not('correctcustomer', 'is', null)
            .or(`ordernumber.in.(${orderNumbersForMessages.join(',')}),returnnumber.in.(${returnNumbersForMessages.join(',')})`);

          if (replacements) {
            replacements.forEach(replacement => {
              const key = replacement.ordernumber || replacement.returnnumber;
              if (key) {
                replacementMap.set(key.toString(), {
                  customername: replacement.correctcustomer,
                  city: replacement.city
                });
              }
            });
          }
        }
      }

      const uniqueCustomers = Array.from(
        new Set(orderData.map(item => item.customername))
      );

      // City name mappings for fallback
      const cityNameMappings: Record<string, string> = {
        'פ"ת': 'פתח תקווה',
        'ת"א': 'תל אביב',
        'י-ם': 'ירושלים'
      };

      // First try to get customers with existing coordinates
      const { data: customerList, error } = await supabase
        .from('customerlist')
        .select('customername, city, address, lat, lng')
        .in('customername', uniqueCustomers);

      if (error) {
        console.error('Error fetching customer coordinates:', error);
        return;
      }

      // Get city coordinates for fallback
      const { data: cityCoordinates, error: cityError } = await supabase
        .from('cities')
        .select('city, lat, lng');

      if (cityError) {
        console.error('Error fetching city coordinates:', cityError);
      }

      const cityCoordMap = new Map();
      cityCoordinates?.forEach(city => {
        if (city.lat && city.lng) {
          cityCoordMap.set(city.city, { lat: city.lat, lng: city.lng });
        }
      });

      // Process customers to ensure all have coordinates
      const processedCustomers: Customer[] = [];
      
      for (const customerName of uniqueCustomers) {
        const orderDataItem = orderData.find(item => item.customername === customerName);
        if (!orderDataItem) continue;

        // Check if this customer has been replaced
        let finalCustomerName = customerName;
        let finalCityName = orderDataItem.city;
        
        // Look for replacements in the orderData by finding actual order/return numbers
        const { data: orderCheck } = await supabase
          .from('mainorder')
          .select('ordernumber')
          .eq('schedule_id', parseInt(scheduleId!))
          .eq('customername', customerName)
          .limit(1);
          
        const { data: returnCheck } = await supabase
          .from('mainreturns')
          .select('returnnumber')
          .eq('schedule_id', parseInt(scheduleId!))
          .eq('customername', customerName)
          .limit(1);

        const orderNumber = orderCheck?.[0]?.ordernumber;
        const returnNumber = returnCheck?.[0]?.returnnumber;
        
        const replacementKey = orderNumber?.toString() || returnNumber?.toString();
        if (replacementKey && replacementMap.has(replacementKey)) {
          const replacement = replacementMap.get(replacementKey);
          finalCustomerName = replacement.customername;
          finalCityName = replacement.city;
        }

        // Find customer in customerlist (try both original and replacement name)
        let customerRecord = customerList?.find(c => c.customername === finalCustomerName);
        if (!customerRecord) {
          customerRecord = customerList?.find(c => c.customername === customerName);
        }
        
        let customer: Customer;
        
        if (customerRecord?.lat && customerRecord?.lng) {
          // Use existing precise coordinates
          customer = {
            customername: finalCustomerName,
            city: customerRecord.city || finalCityName,
            address: customerRecord.address || orderDataItem.address,
            lat: customerRecord.lat,
            lng: customerRecord.lng
          };
        } else {
          // Try to get city coordinates as fallback
          const cityName = finalCityName;
          const mappedCityName = cityNameMappings[cityName] || cityName;
          const cityCoords = cityCoordMap.get(mappedCityName) || cityCoordMap.get(cityName);
          
          if (cityCoords) {
            customer = {
              customername: finalCustomerName,
              city: cityName,
              address: customerRecord?.address || orderDataItem.address || 'כתובת לא זמינה',
              lat: cityCoords.lat,
              lng: cityCoords.lng
            };
          } else {
            // Skip customers without any coordinates
            console.warn(`No coordinates found for customer: ${finalCustomerName} in city: ${cityName}`);
            continue;
          }
        }
        
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
                      className="p-3 border rounded-lg bg-background"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {orderNumber && orderNumber > 0 && (
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {orderNumber}
                          </span>
                        )}
                        <div className="font-semibold text-sm">{customer.customername}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{customer.address}</div>
                      <div className="text-xs text-muted-foreground">{customer.city}</div>
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