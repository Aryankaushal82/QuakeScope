import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
// Plugin imports (ensure packages are installed)
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Earthquake, EarthquakeFeature } from '@/types/earthquake';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Clock, Activity } from 'lucide-react';
import { generateQuakeSummary } from '@/lib/ai';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface QuakeScopeMapProps {
  earthquakes: EarthquakeFeature[];
  onEarthquakeClick?: (eq: Earthquake) => void;
  selectedTimeRange?: string;
  showHeatmap?: boolean;
  showClusters?: boolean;
  userLocation?: { lat: number; lng: number };
}

const QuakeScopeMap: React.FC<QuakeScopeMapProps> = ({
  earthquakes,
  onEarthquakeClick,
  selectedTimeRange = '1day',
  showHeatmap = false,
  showClusters = false,
  userLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null as any);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const userCenteredRef = useRef(false);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  // AI summary 
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiCacheRef = useRef<Map<string, string>>(new Map());


  const requestSummary = async (force = false) => {
    setAiError(null);
    const eq = selectedEarthquake;
    if (!eq) return;
    if (!force) {
      const cached = aiCacheRef.current.get(eq.id);
      if (cached) {
        setAiSummary(cached);
        setAiLoading(false);
        return;
      }
    } else {
      aiCacheRef.current.delete(eq.id);
    }
    try {
      setAiLoading(true);
      setAiSummary('');
      const summary = await generateQuakeSummary({
        id: eq.id,
        magnitude: eq.magnitude,
        depthKm: Math.abs(eq.coordinates[2] || 0),
        place: eq.place,
        timeISO: new Date(eq.time).toISOString(),
      });
      aiCacheRef.current.set(eq.id, summary);
      setAiSummary(summary);
    } catch (e: any) {
      setAiError(e?.message || 'Failed to generate AI summary');
    } finally {
      setAiLoading(false);
    }
  };


  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      worldCopyJump: true,
      maxBounds: L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
      maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: 'CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
      noWrap: true
    }).addTo(mapInstanceRef.current);

    
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapInstanceRef.current);

    
    markersRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    userLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);


  const getMagnitudeStyle = (magnitude: number) => {
    if (magnitude < 3.0) {
      return { color: 'hsl(142, 76%, 36%)', size: 6, className: 'magnitude-low' };
    } else if (magnitude < 5.0) {
      return { color: 'hsl(48, 100%, 67%)', size: 8, className: 'magnitude-medium' };
    } else if (magnitude < 6.0) {
      return { color: 'hsl(25, 95%, 53%)', size: 12, className: 'magnitude-high' };
    } else {
      return { color: 'hsl(0, 86%, 58%)', size: 16, className: 'magnitude-severe' };
    }
  };

  
  const renderMarkersInto = (target: L.LayerGroup, useClusterMarkers: boolean) => {
    target.clearLayers();
    earthquakes.forEach((feature) => {
      const { coordinates } = feature.geometry;
      const [lng, lat] = coordinates;
      const earthquake = { ...feature.properties, coordinates } as Earthquake;
      const style = getMagnitudeStyle(earthquake.magnitude);

      let layer: L.Layer;
      if (useClusterMarkers) {
        const size = style.size;
        const html = `
          <div style="
            width:${size * 2}px;height:${size * 2}px;border-radius:9999px;
            background:${style.color};opacity:0.75;border:2px solid ${style.color};
            box-shadow:0 0 8px ${style.color};
          "></div>`;
        const icon = L.divIcon({ className: `eq-div-icon ${style.className}`, html, iconSize: [size * 2, size * 2] as any });
        const marker = L.marker([lat, lng], { icon });
        marker.on('click', () => { setSelectedEarthquake(earthquake); onEarthquakeClick?.(earthquake); });
        layer = marker;
      } else {
        const marker = L.circleMarker([lat, lng], {
          radius: style.size,
          fillColor: style.color,
          color: style.color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.6,
          className: `earthquake-marker ${style.className}`
        });
        const isRecent = Date.now() - earthquake.time < 3600000;
        if (isRecent) marker.setStyle({ className: `earthquake-marker ${style.className} pulse-glow` });
        marker.on('click', () => { setSelectedEarthquake(earthquake); onEarthquakeClick?.(earthquake); });
        marker.on('mouseover', () => { marker.setStyle({ radius: style.size * 1.5, weight: 3, opacity: 1, fillOpacity: 0.8 }); });
        marker.on('mouseout', () => { marker.setStyle({ radius: style.size, weight: 2, opacity: 0.8, fillOpacity: 0.6 }); });
        layer = marker;
      }

      target.addLayer(layer);
    });
  };
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const Lany = L as any;

    
    if (showClusters && Lany.markerClusterGroup) { 
      if (markersRef.current) markersRef.current.clearLayers();
      if (!clusterGroupRef.current) {
        clusterGroupRef.current = Lany.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true
        });
        map.addLayer(clusterGroupRef.current);
      }
      renderMarkersInto(clusterGroupRef.current as L.LayerGroup, true);
    } else {
      
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      
      if (markersRef.current) renderMarkersInto(markersRef.current, false);
    }
  }, [earthquakes, showClusters, onEarthquakeClick]);

  
  useEffect(() => {
    setAiSummary('');
    setAiError(null);
    setAiLoading(false);
  }, [selectedEarthquake]);

  
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLayerRef.current) return;
    userLayerRef.current.clearLayers();
    if (!userLocation) return;

    const marker = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 7,
      color: '#38bdf8',
      fillColor: '#38bdf8',
      fillOpacity: 0.9,
      weight: 2,
      className: 'user-location-marker'
    });
    userLayerRef.current.addLayer(marker);

    
    if (!userCenteredRef.current) {
      const targetZoom = Math.max(5, map.getZoom());
      map.flyTo([userLocation.lat, userLocation.lng], targetZoom, { duration: 0.8 });
      userCenteredRef.current = true;
    }
  }, [userLocation]);

  // Heatmapp
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const Lany = L as any;

    if (showHeatmap && Lany.heatLayer) {
      const heatData = earthquakes.map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const intensity = Math.max(0.1, Math.min(1, (f.properties.magnitude || 0) / 8));
        return [lat, lng, intensity];
      });
      const getHeatOptions = () => {
        const z = map.getZoom();
        const radius = Math.max(18, Math.min(45, z * 3 + 12));
        return {
          radius,
          blur: Math.round(radius * 0.8),
          maxZoom: 18,
          minOpacity: 0.3,
          gradient: {
            0.2: '#0ea5e9',
            0.4: '#22c55e', 
            0.6: '#eab308', 
            0.8: '#f97316', 
            1.0: '#ef4444',
          }
        } as any;
      };

      if (!heatLayerRef.current) {
        heatLayerRef.current = Lany.heatLayer(heatData, getHeatOptions());
        map.addLayer(heatLayerRef.current);
      } else {
        (heatLayerRef.current as any).setLatLngs(heatData);
        if ((heatLayerRef.current as any).setOptions) {
          (heatLayerRef.current as any).setOptions(getHeatOptions());
        }
      }

      
      const onZoom = () => {
        if (heatLayerRef.current && (heatLayerRef.current as any).setOptions) {
          (heatLayerRef.current as any).setOptions(getHeatOptions());
        }
      };
      map.on('zoomend', onZoom);
      return () => {
        map.off('zoomend', onZoom);
      };
    } else {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    }
  }, [earthquakes, showHeatmap]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const closePopup = () => {
    setSelectedEarthquake(null);
  };

  return (
    <div className="relative w-full h-full">
    
      <div 
        ref={mapRef} 
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          filter: 'contrast(1.1) brightness(0.9)',
          backgroundColor: '#000000',
        }}
      />
      
      {/* Earthquake details*/}
      {selectedEarthquake && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 max-w-sm animate-fade-in">
          <Card className="morphic-card backdrop-blur-strong border-glass-border/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-4 h-4 rounded-full ${getMagnitudeStyle(selectedEarthquake.magnitude).className}`}
                />
                <h3 className="font-semibold text-lg">
                  M{selectedEarthquake.magnitude.toFixed(1)}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePopup}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm">{selectedEarthquake.place}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(selectedEarthquake.time)}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">Depth: {selectedEarthquake.coordinates[2].toFixed(1)} km</p>
              </div>

              {/* AI Summary section */}
              <div className="mt-2 rounded-lg border border-glass-border/50 p-2 bg-background/40">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">AI Summary</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (aiSummary) {
                          requestSummary(true);
                        } else {
                          requestSummary(false); 
                        }
                      }}
                      disabled={aiLoading}
                    >
                      {aiSummary ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>
                </div>
                {aiLoading && (
                  <p className="text-sm text-muted-foreground">Generating a concise summary…</p>
                )}
                {!aiLoading && aiError && (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">{aiError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="morphic-button"
                      onClick={() => requestSummary(true)}
                    >
                      Retry
                    </Button>
                  </div>
                )}
                {!aiLoading && !aiError && aiSummary && (
                  <p className="text-sm whitespace-pre-wrap">{aiSummary}</p>
                )}
                {!aiLoading && !aiError && !aiSummary && (
                  <p className="text-sm text-muted-foreground">Click Generate to create a short summary for this event.</p>
                )}
              </div>
              
              <Button 
                asChild
                variant="outline"
                size="sm"
                className="w-full mt-4 morphic-button"
              >
                <a 
                  href={selectedEarthquake.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View USGS Report</span>
                </a>
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/10 via-transparent to-transparent rounded-xl" />
    </div>
  );
};

export default QuakeScopeMap;