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
  departureTime: string;
}

interface TravelTimeData {
  totalDuration: string;
  totalDistance: string;
  segments: Array<{
    from: string;
    to: string;
    duration: string;
    distance: string;
  }>;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCC1VMiEQgv0fHVErjT1b1ZJuzJYWEqxmk';

// בראל אלון - נקודת ההתחלה והסיום הקבועה
const DEPOT_LOCATION = {
  lat: 31.899090,
  lng: 34.738499,
  name: 'בראל אלון',
  address: 'נחל שניר 5',
  city: 'יבנה'
};

export const RouteMapComponent: React.FC<RouteMapComponentProps> = ({
  customers,
  orderData,
  departureTime
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [directionsService, setDirectionsService] = useState<GoogleMapsDirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<GoogleMapsDirectionsRenderer | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [travelTimeData, setTravelTimeData] = useState<TravelTimeData | null>(null);

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
        
        // Calculate center point including depot
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng });
        customers.forEach(customer => {
          bounds.extend({ lat: customer.lat, lng: customer.lng });
        });

        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: 10,
          center: bounds.getCenter(),
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        // Fit map to show all customers and depot
        mapInstance.fitBounds(bounds);

        // Add depot marker (starting point)
        const depotMarker = new google.maps.Marker({
          position: { lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng },
          map: mapInstance,
          title: DEPOT_LOCATION.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
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

        const depotInfoWindow = new google.maps.InfoWindow({
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

        // Add markers for each customer
        customers.forEach((customer, index) => {
          const marker = new google.maps.Marker({
            position: { lat: customer.lat, lng: customer.lng },
            map: mapInstance,
            title: customer.customername,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285f4',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 15
            },
            label: {
              text: `${index + 1}`,
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
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
          });

          // Add customer name label next to marker
          const nameLabel = new google.maps.InfoWindow({
            content: `<div style="background: transparent; border: none; box-shadow: none; font-size: 11px; font-weight: bold; color: #333; direction: rtl;">${customer.customername}</div>`,
            position: { lat: customer.lat + 0.003, lng: customer.lng },
            disableAutoPan: true
          });
          nameLabel.open(mapInstance);
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

      // Create departure time for today
      const today = new Date();
      const [hours, minutes] = departureTime.split(':');
      const departureDateTime = new Date(today);
      departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: 'IL',
        drivingOptions: {
          departureTime: departureDateTime,
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          setRouteOptimized(true);
          
          // Calculate travel time data
          const route = result.routes[0];
          const legs = route.legs;
          
          let totalDuration = 0;
          let totalDistance = 0;
          const segments: TravelTimeData['segments'] = [];

          legs.forEach((leg, index) => {
            totalDuration += leg.duration?.value || 0;
            totalDistance += leg.distance?.value || 0;
            
            let fromName, toName;
            if (index === 0) {
              fromName = DEPOT_LOCATION.name;
            } else {
              const waypointIndex = route.waypoint_order ? route.waypoint_order[index - 1] : index - 1;
              fromName = customers[waypointIndex]?.customername || `נקודה ${index}`;
            }
            
            if (index === legs.length - 1) {
              toName = DEPOT_LOCATION.name;
            } else {
              const waypointIndex = route.waypoint_order ? route.waypoint_order[index] : index;
              toName = customers[waypointIndex]?.customername || `נקודה ${index + 1}`;
            }

            segments.push({
              from: fromName,
              to: toName,
              duration: leg.duration?.text || '',
              distance: leg.distance?.text || ''
            });
          });

          setTravelTimeData({
            totalDuration: `${Math.floor(totalDuration / 3600)}:${Math.floor((totalDuration % 3600) / 60).toString().padStart(2, '0')}`,
            totalDistance: `${(totalDistance / 1000).toFixed(1)} ק"מ`,
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

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
      setRouteOptimized(false);
      setTravelTimeData(null);
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
          disabled={isLoadingRoute || customers.length === 0}
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

      {/* Travel Time Data */}
      {travelTimeData && (
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-md text-sm max-w-80 max-h-60 overflow-y-auto">
          <div className="font-semibold mb-3 text-primary">נתוני נסיעה:</div>
          
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
              <span className="font-medium">סה"כ זמן:</span>
              <span className="font-bold text-primary">{travelTimeData.totalDuration}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-secondary/10 rounded">
              <span className="font-medium">סה"כ מרחק:</span>
              <span className="font-bold">{travelTimeData.totalDistance}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="font-medium mb-2">זמני נסיעה בין נקודות:</div>
            <div className="space-y-1 text-xs">
              {travelTimeData.segments.map((segment, index) => (
                <div key={index} className="flex justify-between items-center p-1 border-b border-border/50">
                  <div className="flex-1 text-right">
                    <div>{segment.from}</div>
                    <div className="text-muted-foreground">↓</div>
                    <div>{segment.to}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{segment.duration}</div>
                    <div className="text-muted-foreground">{segment.distance}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};