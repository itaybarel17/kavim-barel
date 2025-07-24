import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';

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

export const OrderMapDialog: React.FC<OrderMapDialogProps> = ({
  isOpen,
  onClose,
  customerName,
  address,
  city,
  lat,
  lng,
  kanbanAreas = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);

  // Initialize map when dialog opens - simplified version
  useEffect(() => {
    const initializeMap = () => {
      if (!isOpen || !mapRef.current || !window.google) {
        console.log('Map init conditions not met:', { isOpen, mapRef: !!mapRef.current, google: !!window.google });
        return;
      }

      console.log('Initializing map for customer:', customerName);

      try {
        // Use lat/lng directly if available
        if (lat && lng) {
          console.log('Using direct coordinates:', { lat, lng });
          const coords = { lat, lng };

          const mapInstance = new window.google.maps.Map(mapRef.current, {
            zoom: 15,
            center: coords,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          // Add simple marker
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
          console.log('Map initialized successfully with coordinates');
        } else {
          console.log('No coordinates provided, using geocoding fallback');
          // Fallback to geocoding
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { address: `${address}, ${city}`, region: 'IL' },
            (results: any, status: any) => {
              console.log('Geocoding result:', { status, results });
              if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const coords = { lat: location.lat(), lng: location.lng() };

                const mapInstance = new window.google.maps.Map(mapRef.current, {
                  zoom: 15,
                  center: coords,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                });

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
                console.log('Map initialized successfully with geocoding');
              } else {
                console.error('Geocoding failed:', status);
              }
            }
          );
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();
  }, [isOpen, address, city, customerName, lat, lng]);

  const handleClose = () => {
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
              {lat && lng && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>קואורדינטות: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};