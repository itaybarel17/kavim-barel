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
  lat,
  lng
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
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
  
  // Fetch active customers with coordinates from database (one record per customer)
  const fetchActiveCustomersWithCoordinates = async (): Promise<CustomerWithCoordinates[]> => {
    try {
      console.log('Fetching active customers from database...');
      
      // First, get active orders with schedule_id but without done_mainorder
      const { data: activeOrders, error: ordersError } = await supabase
        .from('mainorder')
        .select('ordernumber, customername, customernumber, schedule_id')
        .not('schedule_id', 'is', null)
        .is('done_mainorder', null);

      if (ordersError) {
        console.error('Error fetching active orders:', ordersError);
        return [];
      }

      console.log('Active orders found:', activeOrders?.length || 0);

      if (!activeOrders || activeOrders.length === 0) {
        return [];
      }

      // Get unique customer numbers and count orders per customer
      const customerOrderCounts = new Map<string, number>();
      activeOrders.forEach(order => {
        const count = customerOrderCounts.get(order.customernumber) || 0;
        customerOrderCounts.set(order.customernumber, count + 1);
      });

      const customerNumbers = Array.from(customerOrderCounts.keys());
      console.log('Unique customer numbers:', customerNumbers.length);

      // Fetch customer coordinates from customerlist
      const { data: customersWithCoords, error: coordsError } = await supabase
        .from('customerlist')
        .select('customernumber, customername, address, city, lat, lng')
        .in('customernumber', customerNumbers)
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (coordsError) {
        console.error('Error fetching customer coordinates:', coordsError);
        return [];
      }

      console.log('Customers with coordinates found:', customersWithCoords?.length || 0);

      if (!customersWithCoords) {
        return [];
      }

      // Combine the data - one record per customer with order count
      const uniqueCustomers: CustomerWithCoordinates[] = customersWithCoords.map(customer => {
        const orderCount = customerOrderCounts.get(customer.customernumber) || 1;
        const sampleOrder = activeOrders.find(order => order.customernumber === customer.customernumber);
        
        return {
          customernumber: customer.customernumber,
          customername: customer.customername || sampleOrder?.customername || '',
          address: customer.address || '',
          city: customer.city || '',
          lat: customer.lat,
          lng: customer.lng,
          orderCount: orderCount
        };
      });

      console.log('Final unique customers:', uniqueCustomers.length);
      console.log('Sample customer data:', uniqueCustomers[0]);
      
      return uniqueCustomers;
      
    } catch (error) {
      console.error('Error in fetchActiveCustomersWithCoordinates:', error);
      return [];
    }
  };

  // Find 3 closest customers
  const findClosestCustomers = async () => {
    if (!map || !lat || !lng) return;
    
    setIsCalculatingClosest(true);
    console.log('Finding closest customers...');
    console.log('Starting point (clicked customer):', { lat, lng });
    
    try {
      // Fetch customers from database
      const activeCustomers = await fetchActiveCustomersWithCoordinates();
      
      if (activeCustomers.length === 0) {
        console.log('No active customers found');
        setIsCalculatingClosest(false);
        return;
      }

      // Filter customers with valid coordinates, excluding those at the same location as starting point
      const validCustomers = activeCustomers.filter(customer => 
        customer.lat && customer.lng && 
        !(customer.lat === lat && customer.lng === lng)
      );
      
      console.log('Valid customers with coordinates:', validCustomers.length);
      
      // Calculate distances from the clicked customer (starting point)
      const customersWithDistance = validCustomers.map(customer => ({
        customer: customer,
        distance: calculateDistance(lat, lng, customer.lat, customer.lng)
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
    if (!window.google || !lat || !lng) return customers;
    
    try {
      const service = new window.google.maps.DistanceMatrixService();
      const destinations = customers.map(item => 
        new window.google.maps.LatLng(item.customer.lat, item.customer.lng)
      );
      
      // Parse departure time
      const now = new Date();
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      return new Promise<Array<{customer: CustomerWithCoordinates; distance: number; travelTime?: string}>>((resolve) => {
        service.getDistanceMatrix({
          origins: [new window.google.maps.LatLng(lat, lng)],
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
          if (status === 'OK' && response.rows[0]) {
            const results = customers.map((customer, index) => {
              const element = response.rows[0].elements[index];
              let travelTime = 'לא זמין';
              
              if (element.status === 'OK' && element.duration_in_traffic) {
                travelTime = element.duration_in_traffic.text;
              } else if (element.status === 'OK' && element.duration) {
                travelTime = element.duration.text;
              }
              
              return {
                ...customer,
                travelTime
              };
            });
            resolve(results);
          } else {
            console.log('Distance Matrix API failed, using distance only');
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
    if (!map || !window.google) return;
    
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
        origin: { lat: lat!, lng: lng! },
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
    bounds.extend({ lat: lat!, lng: lng! });
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
    if (map && lat && lng) {
      const coords = { lat, lng };
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

  // Initialize map when dialog opens with improved timing and retry
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setRetryCount(0);
      return;
    }

    const attemptMapInitialization = () => {
      console.log('=== Map initialization attempt ===');
      console.log('Conditions check:', {
        isOpen,
        mapRef: !!mapRef.current,
        windowGoogle: !!window.google,
        googleMaps: !!(window.google?.maps),
        googleMapsMap: !!(window.google?.maps?.Map),
        retryCount
      });

      if (!mapRef.current) {
        console.log('❌ Map ref not ready');
        return false;
      }

      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        console.log('❌ Google Maps API not fully loaded');
        return false;
      }

      console.log('✅ All conditions met, initializing map for:', customerName);
      setIsLoading(true);

      try {
        // Create a simple empty map first
        const coords = lat && lng ? { lat, lng } : { lat: 32.0853, lng: 34.7818 }; // Default to Tel Aviv
        console.log('Using coordinates:', coords);

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: lat && lng ? 15 : 10,
          center: coords,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        console.log('✅ Map instance created successfully');

        // Add starting point marker (the clicked customer) if we have coordinates
        if (lat && lng) {
          new window.google.maps.Marker({
            position: coords,
            map: mapInstance,
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
          console.log('✅ Starting point marker added with coordinates');
        }

        setMap(mapInstance);
        setIsLoading(false);
        setRetryCount(0);
        console.log('✅ Map initialization completed successfully');
        return true;
      } catch (error) {
        console.error('❌ Error during map initialization:', error);
        setIsLoading(false);
        return false;
      }
    };

    // Initial attempt with delay
    const initializeWithDelay = () => {
      setTimeout(() => {
        const success = attemptMapInitialization();
        
        // Retry mechanism if failed and we haven't exceeded max retries
        if (!success && retryCount < 3) {
          console.log(`Retrying map initialization (attempt ${retryCount + 1})`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            attemptMapInitialization();
          }, 500 * (retryCount + 1)); // Increasing delay
        }
      }, 100);
    };

    initializeWithDelay();
  }, [isOpen, customerName, lat, lng, retryCount]);

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
              {lat && lng && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>קואורדינטות: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
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
                  disabled={isCalculatingClosest || !lat || !lng}
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
              
              {(!lat || !lng) && (
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