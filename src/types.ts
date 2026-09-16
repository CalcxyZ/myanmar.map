/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'sacred' | 'nature' | 'beach' | 'historical' | 'cultural' | 'hotel';

export interface Landmark {
  id: string;
  name: string;
  regionId: string;
  category: Category;
  description: string;
  usp: string;
  // Percentage coordinates relative to detailed box (0 - 100)
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  visitDuration: string;
  location?: string;
  rating?: number;
  facebook?: string;
  email?: string;
  phoneNumber?: string;
}

export interface Region {
  id: string;
  name: string;
  myanmarName: string;
  capital: string;
  description: string;
  localTrivia: string;
  specialtyFood: string;
  traditionalGreeting: string;
  landmarks: Landmark[];
  pathCoords: string; // SVG path coordinates for the national map
  centerX: number; // Approximate hover card anchor X
  centerY: number; // Approximate hover card anchor Y
}

export type ThemeType = 'vibrant' | 'cute' | 'classic' | 'royal' | 'minimalist';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  emoji: string;
  background: string;
  cardBg: string;
  primaryBg: string;
  primaryText: string;
  secondaryText: string;
  accentColor: string;
  accentBg: string;
  buttonActiveBg: string;
  mapFill: string;
  mapGlow: string;
  mapHover: string;
  mapStroke: string;
  fontFamily: string;
  rounded: string;
  shadow: string;
  borderStyle: string;
}

export interface CustomPath {
  id: string;
  title: string;
  landmarkIds: string[];
  createdAt: string;
}
