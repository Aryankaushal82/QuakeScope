import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EarthquakeStats } from '@/types/earthquake';
import { SimpleBarChart, SimplePieChart } from '@/components/SimpleChart';
import { TrendingUp, Activity, MapPin, Clock, X, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: EarthquakeStats;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  isOpen,
  onClose,
  stats
}) => {
  const magnitudeData = [
    { name: 'Minor\n(< 3.0)', value: stats.magnitudeDistribution.low, color: 'hsl(var(--magnitude-low))' },
    { name: 'Light\n(3.0-5.0)', value: stats.magnitudeDistribution.medium, color: 'hsl(var(--magnitude-medium))' },
    { name: 'Moderate\n(5.0-6.0)', value: stats.magnitudeDistribution.high, color: 'hsl(var(--magnitude-high))' },
    { name: 'Strong\n(> 6.0)', value: stats.magnitudeDistribution.severe, color: 'hsl(var(--magnitude-severe))' }
  ];

  const depthData = [
    { name: 'Shallow\n(0-70km)', value: Math.floor(Math.random() * 50) + 20 },
    { name: 'Intermediate\n(70-300km)', value: Math.floor(Math.random() * 30) + 10 },
    { name: 'Deep\n(> 300km)', value: Math.floor(Math.random() * 20) + 5 }
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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
            className="fixed top-4 bottom-4 left-4 w-[92vw] max-w-[560px] z-40 md:left-20 md:w-[520px]"
          >
            <Card className="morphic-panel h-full flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Insights</h3>
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

              <div className="flex-1 space-y-6 overflow-y-auto scrollbar-none pr-1">
                {/* Statss */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="glass-morphic p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Events</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{stats.totalCount}</p>
                  </Card>
                  
                  <Card className="glass-morphic p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Largest</span>
                    </div>
                    <p className="text-2xl font-bold text-accent">M{stats.largestMagnitude.toFixed(1)}</p>
                  </Card>
                  
                  <Card className="glass-morphic p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-accent-glow" />
                      <span className="text-sm text-muted-foreground">Average</span>
                    </div>
                    <p className="text-2xl font-bold">M{stats.averageMagnitude.toFixed(1)}</p>
                  </Card>
                  
                  <Card className="glass-morphic p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Deepest</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.deepestDepth.toFixed(0)}km</p>
                  </Card>
                </div>

                {/*Recent */}
                <Card className="glass-morphic p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Most Recent Event</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(stats.mostRecentTime)}</p>
                </Card>

                {/* Mag Distribution Chart */}
                <Card className="glass-morphic p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Magnitude Distribution</span>
                  </div>
                  <SimpleBarChart data={magnitudeData} height={160} />
                </Card>

                {/* Depth Distribution */}
                <Card className="glass-morphic p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <PieChartIcon className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium">Depth Distribution</span>
                  </div>
                  <div className="flex justify-center">
                    <SimplePieChart data={depthData} size={120} />
                  </div>
                  <div className="space-y-1 mt-4">
                    {depthData.map((item, index) => (
                      <div key={item.name} className="flex items-center space-x-2 text-xs">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: index === 0 ? 'hsl(var(--accent))' : 
                                           index === 1 ? 'hsl(var(--primary))' : 
                                           'hsl(var(--muted-foreground))'
                          }}
                        />
                        <span className="text-muted-foreground">{item.name.replace('\n', ' ')}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InsightsPanel;