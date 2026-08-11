import { act, render, screen } from '@testing-library/react';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { TravelGlobe, GOLD, RESUME_DELAY_MS } from './TravelGlobe';

const controls = {
  autoRotate: false,
  autoRotateSpeed: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

type MockGlobeProps = {
  onGlobeReady?: () => void;
  onGlobeClick?: (coords: { lat: number; lng: number }, event: object) => void;
  onPointClick?: (point: object, event: object, coords: object) => void;
  pointsData?: object[];
  arcsData?: object[];
  arcColor?: (arc: object) => string;
  arcDashLength?: (arc: object) => number;
  arcDashGap?: (arc: object) => number;
  arcDashAnimateTime?: (arc: object) => number;
};

const latestProps: { current: MockGlobeProps } = { current: {} };

vi.mock('react-globe.gl', () => ({
  default: forwardRef<{ controls: () => typeof controls }, MockGlobeProps>((props, ref) => {
    useImperativeHandle(ref, () => ({ controls: () => controls }), []);
    useEffect(() => {
      latestProps.current = props;
      props.onGlobeReady?.();
    }, [props]);
    return <button data-testid="mock-globe" onClick={() => props.onGlobeClick?.({ lat: 12, lng: 34 }, {})}>Globe</button>;
  }),
}));

type TripSummary = TripsQuery['trips'][number];

const trips: TripSummary[] = [
  {
    id: 'trip-1', title: 'Japon', country: 'Japon', lat: 35.6762, lng: 139.6503,
    startDate: '2024-03-15', endDate: '2024-03-25', status: 'PUBLISHED', coverPhoto: '',
  },
];

describe('TravelGlobe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    latestProps.current = {};
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0;
    controls.addEventListener.mockReset();
    controls.removeEventListener.mockReset();
  });

  it('maps destinations to gold arcs from Bordeaux and selects a trip marker', async () => {
    const onTripSelect = vi.fn();
    render(<TravelGlobe trips={trips} onTripSelect={onTripSelect} />);

    expect(latestProps.current.arcsData).toHaveLength(2);
    expect(latestProps.current.arcsData?.[0]).toMatchObject({ startLat: 44.8378, startLng: -0.5792, endLat: 35.6762, endLng: 139.6503, animated: false });
    expect(latestProps.current.arcsData?.[1]).toMatchObject({ startLat: 44.8378, startLng: -0.5792, endLat: 35.6762, endLng: 139.6503, animated: true });
    expect(latestProps.current.arcColor?.({ animated: true })).toBe(GOLD);
    expect(latestProps.current.arcDashLength?.({ animated: true })).toBe(0.38);
    expect(latestProps.current.arcDashGap?.({ animated: true })).toBe(1.2);
    expect(latestProps.current.arcDashAnimateTime?.({ animated: true })).toBe(3600);
    expect(latestProps.current.arcDashAnimateTime?.({ animated: false })).toBe(0);

    act(() => latestProps.current.onPointClick?.(latestProps.current.pointsData?.[0] ?? {}, {}, { lat: 35.6762, lng: 139.6503 }));
    expect(onTripSelect).toHaveBeenCalledWith(trips[0]);
    expect(screen.getByTestId('mock-globe')).toBeVisible();
  });

  it('pauses auto-rotation during controls interaction and resumes after three seconds', () => {
    render(<TravelGlobe trips={trips} onTripSelect={vi.fn()} />);
    expect(controls.autoRotate).toBe(true);

    const start = controls.addEventListener.mock.calls.find(([event]) => event === 'start')?.[1];
    expect(start).toBeTypeOf('function');
    act(() => start());
    expect(controls.autoRotate).toBe(false);

    act(() => vi.advanceTimersByTime(RESUME_DELAY_MS - 1));
    expect(controls.autoRotate).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(controls.autoRotate).toBe(true);
  });

  it('uses empty globe clicks for coordinate placement', () => {
    const onLocationSelect = vi.fn();
    const onTripSelect = vi.fn();
    render(<TravelGlobe trips={trips} onTripSelect={onTripSelect} onLocationSelect={onLocationSelect} />);

    act(() => latestProps.current.onGlobeClick?.({ lat: 12, lng: 34 }, {}));
    expect(onLocationSelect).toHaveBeenCalledWith({ lat: 12, lng: 34 });
    expect(onTripSelect).not.toHaveBeenCalled();
  });
});
