import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterOptions } from '@/types/earthquake';
import { Calendar, Layers, MapPin, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}) => {
  const handleMagnitudeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      magnitudeRange: [value[0], value[1]]
    });
  };

  const handleDepthChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      depthRange: [value[0], value[1]]
    });
  };

  const toggleHeatmap = () => {
    onFiltersChange({
      ...filters,
      showHeatmap: !filters.showHeatmap
    });
  };

  const toggleClusters = () => {
    onFiltersChange({
      ...filters,
      showClusters: !filters.showClusters
    });
  };

  const handleTimeRangeChange = (value: FilterOptions['timeRange']) => {
    onFiltersChange({
      ...filters,
      timeRange: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      timeRange: '1day',
      magnitudeRange: [0, 10],
      depthRange: [0, 700],
      showHeatmap: false,
      showClusters: false
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/20 backdrop-blur-sm z-30 md:inset-y-0 md:left-16 md:right-0 md:block md:bg-transparent md:backdrop-blur-0"
          />
          <motion.div
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 left-4 w-[92vw] max-w-[360px] z-40 md:left-20 md:w-[380px] lg:max-w-[420px]"
          >
            <Card className="morphic-panel h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold">Filters</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="md:hidden h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto">
                {/* Time Range */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Time Range</label>
                  </div>
                  <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="glass-morphic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-morphic backdrop-blur-strong">
                      <SelectItem value="1hour">Past Hour</SelectItem>
                      <SelectItem value="1day">Past 24 Hours</SelectItem>
                      <SelectItem value="7days">Past 7 Days</SelectItem>
                      <SelectItem value="30days">Past 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Map Layers */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Map Layers</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={filters.showHeatmap ? 'default' : 'outline'}
                      onClick={toggleHeatmap}
                      className="w-full"
                    >
                      Heatmap
                    </Button>
                    <Button
                      type="button"
                      variant={filters.showClusters ? 'default' : 'outline'}
                      onClick={toggleClusters}
                      className="w-full"
                    >
                      Clusters
                    </Button>
                  </div>
                </div>

                {/* Magnitude Range */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Magnitude Range</label>
                  </div>
                  <div className="px-3">
                    <Slider
                      value={filters.magnitudeRange}
                      onValueChange={handleMagnitudeChange}
                      max={10}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>M{filters.magnitudeRange[0].toFixed(1)}</span>
                      <span>M{filters.magnitudeRange[1].toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {/* Magnitude scale refereence */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full magnitude-low"></div>
                      <span className="text-muted-foreground">Minor (&lt; 3.0)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full magnitude-medium"></div>
                      <span className="text-muted-foreground">Light (3.0 - 5.0)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full magnitude-high"></div>
                      <span className="text-muted-foreground">Moderate (5.0 - 6.0)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full magnitude-severe"></div>
                      <span className="text-muted-foreground">Strong (&gt; 6.0)</span>
                    </div>
                  </div>
                </div>

                {/* Depth Rangee */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Depth Range (km)</label>
                  </div>
                  <div className="px-3">
                    <Slider
                      value={filters.depthRange}
                      onValueChange={handleDepthChange}
                      max={700}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{filters.depthRange[0]}km</span>
                      <span>{filters.depthRange[1]}km</span>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="w-full morphic-button"
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;