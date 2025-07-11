import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Route, Navigation } from 'lucide-react';

// Google Maps types
type GoogleMap = google.maps.Map;
type GoogleMapsDirectionsService = google.maps.DirectionsService;
type GoogleMapsDirectionsRenderer = google.maps.DirectionsRenderer;

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
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCC1VMiEQgv0fHVErjT1b1ZJuzJYWEqxmk';

export const RouteMapComponent: React.FC<RouteMapComponentProps> = ({
  customers,
  orderData
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [directionsService, setDirectionsService] = useState<GoogleMapsDirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<GoogleMapsDirectionsRenderer | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || customers.length === 0) return;

      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places']
      });

      try {
        const google = await loader.load();
        
        // Calculate center point
        const bounds = new google.maps.LatLngBounds();
        customers.forEach(customer => {
          bounds.extend({ lat: customer.lat, lng: customer.lng });
        });

        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: 10,
          center: bounds.getCenter(),
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        // Fit map to show all customers
        mapInstance.fitBounds(bounds);

        // Add markers for each customer
        customers.forEach((customer, index) => {
          const customerOrders = orderData.filter(
            item => item.customername === customer.customername
          );
          
          const hasOrders = customerOrders.some(item => item.type === 'order');
          const hasReturns = customerOrders.some(item => item.type === 'return');
          
          // Choose marker color based on type
          let markerColor = '#4285f4'; // Default blue
          if (hasOrders && hasReturns) {
            markerColor = '#ff9800'; // Orange for both
          } else if (hasOrders) {
            markerColor = '#4caf50'; // Green for orders
          } else if (hasReturns) {
            markerColor = '#f44336'; // Red for returns
          }

          const marker = new google.maps.Marker({
            position: { lat: customer.lat, lng: customer.lng },
            map: mapInstance,
            title: customer.customername,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: markerColor,
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8
            },
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; direction: rtl;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold;">${customer.customername}</h3>
                <p style="margin: 0 0 4px 0; color: #666;">${customer.city}</p>
                <p style="margin: 0 0 8px 0; color: #666;">${customer.address}</p>
                <div style="display: flex; gap: 4px;">
                  ${hasOrders ? '<span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">הזמנה</span>' : ''}
                  ${hasReturns ? '<span style="background: #f44336; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">החזרה</span>' : ''}
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
          });
        });

        // Initialize directions service and renderer
        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
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
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initializeMap();
  }, [customers, orderData]);

  const optimizeRoute = async () => {
    if (!directionsService || !directionsRenderer || customers.length < 2) return;

    setIsLoadingRoute(true);
    
    try {
      // Use first customer as start, last as end, and others as waypoints
      const origin = { lat: customers[0].lat, lng: customers[0].lng };
      const destination = { lat: customers[customers.length - 1].lat, lng: customers[customers.length - 1].lng };
      
      const waypoints = customers.slice(1, -1).map(customer => ({
        location: { lat: customer.lat, lng: customer.lng },
        stopover: true
      }));

      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: 'IL'
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          setRouteOptimized(true);
          
          // Log optimized order
          const route = result.routes[0];
          if (route.waypoint_order) {
            console.log('Optimized route order:', route.waypoint_order);
          }
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

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
      setRouteOptimized(false);
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
    <div className="relative h-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      
      {/* Route controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          onClick={optimizeRoute}
          disabled={isLoadingRoute || customers.length < 2}
          className="flex items-center gap-2 bg-white text-gray-700 border shadow-md hover:bg-gray-50"
        >
          <Route size={16} />
          {isLoadingRoute ? 'מחשב מסלול...' : 'מסלול אופטימלי'}
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

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md text-sm">
        <div className="font-semibold mb-2">מקרא:</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>הזמנות בלבד</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>החזרות בלבד</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>הזמנות והחזרות</span>
          </div>
        </div>
      </div>
    </div>
  );
};