import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, MapPin, Target, Route, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: any;
  }
}

interface OrderMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  scheduleId?: number;
}

interface Customer {
  customername: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
}

interface CustomerWithCoordinates {
  customernumber: string;
  customername: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  orderCount: number;
  travelTime?: string;
}


export const OrderMapDialog: React.FC<OrderMapDialogProps> = ({
  isOpen,
  onClose,
  customerName,
  address,
  city,
  lat: propLat,
  lng: propLng,
  scheduleId,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentLat, setCurrentLat] = useState<number | undefined>(propLat);
  const [currentLng, setCurrentLng] = useState<number | undefined>(propLng);
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  
  // State for closest customers functionality
  const [closestCustomers, setClosestCustomers] = useState<Array<{
    customer: CustomerWithCoordinates;
    distance: number;
    travelTime?: string;
  }>>([]);
  const [showingClosest, setShowingClosest] = useState(false);
  const [isCalculatingClosest, setIsCalculatingClosest] = useState(false);
  const [markersOnMap, setMarkersOnMap] = useState<any[]>([]);
  const [directionsRenderers, setDirectionsRenderers] = useState<any[]>([]);
  
  // Haversine formula for distance calculation
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Fetch customers for the specific schedule - using ScheduleMap logic
  const fetchScheduleCustomers = async (): Promise<Customer[]> => {
    if (!scheduleId) {
      console.log('No schedule ID provided, skipping customer fetch');
      return [];
    }

    try {
      console.log(`Fetching customers for schedule ${scheduleId}...`);

      // Get orders for this schedule
      const { data: orders, error: ordersError } = await supabase
        .from('mainorder')
        .select('customername, city, address')
        .eq('schedule_id', scheduleId);

      if (ordersError) throw ordersError;

      // Get returns for this schedule
      const { data: returns, error: returnsError } = await supabase
        .from('mainreturns')
        .select('customername, city, address')
        .eq('schedule_id', scheduleId);

      if (returnsError) throw returnsError;

      // Combine orders and returns
      const allItems = [
        ...(orders || []),
        ...(returns || [])
      ];

      if (allItems.length === 0) {
        console.log('No orders or returns found for this schedule');
        return [];
      }

      // Get unique customers
      const uniqueCustomers = Array.from(
        new Set(allItems.map(item => item.customername))
      );

      console.log(`Found ${uniqueCustomers.length} unique customers for schedule ${scheduleId}`);

      // Get customer replacement data from messages
      let replacementMap = new Map();
      
      // Find all relevant order and return numbers from the database
      const { data: orderIds } = await supabase
        .from('mainorder')
        .select('ordernumber, customername')
        .eq('schedule_id', scheduleId)
        .in('customername', uniqueCustomers);
        
      const { data: returnIds } = await supabase
        .from('mainreturns')
        .select('returnnumber, customername')
        .eq('schedule_id', scheduleId)
        .in('customername', uniqueCustomers);

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

      // City name mappings for fallback
      const cityNameMappings: Record<string, string> = {
        'פ"ת': 'פתח תקווה',
        'ת"א': 'תל אביב',
        'י-ם': 'ירושלים'
      };

      // Get customer coordinates
      const { data: customerList, error } = await supabase
        .from('customerlist')
        .select('customername, city, address, lat, lng')
        .in('customername', uniqueCustomers);

      if (error) {
        console.error('Error fetching customer coordinates:', error);
        return [];
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
        const orderDataItem = allItems.find(item => item.customername === customerName);
        if (!orderDataItem) continue;

        // Check if this customer has been replaced
        let finalCustomerName = customerName;
        let finalCityName = orderDataItem.city;
        
        // Look for replacements
        const { data: orderCheck } = await supabase
          .from('mainorder')
          .select('ordernumber')
          .eq('schedule_id', scheduleId)
          .eq('customername', customerName)
          .limit(1);
          
        const { data: returnCheck } = await supabase
          .from('mainreturns')
          .select('returnnumber')
          .eq('schedule_id', scheduleId)
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

        // Find customer in customerlist
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

      console.log(`Processed ${processedCustomers.length} customers with coordinates`);
      return processedCustomers;

    } catch (error) {
      console.error('Error in fetchScheduleCustomers:', error);
      return [];
    }
  };

  // Convert ScheduleMap Customer interface to CustomerWithCoordinates
  const convertToCustomerWithCoordinates = (customers: Customer[]): CustomerWithCoordinates[] => {
    return customers.map(customer => ({
      customernumber: customer.customername, // Use name as number for now
      customername: customer.customername,
      address: customer.address,
      city: customer.city,
      lat: customer.lat,
      lng: customer.lng,
      orderCount: 1 // Default to 1
    }));
  };

  // Fetch current customer coordinates if not provided
  const fetchCurrentCustomerCoordinates = async () => {
    if (currentLat && currentLng) return;

    try {
      // First try to get coordinates from customerlist
      const { data: customerData } = await supabase
        .from('customerlist')
        .select('lat, lng')
        .eq('customername', customerName)
        .maybeSingle();

      if (customerData?.lat && customerData?.lng) {
        setCurrentLat(customerData.lat);
        setCurrentLng(customerData.lng);
        return;
      }

      // If not found, try to get coordinates from cities
      const { data: cityData } = await supabase
        .from('cities')
        .select('lat, lng')
        .eq('city', city)
        .maybeSingle();

      if (cityData?.lat && cityData?.lng) {
        setCurrentLat(cityData.lat);
        setCurrentLng(cityData.lng);
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
  };

  // Find 3 closest customers
  const findClosestCustomers = async () => {
    if (!map || !currentLat || !currentLng) return;
    
    setIsCalculatingClosest(true);
    console.log('Finding closest customers...');
    console.log('Starting point (clicked customer):', { lat: currentLat, lng: currentLng });
    
    try {
      // Fetch customers from schedule or general active customers
      const scheduleCustomers = await fetchScheduleCustomers();
      const activeCustomers = convertToCustomerWithCoordinates(scheduleCustomers);
      
      if (activeCustomers.length === 0) {
        console.log('No active customers found');
        setIsCalculatingClosest(false);
        return;
      }

      // Filter customers with valid coordinates, excluding those at the same location as starting point
      const validCustomers = activeCustomers.filter(customer => 
        customer.lat && customer.lng && 
        !(customer.lat === currentLat && customer.lng === currentLng)
      );
      
      console.log('Valid customers with coordinates:', validCustomers.length);
      
      // Calculate distances from the clicked customer (starting point)
      const customersWithDistance = validCustomers.map(customer => ({
        customer: customer,
        distance: calculateDistance(currentLat, currentLng, customer.lat, customer.lng)
      }));
      
      // Sort by distance and take top 3
      const closest = customersWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      
      console.log('3 closest customers:', closest);
      
      // Calculate travel times for the 3 closest customers
      const closestWithTravelTime = await calculateTravelTimes(closest);
      
      setClosestCustomers(closestWithTravelTime);
      setShowingClosest(true);
      displayClosestCustomersOnMap(closestWithTravelTime);
      
    } catch (error) {
      console.error('Error finding closest customers:', error);
    } finally {
      setIsCalculatingClosest(false);
    }
  };

  // Calculate travel times using Google Maps Distance Matrix API
  const calculateTravelTimes = async (customers: Array<{customer: CustomerWithCoordinates; distance: number}>) => {
    if (!window.google || !currentLat || !currentLng) {
      console.log('Missing Google Maps API or coordinates');
      return customers;
    }
    
    try {
      console.log('🚗 Starting travel time calculation...');
      console.log('Departure time:', departureTime);
      console.log('Origin:', { lat: currentLat, lng: currentLng });
      console.log('Customers:', customers.length);
      
      const service = new window.google.maps.DistanceMatrixService();
      const destinations = customers.map(item => 
        new window.google.maps.LatLng(item.customer.lat, item.customer.lng)
      );
      
      // Parse departure time
      const now = new Date();
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      console.log('Departure date:', departureDate);
      console.log('Destinations:', destinations.length);
      
      return new Promise<Array<{customer: CustomerWithCoordinates; distance: number; travelTime?: string}>>((resolve) => {
        service.getDistanceMatrix({
          origins: [new window.google.maps.LatLng(currentLat, currentLng)],
          destinations: destinations,
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
          drivingOptions: {
            departureTime: departureDate,
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS
          }
        }, (response: any, status: any) => {
          console.log('Distance Matrix API response:', { status, response });
          
          if (status === 'OK' && response.rows[0]) {
            const results = customers.map((customer, index) => {
              const element = response.rows[0].elements[index];
              let travelTime = undefined;
              
              console.log(`Customer ${index + 1}:`, {
                name: customer.customer.customername,
                element_status: element.status,
                duration_in_traffic: element.duration_in_traffic?.text,
                duration: element.duration?.text
              });
              
              if (element.status === 'OK' && element.duration_in_traffic) {
                travelTime = element.duration_in_traffic.text;
                console.log(`✅ Using traffic time: ${travelTime}`);
              } else if (element.status === 'OK' && element.duration) {
                travelTime = element.duration.text;
                console.log(`⚠️ Using regular time: ${travelTime}`);
              } else {
                console.log(`❌ No time available for customer ${index + 1}`);
              }
              
              return {
                ...customer,
                travelTime
              };
            });
            
            console.log('Final results with travel times:', results);
            resolve(results);
          } else {
            console.log('❌ Distance Matrix API failed:', status);
            resolve(customers);
          }
        });
      });
    } catch (error) {
      console.error('Error calculating travel times:', error);
      return customers;
    }
  };
  
  // Display closest customers on map with arrows
  const displayClosestCustomersOnMap = (closest: typeof closestCustomers) => {
    if (!map || !window.google || !currentLat || !currentLng) return;
    
    // Clear existing markers and directions
    clearMarkersAndDirections();
    
    const newMarkers: any[] = [];
    const newDirections: any[] = [];
    const colors = ['#2563eb', '#dc2626', '#16a34a']; // Blue, Red, Green
    
    closest.forEach((item, index) => {
      const { customer } = item;
      
      // Add numbered marker
      const marker = new window.google.maps.Marker({
        position: { lat: customer.lat, lng: customer.lng },
        map: map,
        title: customer.customername,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: colors[index],
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 20
        }
      });
      newMarkers.push(marker);
      
      // Add direction arrow
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true, // We have our own markers
        polylineOptions: {
          strokeColor: colors[index],
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      
      directionsService.route({
        origin: { lat: currentLat, lng: currentLng },
        destination: { lat: customer.lat, lng: customer.lng },
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        }
      });
      
      newDirections.push(directionsRenderer);
    });
    
    setMarkersOnMap(newMarkers);
    setDirectionsRenderers(newDirections);
    
    // Adjust map bounds to show all points
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: currentLat, lng: currentLng });
    closest.forEach(item => {
      bounds.extend({ lat: item.customer.lat, lng: item.customer.lng });
    });
    map.fitBounds(bounds);
  };
  
  // Clear markers and directions
  const clearMarkersAndDirections = () => {
    markersOnMap.forEach(marker => marker.setMap(null));
    directionsRenderers.forEach(renderer => renderer.setMap(null));
    setMarkersOnMap([]);
    setDirectionsRenderers([]);
  };
  
  // Clear closest customers display
  const clearClosestDisplay = () => {
    clearMarkersAndDirections();
    setClosestCustomers([]);
    setShowingClosest(false);
    
    // Reset map to original view
    if (map && currentLat && currentLng) {
      const coords = { lat: currentLat, lng: currentLng };
      map.setCenter(coords);
      map.setZoom(15);
      
      // Re-add original marker
      new window.google.maps.Marker({
        position: coords,
        map: map,
        title: customerName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#FF6B6B',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 15
        },
        label: {
          text: 'מוצא',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });
    }
  };

  // Fetch coordinates when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchCurrentCustomerCoordinates();
    }
  }, [isOpen, customerName, city]);

  // Initialize map only after coordinates are available
  useEffect(() => {
    const initializeMap = async () => {
      if (!isOpen || !mapRef.current || map) return;
      
      // Wait for coordinates to be available
      if (!currentLat || !currentLng) {
        console.log('Waiting for coordinates...');
        return;
      }

      try {
        setIsLoading(true);
        
        // Ensure Google Maps is loaded with proper retry logic
        if (!window.google || !window.google.maps) {
          console.log('Google Maps not loaded, retrying...', retryCount);
          if (retryCount < 10) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 500);
          } else {
            console.error('Google Maps failed to load after maximum retries');
            setIsLoading(false);
          }
          return;
        }

        console.log('Initializing map with coordinates:', { lat: currentLat, lng: currentLng });

        // Initialize map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: currentLat, lng: currentLng },
          zoom: 15,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Add marker for the current customer
        new window.google.maps.Marker({
          position: { lat: currentLat, lng: currentLng },
          map: mapInstance,
          title: customerName,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="red">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 40),
          },
        });

        setMap(mapInstance);
        setRetryCount(0); // Reset retry count on success
        console.log('Map initialized successfully');
        
      } catch (error) {
        console.error('Error initializing map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [isOpen, currentLat, currentLng, customerName, retryCount]);

  const handleClose = () => {
    clearMarkersAndDirections();
    setMap(null);
    setClosestCustomers([]);
    setShowingClosest(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>מפה - {customerName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4">
          {/* Map */}
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg border z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">טוען מפה...</p>
                </div>
              </div>
            )}
            <div 
              ref={mapRef} 
              className="w-full h-full rounded-lg border"
              style={{ direction: 'ltr' }}
            />
          </div>
          
          {/* Side Panel */}
          <div className="w-80 flex-shrink-0 space-y-4 max-h-[calc(90vh-8rem)] overflow-y-auto p-1">
            {/* Customer Info */}
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">{customerName}</h3>
              <p className="text-sm text-muted-foreground">{address}</p>
              <p className="text-sm text-muted-foreground">{city}</p>
              {currentLat && currentLng && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>קואורדינטות: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}</p>
                </div>
              )}
            </div>

            {/* Route Planning */}
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Route className="h-4 w-4" />
                תכנון מסלול
              </h3>
              
              {/* Departure Time Input */}
              <div className="mb-4 space-y-2">
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
                    className="flex-1"
                  />
                </div>
              </div>
              
              {!showingClosest ? (
                <Button 
                  onClick={findClosestCustomers}
                  disabled={isCalculatingClosest || !currentLat || !currentLng}
                  className="w-full"
                  variant="outline"
                >
                  {isCalculatingClosest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      מחפש לקוחות...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      מצא 3 לקוחות קרובים
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={clearClosestDisplay}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    נקה תצוגה
                  </Button>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">3 הלקוחות הקרובים ביותר:</h4>
                    {closestCustomers.map((item, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: ['#2563eb', '#dc2626', '#16a34a'][index] }}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.customer.customername}</span>
                        </div>
                         <p className="text-xs text-muted-foreground">{item.customer.address}, {item.customer.city}</p>
                         <div className="flex justify-between items-center text-xs text-muted-foreground">
                           <div className="flex items-center gap-3">
                             <span>מרחק: {item.distance.toFixed(2)} ק"מ</span>
                             {item.travelTime && (
                               <div className="flex items-center gap-1">
                                 <Clock size={12} />
                                 <span>{item.travelTime}</span>
                               </div>
                             )}
                           </div>
                           {item.customer.orderCount > 1 && (
                             <span className="bg-primary text-primary-foreground px-1 rounded text-xs">
                               {item.customer.orderCount} הזמנות
                             </span>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!currentLat || !currentLng) && (
                <p className="text-xs text-muted-foreground mt-2">
                  אין קואורדינטות ללקוח זה
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};