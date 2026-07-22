/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Region, Landmark, ThemeConfig, CustomPath, Category } from '../types';
import { MYANMAR_REGIONS } from '../data';
import { EmbeddedOSMMap } from './EmbeddedOSMMap';
import { 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Info, 
  Navigation, 
  ChevronRight, 
  ArrowLeft,
  Compass,
  AlertCircle,
  Trash2,
  Plus,
  Star,
  StarHalf
} from 'lucide-react';

interface MyanmarMapProps {
  currentTheme: ThemeConfig;
  selectedRegion: Region | null;
  onSelectRegion: (region: Region | null) => void;
  isDetailedView: boolean;
  onSetDetailedView: (detailed: boolean) => void;
  selectedLandmark: Landmark | null;
  onSelectLandmark: (landmark: Landmark | null) => void;
  searchQuery: string;
  selectedCategory: string;
  onSelectCategory?: (category: string) => void;
  customPath?: CustomPath | null;
  onAddLandmarkToPath?: (landmark: Landmark) => void;
  isItineraryCollapsed?: boolean;
  onToggleItinerary?: () => void;
  onAddCustomLandmark?: (landmark: Landmark) => void;
  onDeleteCustomLandmark?: (landmarkId: string) => void;
  regions?: Region[];
}

// Helper to parse exact bounding box of any SVG path coords dynamically
function getPathBounds(pathStr: string) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let currentX = 0;
  let currentY = 0;

  // Split path into commands and their arguments
  const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let cmdMatch;
  while ((cmdMatch = commandRegex.exec(pathStr)) !== null) {
    const cmd = cmdMatch[1];
    const argsStr = cmdMatch[2].trim();
    const argNumbers: number[] = [];
    const numRegex = /-?\d+\.?\d*/g;
    let nMatch;
    while ((nMatch = numRegex.exec(argsStr)) !== null) {
      argNumbers.push(parseFloat(nMatch[0]));
    }

    if (cmd === 'M') {
      currentX = argNumbers[0];
      currentY = argNumbers[1];
      if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
      if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      for (let i = 2; i < argNumbers.length; i += 2) {
        currentX = argNumbers[i];
        currentY = argNumbers[i+1];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'm') {
      currentX += argNumbers[0];
      currentY += argNumbers[1];
      if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
      if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      for (let i = 2; i < argNumbers.length; i += 2) {
        currentX += argNumbers[i];
        currentY += argNumbers[i+1];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'L') {
      for (let i = 0; i < argNumbers.length; i += 2) {
        currentX = argNumbers[i];
        currentY = argNumbers[i+1];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'l') {
      for (let i = 0; i < argNumbers.length; i += 2) {
        currentX += argNumbers[i];
        currentY += argNumbers[i+1];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'H') {
      for (let i = 0; i < argNumbers.length; i++) {
        currentX = argNumbers[i];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
      }
    } else if (cmd === 'h') {
      for (let i = 0; i < argNumbers.length; i++) {
        currentX += argNumbers[i];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
      }
    } else if (cmd === 'V') {
      for (let i = 0; i < argNumbers.length; i++) {
        currentY = argNumbers[i];
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'v') {
      for (let i = 0; i < argNumbers.length; i++) {
        currentY += argNumbers[i];
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'C') {
      for (let i = 0; i < argNumbers.length; i += 6) {
        currentX = argNumbers[i+4];
        currentY = argNumbers[i+5];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'c') {
      for (let i = 0; i < argNumbers.length; i += 6) {
        currentX += argNumbers[i+4];
        currentY += argNumbers[i+5];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'S') {
      for (let i = 0; i < argNumbers.length; i += 4) {
        currentX = argNumbers[i+2];
        currentY = argNumbers[i+3];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 's') {
      for (let i = 0; i < argNumbers.length; i += 4) {
        currentX += argNumbers[i+2];
        currentY += argNumbers[i+3];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'Q') {
      for (let i = 0; i < argNumbers.length; i += 4) {
        currentX = argNumbers[i+2];
        currentY = argNumbers[i+3];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'q') {
      for (let i = 0; i < argNumbers.length; i += 4) {
        currentX += argNumbers[i+2];
        currentY += argNumbers[i+3];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'T') {
      for (let i = 0; i < argNumbers.length; i += 2) {
        currentX = argNumbers[i];
        currentY = argNumbers[i+1];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 't') {
      for (let i = 0; i < argNumbers.length; i += 2) {
        currentX += argNumbers[i];
        currentY += argNumbers[i+1];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'A') {
      for (let i = 0; i < argNumbers.length; i += 7) {
        currentX = argNumbers[i+5];
        currentY = argNumbers[i+6];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    } else if (cmd === 'a') {
      for (let i = 0; i < argNumbers.length; i += 7) {
        currentX += argNumbers[i+5];
        currentY += argNumbers[i+6];
        if (currentX < minX) minX = currentX; if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY; if (currentY > maxY) maxY = currentY;
      }
    }
  }

  if (minX === Infinity) {
    return { minX: 264, maxX: 735, minY: 15, maxY: 984 };
  }

  return { minX, maxX, minY, maxY };
}

const BOUNDS_CACHE: Record<string, { minX: number; maxX: number; minY: number; maxY: number }> = {};

function getCachedRegionBounds(regionId: string, pathCoords: string) {
  if (!BOUNDS_CACHE[regionId]) {
    BOUNDS_CACHE[regionId] = getPathBounds(pathCoords);
  }
  return BOUNDS_CACHE[regionId];
}

export default function MyanmarMap({
  currentTheme,
  selectedRegion: propSelectedRegion,
  onSelectRegion,
  isDetailedView,
  onSetDetailedView,
  selectedLandmark,
  onSelectLandmark,
  searchQuery,
  selectedCategory,
  onSelectCategory,
  customPath,
  onAddLandmarkToPath,
  isItineraryCollapsed = false,
  onToggleItinerary,
  onAddCustomLandmark,
  onDeleteCustomLandmark,
  regions: propRegions = MYANMAR_REGIONS
}: MyanmarMapProps) {
  // Dynamically resolve coordinates from lat/lng for any pre-loaded or custom landmarks
  const processedRegions = React.useMemo(() => {
    return propRegions.map(r => {
      // Get bounding box of the region's SVG path coords
      const bounds = getCachedRegionBounds(r.id, r.pathCoords);
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;

      const landmarks = r.landmarks.map(l => {
        if (l.lat !== undefined && l.lng !== undefined) {
          const lng_min = 92.17;
          const lng_max = 101.17;
          const lat_min = 9.60;
          const lat_max = 28.54;

          const lng_pct = (l.lng - lng_min) / (lng_max - lng_min);
          const lat_pct = (l.lat - lat_min) / (lat_max - lat_min);

          const svgX = 264 + lng_pct * 471;
          const svgY = 984 - lat_pct * 969;

          const computedX = ((svgX - bounds.minX) / width) * 100;
          const computedY = ((svgY - bounds.minY) / height) * 100;

          return {
            ...l,
            x: Math.round(computedX * 100) / 100,
            y: Math.round(computedY * 100) / 100
          };
        }
        return {
          ...l,
          x: l.x ?? 50,
          y: l.y ?? 50
        };
      });

      return {
        ...r,
        landmarks
      };
    });
  }, [propRegions]);

  const activeRegion = propSelectedRegion ? processedRegions.find(r => r.id === propSelectedRegion.id) || propSelectedRegion : null;

  // Re-map variables for seamless compatibility with existing JSX
  const regions = processedRegions;
  const selectedRegion = activeRegion;

  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [expandedClusterIds, setExpandedClusterIds] = useState<string[]>([]);
  const [focusedClusterId, setFocusedClusterId] = useState<string | null>(null);
  const [focusedCity, setFocusedCity] = useState<string | null>(null);

  // Zoom & Pan state for detailed regional views
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState<number>(500);

  // Measure stage container dimensions with ResizeObserver to prevent drifting pins
  React.useEffect(() => {
    if (!stageRef.current) return;

    const updateSize = () => {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const minDim = Math.min(rect.width, rect.height);
        if (minDim > 0) {
          setStageSize(minDim);
        }
      }
    };

    updateSize(); // Initial call

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateSize);
    });

    resizeObserver.observe(stageRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedRegion, isDetailedView]);

  // Add Custom Landmark Form states
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<Category>('sacred');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customDuration, setCustomDuration] = useState('2 Hours');
  const [customUsp, setCustomUsp] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [animatingClusterIds, setAnimatingClusterIds] = useState<string[]>([]);

  // Reset zoom & pan when region changes or view mode transitions
  React.useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setShowAddForm(false);
    setExpandedClusterIds([]);
    setAnimatingClusterIds([]);
    setFocusedClusterId(null);
    setFocusedCity(null);
  }, [selectedRegion?.id, isDetailedView]);

  // Unified camera centering and zoom effect handles all categories elegantly, located below clusters memo

  const handleCityClick = (cityName: string) => {
    setFocusedCity(cityName);
    onSelectLandmark(null); // Clear active selected landmark when switching focused city
  };

  const openAddForm = () => {
    if (!selectedRegion) return;
    // Reverse project center point of selected region back to real-world latitude and longitude
    const initLng = ((selectedRegion.centerX - 264) / 471) * 9 + 92.17;
    const initLat = ((984 - selectedRegion.centerY) / 969) * 18.94 + 9.60;
    
    setCustomName('');
    setCustomCategory('sacred');
    setCustomLat(initLat.toFixed(4));
    setCustomLng(initLng.toFixed(4));
    setCustomDesc('');
    setCustomDuration('2 Hours');
    setCustomUsp('');
    setFormError(null);
    setShowAddForm(true);
  };

  const getLocalCoordsFromLatLng = (latStr: string, lngStr: string, region: Region) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) return null;

    const lng_min = 92.17;
    const lng_max = 101.17;
    const lat_min = 9.60;
    const lat_max = 28.54;

    const lng_pct = (lng - lng_min) / (lng_max - lng_min);
    const lat_pct = (lat - lat_min) / (lat_max - lat_min);

    const svgX = 264 + lng_pct * 471;
    const svgY = 984 - lat_pct * 969;

    const bounds = getCachedRegionBounds(region.id, region.pathCoords);
    const x = ((svgX - bounds.minX) / (bounds.maxX - bounds.minX)) * 100;
    const y = ((svgY - bounds.minY) / (bounds.maxY - bounds.minY)) * 100;

    return { x, y };
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegion || !onAddCustomLandmark) return;

    if (!customName.trim()) {
      setFormError('Please enter a name.');
      return;
    }
    const latNum = parseFloat(customLat);
    const lngNum = parseFloat(customLng);

    if (isNaN(latNum) || latNum < 9.6 || latNum > 28.54) {
      setFormError('Latitude must be a valid number between 9.6 and 28.5.');
      return;
    }
    if (isNaN(lngNum) || lngNum < 92.17 || lngNum > 101.17) {
      setFormError('Longitude must be a valid number between 92.1 and 101.2.');
      return;
    }

    const coords = getLocalCoordsFromLatLng(customLat, customLng, selectedRegion);
    if (!coords) {
      setFormError('Could not calculate map coordinates.');
      return;
    }

    const newLandmark: Landmark = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      regionId: selectedRegion.id,
      category: customCategory,
      description: customDesc.trim() || `Custom landmark in ${selectedRegion.name}.`,
      usp: customUsp.trim() || `Geographical real-world coordinates: ${latNum.toFixed(4)}° N, ${lngNum.toFixed(4)}° E.`,
      x: Math.round(coords.x * 100) / 100,
      y: Math.round(coords.y * 100) / 100,
      visitDuration: customDuration || '2 Hours'
    };

    onAddCustomLandmark(newLandmark);
    setShowAddForm(false);
  };

  // Filter regions that contain matches for search and category
  const matchesSearchAndCategory = (region: Region) => {
    const term = searchQuery.toLowerCase();
    const hasCategory = (landmark: Landmark) => {
      if (!selectedCategory || selectedCategory === 'all') return true;
      return landmark.category === selectedCategory;
    };

    const hasSearch = (landmark: Landmark) => {
      if (!term) return true;
      return landmark.name.toLowerCase().includes(term) || 
             landmark.description.toLowerCase().includes(term);
    };

    const matchesName = !term || region.name.toLowerCase().includes(term) || region.capital.toLowerCase().includes(term);

    const matchLandmarks = region.landmarks.some(lm => hasCategory(lm) && hasSearch(lm));

    if (selectedCategory && selectedCategory !== 'all') {
      return matchLandmarks;
    }
    return matchesName || matchLandmarks;
  };

  // Double click or single click recognition
  const handleRegionClick = (region: Region) => {
    const currentTime = new Date().getTime();
    const isDoubleClick = currentTime - lastClickTime < 300;
    setLastClickTime(currentTime);

    onSelectRegion(region);
    onSelectLandmark(null); // Clear selected landmark when switching region

    if (isDoubleClick) {
      onSetDetailedView(true);
    }
  };

  // Find geographic coordinates on national map for drawing paths between regions
  const getRegionCenter = (regionId: string) => {
    const match = regions.find(r => r.id === regionId);
    if (match) {
      return { x: match.centerX, y: match.centerY };
    }
    return { x: 220, y: 400 };
  };

  // Generate continuous SVG path line for custom planner itinerary
  const renderNationalPath = () => {
    if (!customPath || customPath.landmarkIds.length === 0) return null;

    const points = customPath.landmarkIds.map(lmId => {
      // Find the region holding this landmark
      const foundRegion = regions.find(r => r.landmarks.some(lm => lm.id === lmId));
      if (foundRegion) {
        return {
          id: lmId,
          regionName: foundRegion.name,
          x: foundRegion.centerX,
          y: foundRegion.centerY
        };
      }
      return null;
    }).filter(p => p !== null) as { id: string; x: number; y: number; regionName: string }[];

    if (points.length < 1) return null;

    let pathD = '';
    points.forEach((pt, idx) => {
      if (idx === 0) {
        pathD += `M ${pt.x},${pt.y}`;
      } else {
        // Curve to make it cute and playful
        const prev = points[idx - 1];
        const midX = (prev.x + pt.x) / 2 + (pt.y - prev.y) * 0.15;
        const midY = (prev.y + pt.y) / 2 - (pt.x - prev.x) * 0.15;
        pathD += ` Q ${midX},${midY} ${pt.x},${pt.y}`;
      }
    });

    return (
      <g id="animated-itinerary-layer" className="pointer-events-none">
        {/* Shadow glow line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={currentTheme.id === 'vibrant' ? '#FF8E72' : currentTheme.id === 'cute' ? '#f472b6' : currentTheme.id === 'royal' ? '#f59e0b' : '#10b981'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-30 blur-sm"
          />
        )}
        {/* Animative dotted trail */}
        {pathD && (
          <path
            d={pathD}
            id="adventure-dotted-trail"
            fill="none"
            stroke={currentTheme.id === 'vibrant' ? '#FF8E72' : currentTheme.id === 'classic' ? '#78350f' : currentTheme.id === 'royal' ? '#b45309' : currentTheme.id === 'cute' ? '#db2777' : '#047857'}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8,8"
            className="animate-[dash_25s_linear_infinite]"
          />
        )}

        {/* Small pinpoints for active points */}
        {points.map((pt, i) => (
          <g key={`route-pin-${pt.id}-${i}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="6.5"
              className={currentTheme.id === 'vibrant' ? 'fill-[#FF8E72] stroke-white' : currentTheme.id === 'cute' ? 'fill-pink-500 stroke-white' : currentTheme.id === 'royal' ? 'fill-amber-500 stroke-red-800' : 'fill-emerald-800 stroke-white'}
              strokeWidth="2.5"
            />
            {/* Sequence number badge */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill="white"
            />
          </g>
        ))}

        {/* Floating travel indicator sailing across the path */}
        {pathD && (
          <g>
            {/* Glowing outer circle indicator */}
            <circle
              r="7"
              className="fill-amber-400/40"
            />
            {/* Solid inner core indicator */}
            <circle
              r="4.2"
              className="fill-amber-500 stroke-white stroke-[1.5]"
            />
            <animateMotion
              path={pathD}
              dur={`${Math.max(8, points.length * 4.5)}s`}
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>
        )}
      </g>
    );
  };

  // Pre-calculate clusters at the component level to make them accessible to both map renderer and sidebar
  const clusters = React.useMemo(() => {
    if (!selectedRegion) return [];
    
    const list = selectedRegion.landmarks
      .filter((landmark) => !selectedCategory || selectedCategory === 'all' || landmark.category === selectedCategory)
      .filter((landmark) => {
        if (selectedRegion.id === 'shan') {
          if (landmark.category === 'hotel') {
            if (focusedCity) {
              return landmark.location === focusedCity;
            }
            return false;
          }
          if (focusedCity) {
            return landmark.location === focusedCity || landmark.name.toLowerCase().includes(focusedCity.toLowerCase());
          }
        }
        return true;
      });
    
    const baseLandmarks = list.map(l => ({
      ...l,
      originalX: l.x ?? 50,
      originalY: l.y ?? 50,
      x: l.x ?? 50,
      y: l.y ?? 50,
    }));

    const threshold = 5.0; // Distance percentage threshold for clustering
    
    interface LocalCluster {
      id: string;
      centerX: number;
      centerY: number;
      items: typeof baseLandmarks;
      isExpanded: boolean;
      locationName?: string;
    }

    const computedClusters: LocalCluster[] = [];

    baseLandmarks.forEach(item => {
      const ix = item.x;
      const iy = item.y;

      let foundCluster: LocalCluster | undefined = undefined;

      // Bypass clustering entirely for Shan State to allow each hotel/landmark to render as an individual pin
      if (selectedRegion.id !== 'shan') {
        if (item.category === 'hotel' && item.location) {
          // Find existing hotel cluster with the SAME location name
          foundCluster = computedClusters.find(c => c.locationName === item.location);
        } else {
          // Distance-based clustering for non-hotel items (standard)
          foundCluster = computedClusters.find(c => {
            if (c.locationName) return false; // Don't cluster non-hotel items into a location-based hotel cluster
            const dx = c.centerX - ix;
            const dy = c.centerY - iy;
            return Math.sqrt(dx * dx + dy * dy) < threshold;
          });
        }
      }

      if (foundCluster) {
        foundCluster.items.push(item);
        // Recalculate cluster center as average of its items
        foundCluster.centerX = foundCluster.items.reduce((sum, it) => sum + it.originalX, 0) / foundCluster.items.length;
        foundCluster.centerY = foundCluster.items.reduce((sum, it) => sum + it.originalY, 0) / foundCluster.items.length;
      } else {
        const clusterId = item.category === 'hotel' && item.location 
          ? `cluster-hotel-${item.location.toLowerCase().replace(/\s+/g, '-')}` 
          : `cluster-${item.id}`;
        computedClusters.push({
          id: clusterId,
          centerX: ix,
          centerY: iy,
          items: [item],
          isExpanded: expandedClusterIds.includes(clusterId),
          locationName: item.category === 'hotel' ? item.location : undefined
        });
      }
    });

    return computedClusters;
  }, [selectedRegion, selectedCategory, expandedClusterIds, focusedCity]);

  // Automatically expand and focus cluster if a clustered landmark (such as a hotel) is selected
  React.useEffect(() => {
    if (selectedLandmark && isDetailedView && selectedRegion && stageSize > 0) {
      // Find the computed cluster containing this selected landmark
      const clusterWithLandmark = clusters.find(c => 
        c.items.some(item => item.id === selectedLandmark.id)
      );

      if (clusterWithLandmark && clusterWithLandmark.items.length > 1) {
        // Expand this cluster if it's not already expanded
        setExpandedClusterIds(prev => {
          if (!prev.includes(clusterWithLandmark.id)) {
            setAnimatingClusterIds(prevAnim => {
              if (!prevAnim.includes(clusterWithLandmark.id)) {
                return [...prevAnim, clusterWithLandmark.id];
              }
              return prevAnim;
            });
            return [...prev, clusterWithLandmark.id];
          }
          return prev;
        });
        
        // Focus on this cluster
        setFocusedClusterId(clusterWithLandmark.id);
      }
    }
  }, [selectedLandmark, isDetailedView, clusters, selectedRegion, stageSize]);

  // Landmark category-specific emojis/styling helper
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'sacred': return { emoji: '🕌', color: 'bg-amber-400 border-amber-600 text-amber-950' };
      case 'nature': return { emoji: '🌳', color: 'bg-emerald-400 border-emerald-600 text-emerald-950' };
      case 'beach': return { emoji: '🏖️', color: 'bg-sky-400 border-sky-600 text-sky-950' };
      case 'historical': return { emoji: '🏰', color: 'bg-[#b45309] border-[#78350f] text-white' };
      case 'cultural': return { emoji: '🎨', color: 'bg-pink-400 border-pink-600 text-pink-950' };
      case 'hotel': return { emoji: '🏨', color: 'bg-indigo-400 border-indigo-600 text-indigo-950' };
      default: return { emoji: '📍', color: 'bg-red-400 border-red-600 text-red-950' };
    }
  };

  return (
    <div id="interactive-map-card" className={`p-6 ${currentTheme.cardBg} ${currentTheme.rounded} transition-all duration-300 relative`}>
      {/* Map Action Bar */}
      <div id="map-control-bar" className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 id="map-main-title" className={`text-xl sm:text-2xl font-bold ${currentTheme.primaryText} flex items-center gap-2 flex-wrap`}>
            {isDetailedView && selectedRegion ? (
              <span className="flex items-center gap-2">
                <button
                  id="back-btn-national-compact"
                  onClick={() => {
                    onSetDetailedView(false);
                    onSelectLandmark(null);
                  }}
                  className={`p-1.5 rounded-lg border hover:shadow-sm transition-all duration-200 cursor-pointer ${
                    currentTheme.id === 'vibrant' ? 'bg-[#FFE5D4]/40 text-[#FF8E72] border-[#FFE5D4]' :
                    currentTheme.id === 'cute' ? 'bg-pink-50 text-pink-600 border-pink-200' :
                    currentTheme.id === 'classic' ? 'bg-[#f5ebd7] text-amber-800 border-amber-300' :
                    currentTheme.id === 'royal' ? 'bg-amber-50 text-red-800 border-amber-400' :
                    'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                  title="Back to Full Map"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span>{selectedRegion.name} Detail</span>
              </span>
            ) : (
              <>
                <img
                  src="/raizentravel-logo.jpg"
                  alt="raizentravel.com logo"
                  className="w-8 h-8 object-contain rounded-full bg-white/80 p-0.5 shadow-sm"
                />
                Interactive Map of Myanmar by raizentravel.com
              </>
            )}
          </h2>
          <p id="map-helper-subtitle" className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            {isDetailedView 
              ? 'Click any pinpoint to explore famous cultural tourist attractions.' 
              : 'Tap or click to highlight. Double-click to zoom in.'}
          </p>
        </div>

        <div id="view-mode-buttons" className="flex items-center gap-2 flex-wrap">
          {!isDetailedView && selectedRegion && (
            <button
              id="zoom-btn-details"
              onClick={() => onSetDetailedView(true)}
              className={`text-xs px-3.5 py-2 font-medium flex items-center gap-1.5 border rounded-lg hover:shadow-sm transition-all duration-200 ${
                currentTheme.id === 'vibrant' ? 'bg-[#FF8E72] hover:bg-[#ff7b5a] text-white border-transparent' :
                currentTheme.id === 'cute' ? 'bg-pink-500 hover:bg-pink-600 text-white' :
                currentTheme.id === 'classic' ? 'bg-amber-700 hover:bg-amber-800 text-white font-medium' :
                currentTheme.id === 'royal' ? 'bg-red-700 hover:bg-red-800 text-white' :
                'bg-emerald-800 hover:bg-emerald-900 text-white'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Zoom into {selectedRegion.name.split(' ')[0]}
            </button>
          )}
        </div>
      </div>

      {isDetailedView && selectedRegion ? (
        /* ================= DETAILED REGIONAL MAP MODE ================= */
        <div id="detailed-map-mode" className="relative flex flex-col md:flex-row gap-6 min-h-[380px] md:h-[500px] lg:h-[560px]">
          {/* Detailed Map Illustration Stage - Larger map view height */}
          <div 
            id="detailed-svg-stage" 
            ref={stageRef}
            className={`flex-1 relative rounded-2xl p-0 overflow-hidden h-[380px] sm:h-[440px] md:h-full flex items-center justify-center ${currentTheme.borderStyle} ${
              currentTheme.id === 'vibrant' ? 'bg-[#FFF9F2]' :
              currentTheme.id === 'cute' ? 'bg-pink-50/50' :
              currentTheme.id === 'classic' ? 'bg-[#fbf8ee]' :
              currentTheme.id === 'royal' ? 'bg-red-50/30' :
              'bg-neutral-50'
            }`}
          >
            {/* Custom Interactive Local Map Backdrop with grid */}
            <div id="coordinate-grid" className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-[0.25] select-none pointer-events-none p-4">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-dashed border-neutral-200" />
              ))}
            </div>

            {/* Compass rose decorative element moved to bottom-right */}
            <div id="compass-rose" className="absolute bottom-4 right-4 opacity-75 flex flex-col items-center z-25">
              <Navigation className="w-6 h-6 text-neutral-400 rotate-45 transform" />
              <span className="text-[9px] font-mono tracking-widest text-neutral-400 font-bold select-none">N</span>
            </div>

            {/* Region Title Plate */}
            <div id="region-tagPlate" className="absolute bottom-4 left-4 z-25 flex flex-col items-start bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-neutral-200/50 shadow-sm leading-tight">
              <span className={`text-[10px] font-bold tracking-widest uppercase ${currentTheme.accentColor}`}>
                {selectedRegion.myanmarName}
              </span>
              <span className="text-sm font-semibold text-neutral-800 font-sans mt-0.5">
                Capital: {selectedRegion.capital}
              </span>
            </div>

            {/* Embedded Inline OpenStreetMap View for Shan State Cities */}
            {selectedRegion.id === 'shan' && focusedCity && (
              <div className="absolute inset-0 z-40 bg-white flex flex-col p-4">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-sans capitalize">
                        📍 {focusedCity}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-800">
                        Interactive OpenStreetMap
                      </h4>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-medium font-sans mt-0.5">
                      Showing curated hotels in {focusedCity}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFocusedCity(null);
                        onSelectLandmark(null);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-950 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer border border-neutral-700"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Back to Region View
                    </button>
                    <button
                      onClick={() => {
                        setFocusedCity(null);
                        onSetDetailedView(false);
                        onSelectLandmark(null);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer border border-neutral-200/40"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Full Map
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <EmbeddedOSMMap
                    center={
                      focusedCity === 'Kalaw' ? { lat: 20.6253, lng: 96.5587 } :
                      focusedCity === 'Inle Lake' ? { lat: 20.55, lng: 96.92 } :
                      { lat: 20.7842, lng: 97.0336 } // Taunggyi
                    }
                    zoom={
                      focusedCity === 'Inle Lake' ? 12 : 14
                    }
                    markers={selectedRegion.landmarks.filter(lm => 
                      lm.location === focusedCity || 
                      lm.name.toLowerCase().includes(focusedCity.toLowerCase())
                    )}
                    selectedMarker={selectedLandmark}
                    onSelectMarker={(marker) => {
                      onSelectLandmark(marker);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Beautiful Zoomed vector map of the state with exact locked landmark pins inside SVG space */}
            {(() => {
              const bounds = getCachedRegionBounds(selectedRegion.id, selectedRegion.pathCoords);
              const width = bounds.maxX - bounds.minX;
              const height = bounds.maxY - bounds.minY;
              
              // Scale to fit a uniform viewport size of 240x240 units
              // Scaled elements up (238 instead of 234) to maximize visual real estate and fill the container completely
              const S = 238 / Math.max(width, height);
              const offsetX = (240 - width * S) / 2;
              const offsetY = (240 - height * S) / 2;

              const previewCoords = getLocalCoordsFromLatLng(customLat, customLng, selectedRegion);

              // Group items that are extremely close to spiderfy them and prevent visual clutter on the map
              const list = selectedRegion.landmarks
                .filter((landmark) => !selectedCategory || selectedCategory === 'all' || landmark.category === selectedCategory);
              
              const baseLandmarks = list.map(l => ({
                ...l,
                originalX: l.x ?? 50,
                originalY: l.y ?? 50,
                x: l.x ?? 50,
                y: l.y ?? 50,
              }));

              // Process clusters into renderable single pins, spiderfied pins, and cluster pins
              const finalPinsToRender: {
                type: 'single' | 'spiderfied';
                landmark: typeof baseLandmarks[0];
                clusterId?: string;
              }[] = [];

              const clusterMarkersToRender: {
                id: string;
                centerX: number;
                centerY: number;
                items: typeof baseLandmarks;
                dominantCategory: string;
                locationName?: string;
              }[] = [];

              const connectorLines: {
                id: string;
                startX: number;
                startY: number;
                endX: number;
                endY: number;
                isSelected: boolean;
              }[] = [];

              clusters.forEach(c => {
                if (c.items.length === 1) {
                  // Single item: render normally
                  finalPinsToRender.push({
                    type: 'single',
                    landmark: c.items[0]
                  });
                } else {
                  // Multi-item cluster
                  if (c.isExpanded) {
                    // Smart boundary-aware layout: if center is near the edge, spread inwards to avoid getting blocked
                    let pushX = 0;
                    let pushY = 0;
                    if (c.centerX < 22) pushX = 1;      // Near left boundary -> spread rightwards
                    if (c.centerX > 78) pushX = -1;     // Near right boundary -> spread leftwards
                    if (c.centerY < 22) pushY = 1;      // Near top boundary -> spread downwards
                    if (c.centerY > 78) pushY = -1;     // Near bottom boundary -> spread upwards

                    const n = c.items.length;
                    const radius = 6.0 + (n * 0.45); // Warm and slightly larger radius for easy clicking

                    c.items.forEach((item, index) => {
                      let angle = 0;
                      if (pushX === 0 && pushY === 0) {
                        // Standard full-circle distribution if comfortably centered
                        angle = (index * 2 * Math.PI) / n;
                      } else {
                        // Calculate optimal safe directional sector facing away from the boundaries
                        const centerAngle = Math.atan2(pushY, pushX);
                        const sectorWidth = Math.PI * 1.0; // 180-degree half-circle sector
                        if (n === 1) {
                          angle = centerAngle;
                        } else {
                          const startAngle = centerAngle - sectorWidth / 2;
                          angle = startAngle + (index * sectorWidth) / (n - 1);
                        }
                      }

                      const spiderfiedX = c.centerX + Math.cos(angle) * radius;
                      const spiderfiedY = c.centerY + Math.sin(angle) * radius;

                      const updatedItem = {
                        ...item,
                        x: spiderfiedX,
                        y: spiderfiedY
                      };

                      finalPinsToRender.push({
                        type: 'spiderfied',
                        landmark: updatedItem,
                        clusterId: c.id
                      });

                      connectorLines.push({
                        id: `line-${item.id}`,
                        startX: c.centerX,
                        startY: c.centerY,
                        endX: spiderfiedX,
                        endY: spiderfiedY,
                        isSelected: selectedLandmark?.id === item.id
                      });
                    });
                  } else {
                    // Hidden, represent with a big cluster marker
                    const counts: { [cat: string]: number } = {};
                    c.items.forEach(it => {
                      counts[it.category] = (counts[it.category] || 0) + 1;
                    });
                    let dominantCategory = 'hotel';
                    let maxCount = 0;
                    Object.entries(counts).forEach(([cat, count]) => {
                      if (count > maxCount) {
                        maxCount = count;
                        dominantCategory = cat;
                      }
                    });

                    clusterMarkersToRender.push({
                      id: c.id,
                      centerX: c.centerX,
                      centerY: c.centerY,
                      items: c.items,
                      dominantCategory,
                      locationName: c.locationName
                    });
                  }
                }
              });

              return (
                <>
                  {/* Floating Zoom Controls Panel */}
                  {!(selectedRegion.id === 'shan' && focusedCity) && (
                    <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-neutral-200/60 pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => setZoom(prev => Math.min(10, prev + 0.5))}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 transition-colors cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors cursor-pointer"
                        title="Reset Map Zoom"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(prev => {
                            const next = Math.max(1, prev - 0.5);
                            if (next === 1) setPan({ x: 0, y: 0 });
                            return next;
                          });
                        }}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 transition-colors cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-neutral-400 px-1.5">
                        {zoom.toFixed(1)}x
                      </span>
                    </div>
                  )}

                  {/* Wrapper container for zooming & panning directly within detailed-svg-stage */}
                  <motion.div 
                    animate={{ 
                      scale: zoom,
                      x: pan.x,
                      y: pan.y
                    }}
                    transition={isDragging ? { type: "tween", duration: 0 } : { type: "spring", stiffness: 100, damping: 18 }}
                    style={{ transformOrigin: 'center center' }}
                    className={`absolute inset-0 flex items-center justify-center pointer-events-auto ${
                      zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                    onMouseDown={(e) => {
                      if (zoom === 1) return;
                      setIsDragging(true);
                      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                    }}
                    onMouseMove={(e) => {
                      if (!isDragging) return;
                      const newX = e.clientX - dragStart.x;
                      const newY = e.clientY - dragStart.y;
                      
                      // Dynamic, generous pan limit using the measured stageSize to prevent getting blocked at boundaries
                      const limit = (zoom - 1) * (stageSize / 2) + 120; 
                      setPan({
                        x: Math.max(-limit, Math.min(limit, newX)),
                        y: Math.max(-limit, Math.min(limit, newY))
                      });
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onWheel={(e) => {
                      // Prevent page scroll when focusing on map zoom
                      e.preventDefault();
                      setZoom(prev => {
                        const delta = e.deltaY < 0 ? 0.5 : -0.5;
                        const next = Math.max(1, Math.min(10, prev + delta));
                        if (next === 1) setPan({ x: 0, y: 0 });
                        return next;
                      });
                    }}
                  >
                    {/* Centered aspect-ratio locked map block containing both SVG and Pin overlay */}
                    <div 
                      className="relative flex items-center justify-center select-none shrink-0"
                      style={{
                        width: `${stageSize}px`,
                        height: `${stageSize}px`,
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    >
                      <svg 
                         viewBox="0 0 240 240"
                         className="w-full h-full select-none filter drop-shadow-md"
                      >
                        <defs>
                          <linearGradient id="hexGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
                            <stop offset="35%" stopColor="#fef08a" stopOpacity="0.95"/>
                            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.9"/>
                            <stop offset="100%" stopColor="#b45309" stopOpacity="0.8"/>
                          </linearGradient>
                          <filter id="hexGlowFilter" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="3.0" result="blur" />
                            <feComponentTransfer in="blur" result="brightBlur">
                              <feFuncA type="linear" slope="2.5" />
                            </feComponentTransfer>
                            <feComposite in="SourceGraphic" in2="brightBlur" operator="over" />
                          </filter>
                        </defs>
                        {/* The focused beautifully colored state shape path, centered and scaled uniformly */}
                        <path
                          d={selectedRegion.pathCoords}
                          transform={`translate(${offsetX - bounds.minX * S}, ${offsetY - bounds.minY * S}) scale(${S})`}
                          className={`${currentTheme.mapHover} ${currentTheme.mapStroke} fill-opacity-95 ${currentTheme.mapGlow} transition-[fill,stroke,filter] duration-300`}
                        />

                        {/* Interactive Polygons for Shan State (Kalaw, Inle Lake, Taunggyi) styled as glowing white hexagons */}
                        {selectedRegion.id === 'shan' && (
                          <g transform={`translate(${offsetX}, ${offsetY}) scale(${(width * S) / 100}, ${(height * S) / 100})`}>
                            {[
                              {
                                name: 'Kalaw',
                                points: '2.0,68.0 5.0,62.8 11.0,62.8 14.0,68.0 11.0,73.2 5.0,73.2',
                                center: { x: 8.0, y: 68.0 },
                                labelOffset: { x: 0, y: 0.5 },
                                starOffset: { x: 3.5, y: -4.5 }
                              },
                              {
                                name: 'Inle Lake',
                                points: '16.0,68.0 19.0,62.8 25.0,62.8 28.0,68.0 25.0,73.2 19.0,73.2',
                                center: { x: 22.0, y: 68.0 },
                                labelOffset: { x: 0, y: 0.5 },
                                starOffset: { x: 3.5, y: -4.5 }
                              },
                              {
                                name: 'Taunggyi',
                                points: '30.0,55.0 33.0,49.8 39.0,49.8 42.0,55.0 39.0,60.2 33.0,60.2',
                                center: { x: 36.0, y: 55.0 },
                                labelOffset: { x: 0, y: 0.5 },
                                starOffset: { x: 3.5, y: -4.5 }
                              }
                            ].map((city) => {
                              const isFocused = focusedCity === city.name;
                              return (
                                <g 
                                  key={city.name} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCityClick(city.name);
                                  }}
                                  className="cursor-pointer pointer-events-auto group"
                                >
                                  {/* Multi-colored glowing aura in hexagon shape when selected or hovered */}
                                  <polygon
                                    points={city.points}
                                    style={{
                                      transformOrigin: `${city.center.x}px ${city.center.y}px`,
                                    }}
                                    fill="url(#hexGlowGrad)"
                                    filter="url(#hexGlowFilter)"
                                    className={`transition-all duration-300 pointer-events-none origin-center ${
                                      isFocused 
                                        ? 'scale-135 opacity-100 animate-pika-pulse' 
                                        : 'scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 group-hover:animate-pika-pulse'
                                    }`}
                                  />
                                  {/* Sharp outer glowing border ring */}
                                  <polygon
                                    points={city.points}
                                    style={{
                                      transformOrigin: `${city.center.x}px ${city.center.y}px`,
                                    }}
                                    fill="none"
                                    stroke="#fbbf24"
                                    strokeWidth="0.4"
                                    className={`transition-all duration-300 pointer-events-none origin-center ${
                                      isFocused 
                                        ? 'scale-115 opacity-100' 
                                        : 'scale-100 group-hover:scale-110 opacity-0 group-hover:opacity-85'
                                    }`}
                                  />
                                  <polygon
                                    points={city.points}
                                    className={`transition-all duration-300 ${
                                      isFocused 
                                        ? 'fill-[#F59E0B]/85 stroke-white stroke-[0.8] [filter:drop-shadow(0_0_6px_rgba(255,255,255,1.0))]' 
                                        : 'fill-[#F59E0B]/30 group-hover:fill-[#F59E0B]/60 stroke-white/60 group-hover:stroke-white group-hover:stroke-[0.6] [filter:drop-shadow(0_0_2px_rgba(255,255,255,0.4))] group-hover:[filter:drop-shadow(0_0_5px_rgba(255,255,255,0.95))]'
                                    }`}
                                  />
                                  {/* Label inside the polygon */}
                                  <text
                                    x={city.center.x + city.labelOffset.x}
                                    y={city.center.y + city.labelOffset.y}
                                    className={`font-sans font-extrabold select-none transition-all duration-300 pointer-events-none ${
                                      isFocused ? 'fill-white text-[1.6px] [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]' : 'fill-white/90 group-hover:fill-white text-[1.4px] [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]'
                                    }`}
                                    textAnchor="middle"
                                  >
                                    {city.name}
                                  </text>
                                  {/* Small floating bounce sparkle star when selected or hovered */}
                                  <text
                                    x={city.center.x + city.starOffset.x}
                                    y={city.center.y + city.starOffset.y}
                                    style={{ fontSize: '1.8px' }}
                                    className={`select-none pointer-events-none transition-all duration-300 origin-center ${
                                      isFocused 
                                        ? 'opacity-100 scale-125 animate-micro-bounce' 
                                        : 'opacity-0 group-hover:opacity-100 scale-100 group-hover:animate-micro-bounce'
                                    }`}
                                  >
                                    ✨
                                  </text>
                                </g>
                              );
                            })}
                          </g>
                        )}

                        {/* Connector lines for expanded cluster pins (stellar ray style, thin and shining bright like a star) */}
                        {connectorLines.map(line => {
                          const pX = offsetX + (line.endX / 100) * (width * S);
                          const pY = offsetY + (line.endY / 100) * (height * S);
                          const oX = offsetX + (line.startX / 100) * (width * S);
                          const oY = offsetY + (line.startY / 100) * (height * S);

                          const isUnfocused = focusedClusterId !== null && (line.id.replace('line-', 'cluster-') !== `cluster-${focusedClusterId}`);

                          return (
                            <g key={line.id}>
                              {/* Anchor point at center styled as a bright shining star core */}
                              <circle 
                                cx={oX} 
                                cy={oY} 
                                r="2.2" 
                                className="fill-amber-400 stroke-white stroke-[0.75]" 
                              />
                              {/* Thin curved connecting line (quadratic curve) shining bright like a star ray */}
                              {(() => {
                                const dx = pX - oX;
                                const dy = pY - oY;
                                const len = Math.sqrt(dx * dx + dy * dy);
                                // Bow it gracefully (about 15% curvature) for a gorgeous arc appearance
                                const offsetDist = len * 0.15;
                                const nx = len > 0 ? -dy / len : 0;
                                const ny = len > 0 ? dx / len : 0;
                                const cpX = (oX + pX) / 2 + nx * offsetDist;
                                const cpY = (oY + pY) / 2 + ny * offsetDist;
                                const pathD = `M ${oX} ${oY} Q ${cpX} ${cpY} ${pX} ${pY}`;

                                return (
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke={line.isSelected ? '#fbbf24' : '#fae8ff'} // Luminous gold or sharp pinkish-white
                                    strokeWidth={line.isSelected ? 1.0 : 0.6}
                                    style={{ 
                                      opacity: isUnfocused ? 0.25 : 0.95,
                                    }}
                                  />
                                );
                              })()}
                            </g>
                          );
                        })}
                      </svg>

                      {/* Absolute HTML Landmark Pin overlay to ensure constant, crisp, and compact pin size */}
                      <div className="absolute inset-0 pointer-events-none z-30">
                        {finalPinsToRender.map(({ landmark, clusterId }) => {
                          const categoryStyle = getCategoryTheme(landmark.category);
                          const isSelected = selectedLandmark?.id === landmark.id;

                          // Lineup percentages to exact scaled coordinate scope
                          const px = offsetX + (landmark.x / 100) * (width * S);
                          const py = offsetY + (landmark.y / 100) * (height * S);

                          // Convert 0-240 SVG space to percentage coordinates
                          const leftPct = (px / 240) * 100;
                          const topPct = (py / 240) * 100;

                          // Calculate if this landmark is unfocused
                          // It is unfocused if another cluster is currently focused AND this pin is not in that focused cluster
                          const isUnfocused = focusedClusterId !== null && (clusterId !== focusedClusterId);

                          return (
                            <motion.div
                              key={landmark.id}
                              layout={clusterId && animatingClusterIds.includes(clusterId) ? "position" : false}
                              onAnimationComplete={() => {
                                if (clusterId) {
                                  setAnimatingClusterIds(prev => prev.filter(id => id !== clusterId));
                                }
                              }}
                              animate={{ 
                                scale: 1 / zoom, 
                                opacity: isUnfocused ? 0.3 : 1 
                              }}
                              transition={{ type: "spring", stiffness: 120, damping: 14 }}
                              className="absolute pointer-events-auto flex flex-col items-center justify-center"
                              style={{ 
                                left: `${leftPct}%`, 
                                top: `${topPct}%`,
                                x: '-50%',
                                y: '-50%',
                                filter: isUnfocused ? 'grayscale(30%) blur(0.2px)' : 'none'
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectLandmark(landmark);
                                  if (clusterId) {
                                    setFocusedClusterId(clusterId);
                                  }
                                  if (selectedRegion.id === 'shan' && landmark.location) {
                                    setFocusedCity(landmark.location);
                                  }
                                }}
                                className="relative group outline-none flex flex-col items-center justify-center transition-transform duration-200"
                              >
                                {/* Gorgeous glowing aura rings when selected */}
                                {isSelected ? (
                                  <>
                                    <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 opacity-85 blur-md" />
                                    <div className="absolute -inset-1 rounded-full border-2 border-amber-400/50 opacity-75" />
                                  </>
                                ) : (
                                  /* Soft glowing beacon ring for unselected but available landmarks */
                                  <div className="absolute w-8 h-8 md:w-9 md:h-9 rounded-full scale-125 opacity-20 bg-neutral-400/20" />
                                )}

                                {/* Styled Pin Core with Emoji */}
                                <div className={`relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full shadow-lg border-2 transition-all duration-300 ${
                                  isSelected 
                                    ? 'scale-125 border-amber-400 bg-gradient-to-br from-amber-400 to-amber-200 text-amber-950 shadow-amber-500/50 shadow-lg z-40' 
                                    : 'hover:scale-115 border-white z-20 ' + categoryStyle.color
                                }`}>
                                  <span className="text-sm md:text-base relative z-10">{categoryStyle.emoji}</span>
                                  
                                  {/* Small floating sparkle overlay when selected */}
                                  {isSelected && (
                                    <span className="absolute -top-1.5 -right-1.5 text-[10px] animate-bounce">✨</span>
                                  )}
                                </div>

                                {/* Centered label under the pin marker - beautifully small and compact */}
                                <div className={`mt-1 font-sans text-[8px] md:text-[9px] font-bold tracking-tight whitespace-nowrap px-1.5 py-0.5 rounded shadow-sm border transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-amber-500 text-white border-amber-600 scale-105 z-30 opacity-100' 
                                    : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 opacity-90 group-hover:opacity-100'
                                }`}>
                                  {landmark.name}
                                </div>
                              </button>
                            </motion.div>
                          );
                        })}

                        {/* Cluster Pins */}
                        {clusterMarkersToRender.map((cluster) => {
                          const categoryStyle = getCategoryTheme(cluster.dominantCategory);
                          const count = cluster.items.length;
                          
                          // Lineup percentages to exact scaled coordinate scope
                          const px = offsetX + (cluster.centerX / 100) * (width * S);
                          const py = offsetY + (cluster.centerY / 100) * (height * S);

                          // Convert 0-240 SVG space to percentage coordinates
                          const leftPct = (px / 240) * 100;
                          const topPct = (py / 240) * 100;

                          const label = cluster.locationName
                            ? cluster.locationName
                            : (cluster.dominantCategory === 'hotel'
                              ? `${count} Hotels`
                              : `${count} Spots`);

                          const isUnfocused = focusedClusterId !== null && (cluster.id !== focusedClusterId);

                          return (
                            <motion.div
                              key={cluster.id}
                              layout={animatingClusterIds.includes(cluster.id) ? "position" : false}
                              animate={{ 
                                scale: 1 / zoom, 
                                opacity: isUnfocused ? 0.25 : 1 
                              }}
                              transition={{ type: "spring", stiffness: 120, damping: 14 }}
                              className="absolute pointer-events-auto flex flex-col items-center justify-center font-sans"
                              style={{ 
                                left: `${leftPct}%`, 
                                top: `${topPct}%`,
                                x: '-50%',
                                y: '-50%',
                                filter: isUnfocused ? 'blur(0.4px)' : 'none'
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedClusterIds(prev => [...prev, cluster.id]);
                                  setAnimatingClusterIds(prev => [...prev, cluster.id]);
                                  setFocusedClusterId(cluster.id);
                                }}
                                className="relative group outline-none flex flex-col items-center justify-center transition-transform duration-200 cursor-pointer"
                                title={cluster.locationName ? `${cluster.locationName} (${count} Hotels). Click to expand.` : `Contains ${count} items. Click to expand.`}
                              >
                                {/* Glowing beacon for clusters */}
                                <div className="absolute w-12 h-12 rounded-full scale-110 bg-indigo-500/20 border border-dashed border-indigo-400" />

                                {/* Styled Cluster Pin Core */}
                                <div className="relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2 border-indigo-600 bg-indigo-50 text-indigo-950 transition-all duration-300 hover:scale-110">
                                  <span className="text-base relative z-10">{categoryStyle.emoji}</span>
                                  
                                  {/* Badge showing count */}
                                  <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-extrabold rounded-full h-5.5 w-5.5 flex items-center justify-center border-2 border-white shadow-sm">
                                    {count}
                                  </span>
                                </div>

                                {/* Small text label under cluster pin */}
                                <div className="mt-1.5 font-sans text-[8.5px] font-extrabold tracking-wider uppercase bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-md border border-indigo-700 opacity-95 group-hover:opacity-100 whitespace-nowrap">
                                  {label}
                                </div>
                                <span className="text-[7px] text-indigo-400 font-extrabold tracking-wider uppercase mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  Tap to Spread Out
                                </span>
                              </button>
                            </motion.div>
                          );
                        })}

                        {/* Collapse controls for currently expanded clusters */}
                        {clusters
                          .filter(c => c.isExpanded && c.items.length > 1)
                          .map(cluster => {
                            const px = offsetX + (cluster.centerX / 100) * (width * S);
                            const py = offsetY + (cluster.centerY / 100) * (height * S);

                            const leftPct = (px / 240) * 100;
                            const topPct = (py / 240) * 100;

                            const isUnfocused = focusedClusterId !== null && (cluster.id !== focusedClusterId);

                            const label = cluster.locationName
                              ? cluster.locationName
                              : (cluster.dominantCategory === 'hotel'
                                ? 'Hotels'
                                : 'Spots');

                            return (
                              <motion.div
                                key={`collapse-${cluster.id}`}
                                animate={{ 
                                  scale: 1 / zoom, 
                                  opacity: isUnfocused ? 0.35 : 1 
                                }}
                                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                                className="absolute pointer-events-auto flex flex-col items-center justify-center font-sans z-30"
                                style={{ 
                                  left: `${leftPct}%`, 
                                  top: `${topPct}%`,
                                  x: '-50%',
                                  y: '-50%',
                                  filter: isUnfocused ? 'blur(0.4px)' : 'none'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedClusterIds(prev => prev.filter(id => id !== cluster.id));
                                    if (focusedClusterId === cluster.id) {
                                      setFocusedClusterId(null);
                                    }
                                  }}
                                  className="relative group outline-none flex flex-col items-center justify-center cursor-pointer select-none"
                                  title={`Click to collapse ${label}`}
                                >
                                  {/* Glowing outer circle indicating it's an active hub */}
                                  <div className="absolute w-12 h-12 rounded-full bg-amber-500/25 border border-dashed border-amber-400 animate-pulse" />

                                  {/* Base Circle Core showing a beautiful compass or interactive collapse icon */}
                                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-amber-500 bg-amber-50 text-amber-900 transition-all duration-200 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-600">
                                    <Compass className="w-4 h-4 transition-all duration-200 group-hover:hidden" />
                                    <span className="hidden group-hover:inline text-[11px] font-extrabold leading-none">✕</span>
                                  </div>

                                  {/* Beautiful pill label showing the name of the location, e.g., "Kalaw" */}
                                  <div className="mt-1.5 font-sans text-[9px] font-extrabold tracking-wide bg-amber-500 text-white px-3 py-0.5 rounded-full shadow-md border border-amber-600 transition-colors duration-200 group-hover:bg-amber-600 group-hover:border-amber-700 whitespace-nowrap flex items-center gap-1">
                                    <span>{label}</span>
                                    <span className="text-[8px] opacity-75 font-normal group-hover:font-extrabold">• Collapse</span>
                                  </div>
                                </button>
                              </motion.div>
                            );
                          })}

                        {/* Live Custom Landmark Preview Pin */}
                        {showAddForm && previewCoords && (
                          <div
                            className="absolute pointer-events-auto flex flex-col items-center justify-center z-40"
                            style={{ 
                              left: `${previewCoords.x}%`, 
                              top: `${previewCoords.y}%`,
                              transform: `translate(-50%, -50%) scale(${1.25 / zoom})`
                            }}
                          >
                            <div className="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-dashed border-amber-500 bg-amber-100 animate-bounce">
                              <span className="text-sm">📍</span>
                            </div>
                            <div className="mt-1 font-sans text-[8px] font-extrabold bg-amber-500 text-white px-1.5 py-0.5 rounded shadow">
                              Preview: {customName || 'New Spot'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </>
              );
            })()}
          </div>

          {/* Interactive Landmark Sheet Panels */}
          <div id="landmark-explanation-cabinet" className="w-full md:w-80 flex flex-col md:h-full">
            {showAddForm ? (
              /* ================= ADD CUSTOM LANDMARK FORM ================= */
              <form 
                onSubmit={handleSubmitCustom}
                id="add-custom-landmark-form" 
                className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm flex-1 flex flex-col justify-between"
              >
                <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-800 flex items-center gap-1 uppercase tracking-wide">
                      <Plus className="w-4 h-4 text-amber-500" />
                      Add Custom Landmark
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {formError && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded-lg flex items-center gap-1.5 font-medium leading-relaxed">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                      Landmark Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mingun Bell, Popa Crest"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                        Latitude (°N)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        placeholder="e.g. 21.90"
                        value={customLat}
                        onChange={(e) => {
                          setCustomLat(e.target.value);
                          setFormError(null);
                        }}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                        Longitude (°E)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        placeholder="e.g. 96.08"
                        value={customLng}
                        onChange={(e) => {
                          setCustomLng(e.target.value);
                          setFormError(null);
                        }}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as Category)}
                      className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                    >
                      <option value="sacred">🕌 Sacred / Pagoda</option>
                      <option value="nature">🌳 Nature / Peak</option>
                      <option value="beach">🏖️ Beach / Coast</option>
                      <option value="historical">🏰 Historical / Palace</option>
                      <option value="cultural">🎨 Cultural / Workshop</option>
                      <option value="hotel">🏨 Hotel / Lodging</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe what makes this custom attraction special..."
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                        Visit Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2 Hours"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                        Unique Selling Point
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Built in 1790"
                        value={customUsp}
                        onChange={(e) => setCustomUsp(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm hover:shadow transition-all cursor-pointer ${currentTheme.primaryBg}`}
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (focusedClusterId || selectedLandmark) ? (
              /* ================= DETAILED LANDMARK / CLUSTER CARD ================= */
              <div id="landmark-detail-sheet" className="flex-1 flex flex-col gap-1.5 min-h-0 h-full">
                {/* TOP CARD: Landmark details or Cluster overview */}
                <div className="flex-none bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm p-3 flex flex-col">
                  {selectedLandmark ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold ${getCategoryTheme(selectedLandmark.category).color}`}>
                          {selectedLandmark.category}
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          ⌛ {selectedLandmark.visitDuration || '2 Hours'}
                        </span>
                      </div>

                      <h3 className={`text-base sm:text-lg font-bold ${currentTheme.primaryText} mb-2`}>
                        {selectedLandmark.name}
                      </h3>
                      
                      {selectedLandmark.rating !== undefined && (
                        <div className="flex items-center gap-1.5 mb-3 select-none">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const ratingVal = selectedLandmark.rating || 0;
                              const isFull = i + 1 <= Math.floor(ratingVal);
                              const isHalf = !isFull && (i < ratingVal) && (ratingVal % 1 >= 0.5);
                              if (isFull) {
                                return <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />;
                              } else if (isHalf) {
                                return <StarHalf key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />;
                              } else {
                                return <Star key={i} className="w-4 h-4 text-neutral-200 fill-none" />;
                              }
                            })}
                          </div>
                          <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                            {selectedLandmark.rating.toFixed(1)} / 5.0
                          </span>
                        </div>
                      )}
                      
                      {selectedLandmark.category !== 'hotel' && (
                        <p className="text-xs text-neutral-600 leading-relaxed mb-4 whitespace-pre-line">
                          {selectedLandmark.description}
                        </p>
                      )}

                      {selectedLandmark.category === 'hotel' && (selectedLandmark.facebook || selectedLandmark.email || selectedLandmark.phoneNumber) && (
                        <div className="mb-4 rounded-lg border border-red-100 bg-red-50/60 p-3 text-[11px] text-neutral-700 space-y-1.5">
                          {selectedLandmark.facebook && (
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-20">Facebook:</span>
                              <a
                                href={selectedLandmark.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-700 hover:underline break-all"
                              >
                                {selectedLandmark.facebook}
                              </a>
                            </div>
                          )}
                          {selectedLandmark.email && (
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-20">Email:</span>
                              <a
                                href={'mailto:' + selectedLandmark.email}
                                className="text-red-700 hover:underline break-all"
                              >
                                {selectedLandmark.email}
                              </a>
                            </div>
                          )}
                          {selectedLandmark.phoneNumber && (
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-20">Phone:</span>
                              <a
                                href={'tel:' + selectedLandmark.phoneNumber.replace(/\s+/g, '')}
                                className="text-red-700 hover:underline"
                              >
                                {selectedLandmark.phoneNumber}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* External Map Buttons */}
                      {(selectedLandmark.googleMapsUrl || (selectedLandmark.lat !== undefined && selectedLandmark.lng !== undefined)) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <a
                            href={selectedLandmark.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${selectedLandmark.lat},${selectedLandmark.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all text-center"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            See in Google Maps
                          </a>
                        </div>
                      )}

                      {/* Cute Golden Trivia box */}
                      <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/50 text-[11px] text-amber-900 leading-relaxed">
                        <div className="font-bold flex items-center gap-1 text-amber-800 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Unique Selling Point
                        </div>
                        {selectedLandmark.usp}
                      </div>
                    </div>
                  ) : (
                    /* Cluster overview if no specific landmark is selected yet */
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">
                          {clusters.find(c => c.id === focusedClusterId)?.locationName || 'Cluster'}
                        </span>
                        <span className="text-xs text-indigo-500 font-bold flex items-center gap-1">
                          🏨 {clusters.find(c => c.id === focusedClusterId)?.items.length} Hotels / Spots
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-indigo-950 mb-2">
                        {clusters.find(c => c.id === focusedClusterId)?.locationName || 'Cluster Highlights'}
                      </h3>
                      
                      <p className="text-xs text-neutral-600 leading-relaxed mb-4 whitespace-pre-line">
                        Explore all the accommodation and tourist hotspots clustered at this destination. Tap on any item below to view full details!
                      </p>

                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>Tap on any pin or list item below to center and discover local attractions.</span>
                      </div>
                    </div>
                  )}

                  {/* Actions for top card */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-2">
                    {selectedLandmark && selectedLandmark.id.startsWith('custom-') && onDeleteCustomLandmark && (
                      <button
                        type="button"
                        id="delete-custom-landmark-btn"
                        onClick={() => {
                          onDeleteCustomLandmark(selectedLandmark.id);
                          onSelectLandmark(null);
                        }}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Custom Attraction
                      </button>
                    )}

                    {focusedClusterId && (
                      <button
                        type="button"
                        onClick={() => {
                          setFocusedClusterId(null);
                          onSelectLandmark(null);
                          setZoom(1);
                          setPan({ x: 0, y: 0 });
                        }}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Full Map
                      </button>
                    )}
                  </div>
                </div>

                {/* BOTTOM CARD: Cluster spots list OR default "More Hotels" list */}
                <div className="flex-1 min-h-0 bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm p-5 flex flex-col overflow-y-auto">
                  {selectedRegion?.id === 'shan' && focusedCity ? (
                    /* Show spots in the active focused city */
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="text-base">🏨</span> Hotels in {focusedCity}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setFocusedCity(null);
                            onSelectLandmark(null);
                          }}
                          className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded font-bold transition-all cursor-pointer border border-neutral-200 shadow-sm"
                        >
                          Clear Filter
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const cityItems = selectedRegion.landmarks.filter(l => 
                            (l.category === 'hotel' || l.location === focusedCity) && 
                            (l.location === focusedCity || l.name.toLowerCase().includes(focusedCity.toLowerCase()))
                          );
                          
                          if (cityItems.length > 0) {
                            return cityItems.map(item => {
                              const isCurrent = selectedLandmark?.id === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => onSelectLandmark(item)}
                                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2.5 cursor-pointer group ${
                                    isCurrent
                                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/60'
                                  }`}
                                >
                                  <div className={`p-1 rounded-md shrink-0 ${
                                    isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-white text-neutral-500 border border-neutral-200/40'
                                  }`}>
                                    <span className="text-xs">{getCategoryTheme(item.category).emoji}</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-[11px] text-neutral-800 group-hover:text-amber-700 transition-colors flex items-center justify-between gap-1">
                                      <span className="truncate">{item.name}</span>
                                      {item.rating !== undefined && (
                                        <span className="shrink-0 text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                          ★ {item.rating.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-neutral-500 mt-0.5 truncate">
                                      {item.category.toUpperCase()} • {item.visitDuration || 'Overnight'}
                                    </div>
                                  </div>
                                </button>
                              );
                            });
                          } else {
                            return (
                              <p className="text-[11px] text-neutral-400 italic">No hotels found in {focusedCity}.</p>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  ) : focusedClusterId ? (
                    /* Show spots in the active cluster */
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <span className="text-base">🏨</span> Cluster Accommodation & Sights
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const clusterItems = clusters.find(c => c.id === focusedClusterId)?.items || [];
                          return clusterItems.map(item => {
                            const isCurrent = selectedLandmark?.id === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectLandmark(item)}
                                className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2.5 cursor-pointer group ${
                                  isCurrent
                                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/60'
                                }`}
                              >
                                <div className={`p-1 rounded-md shrink-0 ${
                                  isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-white text-neutral-500 border border-neutral-200/40'
                                }`}>
                                  <span className="text-xs">{getCategoryTheme(item.category).emoji}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-[11px] text-neutral-800 group-hover:text-amber-700 transition-colors flex items-center justify-between gap-1">
                                    <span className="truncate">{item.name}</span>
                                    {item.rating !== undefined && (
                                      <span className="shrink-0 text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                        ★ {item.rating.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 mt-0.5 truncate">
                                    {item.category.toUpperCase()} • {item.visitDuration || '2 Hours'}
                                  </div>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* Default Recommended Hotels */
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <span className="text-base">🏨</span> More Hotels & Lodging
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const currentRegionHotels = selectedRegion
                            ? selectedRegion.landmarks.filter(l => l.category === 'hotel')
                            : [];
                          
                          const otherRegionsHotels: Landmark[] = [];
                          (regions || MYANMAR_REGIONS).forEach(r => {
                            if (!selectedRegion || r.id !== selectedRegion.id) {
                              r.landmarks.forEach(l => {
                                if (l.category === 'hotel') {
                                  otherRegionsHotels.push(l);
                                }
                              });
                            }
                          });

                          const recommendedHotels = [...currentRegionHotels, ...otherRegionsHotels];

                          if (recommendedHotels.length > 0) {
                            return recommendedHotels.map(hotel => {
                              const isCurrent = selectedLandmark?.id === hotel.id;
                              const hotelRegion = (regions || MYANMAR_REGIONS).find(r => r.id === hotel.regionId);
                              return (
                                <button
                                  key={hotel.id}
                                  type="button"
                                  onClick={() => {
                                    onSelectLandmark(hotel);
                                    if (hotelRegion && hotelRegion.id !== selectedRegion?.id) {
                                      onSelectRegion(hotelRegion);
                                    }
                                  }}
                                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer group ${
                                    isCurrent
                                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                                      : 'bg-neutral-50/50 hover:bg-neutral-50 border-neutral-200/60 hover:border-neutral-300'
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg shrink-0 ${
                                    isCurrent ? 'bg-amber-100 text-amber-700' : 'bg-white text-neutral-500 border border-neutral-200/40 group-hover:text-amber-600'
                                  }`}>
                                    <span className="text-sm">🏨</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-xs text-neutral-800 group-hover:text-amber-700 transition-colors flex items-center justify-between gap-1">
                                      <span className="truncate">{hotel.name}</span>
                                      {hotel.rating !== undefined && (
                                        <span className="shrink-0 text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                                          ★ {hotel.rating.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1.5">
                                      <span>📍 {hotelRegion?.name || 'Myanmar'}</span>
                                      <span className="text-neutral-300">•</span>
                                      <span>{hotel.visitDuration || 'Overnight'}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            });
                          } else {
                            return (
                              <p className="text-[11px] text-neutral-400 italic">No hotels found in database.</p>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ================= NO LANDMARK SELECTED SLATE ================= */
              <div id="no-landmark-selected-slate" className="p-6 bg-neutral-100/60 rounded-xl border border-dashed border-neutral-200 flex flex-col items-center justify-center text-center h-full gap-4 justify-between">
                <div className="flex flex-col items-center justify-center my-auto">
                  <Compass className="w-8 h-8 text-neutral-300 mb-2 animate-[spin_10s_linear_infinite]" />
                  <h4 className="text-xs font-bold text-neutral-500 mb-1">No attraction clicked</h4>
                  <p className="text-[11px] text-neutral-400 max-w-[200px]">
                    Click on any icon pin on the map to show full attractions descriptions!
                  </p>
                </div>

                {onAddCustomLandmark && (
                  <button
                    type="button"
                    onClick={openAddForm}
                    className={`w-full py-2 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-sm transition-all hover:shadow-md ${currentTheme.primaryBg}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Lat/Long
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= NATIONAL GEOGRAPHIC MAP MODE ================= */
        <div id="national-map-mode" className="relative flex flex-col lg:flex-row gap-8 items-center lg:items-stretch min-h-[500px]">
          
          {/* Main SVG National Map Visual Container */}
          <div 
            id="national-svg-holder" 
            className="flex-1 w-full flex justify-center items-center relative overflow-visible py-4 border-neutral-200"
          >
            <svg 
              id="myanmar-svg-national"
              viewBox="264 15 471 969" 
              className="w-full max-w-[420px] max-h-[580px] drop-shadow-md select-none transition-transform duration-500 hover:scale-[1.02]"
            >
              <g id="states-group">
                {regions.map((region) => {
                  const isSelected = selectedRegion?.id === region.id;
                  const isHovered = hoveredRegion?.id === region.id;
                  
                  // Secondary Highlight matches search results
                  const matchesQuery = searchQuery || (selectedCategory && selectedCategory !== 'all');
                  const containsResult = matchesQuery && matchesSearchAndCategory(region);

                  // Colors derived dynamically from active customization themes
                  let fill = currentTheme.mapFill;
                  if (isSelected) {
                    fill = currentTheme.mapHover;
                  } else if (isHovered) {
                    fill = 'opacity-85 ' + currentTheme.mapHover;
                  } else if (containsResult) {
                    fill = currentTheme.id === 'vibrant' ? 'fill-[#FFD166]' : currentTheme.id === 'cute' ? 'fill-pink-300' : currentTheme.id === 'classic' ? 'fill-amber-300' : 'fill-emerald-200';
                  }

                  return (
                    <path
                      key={region.id}
                      id={`vector-path-${region.id}`}
                      d={region.pathCoords}
                      className={`${fill} ${currentTheme.mapStroke} cursor-pointer transition-all duration-300 outline-none ${
                        isSelected ? currentTheme.mapGlow : ''
                      }`}
                      onMouseEnter={() => setHoveredRegion(region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => handleRegionClick(region)}
                    />
                  );
                })}
              </g>

              {/* Dotted Trails for custom itineraries */}
              {renderNationalPath()}

              {/* Render small star-bubbles for capitals or main anchors */}
              <g id="capital-stars" className="pointer-events-none">
                {regions.map((region) => {
                  const isSelected = selectedRegion?.id === region.id;
                  return (
                    <g key={`capital-marker-${region.id}`}>
                      {/* Fluffy star helper dots */}
                      {isSelected && (
                        <circle
                          cx={region.centerX}
                          cy={region.centerY}
                          r="10"
                          className="fill-amber-400/40 animate-ping"
                        />
                      )}
                      
                      <circle
                        cx={region.centerX}
                        cy={region.centerY}
                        r="3.5"
                        className={
                          isSelected 
                            ? 'fill-amber-500 stroke-white' 
                            : 'fill-neutral-700/60 stroke-white'
                        }
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Dynamic floating hover banner on the national canvas */}
            {hoveredRegion && (
              <div 
                id="floating-hover-banner" 
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '15px',
                  transform: 'translateX(-50%)'
                }}
                className="bg-neutral-900/90 backdrop-blur-md text-white text-xs py-1.5 px-3.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none z-30 transition-opacity duration-300 animate-fade-in"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">{hoveredRegion.name}</span>
                <span className="text-[10px] text-neutral-300 font-mono">({hoveredRegion.capital})</span>
              </div>
            )}
          </div>

          {/* Quick Inspector Side Panel */}
          <div id="inspector-brief-tab" className="w-full lg:w-80 flex flex-col justify-start">
            {selectedRegion ? (
              <div 
                id="region-focus-summary" 
                className={`p-5 rounded-2xl bg-neutral-50 border border-neutral-100 shadow-sm flex flex-col justify-between ${
                  currentTheme.id === 'cute' ? 'border-pink-100' :
                  currentTheme.id === 'classic' ? 'border-amber-200' :
                  'border-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span id="greeting-box" className={`text-xs font-mono font-bold px-2 py-1 rounded-sm ${currentTheme.accentBg} ${currentTheme.accentColor}`}>
                      🗣️ "{selectedRegion.traditionalGreeting}"
                    </span>
                    <span id="region-capital-chip" className="text-xs text-neutral-400 font-medium">
                      Cap: {selectedRegion.capital}
                    </span>
                  </div>

                  <h3 id="inspector-region-name" className={`text-lg font-bold text-neutral-800 ${currentTheme.primaryText}`}>
                    {selectedRegion.name}
                  </h3>
                  <span id="inspector-myanmar-script" className="text-xs text-neutral-400 font-medium block mb-2 font-mono">
                    {selectedRegion.myanmarName}
                  </span>

                  <p id="inspector-description" className="text-xs text-neutral-600 leading-relaxed mb-4 whitespace-pre-line">
                    {selectedRegion.description}
                  </p>

                  {/* Highlights Grid */}
                  <div id="inspector-bullet-grid" className="space-y-2.5 border-t border-neutral-100 pt-3">
                    <div className="text-[11px] flex items-start gap-1.5 text-neutral-600">
                      <span className="text-xs">🍲</span>
                      <div>
                        <strong>Local Dish: </strong> 
                        <span>{selectedRegion.specialtyFood}</span>
                      </div>
                    </div>
                    <div className="text-[11px] flex items-start gap-1.5 text-neutral-600">
                      <span className="text-xs">💡</span>
                      <div>
                        <strong>Regional Trivia: </strong> 
                        <span>{selectedRegion.localTrivia}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="inspector-action-launchers" className="mt-5 pt-4 border-t border-neutral-100 flex flex-col gap-2">
                  <button
                    id="zoom-details-launcher"
                    onClick={() => {
                      onSetDetailedView(true);
                      onSelectLandmark(null);
                    }}
                    className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-sm hover:shadow transition-all ${
                      currentTheme.primaryBg
                    }`}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    Zoom into landmarks ({selectedRegion.landmarks.length})
                  </button>
                </div>
              </div>
            ) : (
              <div id="no-region-selected-slate" className="p-6 bg-white/40 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center py-16">
                <Compass className="w-12 h-12 text-neutral-300 mb-3 animate-pulse" />
                <h4 className="text-sm font-bold text-neutral-500 mb-1">Explore Myanmar!</h4>
                <p className="text-xs text-neutral-400 max-w-[200px] leading-relaxed">
                  Click on any state/region on the map to browse culture, traditional greetings, specialties, and attractions!
                </p>
                
                {searchQuery && (
                  <div className="mt-4 flex items-center gap-1 text-[11px] bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Matching search filters
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}