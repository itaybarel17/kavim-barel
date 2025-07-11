import React, { useEffect, useRef } from 'react';
import { getAreaColorHex } from '@/utils/areaColors';

interface City {
  cityid: number;
  city: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
}

interface MapComponentProps {
  cities: City[];
}

declare global {
  interface Window {
    google: any;
  }
}

export const MapComponent: React.FC<MapComponentProps> = ({ cities }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Initialize map centered on Israel
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 31.7683, lng: 35.2137 }, // Center of Israel
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for cities with valid coordinates
    const validCities = cities.filter(city => 
      city.lat !== null && 
      city.lng !== null && 
      !isNaN(Number(city.lat)) && 
      !isNaN(Number(city.lng))
    );

    validCities.forEach(city => {
      const position = { 
        lat: Number(city.lat), 
        lng: Number(city.lng) 
      };

      const areaColor = getAreaColorHex(city.area || 'לא מוגדר');

      // Create custom marker icon with area color
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: city.city,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: areaColor,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        },
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
              ${city.city}
            </div>
            <div style="color: #666; font-size: 12px;">
              אזור: ${city.area || 'לא מוגדר'}
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(({ infoWindow: iw }) => iw?.close());
        infoWindow.open(map, marker);
      });

      markersRef.current.push({ marker, infoWindow });
    });

    // Adjust map bounds if there are markers
    if (validCities.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validCities.forEach(city => {
        bounds.extend({ lat: Number(city.lat), lng: Number(city.lng) });
      });
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 8) map.setZoom(8);
        window.google.maps.event.removeListener(listener);
      });
    }

    return () => {
      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [cities]);

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">מפת ערים</h2>
        <p className="text-sm text-muted-foreground">נקודות מוצבעות לפי אזור</p>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-[400px]"
        style={{ direction: 'ltr' }}
      />
    </div>
  );
};