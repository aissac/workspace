'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { CandleData, VWAPData } from '@/lib/types';

interface PriceChartProps {
  data: CandleData[];
  vwapData?: VWAPData[];
  symbol?: string;
  height?: number;
}

export default function PriceChart({ data, vwapData, symbol = 'BTCUSDT', height = 400 }: PriceChartProps) {
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
      crosshair: {
        mode: 3,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeries.setData(data as never[]);

    if (vwapData && vwapData.length > 0) {
      const vwapSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      vwapSeries.setData(vwapData.map(d => ({ time: d.time as never, value: d.value })));

      const upperBandSeries = chart.addSeries(LineSeries, {
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      upperBandSeries.setData(vwapData.map(d => ({ time: d.time as never, value: d.upper })));

      const lowerBandSeries = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lowerBandSeries.setData(vwapData.map(d => ({ time: d.time as never, value: d.lower })));
    }

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
  }, [data, vwapData, height]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clawars-accent"></div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full rounded-lg" />
      <div className="absolute top-2 left-2 px-2 py-1 bg-gray-900/80 rounded text-sm font-mono">
        {symbol}
      </div>
    </div>
  );
}