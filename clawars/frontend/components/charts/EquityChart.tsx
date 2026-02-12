'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts';
import type { EquityPoint } from '@/lib/types';

interface EquityChartProps {
  data: EquityPoint[];
  height?: number;
  color?: string;
}

export default function EquityChart({ data, height = 200, color = '#10b981' }: EquityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    setIsLoading(true);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1f2937' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: false,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height,
      handleScale: false,
      handleScroll: false,
    });

    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: `${color}66`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    areaSeries.setData(data as never[]);

    chart.timeScale().fitContent();
    setIsLoading(false);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height, color]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg" style={{ height }}>
        <p className="text-gray-500 text-sm">No equity data available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-clawars-accent"></div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full rounded-lg" />
    </div>
  );
}