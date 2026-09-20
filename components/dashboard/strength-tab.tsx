'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AggregatedProgressMetrics } from '@/lib/domain/progress-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Dumbbell, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface StrengthTabProps {
  metrics: AggregatedProgressMetrics;
}

interface TooltipPayloadItem {
  payload: {
    dateStr: string;
    displayDate: string;
    volumeKg: number;
    volumeLbs: number;
    volume: number;
    setsCount: number;
    repsCount: number;
  };
}

const VolumeChartTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadItem[];
  unitMode: 'kg' | 'lbs';
}> = ({ active, payload, unitMode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const vol = unitMode === 'kg' ? data.volumeKg : data.volumeLbs;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white p-2.5 rounded-lg shadow-lg border border-slate-700/50 text-xs space-y-1">
        <p className="font-bold text-slate-200">{data.displayDate}</p>
        <p className="text-emerald-400 font-semibold">
          Volume: {vol.toLocaleString()} {unitMode}
        </p>
        <p className="text-slate-400 text-[11px]">
          {data.setsCount} sets · {data.repsCount} reps
          {vol === 0 && data.setsCount > 0 ? ' (Bodyweight)' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export const StrengthTab: React.FC<StrengthTabProps> = ({ metrics }) => {
  const [unitMode, setUnitMode] = useState<'kg' | 'lbs'>('kg');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Chart data array with volume, volumeKg, and volumeLbs fields
  const chartData = useMemo(() => {
    return metrics.volumeOverTime.map((point) => ({
      ...point,
      volume: unitMode === 'kg' ? point.volumeKg : point.volumeLbs,
      volumeKg: point.volumeKg,
      volumeLbs: point.volumeLbs,
    }));
  }, [metrics.volumeOverTime, unitMode]);

  // 2. Maximum volume for domain derivation
  const maxVolume = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(0, ...chartData.map((d) => d.volume));
  }, [chartData]);

  // Derived Y-axis domain ensuring proper scale even when all points are 0 (bodyweight)
  const yDomainMax = useMemo(() => {
    if (maxVolume === 0) return unitMode === 'kg' ? 100 : 200;
    return Math.ceil(maxVolume * 1.15);
  }, [maxVolume, unitMode]);

  return (
    <div className="space-y-6">
      {/* 1. Volume Over Time Chart Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Volume Progression Over Time
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Total load multiplied by repetitions performed per training day
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <Button
                variant={unitMode === 'kg' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-2.5 text-xs font-semibold ${
                  unitMode === 'kg'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setUnitMode('kg')}
              >
                KG
              </Button>
              <Button
                variant={unitMode === 'lbs' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 px-2.5 text-xs font-semibold ${
                  unitMode === 'lbs'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setUnitMode('lbs')}
              >
                LBS
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.volumeOverTime.length > 0 ? (
            <div className="pt-4 pb-2">
              <div className="h-56 w-full">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 12, right: 16, left: -4, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="volumeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#94a3b8"
                        strokeOpacity={0.25}
                      />
                      <XAxis
                        dataKey="displayDate"
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.6 }}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickMargin={8}
                        minTickGap={12}
                      />
                      <YAxis
                        dataKey="volume"
                        domain={[0, yDomainMax]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(val: number) =>
                          val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `${val}`
                        }
                        tickMargin={4}
                      />
                      <Tooltip content={<VolumeChartTooltip unitMode={unitMode} />} />
                      {/* Bar series for presence across all session counts */}
                      <Bar
                        dataKey="volume"
                        fill="#10b981"
                        fillOpacity={0.15}
                        maxBarSize={32}
                        radius={[4, 4, 0, 0]}
                      />
                      {/* Plotted Area + Line + Points */}
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#volumeAreaGradient)"
                        dot={{
                          r: 4.5,
                          fill: '#10b981',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6.5,
                          fill: '#059669',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                    Loading volume progression chart...
                  </div>
                )}
              </div>

              {/* Accessible table summary */}
              <div className="sr-only">
                <table>
                  <caption>Volume progression data</caption>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Volume ({unitMode})</th>
                      <th>Sets</th>
                      <th>Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.volumeOverTime.map((p) => (
                      <tr key={p.dateStr}>
                        <td>{p.displayDate}</td>
                        <td>{unitMode === 'kg' ? p.volumeKg : p.volumeLbs}</td>
                        <td>{p.setsCount}</td>
                        <td>{p.repsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No load volume recorded in this period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Grid Row: Day of Week Distribution & Bodyweight Training Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day-of-Week Training Distribution */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              Day-of-Week Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Training session frequency across days of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.dayOfWeekDistribution.map((item) => (
              <div key={item.day} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{item.day}</span>
                  <span>{item.count} sessions ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={item.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bodyweight & Policy Details */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-indigo-500" />
              Bodyweight & Volume Semantics
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Precise separation of load-based vs bodyweight movements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Bodyweight-Only Sets
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {metrics.bodyweightOnlySets} sets
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Bodyweight Repetitions
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {metrics.bodyweightOnlyReps} reps
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Volume Rule:</strong> Volume = Load (kg) × Reps. Sets without load are tracked by reps and sets to prevent misleading 0 kg distortion.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Integrity Rule:</strong> Deleted sets and abandoned sessions are excluded from volume analytics.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
