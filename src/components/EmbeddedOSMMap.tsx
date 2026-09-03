import React, { useEffect, useRef, useState } from 'react';
import { Landmark } from '../types';

interface EmbeddedOSMMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Landmark[];
  selectedMarker: Landmark | null;
  onSelectMarker: (marker: Landmark) => void;
}

export const EmbeddedOSMMap: React.FC<EmbeddedOSMMapProps> = ({
  center,
  zoom,
  markers,
  selectedMarker,
  onSelectMarker,
}) => {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [loadError, setFormError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string, any>>(new Map());

  // Dynamically load Leaflet library from CDN to prevent any compile-time or dependency environment issues
  useEffect(() => {
    // Check if Leaflet is already loaded on window
    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    // 1. Load Leaflet CSS
    const cssId = 'leaflet-cdn-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // 2. Load Leaflet JS
    const jsId = 'leaflet-cdn-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.async = true;
      script.onload = () => {
        setIsLeafletLoaded(true);
      };
      script.onerror = () => {
        setFormError('Failed to load OpenStreetMap script. Please check your internet connection.');
      };
      document.body.appendChild(script);
    } else {
      // Script tag exists, wait for load
      const interval = setInterval(() => {
        if ((window as any).L) {
          setIsLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Check if map is already initialized on this container
    if (mapInstanceRef.current) {
      return;
    }

    try {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView([center.lat, center.lng], zoom);

      // Add standard high-quality OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add a group to hold all hotel markers
      const markerGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = markerGroup;
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }

    return () => {
      // Clean up Leaflet map instance on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
        markerMapRef.current.clear();
      }
    };
  }, [isLeafletLoaded]);

  // Handle camera position updates when center/zoom props change
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    const currentCenter = mapInstanceRef.current.getCenter();
    const currentZoom = mapInstanceRef.current.getZoom();

    const centerDist = Math.abs(currentCenter.lat - center.lat) + Math.abs(currentCenter.lng - center.lng);
    const zoomDist = Math.abs(currentZoom - zoom);

    // Smooth transition if the location changes
    if (centerDist > 0.0001 || zoomDist > 0.1) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [center.lat, center.lng, zoom]);

  // Handle marker updates
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !markerGroupRef.current) return;

    // Clear old markers
    markerGroupRef.current.clearLayers();
    markerMapRef.current.clear();

    // Custom marker icons to prevent assets missing in bundler
    const defaultHotelIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const selectedHotelIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    markers.forEach((marker) => {
      if (marker.lat === undefined || marker.lng === undefined) return;

      const isSelected = selectedMarker?.id === marker.id;
      const icon = isSelected ? selectedHotelIcon : defaultHotelIcon;

      const mapMarker = L.marker([marker.lat, marker.lng], { icon })
        .addTo(markerGroupRef.current);

      // Create a gorgeous custom HTML tooltip for instant hover feedback
      const categoryEmoji: Record<string, string> = {
        hotel: '🏨',
        sacred: '🙏',
        nature: '🌿',
        beach: '🏖️',
        historical: '🏛️',
        cultural: '🎎',
      };
      const emoji = categoryEmoji[marker.category] || '📍';
      const categoryLabel = marker.category.charAt(0).toUpperCase() + marker.category.slice(1);
      mapMarker.bindTooltip(
        `<div class="p-1.5 font-sans">
          <div class="font-bold text-xs text-neutral-800">${marker.name}</div>
          <div class="text-[10px] text-amber-600 font-medium capitalize mt-0.5">${emoji} ${categoryLabel}${marker.location ? ` · ${marker.location}` : ''}</div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95,
        }
      );

      // Handle marker click
      mapMarker.on('click', () => {
        onSelectMarker(marker);
      });

      markerMapRef.current.set(marker.id, mapMarker);
    });

    // If there is an active selected hotel, fly to it and open tooltip
    if (selectedMarker) {
      const activeMapMarker = markerMapRef.current.get(selectedMarker.id);
      if (activeMapMarker) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(activeMapMarker.getLatLng(), Math.max(mapInstanceRef.current.getZoom(), 15));
            activeMapMarker.openTooltip();
          }
        }, 100);
      }
    }
  }, [markers, selectedMarker, isLeafletLoaded]);

  // React to selecting marker outside (sidebar list selection)
  useEffect(() => {
    if (!isLeafletLoaded || !mapInstanceRef.current || !selectedMarker) return;

    const activeMapMarker = markerMapRef.current.get(selectedMarker.id);
    if (activeMapMarker) {
      mapInstanceRef.current.setView(activeMapMarker.getLatLng(), Math.max(mapInstanceRef.current.getZoom(), 15));
      activeMapMarker.openTooltip();
    }
  }, [selectedMarker]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden shadow-inner border border-neutral-200">
      {!isLeafletLoaded && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-neutral-50/95 backdrop-blur-sm">
          {loadError ? (
            <div className="text-center p-6 max-w-sm">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-medium text-neutral-600 mt-2">{loadError}</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-neutral-600 font-sans">
                Loading interactive OpenStreetMap...
              </p>
              <p className="text-[10px] text-neutral-400 font-mono mt-1">
                Fetching open-source Leaflet components
              </p>
            </div>
          )}
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};