import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Route, Navigation, ChevronUp } from 'lucide-react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

declare global {
  interface Window {
    google: any;
  }
}

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

interface RouteMapComponentProps {
  customers: Customer[];
  orderData: OrderData[];
  departureTime: string;
  onRouteOptimized?: (order: number[]) => void;
  onRouteClear?: () => void;
  isMobile?: boolean;
  fuelData?: {
    kmPerLiter?: number;
    pricePerLiter?: number;
  };
}

interface TravelTimeData {
  totalDuration: string;
  totalDurationWithoutTraffic: string;
  totalDistance: string;
  totalFuelCost?: string;
  fuelCalculation?: string;
  segments: Array<{
    from: string;
    to: string;
    duration: string;
    durationWithoutTraffic: string;
    distance: string;
    arrivalTime: string;
    orderNumber: number;
  }>;
}



// בראל אלון - נקודת ההתחלה והסיום הקבועה
const DEPOT_LOCATION = {
  lat: 31.899090,
  lng: 34.738499,
  name: 'בראל אלון',
  address: 'נחל שניר 5',
  city: 'יבנה'
};

export const RouteMapComponent = forwardRef<any, RouteMapComponentProps>(({
  customers,
  orderData,
  departureTime,
  onRouteOptimized,
  onRouteClear,
  isMobile = false,
  fuelData
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [travelTimeData, setTravelTimeData] = useState<TravelTimeData | null>(null);
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>([]);
  const [customerMarkers, setCustomerMarkers] = useState<any[]>([]);

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    optimizeRoute,
    clearRoute
  }));

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || customers.length === 0 || !window.google) return;

      // Calculate center point including depot
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng });
      customers.forEach(customer => {
        bounds.extend({ lat: customer.lat, lng: customer.lng });
      });

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: bounds.getCenter(),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });

      // Fit map to show all customers and depot
      mapInstance.fitBounds(bounds);

        // Add depot marker (starting point)
        const depotMarker = new window.google.maps.Marker({
          position: { lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng },
          map: mapInstance,
          title: DEPOT_LOCATION.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#FF0000',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 12
          },
          label: {
            text: 'מ',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          }
        });

        const depotInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; direction: rtl;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #FF0000;">${DEPOT_LOCATION.name}</h3>
              <p style="margin: 0 0 4px 0; color: #666;">${DEPOT_LOCATION.city}</p>
              <p style="margin: 0 0 8px 0; color: #666;">${DEPOT_LOCATION.address}</p>
              <span style="background: #FF0000; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">נקודת התחלה וסיום</span>
            </div>
          `
        });

        depotMarker.addListener('click', () => {
          depotInfoWindow.open(mapInstance, depotMarker);
        });

        // Add markers for each customer (initially without numbers)
        const markers: any[] = [];
        customers.forEach((customer, index) => {
          const marker = new window.google.maps.Marker({
            position: { lat: customer.lat, lng: customer.lng },
            map: mapInstance,
            title: customer.customername,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285f4',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 15
            }
          });

          // Create info window (only opens on click)
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; direction: rtl;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold;">${customer.customername}</h3>
                <p style="margin: 0 0 4px 0; color: #666;">${customer.city}</p>
                <p style="margin: 0 0 8px 0; color: #666;">${customer.address}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
          });

          markers.push(marker);
        });

        setCustomerMarkers(markers);

        // Initialize directions service and renderer
        const directionsServiceInstance = new window.google.maps.DirectionsService();
        const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: true, // Keep our custom markers
          polylineOptions: {
            strokeColor: '#2196f3',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setCustomerMarkers(markers);
    };

    initializeMap();
  }, [customers, orderData]);

  const optimizeRoute = async () => {
    if (!directionsService || !directionsRenderer || customers.length === 0) return;

    setIsLoadingRoute(true);
    
    try {
      // Always start and end at depot (בראל אלון)
      const origin = { lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng };
      const destination = { lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng };
      
      const waypoints = customers.map(customer => ({
        location: { lat: customer.lat, lng: customer.lng },
        stopover: true
      }));

      // Always use current time for Google Maps API (for traffic data accuracy)
      const currentDateTime = new Date();

      const request: any = {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        region: 'IL',
        drivingOptions: {
          departureTime: currentDateTime,
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        }
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          setRouteOptimized(true);
          
          // Store optimized order
          const waypointOrder = result.routes[0].waypoint_order || customers.map((_, i) => i);
          setOptimizedOrder(waypointOrder);
          
          // Update markers with route numbers
          updateMarkersWithRouteNumbers(waypointOrder);
          
          // Notify parent of route optimization
          onRouteOptimized?.(waypointOrder);
          
          // Calculate travel time data
          const route = result.routes[0];
          const legs = route.legs;
          
           let totalDuration = 0;
           let totalDurationWithoutTraffic = 0;
           let totalDistance = 0;
           // Use user-defined departure time for display calculations
           let currentTime = new Date();
           const [hours, minutes] = departureTime.split(':');
           currentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const segments: TravelTimeData['segments'] = [];

          legs.forEach((leg, index) => {
            const dwellTime = 25 * 60; // 25 minutes in seconds
            totalDuration += (leg.duration?.value || 0) + (index < legs.length - 1 ? dwellTime : 0);
            totalDurationWithoutTraffic += (leg.duration?.value || 0) + (index < legs.length - 1 ? dwellTime : 0);
            totalDistance += leg.distance?.value || 0;
            
            let fromName, toName;
            if (index === 0) {
              fromName = DEPOT_LOCATION.name;
            } else {
              const waypointIndex = waypointOrder[index - 1];
              fromName = customers[waypointIndex]?.customername || `נקודה ${index}`;
            }
            
            if (index === legs.length - 1) {
              toName = DEPOT_LOCATION.name;
            } else {
              const waypointIndex = waypointOrder[index];
              toName = customers[waypointIndex]?.customername || `נקודה ${index + 1}`;
            }

            // Calculate arrival time
            const arrivalTime = new Date(currentTime.getTime() + (leg.duration?.value || 0) * 1000);
            currentTime = new Date(arrivalTime.getTime() + dwellTime * 1000);

            segments.push({
              from: fromName,
              to: toName,
              duration: leg.duration?.text || '',
              durationWithoutTraffic: leg.duration?.text || '', // Google doesn't provide separate without traffic time
              distance: leg.distance?.text || '',
              arrivalTime: arrivalTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
              orderNumber: index < legs.length - 1 ? index + 1 : -1 // Return to depot gets -1
            });
          });

          // Calculate fuel cost if data is available
          let fuelCost = '';
          let fuelCalculation = '';
          if (fuelData?.kmPerLiter && fuelData?.pricePerLiter) {
            const distanceKm = totalDistance / 1000;
            const litersNeeded = distanceKm / fuelData.kmPerLiter;
            const cost = litersNeeded * fuelData.pricePerLiter;
            fuelCost = `${cost.toFixed(1)} ₪`;
            fuelCalculation = `(${distanceKm.toFixed(1)} ÷ ${fuelData.kmPerLiter}) × ${fuelData.pricePerLiter.toFixed(2)} = ${cost.toFixed(1)} ₪`;
          }

          setTravelTimeData({
            totalDuration: `${Math.floor(totalDuration / 3600)}:${Math.floor((totalDuration % 3600) / 60).toString().padStart(2, '0')}`,
            totalDurationWithoutTraffic: `${Math.floor(totalDurationWithoutTraffic / 3600)}:${Math.floor((totalDurationWithoutTraffic % 3600) / 60).toString().padStart(2, '0')}`,
            totalDistance: `${(totalDistance / 1000).toFixed(1)} ק"מ`,
            totalFuelCost: fuelCost,
            fuelCalculation: fuelCalculation,
            segments
          });
        } else {
          console.error('Directions request failed:', status);
        }
        setIsLoadingRoute(false);
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
      setIsLoadingRoute(false);
    }
  };

  const updateMarkersWithRouteNumbers = (waypointOrder: number[]) => {
    customerMarkers.forEach((marker, index) => {
      const routeIndex = waypointOrder.indexOf(index);
      if (routeIndex !== -1) {
        marker.setLabel({
          text: `${routeIndex + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        });
      }
    });
  };

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
      setRouteOptimized(false);
      setTravelTimeData(null);
      setOptimizedOrder([]);
      
      // Remove numbers from markers
      customerMarkers.forEach(marker => {
        marker.setLabel(null);
      });
      
      // Notify parent of route clear
      onRouteClear?.();
    }
  };

  if (customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <Navigation size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">אין נקודות זמינות למפה</p>
          <p className="text-sm text-gray-400 mt-2">
            נקודות ללא קואורדינטות לא יוצגו במפה
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full" data-map-component>
      <div 
        ref={mapRef} 
        className={`w-full rounded-lg ${isMobile ? 'h-[400px]' : 'h-full'}`}
        style={{ direction: 'ltr' }}
      />
      
      {/* Route controls - Desktop only */}
      {!isMobile && (
        <div className="absolute top-4 right-4 space-y-2">
          <Button
            onClick={optimizeRoute}
            disabled={isLoadingRoute || customers.length === 0}
            className="flex items-center gap-2 bg-white text-gray-700 border shadow-md hover:bg-gray-50"
          >
            <Route size={16} />
            {isLoadingRoute ? 'מחשב...' : 'מסלול אופטימלי'}
          </Button>
          
          {routeOptimized && (
            <Button
              onClick={clearRoute}
              variant="outline"
              className="flex items-center gap-2 bg-white border shadow-md"
            >
              נקה מסלול
            </Button>
          )}
        </div>
      )}

      {/* Travel Time Data - Desktop */}
      {travelTimeData && !isMobile && (
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-md text-sm max-w-96 max-h-80 overflow-y-auto z-20">
          <div className="font-semibold mb-3 text-primary">נתוני נסיעה:</div>
          
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
              <span className="font-medium">סה"כ זמן (כולל פקקים):</span>
              <span className="font-bold text-primary">{travelTimeData.totalDuration}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="font-medium">זמן ללא פקקים:</span>
              <span className="font-bold text-green-600">{travelTimeData.totalDurationWithoutTraffic}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-secondary/10 rounded">
              <span className="font-medium">סה"כ מרחק:</span>
              <span className="font-bold">{travelTimeData.totalDistance}</span>
            </div>
            {travelTimeData.totalFuelCost && (
              <div className="space-y-1">
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="font-medium">סה"כ דלק:</span>
                  <span className="font-bold text-orange-600">{travelTimeData.totalFuelCost}</span>
                </div>
                {travelTimeData.fuelCalculation && (
                  <div className="text-xs text-muted-foreground px-2">
                    {travelTimeData.fuelCalculation}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <div className="font-medium mb-2">סדר נסיעה ושעות הגעה:</div>
            <div className="space-y-2 text-xs">
              {travelTimeData.segments.map((segment, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {segment.orderNumber === -1 ? (
                        <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          מ
                        </span>
                      ) : (
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {segment.orderNumber}
                        </span>
                      )}
                      <span className="font-medium">
                        {segment.orderNumber === -1 ? 'חזרה למחסן - ' : ''}{segment.to}
                      </span>
                    </div>
                    <span className="text-blue-600 font-bold">{segment.arrivalTime}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>זמן נסיעה: {segment.duration}</span>
                    <span>מרחק: {segment.distance}</span>
                  </div>
                  {segment.orderNumber !== -1 && (
                    <div className="text-xs text-orange-600 mt-1">
                      + 25 דקות שהייה בנקודה
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Travel Time Data - Mobile Drawer */}
      {travelTimeData && isMobile && (
        <Drawer>
          <DrawerTrigger asChild>
            <Button 
              className="absolute bottom-4 left-4 right-4 bg-white text-gray-700 border shadow-md hover:bg-gray-50 flex items-center justify-center gap-2"
              size="sm"
            >
              <ChevronUp size={16} />
              נתוני נסיעה - {travelTimeData.totalDuration}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader>
              <DrawerTitle className="text-center">נתוני נסיעה</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-medium text-sm">סה"כ זמן (כולל פקקים):</span>
                  <span className="font-bold text-primary">{travelTimeData.totalDuration}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-sm">זמן ללא פקקים:</span>
                  <span className="font-bold text-green-600">{travelTimeData.totalDurationWithoutTraffic}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                  <span className="font-medium text-sm">סה"כ מרחק:</span>
                  <span className="font-bold">{travelTimeData.totalDistance}</span>
                </div>
                {travelTimeData.totalFuelCost && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-sm">סה"כ דלק:</span>
                      <span className="font-bold text-orange-600">{travelTimeData.totalFuelCost}</span>
                    </div>
                    {travelTimeData.fuelCalculation && (
                      <div className="text-xs text-muted-foreground px-3">
                        {travelTimeData.fuelCalculation}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="font-medium mb-3 text-center">סדר נסיעה ושעות הגעה</div>
                <div className="space-y-3">
                  {travelTimeData.segments.map((segment, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {segment.orderNumber === -1 ? (
                            <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              מ
                            </span>
                          ) : (
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {segment.orderNumber}
                            </span>
                          )}
                          <span className="font-medium text-sm">
                            {segment.orderNumber === -1 ? 'חזרה למחסן - ' : ''}{segment.to}
                          </span>
                        </div>
                        <span className="text-blue-600 font-bold text-sm">{segment.arrivalTime}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>זמן נסיעה: {segment.duration}</span>
                        <span>מרחק: {segment.distance}</span>
                      </div>
                      {segment.orderNumber !== -1 && (
                        <div className="text-xs text-orange-600 mt-2">
                          + 25 דקות שהייה בנקודה
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
});