export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  url: string;
  detail: string;
  felt?: number;
  cdi?: number;
  mmi?: number;
  alert?: string;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst?: number;
  dmin?: number;
  rms?: number;
  gap?: number;
  magType: string;
  type: string;
  title: string;
  coordinates: [number, number, number]; // [longitude, latitude, depth]
}

// Raw USGS API response format
export interface USGSEarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  updated: number;
  tz?: number;
  url: string;
  detail: string;
  felt?: number;
  cdi?: number;
  mmi?: number;
  alert?: string;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst?: number;
  dmin?: number;
  rms?: number;
  gap?: number;
  magType: string;
  type: string;
  title: string;
}

export interface EarthquakeFeature {
  type: "Feature";
  properties: Omit<Earthquake, "coordinates">;
  geometry: {
    type: "Point";
    coordinates: [number, number, number];
  };
  id: string;
}

export interface USGSEarthquakeFeature {
  type: "Feature";
  properties: USGSEarthquakeProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number, number];
  };
  id: string;
}

export interface USGSResponse {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSEarthquakeFeature[];
}

export interface FilterOptions {
  timeRange: '1hour' | '1day' | '7days' | '30days';
  magnitudeRange: [number, number];
  depthRange: [number, number];
  region?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  showHeatmap?: boolean;
  showClusters?: boolean;
}

export interface EarthquakeStats {
  totalCount: number;
  largestMagnitude: number;
  averageMagnitude: number;
  deepestDepth: number;
  shallowestDepth: number;
  mostRecentTime: number;
  magnitudeDistribution: {
    low: number; // < 3.0
    medium: number; // 3.0 - 5.0
    high: number; // 5.0 - 6.0
    severe: number; // > 6.0
  };
}