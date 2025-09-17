'use client';

import { useState } from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'pie';
  height?: number;
  showValues?: boolean;
  currency?: boolean;
}

export default function AnalyticsChart({ 
  title, 
  data, 
  type, 
  height = 300, 
  showValues = true, 
  currency = false 
}: AnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value), 1); // Ensure at least 1 to avoid division by 0
  
  const formatValue = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return '0';
    
    if (currency) {
      return new Intl.NumberFormat('sq-AL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
      }).format(value);
    }
    return value.toLocaleString();
  };

  const colors = [
    '#2563eb', '#f59e0b', '#059669', '#dc2626', '#8b5cf6', 
    '#06b6d4', '#65a30d', '#ea580c', '#db2777', '#7c3aed'
  ];

  const renderBarChart = () => (
    <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around', height: height - 60, padding: '0 1rem' }}>
      {data.map((item, index) => {
        const safeValue = isFinite(item.value) ? item.value : 0;
        const barHeight = Math.max((safeValue / maxValue) * (height - 100), 5); // Minimum 5px height
        const isHovered = hoveredIndex === index;
        
        return (
          <div 
            key={index}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '80px' }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Value label */}
            {showValues && (isHovered || data.length <= 6) && (
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: '500', 
                color: '#1f2937', 
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                {formatValue(safeValue)}
              </div>
            )}
            
            {/* Bar */}
            <div 
              style={{ 
                width: '100%',
                height: `${isFinite(barHeight) ? barHeight : 5}px`,
                background: item.color || colors[index % colors.length],
                borderRadius: '0.25rem 0.25rem 0 0',
                transition: 'all 0.2s',
                opacity: isHovered ? 0.8 : 1,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
              title={`${item.label}: ${formatValue(safeValue)}`}
            />
            
            {/* Label */}
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6b7280', 
              marginTop: '0.5rem',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderLineChart = () => {
    const width = 400;
    const chartHeight = height - 60;
    const padding = 40;
    
    if (data.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: chartHeight }}>
          <span style={{ color: '#6b7280' }}>Nuk ka të dhëna për të shfaqur</span>
        </div>
      );
    }
    
    const points = data.map((item, index) => {
      const safeValue = isFinite(item.value) ? item.value : 0;
      const xPosition = data.length > 1 ? (index / (data.length - 1)) * (width - 2 * padding) + padding : width / 2;
      const yPosition = chartHeight - ((safeValue / maxValue) * (chartHeight - 2 * padding)) - padding;
      
      return {
        x: isFinite(xPosition) ? xPosition : width / 2,
        y: isFinite(yPosition) ? yPosition : chartHeight - padding
      };
    });

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <div style={{ position: 'relative' }}>
        <svg width={width} height={chartHeight} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - (ratio * (chartHeight - 2 * padding)) - padding;
            return (
              <g key={index}>
                <line
                  x1={padding}
                  y1={isFinite(y) ? y : padding}
                  x2={width - padding}
                  y2={isFinite(y) ? y : padding}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={isFinite(y) ? y + 4 : padding}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {formatValue(maxValue * ratio)}
                </text>
              </g>
            );
          })}
          
          {/* Line */}
          <path
            d={pathData}
            stroke="#2563eb"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={isFinite(point.x) ? point.x : 0}
              cy={isFinite(point.y) ? point.y : 0}
              r="4"
              fill="#2563eb"
              stroke="white"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', marginLeft: `${padding}px`, marginRight: `${padding}px` }}>
          {data.map((item, index) => (
            <span key={index} style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
              {item.label}
            </span>
          ))}
        </div>
        
        {/* Hover tooltip */}
        {hoveredIndex !== null && hoveredIndex < points.length && points[hoveredIndex] && (
          <div style={{
            position: 'absolute',
            top: Math.max(0, (isFinite(points[hoveredIndex].y) ? points[hoveredIndex].y : 0) - 30),
            left: Math.max(0, (isFinite(points[hoveredIndex].x) ? points[hoveredIndex].x : 0) - 50),
            background: '#1f2937',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {data[hoveredIndex]?.label}: {formatValue(data[hoveredIndex]?.value || 0)}
          </div>
        )}
      </div>
    );
  };

  const renderPieChart = () => {
    const radius = Math.min(height, 300) / 2 - 20;
    const centerX = 200;
    const centerY = height / 2;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    let currentAngle = -90; // Start from top
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <svg width={400} height={height}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle = endAngle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color || colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ 
                  cursor: 'pointer',
                  opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.7
                }}
              />
            );
          })}
        </svg>
        
        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div 
                key={index} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div 
                  style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    background: item.color || colors[index % colors.length],
                    borderRadius: '0.25rem'
                  }} 
                />
                <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 'auto' }}>
                  {percentage}% ({formatValue(item.value)})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
        {title}
      </h3>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <p>Nuk ka të dhëna për të shfaqur</p>
        </div>
      ) : (
        <>
          {type === 'bar' && renderBarChart()}
          {type === 'line' && renderLineChart()}
          {type === 'pie' && renderPieChart()}
        </>
      )}
    </div>
  );
}
