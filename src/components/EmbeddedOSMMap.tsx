import React, { useEffect, useRef, useState } from 'react';
import { Landmark } from '../types';

interface EmbeddedOSMMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Landmark[];
  selectedMarker: Landmark | null;
  onSelectMarker: (marker: Landmark | null) => void;
}

export const EmbeddedOSMMap: React.FC<EmbeddedOSMMapProps> = ({
  center,
  zoom,
  markers,
  selectedMarker,
  onSelectMarker,
}) => {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string, any>>(new Map());
  const onSelectMarkerRef = useRef(onSelectMarker);
  const lastSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    onSelectMarkerRef.current = onSelectMarker;
  }, [onSelectMarker]);

  // Dynamically load Leaflet library from CDN
  useEffect(() => {
    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const cssId = 'leaflet-cdn-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

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
        setLoadError('Failed to load OpenStreetMap script. Please check your internet connection.');
      };
      document.body.appendChild(script);
    } else {
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
    if (!L || mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView([center.lat, center.lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = markerGroup;

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      map.on('click', () => {
        onSelectMarkerRef.current(null);
      });
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
        markerMapRef.current.clear();
      }
    };
  }, [isLeafletLoaded]);

  // Handle camera position updates
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    const currentCenter = mapInstanceRef.current.getCenter();
    const mapZoom = mapInstanceRef.current.getZoom();

    const centerDist = Math.abs(currentCenter.lat - center.lat) + Math.abs(currentCenter.lng - center.lng);
    const zoomDist = Math.abs(mapZoom - zoom);

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

    markerGroupRef.current.clearLayers();
    markerMapRef.current.clear();

    const getCategoryEmoji = (category?: string) => {
      switch (category?.toLowerCase()) {
        case 'hotel': return '🏨';
        case 'beach': return '🏖️';
        case 'nature': return '🌿';
        case 'sacred': return '🙏';
        case 'historical': return '🏛️';
        case 'cultural': return '🎎';   
        default: return '📍';
      }
    };

    (markers || []).forEach((marker) => {
      if (marker?.lat === undefined || marker?.lng === undefined) return;

      const isSelected = selectedMarker?.id === marker.id;
      const category = marker.category || 'landmark';
      const emoji = getCategoryEmoji(category);
      const markerName = marker.name || 'Unnamed Location';

      let customIconHtml = '';

      if (currentZoom < 16 && !isSelected) {
        customIconHtml = `
          <div class="relative group cursor-pointer select-none transition-all duration-300 transform -translate-x-1/2 -translate-y-full" style="pointer-events: auto;">
            <div class="relative flex items-center justify-center">
              <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md ring-2 ring-white hover:scale-110 hover:from-amber-500 hover:to-orange-500 transition-all duration-200">
                <span class="text-sm leading-none filter drop-shadow-sm">${emoji}</span>
                <span class="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 font-extrabold text-xs whitespace-nowrap tracking-tight font-sans drop-shadow-sm transition-all duration-300">${markerName}</span>
              </div>
            </div>
            <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-600 mx-auto -mt-0.5 filter drop-shadow-sm"></div>
          </div>
        `;
      } else {
        customIconHtml = `
          <div class="relative group cursor-pointer select-none transition-all duration-300 transform -translate-x-1/2 -translate-y-full" style="pointer-events: auto;">
            ${isSelected ? '<div class="absolute -inset-1.5 rounded-full bg-amber-400/70 blur-md animate-pulse"></div>' : ''}
            <div class="relative flex items-center justify-center">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                isSelected 
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl ring-2 ring-white scale-110 z-50' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg ring-2 ring-white/90 hover:scale-105 hover:from-amber-500 hover:to-orange-500'
              } transition-all duration-200">
                <span class="text-base leading-none filter drop-shadow-sm">${emoji}</span>
                <span class="font-extrabold text-xs whitespace-nowrap tracking-tight font-sans drop-shadow-sm">${markerName}</span>
              </div>
            </div>
            <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent ${
              isSelected ? 'border-t-[9px] border-t-amber-600' : 'border-t-[8px] border-t-amber-600'
            } mx-auto -mt-0.5 filter drop-shadow-sm"></div>
          </div>
        `;
      }

      const icon = L.divIcon({
        className: '!bg-transparent !border-0',
        html: customIconHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -32],
      });

      const mapMarker = L.marker([marker.lat, marker.lng], { icon })
        .addTo(markerGroupRef.current);

      const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
      mapMarker.bindTooltip(
        `<div class="p-1.5 font-sans">
          <div class="font-bold text-xs text-neutral-800">${markerName}</div>
          <div class="text-[10px] text-amber-600 font-medium capitalize mt-0.5">${emoji} ${categoryLabel}${marker.location ? ` · ${marker.location}` : ''}</div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -32],
          opacity: 0.98,
        }
      );

      mapMarker.on('click', (e: any) => {
        if (e && e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        onSelectMarkerRef.current(marker);
      });

      markerMapRef.current.set(marker.id, mapMarker);
    });
  }, [markers, selectedMarker, isLeafletLoaded, currentZoom]);

  // Handle marker selection focus
  useEffect(() => {
    if (!isLeafletLoaded || !mapInstanceRef.current) return;

    if (selectedMarker) {
      if (lastSelectedIdRef.current !== selectedMarker.id) {
        lastSelectedIdRef.current = selectedMarker.id;
        const activeMapMarker = markerMapRef.current.get(selectedMarker.id);
        if (activeMapMarker) {
          mapInstanceRef.current.setView(activeMapMarker.getLatLng(), Math.max(mapInstanceRef.current.getZoom(), 15));
          activeMapMarker.openTooltip();
        }
      }
    } else {
      lastSelectedIdRef.current = null;
      markerMapRef.current.forEach((m) => {
        if (m) m.closeTooltip();
      });
    }
  }, [selectedMarker, isLeafletLoaded]);

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
