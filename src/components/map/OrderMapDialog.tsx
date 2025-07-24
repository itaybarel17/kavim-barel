import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  kanbanAreas?: Array<{
    customername: string;
    address: string;
    city: string;
    schedule_id: number;
    area_name: string;
    lat?: number;
    lng?: number;
  }>;
}

interface ClosestPoint {
  customername: string;
  address: string;
  city: string;
  schedule_id: number;
  area_name: string;
  distance: string;
  duration: string;
  color: string;
  lat: number;
  lng: number;
}

export const OrderMapDialog: React.FC<OrderMapDialogProps> = ({
  isOpen,
  onClose,
  customerName,
  address,
  city,
  kanbanAreas = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [closestPoints, setClosestPoints] = useState<ClosestPoint[]>([]);
  const [isLoadingClosest, setIsLoadingClosest] = useState(false);
  const [showClosestPoints, setShowClosestPoints] = useState(false);
  const [directionsRenderers, setDirectionsRenderers] = useState<any[]>([]);

  const colors = ['#FF0000', '#00FF00', '#0000FF']; // Red, Green, Blue

  // Initialize map when dialog opens
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Check if Google Maps API is loaded
    if (typeof window.google === 'undefined' || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }

    // Check if required services are available
    if (!window.google.maps.Geocoder || !window.google.maps.DistanceMatrixService || !window.google.maps.DirectionsService) {
      console.error('Required Google Maps services not available');
      return;
    }

    // Geocode the address to get coordinates
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: `${address}, ${city}`, region: 'IL' },
      (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const coords = { lat: location.lat(), lng: location.lng() };
          setTargetLocation(coords);

          const mapInstance = new window.google.maps.Map(mapRef.current, {
            zoom: 15,
            center: coords,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          // Add marker for the target address
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
              text: 'יעד',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });

          setMap(mapInstance);
        }
      }
    );
  }, [isOpen, address, city, customerName]);

  const findClosestPoints = async () => {
    if (!targetLocation || kanbanAreas.length === 0 || !window.google) return;

    setIsLoadingClosest(true);
    const service = new window.google.maps.DistanceMatrixService();
    
    // Get current time for departure
    const now = new Date();
    
    try {
      // Get coordinates for all kanban areas
      const geocoder = new window.google.maps.Geocoder();
      const areasWithCoords = await Promise.all(
        kanbanAreas.map(async (area) => {
          try {
            const result = await new Promise<any>((resolve, reject) => {
              geocoder.geocode(
                { address: `${area.address}, ${area.city}`, region: 'IL' },
                (results: any, status: any) => {
                  if (status === 'OK' && results[0]) {
                    resolve(results[0]);
                  } else {
                    reject(new Error(`Geocoding failed for ${area.address}`));
                  }
                }
              );
            });
            
            return {
              ...area,
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng()
            };
          } catch (error) {
            console.warn(`Failed to geocode ${area.address}:`, error);
            return null;
          }
        })
      );

      const validAreas = areasWithCoords.filter(area => area !== null);
      
      if (validAreas.length === 0) {
        setIsLoadingClosest(false);
        return;
      }

      // Calculate distances using DistanceMatrix API
      const destinations = validAreas.map(area => ({ lat: area.lat, lng: area.lng }));
      
      service.getDistanceMatrix({
        origins: [targetLocation],
        destinations: destinations,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        drivingOptions: {
          departureTime: now,
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        },
        region: 'IL'
      }, (response: any, status: any) => {
        if (status === 'OK') {
          const results: ClosestPoint[] = [];
          
          response.rows[0].elements.forEach((element: any, index: number) => {
            if (element.status === 'OK' && validAreas[index]) {
              results.push({
                ...validAreas[index],
                distance: element.distance.text,
                duration: element.duration.text,
                color: colors[results.length % colors.length]
              });
            }
          });
          
          // Sort by distance and take top 3
          results.sort((a, b) => {
            const aVal = parseFloat(a.distance.replace(/[^\d.]/g, ''));
            const bVal = parseFloat(b.distance.replace(/[^\d.]/g, ''));
            return aVal - bVal;
          });
          
          const top3 = results.slice(0, 3);
          setClosestPoints(top3);
          setShowClosestPoints(true);
          
          // Draw arrows on map
          drawDirectionsToPoints(top3);
        }
        setIsLoadingClosest(false);
      });
    } catch (error) {
      console.error('Error finding closest points:', error);
      setIsLoadingClosest(false);
    }
  };

  const drawDirectionsToPoints = (points: ClosestPoint[]) => {
    if (!map || !targetLocation) return;

    // Clear existing directions
    directionsRenderers.forEach(renderer => renderer.setMap(null));
    setDirectionsRenderers([]);

    const directionsService = new window.google.maps.DirectionsService();
    const newRenderers: any[] = [];

    points.forEach((point, index) => {
      const renderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: point.color,
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });

      directionsService.route({
        origin: targetLocation,
        destination: { lat: point.lat!, lng: point.lng! },
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result: any, status: any) => {
        if (status === 'OK') {
          renderer.setDirections(result);
        }
      });

      // Add colored marker for destination
      new window.google.maps.Marker({
        position: { lat: point.lat!, lng: point.lng! },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: point.color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 12
        },
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });

      newRenderers.push(renderer);
    });

    setDirectionsRenderers(newRenderers);
  };

  const handleClose = () => {
    // Clear directions when closing
    directionsRenderers.forEach(renderer => renderer.setMap(null));
    setDirectionsRenderers([]);
    setClosestPoints([]);
    setShowClosestPoints(false);
    setTargetLocation(null);
    setMap(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
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
          <div className="flex-1">
            <div 
              ref={mapRef} 
              className="w-full h-full rounded-lg border"
              style={{ direction: 'ltr' }}
            />
          </div>
          
          {/* Side Panel */}
          <div className="w-80 space-y-4 overflow-y-auto">
            {/* Customer Info */}
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">{customerName}</h3>
              <p className="text-sm text-muted-foreground">{address}</p>
              <p className="text-sm text-muted-foreground">{city}</p>
            </div>
            
            {/* Closest Points Button */}
            <Button 
              onClick={findClosestPoints}
              disabled={isLoadingClosest || kanbanAreas.length === 0}
              className="w-full"
            >
              {isLoadingClosest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  מחפש נקודות...
                </>
              ) : (
                'הנקודה הקרובה ביותר אליה מהקווים'
              )}
            </Button>
            
            {/* Closest Points Results */}
            {showClosestPoints && closestPoints.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">3 הנקודות הקרובות ביותר:</h4>
                {closestPoints.map((point, index) => (
                  <div 
                    key={`${point.schedule_id}-${index}`}
                    className="p-3 border rounded-lg"
                    style={{ borderColor: point.color }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: point.color }}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">{point.customername}</span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{point.address}, {point.city}</p>
                      <div className="flex justify-between">
                        <span>מזהה לוח זמנים: {point.schedule_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>אזור: {point.area_name}</span>
                      </div>
                      <div className="flex gap-4">
                        <Badge variant="outline" style={{ color: point.color, borderColor: point.color }}>
                          מרחק: {point.distance}
                        </Badge>
                        <Badge variant="outline" style={{ color: point.color, borderColor: point.color }}>
                          זמן: {point.duration}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};