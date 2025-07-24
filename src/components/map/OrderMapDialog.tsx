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
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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

        // Add marker if we have coordinates
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
              text: 'יעד',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });
          console.log('✅ Marker added with coordinates');
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