/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, ThemeConfig, CustomPath, Region } from '../types';
import { MYANMAR_REGIONS } from '../data';
import { 
  Map, 
  Trash2, 
  Save, 
  Compass, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  Clock, 
  BookOpen, 
  CornerDownRight,
  ClipboardList
} from 'lucide-react';

interface ItineraryPlannerProps {
  currentTheme: ThemeConfig;
  customPath: CustomPath | null;
  onSetCustomPath: (path: CustomPath | null) => void;
  onRemoveLandmark: (landmarkId: string) => void;
  onReorderLandmarks: (index: number, direction: 'up' | 'down') => void;
  onCollapse?: () => void;
  regions?: Region[];
}

export default function ItineraryPlanner({
  currentTheme,
  customPath,
  onSetCustomPath,
  onRemoveLandmark,
  onReorderLandmarks,
  onCollapse,
  regions = MYANMAR_REGIONS
}: ItineraryPlannerProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(customPath?.title || 'My Myanmar Pilgrimage');

  // Load a preloaded scenario itinerary
  const loadTemplateItinerary = (templateName: string) => {
    let ids: string[] = [];
    let title = '';

    if (templateName === 'golden-pagoda') {
      title = '👑 Golden Pagodas & Sacred Shrines';
      ids = ['yangon-shwedagon', 'mon-goldenrock', 'sagaing-hsinbyume', 'mandalay-bagan', 'npt-uppatasanti'];
    } else if (templateName === 'nature-beach') {
      title = '🏖️ Coastal Surf & Jungle Peaks';
      ids = ['rakhine-ngapali', 'tanintharyi-grandfather', 'kachin-myitsone', 'kayin-zwegabin', 'chin-rih-lake'];
    } else {
      title = '🎨 Traditional Crafts & Dynasties';
      ids = ['ayeyarwady-pathein', 'mandalay-ubein', 'sagaing-phowin', 'mandalay-palace', 'mon-biluisland'];
    }

    const newPath: CustomPath = {
      id: `path-${Date.now()}`,
      title,
      landmarkIds: ids,
      createdAt: new Date().toISOString()
    };
    onSetCustomPath(newPath);
    setTitleInput(title);
    setEditingTitle(false);
  };

  const handleSaveTitle = () => {
    if (customPath) {
      const updated = { ...customPath, title: titleInput };
      onSetCustomPath(updated);
    }
    setEditingTitle(false);
  };

  // Helper to fetch full Landmark object by ID
  const getLandmarkById = (id: string): Landmark | null => {
    for (const reg of regions) {
      const match = reg.landmarks.find(lm => lm.id === id);
      if (match) return match;
    }
    return null;
  };

  // Helper to fetch holding region name
  const getHoldingRegion = (landmark: Landmark) => {
    const parent = regions.find(r => r.id === landmark.regionId);
    return parent ? parent.name : 'Unknown Region';
  };

  // Compute travel statistics
  const listLandmarks = customPath ? customPath.landmarkIds.map(getLandmarkById).filter(Boolean) as Landmark[] : [];
  const uniqueCounties = new Set(listLandmarks.map(lm => lm.regionId)).size;
  const estimDuration = listLandmarks.length * 1.5; // simple heuristic formula

  return (
    <div id="planner-box" className={`p-5 bg-white border border-neutral-200 ${currentTheme.rounded} transition-all duration-300 shadow-sm flex flex-col justify-between h-full`}>
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className={`w-5 h-5 ${currentTheme.accentColor}`} />
            <h3 className="font-bold text-neutral-800 text-sm tracking-wide uppercase">Custom Path Itinerary</h3>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono font-semibold">
              {listLandmarks.length} pins
            </span>
            {onCollapse && (
              <button
                id="collapse-itinerary-btn"
                onClick={onCollapse}
                className="text-[10px] bg-neutral-150 hover:bg-neutral-200 text-neutral-600 font-bold px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 border border-neutral-200/50 shadow-xs"
                title="Collapse itinerary to expand map"
              >
                Hide &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Path Title Editor */}
        {customPath ? (
          <div className="mb-4 pb-3 border-b border-neutral-100">
            {editingTitle ? (
              <div id="title-editor-row" className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold text-neutral-800 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1"
                  placeholder="Itinerary Title"
                />
                <button
                  id="save-title-btn"
                  onClick={handleSaveTitle}
                  className="p-1 px-2.5 bg-neutral-900 text-white rounded text-[10px] uppercase font-bold"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h4 
                  onClick={() => setEditingTitle(true)}
                  className={`text-xs font-bold ${currentTheme.primaryText} cursor-pointer hover:underline flex items-center gap-1`}
                >
                  📍 {customPath.title}
                </h4>
                <button
                  id="rename-btn"
                  onClick={() => setEditingTitle(true)}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 hover:underline"
                >
                  Rename
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* List of Landmarks inside the active route */}
        {listLandmarks.length > 0 ? (
          <div id="itinerary-checkpoints-list" className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
            {listLandmarks.map((landmark, index) => (
              <div
                key={`${landmark.id}-step-${index}`}
                className="flex items-stretch justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100/80 rounded-xl border border-neutral-200/50 transition-colors"
              >
                <div className="flex gap-2.5 items-center">
                  {/* Step index badge */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    currentTheme.id === 'vibrant' ? 'bg-[#FF8E72]' :
                    currentTheme.id === 'cute' ? 'bg-pink-400' :
                    currentTheme.id === 'royal' ? 'bg-amber-600' :
                    'bg-emerald-800'
                  }`}>
                    {index + 1}
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-neutral-800 leading-tight">
                      {landmark.name}
                    </h5>
                    <p className="text-[9px] text-neutral-400 flex items-center gap-0.5">
                      <CornerDownRight className="w-2.5 h-2.5 inline" /> {getHoldingRegion(landmark)}
                    </p>
                  </div>
                </div>

                {/* Arrow manipulation and garbage inputs */}
                <div className="flex items-center gap-1.5 pl-2">
                  <button
                    id={`move-up-${index}`}
                    onClick={() => onReorderLandmarks(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-neutral-200/60 disabled:opacity-20 text-neutral-500 rounded transition-colors"
                    title="Move up in route"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    id={`move-down-${index}`}
                    onClick={() => onReorderLandmarks(index, 'down')}
                    disabled={index === listLandmarks.length - 1}
                    className="p-1 hover:bg-neutral-200/60 disabled:opacity-20 text-neutral-500 rounded transition-colors"
                    title="Move down in route"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    id={`remove-${index}`}
                    onClick={() => onRemoveLandmark(landmark.id)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                    title="Remove from itinerary"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div id="empty-planner-alert" className="p-5 border border-dashed border-neutral-200 rounded-xl text-center flex flex-col items-center justify-center py-8 bg-neutral-50/20">
            <Compass className="w-8 h-8 text-neutral-300 mb-2 animate-bounce" />
            <p className="text-[11px] text-neutral-500 font-bold mb-1">Your Itinerary is empty</p>
            <p className="text-[10px] text-neutral-400 max-w-[220px] leading-tight">
              Zoom into any state and click <strong className="text-neutral-600">"Pin to Custom Itinerary"</strong> to build your path.
            </p>
          </div>
        )}

        {/* Travel path statistics helper drawer */}
        {listLandmarks.length > 0 && (
          <div id="planner-metrics-drawer" className="mt-4 p-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/10 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <Layers className="w-3.5 h-3.5 text-neutral-400 mb-0.5" />
              <span className="text-[10px] text-neutral-400">Coverage</span>
              <span className="text-xs font-bold text-neutral-700">{uniqueCounties} States</span>
            </div>
            <div className="flex flex-col items-center border-l border-neutral-100">
              <Clock className="w-3.5 h-3.5 text-neutral-400 mb-0.5" />
              <span className="text-[10px] text-neutral-400">Pacing</span>
              <span className="text-xs font-bold text-[#b45309]">{estimDuration}h Est</span>
            </div>
            <div className="flex flex-col items-center border-l border-neutral-100">
              <Save className="w-3.5 h-3.5 text-neutral-400 mb-0.5" />
              <span className="text-[10px] text-neutral-400 font-medium">Backup</span>
              <span className="text-[10px] font-bold text-emerald-800">Auto-saved</span>
            </div>
          </div>
        )}
      </div>

      {/* Pre-packaged template loops shortcuts */}
      <div id="scenic-presets-bottom" className="mt-5 pt-4 border-t border-neutral-100">
        <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500 animate-[spin_5s_linear_infinite]" />
          Instant Adventure Scenarios
        </h5>
        <div id="template-buttons" className="grid grid-cols-1 gap-1.5">
          <button
            id="preset-golden-pagoda"
            onClick={() => loadTemplateItinerary('golden-pagoda')}
            className="w-full text-left p-2 rounded-lg bg-yellow-50/40 hover:bg-yellow-50 text-[11px] font-semibold border border-yellow-200/50 hover:border-yellow-300 text-amber-900 transition-all flex items-center justify-between"
          >
            <span>👑 Golden Pagodas & Sacred Shrines</span>
            <span className="text-[9px] bg-yellow-100 px-2 py-0.5 rounded text-amber-900 font-mono font-bold">5 sites</span>
          </button>
          <button
            id="preset-beach-adventure"
            onClick={() => loadTemplateItinerary('nature-beach')}
            className="w-full text-left p-2 rounded-lg bg-sky-50/40 hover:bg-sky-50 text-[11px] font-semibold border border-sky-200/50 hover:border-sky-300 text-sky-900 transition-all flex items-center justify-between"
          >
            <span>🏖️ Coastal Surf & Jungle Peaks</span>
            <span className="text-[9px] bg-sky-100 px-2 py-0.5 rounded text-sky-900 font-mono font-bold">5 sites</span>
          </button>
          <button
            id="preset-heritage-craft"
            onClick={() => loadTemplateItinerary('heritage-craft')}
            className="w-full text-left p-2 rounded-lg bg-red-50/40 hover:bg-red-50 text-[11px] font-semibold border border-red-200/50 hover:border-red-300 text-red-900 transition-all flex items-center justify-between"
          >
            <span>🎨 Traditional Crafts & Dynasties</span>
            <span className="text-[9px] bg-red-100 px-2 py-0.5 rounded text-red-900 font-mono font-bold">5 sites</span>
          </button>
        </div>
      </div>
    </div>
  );
}
