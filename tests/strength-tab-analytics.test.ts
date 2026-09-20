import { describe, it, expect } from 'vitest';
import { ProgressAnalyticsService, VolumeDataPoint } from '@/lib/domain/progress-analytics';
import { WorkoutSession } from '@/types/domain';

describe('Training Analytics — Volume Tab Chart Data & Domain Derivation', () => {
  const mockReference = new Date('2026-09-20T12:00:00.000Z');

  // Helper to simulate StrengthTab's chartData transformation
  function deriveChartData(volumeOverTime: VolumeDataPoint[], unitMode: 'kg' | 'lbs') {
    const chartData = volumeOverTime.map((point) => ({
      ...point,
      volume: unitMode === 'kg' ? point.volumeKg : point.volumeLbs,
      volumeKg: point.volumeKg,
      volumeLbs: point.volumeLbs,
    }));

    const maxVolume = chartData.length === 0 ? 0 : Math.max(0, ...chartData.map((d) => d.volume));
    const yDomainMax = maxVolume === 0 ? (unitMode === 'kg' ? 100 : 200) : Math.ceil(maxVolume * 1.15);

    return { chartData, maxVolume, yDomainMax };
  }

  it('1. receives non-empty data when training records contain volume', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's-vol-1',
        userId: 'u1',
        name: 'Leg Day',
        status: 'completed',
        startedAt: '2026-09-18T10:00:00Z',
        completedAt: '2026-09-18T11:00:00Z',
        duration: 3600,
        exercises: [
          {
            id: 'se-1',
            sessionId: 's-vol-1',
            exerciseId: 'barbell-squat',
            name: 'Barbell Squat',
            order: 1,
            status: 'completed',
            targetMuscles: ['Legs'],
            equipment: ['barbell'],
            sets: [
              {
                id: 'st-1',
                sessionExerciseId: 'se-1',
                setNumber: 1,
                type: 'working',
                actualWeight: 100,
                actualReps: 5,
                weightUnit: 'kg',
                status: 'completed',
              },
            ],
          },
        ],
      },
    ];

    const metrics = ProgressAnalyticsService.computeMetrics(sessions, '30d', undefined, 4, mockReference);
    expect(metrics.volumeOverTime.length).toBe(1);
    expect(metrics.volumeOverTime[0].volumeKg).toBe(500);
    expect(metrics.volumeOverTime[0].volumeLbs).toBe(1102);
  });

  it('2. each data point has the expected date and volume fields matching chart series dataKey', () => {
    const volumePoints: VolumeDataPoint[] = [
      {
        dateStr: '2026-09-14',
        displayDate: 'Sep 14',
        volumeKg: 0,
        volumeLbs: 0,
        setsCount: 2,
        repsCount: 24,
      },
      {
        dateStr: '2026-09-19',
        displayDate: 'Sep 19',
        volumeKg: 500,
        volumeLbs: 1102,
        setsCount: 1,
        repsCount: 5,
      },
    ];

    const { chartData } = deriveChartData(volumePoints, 'kg');
    expect(chartData.length).toBe(2);

    for (const point of chartData) {
      expect(point).toHaveProperty('dateStr');
      expect(point).toHaveProperty('displayDate');
      expect(point).toHaveProperty('volume');
      expect(point).toHaveProperty('volumeKg');
      expect(point).toHaveProperty('volumeLbs');
      expect(point).toHaveProperty('setsCount');
      expect(point).toHaveProperty('repsCount');
      expect(typeof point.volume).toBe('number');
    }
  });

  it('3. configured series references correct fields and derives proper Y-axis domain', () => {
    const volumePoints: VolumeDataPoint[] = [
      {
        dateStr: '2026-09-19',
        displayDate: 'Sep 19',
        volumeKg: 500,
        volumeLbs: 1102,
        setsCount: 1,
        repsCount: 5,
      },
    ];

    // In KG mode:
    const kgResult = deriveChartData(volumePoints, 'kg');
    expect(kgResult.chartData[0].volume).toBe(500);
    expect(kgResult.maxVolume).toBe(500);
    expect(kgResult.yDomainMax).toBe(Math.ceil(500 * 1.15)); // 575

    // In LBS mode:
    const lbsResult = deriveChartData(volumePoints, 'lbs');
    expect(lbsResult.chartData[0].volume).toBe(1102);
    expect(lbsResult.maxVolume).toBe(1102);
    expect(lbsResult.yDomainMax).toBe(Math.ceil(1102 * 1.15)); // 1268
  });

  it('4. behaves correctly for zero-volume/bodyweight sessions without collapsing Y-axis domain', () => {
    const bwPoints: VolumeDataPoint[] = [
      {
        dateStr: '2026-09-14',
        displayDate: 'Sep 14',
        volumeKg: 0,
        volumeLbs: 0,
        setsCount: 2,
        repsCount: 20,
      },
    ];

    const { chartData, maxVolume, yDomainMax } = deriveChartData(bwPoints, 'kg');
    expect(chartData[0].volume).toBe(0);
    expect(maxVolume).toBe(0);
    expect(yDomainMax).toBe(100); // Sensible non-zero baseline domain
  });

  it('5. behaves correctly for empty data (no sessions in period)', () => {
    const emptyPoints: VolumeDataPoint[] = [];
    const { chartData, maxVolume, yDomainMax } = deriveChartData(emptyPoints, 'kg');
    expect(chartData.length).toBe(0);
    expect(maxVolume).toBe(0);
    expect(yDomainMax).toBe(100);
  });

  it('6. correctly filters volume across 7D, 30D, 90D, and All Time periods', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's-7d',
        userId: 'u1',
        name: 'Recent Workout',
        status: 'completed',
        startedAt: '2026-09-19T10:00:00Z',
        completedAt: '2026-09-19T10:30:00Z',
        duration: 1800,
        exercises: [
          {
            id: 'se-1',
            sessionId: 's-7d',
            exerciseId: 'bench-press',
            name: 'Bench Press',
            order: 1,
            status: 'completed',
            targetMuscles: ['Chest'],
            equipment: ['barbell'],
            sets: [
              {
                id: 'st-1',
                sessionExerciseId: 'se-1',
                setNumber: 1,
                type: 'working',
                actualWeight: 80,
                actualReps: 10,
                weightUnit: 'kg',
                status: 'completed',
              },
            ],
          },
        ],
      },
      {
        id: 's-old',
        userId: 'u1',
        name: 'Old Workout',
        status: 'completed',
        startedAt: '2026-07-01T10:00:00Z',
        completedAt: '2026-07-01T10:30:00Z',
        duration: 1800,
        exercises: [
          {
            id: 'se-2',
            sessionId: 's-old',
            exerciseId: 'squat',
            name: 'Squat',
            order: 1,
            status: 'completed',
            targetMuscles: ['Legs'],
            equipment: ['barbell'],
            sets: [
              {
                id: 'st-2',
                sessionExerciseId: 'se-2',
                setNumber: 1,
                type: 'working',
                actualWeight: 120,
                actualReps: 5,
                weightUnit: 'kg',
                status: 'completed',
              },
            ],
          },
        ],
      },
    ];

    // 7D includes only recent session
    const m7 = ProgressAnalyticsService.computeMetrics(sessions, '7d', undefined, 4, mockReference);
    expect(m7.volumeOverTime.length).toBe(1);
    expect(m7.volumeOverTime[0].volumeKg).toBe(800);

    // 30D includes only recent session
    const m30 = ProgressAnalyticsService.computeMetrics(sessions, '30d', undefined, 4, mockReference);
    expect(m30.volumeOverTime.length).toBe(1);

    // 90D includes both sessions
    const m90 = ProgressAnalyticsService.computeMetrics(sessions, '90d', undefined, 4, mockReference);
    expect(m90.volumeOverTime.length).toBe(2);

    // All Time includes both sessions
    const mAll = ProgressAnalyticsService.computeMetrics(sessions, 'all', undefined, 4, mockReference);
    expect(mAll.volumeOverTime.length).toBe(2);
  });
});
