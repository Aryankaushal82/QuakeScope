import React from 'react';

interface BarData {
  name: string;
  value: number;
  color: string;
}

interface PieData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  height?: number;
}

interface SimplePieChartProps {
  data: PieData[];
  size?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
  data, 
  height = 160 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-around h-full space-x-2 px-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 h-full">
            <div 
              className="w-full rounded-t-md transition-all duration-500 ease-out flex items-end"
              style={{
                height: `${(item.value / maxValue) * 80}%`,
                backgroundColor: item.color,
                minHeight: '4px'
              }}
            />
            <div className="text-xs text-muted-foreground mt-2 text-center leading-tight">
              {item.name}
            </div>
            <div className="text-xs font-medium">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ 
  data, 
  size = 120 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;
  const pieRadius = radius - 20;
  const innerRadius = pieRadius * 0.5;
  
  const colors = [
    'hsl(var(--accent))',
    'hsl(var(--primary))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--magnitude-high))'
  ];
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + Math.cos(startAngle) * pieRadius;
          const y1 = centerY + Math.sin(startAngle) * pieRadius;
          const x2 = centerX + Math.cos(endAngle) * pieRadius;
          const y2 = centerY + Math.sin(endAngle) * pieRadius;
          
          const x3 = centerX + Math.cos(endAngle) * innerRadius;
          const y3 = centerY + Math.sin(endAngle) * innerRadius;
          const x4 = centerX + Math.cos(startAngle) * innerRadius;
          const y4 = centerY + Math.sin(startAngle) * innerRadius;
          
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          
          const pathData = [
            `M ${x1} ${y1}`,
            `A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color || colors[index % colors.length]}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
      </svg>
    </div>
  );
};