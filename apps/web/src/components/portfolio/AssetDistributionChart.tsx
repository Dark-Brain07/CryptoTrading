'use client';

import React from 'react';
import { PortfolioHolding } from '@baseindex/shared';

interface AssetDistributionChartProps {
  holdings: PortfolioHolding[];
}

const COLORS = [
  '#0052FF', // Base Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#6366F1'  // Indigo
];

export function AssetDistributionChart({ holdings }: AssetDistributionChartProps) {
  const totalUSD = holdings.reduce((acc, h) => acc + h.balanceUSD, 0);

  if (holdings.length === 0 || totalUSD === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-xs font-mono">
        No active index positions
      </div>
    );
  }

  // Calculate SVG doughnut arc slices
  let accumulatedAngle = 0;
  const radius = 60;
  const strokeWidth = 20;
  const center = 80;

  const slices = holdings.map((item, idx) => {
    const percentage = totalUSD > 0 ? (item.balanceUSD / totalUSD) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((startAngle + angle - 90) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData =
      angle >= 359.9
        ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius}`
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    return {
      ticker: item.ticker,
      color: COLORS[idx % COLORS.length],
      percentage,
      pathData
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-obsidian-900/60 border border-obsidian-border">
      {/* SVG Doughnut */}
      <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {slices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.pathData}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-500 hover:opacity-80"
            />
          ))}
        </svg>
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Assets</span>
          <span className="text-base font-bold text-slate-900 dark:text-white font-mono">{holdings.length}</span>
        </div>
      </div>

      {/* Legend & Percentages */}
      <div className="flex-1 grid grid-cols-2 gap-2 w-full">
        {holdings.map((item, idx) => (
          <div
            key={item.ticker}
            className="flex items-center justify-between p-2 rounded-lg bg-obsidian-800/60 border border-obsidian-border text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="font-semibold text-slate-900 dark:text-white">{item.ticker}</span>
            </div>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
              {item.allocationPercentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
