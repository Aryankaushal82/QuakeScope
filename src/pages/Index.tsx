  import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import QuakeScopeMap from '@/components/QuakeScopeMap';
import FilterPanel from '@/components/FilterPanel';
import InsightsPanel from '@/components/InsightsPanel';
import { EarthquakeFeature, FilterOptions, EarthquakeStats, USGSResponse } from '@/types/earthquake';
import { Settings, BarChart3, Play, Pause, RotateCcw, Layers, Activity, LocateFixed } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const QuakeScopeIndex = () => {
  const { toast } = useToast();
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userApproximate, setUserApproximate] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const geoRequestedRef = useRef(false);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: '1day',
    magnitudeRange: [0, 10],
    depthRange: [0, 700],
    showHeatmap: false,
    showClusters: false
  });


  useEffect(() => {
    if (showFilters && showInsights) setShowInsights(false);
  }, [showFilters, showInsights]);

 
  const [playbackProgress, setPlaybackProgress] = useState(0); 
  const playbackDurationMs = 30_000; 
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  
  const calculateStats = useCallback((earthquakes: EarthquakeFeature[]): EarthquakeStats => {
    if (earthquakes.length === 0) {
      return {
        totalCount: 0,
        largestMagnitude: 0,
        averageMagnitude: 0,
        deepestDepth: 0,
        shallowestDepth: 0,
        mostRecentTime: 0,
        magnitudeDistribution: { low: 0, medium: 0, high: 0, severe: 0 }
      };
    }

    const magnitudes = earthquakes.map(eq => eq.properties.magnitude);
    const depths = earthquakes.map(eq => Math.abs(eq.geometry.coordinates[2]));
    const times = earthquakes.map(eq => eq.properties.time);

    const magnitudeDistribution = {
      low: earthquakes.filter(eq => eq.properties.magnitude < 3.0).length,
      medium: earthquakes.filter(eq => eq.properties.magnitude >= 3.0 && eq.properties.magnitude < 5.0).length,
      high: earthquakes.filter(eq => eq.properties.magnitude >= 5.0 && eq.properties.magnitude < 6.0).length,
      severe: earthquakes.filter(eq => eq.properties.magnitude >= 6.0).length
    };

    return {
      totalCount: earthquakes.length,
      largestMagnitude: Math.max(...magnitudes),
      averageMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      deepestDepth: Math.max(...depths),
      shallowestDepth: Math.min(...depths),
      mostRecentTime: Math.max(...times),
      magnitudeDistribution
    };
  }, []);

  // Fetch earthquake data from USGS FDSNWS API
  const fetchEarthquakes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
    
      const now = new Date();
      let startTime: Date;
      
      switch (filters.timeRange) {
        case '1hour':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '1day':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7days':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

    
      const startTimeStr = startTime.toISOString().split('.')[0];
      const endTimeStr = now.toISOString().split('.')[0];
      const minMagnitude = Math.max(0, filters.magnitudeRange[0]);
      
      
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTimeStr}&endtime=${endTimeStr}&minmagnitude=${minMagnitude}&maxmagnitude=${filters.magnitudeRange[1]}&mindepth=${filters.depthRange[0]}&maxdepth=${filters.depthRange[1]}&orderby=time&limit=1000`;
      
      console.log('Fetching earthquakes from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch earthquake data: ${response.statusText}`);
      }
      
      const data: USGSResponse = await response.json();
      
    
      const transformedEarthquakes = data.features.map(feature => ({
        ...feature,
        properties: {
          id: feature.id,
          magnitude: feature.properties.mag || 0,
          place: feature.properties.place || 'Unknown location',
          time: feature.properties.time || Date.now(),
          updated: feature.properties.updated || Date.now(),
          url: feature.properties.url || '',
          detail: feature.properties.detail || '',
          felt: feature.properties.felt,
          cdi: feature.properties.cdi,
          mmi: feature.properties.mmi,
          alert: feature.properties.alert,
          status: feature.properties.status || 'automatic',
          tsunami: feature.properties.tsunami || 0,
          sig: feature.properties.sig || 0,
          net: feature.properties.net || '',
          code: feature.properties.code || '',
          ids: feature.properties.ids || '',
          sources: feature.properties.sources || '',
          types: feature.properties.types || '',
          nst: feature.properties.nst,
          dmin: feature.properties.dmin,
          rms: feature.properties.rms,
          gap: feature.properties.gap,
          magType: feature.properties.magType || '',
          type: feature.properties.type || 'earthquake',
          title: feature.properties.title || `M ${feature.properties.mag} - ${feature.properties.place}`
        }
      })) as EarthquakeFeature[];

      setEarthquakes(transformedEarthquakes);
      
      toast({
        title: "Real-time Data Updated",
        description: `Loaded ${transformedEarthquakes.length} recent earthquakes`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch earthquake data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Earthquake fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

 
  useEffect(() => {
    fetchEarthquakes();
    
    
    const interval = setInterval(fetchEarthquakes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEarthquakes]);

  
  useEffect(() => {
    setPlaybackProgress(0);
  }, [earthquakes]);

  
  const { minTime, maxTime } = useMemo(() => {
    if (earthquakes.length === 0) {
      const now = Date.now();
      return { minTime: now, maxTime: now };
    }
    const times = earthquakes.map(e => e.properties.time);
    return { minTime: Math.min(...times), maxTime: Math.max(...times) };
  }, [earthquakes]);

  const cutoffTime = useMemo(() => {
    if (minTime === maxTime) return maxTime;
    return minTime + playbackProgress * (maxTime - minTime);
  }, [minTime, maxTime, playbackProgress]);

 
  const earthquakesToShow = useMemo(() => {
    if (!isPlaying) return earthquakes;
    return earthquakes.filter(e => e.properties.time <= cutoffTime);
  }, [earthquakes, isPlaying, cutoffTime]);

  
  useEffect(() => {
    const step = (ts: number) => {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const delta = ts - lastTickRef.current;
      lastTickRef.current = ts;
      setPlaybackProgress(prev => {
        const next = Math.min(1, prev + (delta / playbackDurationMs));
        if (next >= 1) {
         
          setIsPlaying(false);
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };

    if (isPlaying && earthquakes.length > 0) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = null;
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = null;
    };
  }, [isPlaying, earthquakes.length]);

 
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

 
  const togglePlayback = () => {
  
    if (!isPlaying && playbackProgress >= 1) {
      setPlaybackProgress(0);
    }
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? "Timeline Paused" : "Timeline Playing",
      description: isPlaying ? "Seismic playback stopped" : "Replaying seismic events chronologically",
    });
  };

  const stats = calculateStats(earthquakes);

  const requestLocation = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      const msg = 'Geolocation is not supported in this browser';
      setGeoError(msg);
      toast({ title: 'Location unavailable', description: msg, variant: 'destructive' });
      return;
    }

    try {
      const canQuery = (navigator as any).permissions?.query;
      if (canQuery) {
        try {
          const status = await (navigator as any).permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'denied') {
            const msg = 'Location permission is blocked. Enable it in the browser site settings and retry.';
            setGeoError(msg);
            toast({ title: 'Permission blocked', description: msg, variant: 'destructive' });
            return;
          }
        } catch { /*  */ }
      }

      geoRequestedRef.current = true;

      const ipFallback = async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          if (!res.ok) throw new Error('ipapi request failed');
          const data = await res.json();
          if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            setUserLocation({ lat: data.latitude, lng: data.longitude });
            setUserApproximate(true);
            setGeoError(null);
            toast({ title: 'Approximate location used', description: 'Based on your network location (lower accuracy)' });
            return true;
          }
        } catch (e) {
          console.debug('IP fallback failed', e);
        }
        return false;
      };

     
      const firstAttempt = await new Promise<boolean>((resolve) => {
        let resolved = false;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (resolved) return; resolved = true;
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setUserApproximate(false);
            setGeoError(null);
            toast({ title: 'Location detected', description: 'Centering near your position' });
            resolve(true);
          },
          async (err) => {
            console.debug('getCurrentPosition error', err);
            if (resolved) return; resolved = true;
           
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
        
        setTimeout(() => { if (!resolved) { resolved = true; resolve(false); } }, 23000);
      });

      if (firstAttempt) return;

    
      const watchSucceeded = await new Promise<boolean>((resolve) => {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            navigator.geolocation.clearWatch(watchId);
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setUserApproximate(false);
            setGeoError(null);
            toast({ title: 'Location detected', description: 'Centering near your position' });
            resolve(true);
          },
          async (err) => {
            navigator.geolocation.clearWatch(watchId);
            console.debug('watchPosition error', err);
            resolve(false);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
       
        setTimeout(() => { try { navigator.geolocation.clearWatch(watchId); } catch {} resolve(false); }, 20000);
      });

      if (watchSucceeded) return;

      
      const usedIp = await ipFallback();
      if (!usedIp) {
        const msg = 'Failed to get location. Please ensure Location Services are enabled for your OS and browser, then retry.';
        setGeoError(msg);
        toast({ title: 'Location error', description: msg, variant: 'destructive' });
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to request location';
      setGeoError(msg);
      toast({ title: 'Location error', description: msg, variant: 'destructive' });
    }
  }, [toast]);

  
  useEffect(() => {
    if (!geoRequestedRef.current) requestLocation();
  }, [requestLocation]);

  
  const haversineKm = useCallback((a: {lat:number;lng:number}, b: {lat:number;lng:number}) => {
    const R = 6371; // km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const sinDLat = Math.sin(dLat/2);
    const sinDLng = Math.sin(dLng/2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLng*sinDLng));
    return R * c;
  }, []);

  const estimateImpact = (mag: number, distanceKm: number) => {
    // Simple attenuation: effective magnitude reduces with log distance
    const mEff = mag - 1.1 * Math.log10(Math.max(1, distanceKm));
    if (mEff < 2.5) return { level: 'Not felt', color: 'text-muted-foreground' };
    if (mEff < 3.5) return { level: 'Weak', color: 'text-sky-400' };
    if (mEff < 4.5) return { level: 'Light', color: 'text-green-400' };
    if (mEff < 5.5) return { level: 'Moderate', color: 'text-yellow-400' };
    if (mEff < 6.5) return { level: 'Strong', color: 'text-orange-400' };
    return { level: 'Severe', color: 'text-red-500' };
  };

 
  const nearestToUser = useMemo(() => {
    if (!userLocation || earthquakes.length === 0) return null;
    let best: { eq: EarthquakeFeature; dist: number } | null = null;
    for (const f of earthquakes) {
      const [lng, lat] = f.geometry.coordinates;
      const d = haversineKm(userLocation, { lat, lng });
      if (!best || d < best.dist) best = { eq: f, dist: d };
    }
    if (!best) return null;
    const impact = estimateImpact(best.eq.properties.magnitude, best.dist);
    return { ...best, impact };
  }, [userLocation, earthquakes, haversineKm]);

  if (error && earthquakes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="morphic-card max-w-md mx-auto text-center">
          <div className="space-y-4">
            <Activity className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Connection Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchEarthquakes} className="morphic-button">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="h-full w-16 glass-morphic/70 border-r border-glass-border/30 backdrop-blur-strong flex flex-col items-center py-4 space-y-3"
        >
        
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-2">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>

          {/* btn */}
          <Button
            variant="ghost"
            size="icon"
            className={`morphic-button ${showFilters ? 'ring-2 ring-primary' : ''}`}
            onClick={() => {
              if (showFilters) {
                setShowFilters(false);
              } else {
                setShowFilters(true);
                setShowInsights(false);
              }
            }}
            title="Filters"
            aria-label="Open filters"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`morphic-button ${showInsights ? 'ring-2 ring-primary' : ''}`}
            onClick={() => {
              if (showInsights) {
                setShowInsights(false);
              } else {
                setShowInsights(true);
                setShowFilters(false);
              }
            }}
            title="Insights"
            aria-label="Open insights"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="morphic-button" onClick={togglePlayback} title="Play / Pause" aria-label="Toggle playback">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          {!userLocation && (
            <Button variant="ghost" size="icon" className="morphic-button" onClick={requestLocation} title="Use my location" aria-label="Use my location">
              <LocateFixed className="w-5 h-5" />
            </Button>
          )}

          <div className="flex-1" />
        </motion.div>
      </aside>

      
      <div className="absolute top-0 right-0 bottom-0 left-0">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <Card className="morphic-card">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading seismic data...</span>
                </div>
              </Card>
            </div>
          )}
          
          <QuakeScopeMap
            earthquakes={earthquakesToShow}
            selectedTimeRange={filters.timeRange}
            showHeatmap={!!filters.showHeatmap}
            showClusters={!!filters.showClusters}
            userLocation={userLocation || undefined}
            onEarthquakeClick={(earthquake) => {
              toast({
                title: `M${earthquake.magnitude.toFixed(1)} Earthquake`,
                description: earthquake.place,
              });
            }}
          />

         
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden z-50">
            <Card className="glass-morphic/80 border-glass-border/40 backdrop-blur-strong px-2 py-1 rounded-full shadow-lg">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`morphic-button ${showFilters ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    if (showFilters) {
                      setShowFilters(false);
                    } else {
                      setShowFilters(true);
                      setShowInsights(false);
                    }
                  }}
                  title="Filters"
                  aria-label="Open filters"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`morphic-button ${showInsights ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    if (showInsights) {
                      setShowInsights(false);
                    } else {
                      setShowInsights(true);
                      setShowFilters(false);
                    }
                  }}
                  title="Insights"
                  aria-label="Open insights"
                >
                  <BarChart3 className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="morphic-button"
                  onClick={togglePlayback}
                  title="Play / Pause"
                  aria-label="Toggle playback"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                {!userLocation && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="morphic-button"
                    onClick={requestLocation}
                    title="Use my location"
                    aria-label="Use my location"
                  >
                    <LocateFixed className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </Card>
          </div>


      </div>

     
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
      <InsightsPanel
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        stats={stats}
      />

      
    </div>
  );
};

export default QuakeScopeIndex;