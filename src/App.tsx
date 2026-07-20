/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Region, Landmark, ThemeConfig, CustomPath, Category } from './types';
import { MYANMAR_REGIONS, APP_THEMES } from './data';
import MyanmarMap from './components/MyanmarMap';
import { 
  Search, 
  MapPin, 
  X, 
  Sparkles, 
  Compass, 
  Filter, 
  Heart, 
  BookOpen, 
  Star,
  Map,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // 1. Core States
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(APP_THEMES[0]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isDetailedView, setIsDetailedView] = useState<boolean>(false);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  
  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Custom Itinerary state path
  const [customPath, setCustomPath] = useState<CustomPath | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isItineraryCollapsed, setIsItineraryCollapsed] = useState<boolean>(false);

  // Custom added landmarks (using real-world lat/long coordinates)
  const [customLandmarks, setCustomLandmarks] = useState<Landmark[]>([]);

  // 2. LocalStorage Persistence Loader
  useEffect(() => {
    try {
      const savedPath = localStorage.getItem('myanmar-itinerary-v1');
      if (savedPath) {
        setCustomPath(JSON.parse(savedPath));
      } else {
        // Initial clean state draft
        setCustomPath({
          id: 'itinerary-draft',
          title: '🌸 My Golden Land Trip',
          landmarkIds: ['yangon-shwedagon', 'mon-goldenrock', 'mandalay-bagan'],
          createdAt: new Date().toISOString()
        });
      }

      const savedCustom = localStorage.getItem('myanmar-custom-landmarks-v1');
      if (savedCustom) {
        setCustomLandmarks(JSON.parse(savedCustom));
      }
    } catch (e) {
      console.error('Failed to load local storage state', e);
    }
  }, []);

  // Merge static regions with custom landmarks dynamically
  const regionsWithCustom = MYANMAR_REGIONS.map(region => {
    const regionCustom = customLandmarks.filter(lm => lm.regionId === region.id);
    return {
      ...region,
      landmarks: [...region.landmarks, ...regionCustom]
    };
  });

  const activeRegion = selectedRegion 
    ? (regionsWithCustom.find(r => r.id === selectedRegion.id) || selectedRegion) 
    : null;

  const handleAddCustomLandmark = (landmark: Landmark) => {
    const updated = [...customLandmarks, landmark];
    setCustomLandmarks(updated);
    localStorage.setItem('myanmar-custom-landmarks-v1', JSON.stringify(updated));
    showNotice(`Created custom attraction: ${landmark.name}!`, 'success');
  };

  const handleDeleteCustomLandmark = (landmarkId: string) => {
    const updated = customLandmarks.filter(lm => lm.id !== landmarkId);
    setCustomLandmarks(updated);
    localStorage.setItem('myanmar-custom-landmarks-v1', JSON.stringify(updated));
    showNotice(`Deleted custom attraction`, 'info');
  };

  // Sync itinerary changes automatically to localStorage
  const handleSetCustomPath = (newPath: CustomPath | null) => {
    setCustomPath(newPath);
    if (newPath) {
      localStorage.setItem('myanmar-itinerary-v1', JSON.stringify(newPath));
    } else {
      localStorage.removeItem('myanmar-itinerary-v1');
    }
  };

  // Helper notice toast
  const showNotice = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  // 3. Custom Path (Itinerary) Operations
  const handleAddLandmarkToPath = (landmark: Landmark) => {
    if (!customPath) return;

    // Check of duplicate
    if (customPath.landmarkIds.includes(landmark.id)) {
      showNotice(`${landmark.name} is already in your custom path!`, 'info');
      return;
    }

    const updatedIds = [...customPath.landmarkIds, landmark.id];
    handleSetCustomPath({
      ...customPath,
      landmarkIds: updatedIds
    });
    showNotice(`Added ${landmark.name} to your custom path!`, 'success');
  };

  const handleRemoveLandmarkFromPath = (landmarkId: string) => {
    if (!customPath) return;
    const updatedIds = customPath.landmarkIds.filter(id => id !== landmarkId);
    handleSetCustomPath({
      ...customPath,
      landmarkIds: updatedIds
    });
    showNotice(`Removed pinpoint from itinerary`, 'info');
  };

  const handleReorderLandmarks = (index: number, direction: 'up' | 'down') => {
    if (!customPath) return;
    const updated = [...customPath.landmarkIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= updated.length) return;

    // Swap elements
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    handleSetCustomPath({
      ...customPath,
      landmarkIds: updated
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    showNotice('Filters cleared', 'info');
  };

  // Quick Category filter chips definitions
  const categories: { id: string; label: string; emoji: string }[] = [
    { id: 'all', label: 'All Sights', emoji: '🗺️' },
    { id: 'sacred', label: 'Temples & Sacred Sites', emoji: '🕌' },
    { id: 'nature', label: 'Nature & Peaks', emoji: '🌳' },
    { id: 'beach', label: 'Beaches & Shores', emoji: '🏖️' },
    { id: 'historical', label: 'History & Palaces', emoji: '🏰' },
    { id: 'cultural', label: 'Craft workshops', emoji: '🎨' },
    { id: 'hotel', label: 'Hotels & Lodging', emoji: '🏨' }
  ];

  const fontClass = currentTheme.id === 'classic' ? 'font-serif' : 'font-sans';

  return (
    <div 
      className={`min-h-screen py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${currentTheme.background} ${fontClass}`}
      id="app-root-frame"
    >
      {/* Toast floating notifications */}
      {message && (
        <div 
          id="toast-notification"
          className="fixed top-5 right-5 z-50 flex items-center gap-2 p-3.5 px-5 rounded-xl shadow-xl border text-xs font-bold bg-neutral-900 border-neutral-800 text-white animate-fade-in"
        >
          <div className={`w-2 h-2 rounded-full ${
            message.type === 'success' ? 'bg-green-400' : 'bg-amber-400'
          }`} />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 hover:text-neutral-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= SEARCH & ADVANCED FILTERS ================= */}
        <section 
          id="search-filter-section"
          className={`p-5 bg-white border border-neutral-200/60 ${currentTheme.rounded} shadow-sm space-y-4`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-neutral-400" />
              </span>
              <input
                id="search-landmarks-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landmarks or region names (e.g. Bagan, Inle, Sule)..."
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-shadow"
              />
              {searchQuery && (
                <button
                  id="clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Actions / Reset */}
            <div className="flex items-center gap-2">
              <button
                id="reset-filters-btn"
                onClick={handleClearFilters}
                className="text-xs px-3.5 py-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 font-medium transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Category Toggle Badges */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category Filters
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`filter-chip-${cat.id}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      showNotice(`Filtering by ${cat.label}`, 'info');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? currentTheme.buttonActiveBg + ' shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-800'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= MAP ARENA ================= */}
        <main className="w-full">
          <MyanmarMap
            currentTheme={currentTheme}
            selectedRegion={activeRegion}
            onSelectRegion={setSelectedRegion}
            isDetailedView={isDetailedView}
            onSetDetailedView={setIsDetailedView}
            selectedLandmark={selectedLandmark}
            onSelectLandmark={setSelectedLandmark}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddCustomLandmark={handleAddCustomLandmark}
            onDeleteCustomLandmark={handleDeleteCustomLandmark}
            regions={regionsWithCustom}
          />
        </main>

        {/* ================= CULTURAL LANDMARKS DESCRIPTIONS SHEET ================= */}
        {!isDetailedView && activeRegion && (
          <section
            id="subregion-drawer"
            className={`p-6 ${currentTheme.cardBg} ${currentTheme.rounded} border border-neutral-200/50 shadow-sm animate-fade-in`}
          >
            <h3 className={`text-lg font-bold ${currentTheme.primaryText} mb-3 flex items-center gap-1.5`}>
              <Star className="w-4 h-4 text-amber-500" />
              Famous Attractions of {activeRegion.name}
            </h3>
            
            <div id="quick-landmarks-row" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeRegion.landmarks.filter(l => l.category !== 'hotel').map(landmark => (
                <div 
                  key={landmark.id} 
                  className="p-4 bg-white/70 backdrop-blur border border-neutral-200/40 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#a16207]">
                        {landmark.category}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">⌛ {landmark.visitDuration}</span>
                    </div>
                    <h4 className="text-xs font-extrabold text-neutral-800 mb-1">{landmark.name}</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed mb-3">{landmark.description}</p>
                  </div>
                  
                  <button
                    id={`select-${landmark.id}-app-btn`}
                    onClick={() => {
                      setSelectedLandmark(landmark);
                      setIsDetailedView(true);
                    }}
                    className={`w-full py-1.5 px-2 bg-neutral-900 text-white rounded text-[10px] font-bold hover:bg-neutral-800 transition-colors uppercase cursor-pointer flex items-center justify-center gap-1`}
                  >
                    <Compass className="w-3 h-3" /> View on Map
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-dashed border-neutral-200 text-center">
              <button
                id="interactive-zoom-bottom-trigger"
                onClick={() => setIsDetailedView(true)}
                className={`text-xs font-bold text-amber-600 hover:text-amber-800 hover:underline`}
              >
                Double-click map OR Click here to zoom into local map coordinates 🔍
              </button>
            </div>
          </section>
        )}

        {/* ================= CULTURAL MANUAL ENCYCLOPEDIA ================= */}
        <section 
          id="cultural-encyclopedia" 
          className={`p-6 bg-white/40 border border-neutral-200/40 ${currentTheme.rounded} flex flex-col md:flex-row justify-between items-center gap-4`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentTheme.accentBg} ${currentTheme.accentColor}`}>
              <BookOpen className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className={`text-sm font-extrabold text-neutral-800`}>Burmese Cultural Reference Manual</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Myanmar possesses a multi-layered history spanning the early Pyu cities, Pagan Dynasty golden empires, Konbaung courts, and complex ethnic confederacies. Each division carries a distinct landscape character.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <a 
              href="https://en.wikipedia.org/wiki/Myanmar" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 font-semibold rounded-lg text-neutral-700 transition-all flex items-center gap-1"
            >
              Wikipedia Info &rarr;
            </a>
          </div>
        </section>

        {/* ================= FOOTER CREDITS ================= */}
        <footer id="app-footer" className="text-center py-6 text-neutral-400 text-[11px] font-mono whitespace-nowrap">
          <p>© 2026 Union of Myanmar Interactive Map Explorer. Built with Customizable Aesthetics.</p>
          <div id="footer-emojis" className="flex justify-center gap-2 mt-1.5 opacity-60">
            <span>🌸</span><span>📜</span><span>👑</span><span>🍃</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
