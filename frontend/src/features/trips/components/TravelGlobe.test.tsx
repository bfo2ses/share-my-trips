import { act, render, screen } from '@testing-library/react';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { AUTO_ROTATE_SPEED, TravelGlobe, GOLD, RESUME_DELAY_MS, FOCUS_DURATION_MS } from './TravelGlobe';
import { tripColor } from '../utils/tripColor';

const controls = {
  autoRotate: false,
  autoRotateSpeed: 0,
  pointOfView: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

type MockGlobeProps = {
  globeImageUrl?: string;
  bumpImageUrl?: string;
  focusTripId?: string | null;
  onGlobeReady?: () => void;
  onGlobeClick?: (coords: { lat: number; lng: number }, event: object) => void;
  onPointClick?: (point: object, event: object, coords: object) => void;
  onArcClick?: (arc: object, event: object, coords: object) => void;
  pointsData?: object[];
  arcsData?: object[];
  pointColor?: (point: object) => string;
  arcColor?: (arc: object) => string | string[];
  arcDashLength?: (arc: object) => number;
  arcDashGap?: (arc: object) => number;
  arcDashInitialGap?: (arc: object) => number;
  arcDashAnimateTime?: (arc: object) => number;
};

const latestProps: { current: MockGlobeProps } = { current: {} };

vi.mock('react-globe.gl', () => ({
  default: forwardRef<{ controls: () => typeof controls; pointOfView: (...args: unknown[]) => void }, MockGlobeProps>((props, ref) => {
    useImperativeHandle(ref, () => ({ controls: () => controls, pointOfView: (...args) => controls.pointOfView(...args) }), []);
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
  {
    id: 'trip-2', title: 'Portugal', country: 'Portugal', lat: 38.7223, lng: -9.1393,
    startDate: '2023-05-10', endDate: '2023-05-20', status: 'PUBLISHED', coverPhoto: '',
  },
];

describe('TravelGlobe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    latestProps.current = {};
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0;
    controls.pointOfView.mockReset();
    controls.addEventListener.mockReset();
    controls.removeEventListener.mockReset();
  });

  it('maps destinations to gold arcs from Bordeaux and selects a trip marker', async () => {
    const onTripSelect = vi.fn();
    render(<TravelGlobe trips={trips} onTripSelect={onTripSelect} />);

    expect(latestProps.current.globeImageUrl).toBe('https://unpkg.com/three-globe@2.45.2/example/img/earth-blue-marble.jpg');
    expect(latestProps.current.bumpImageUrl).toBe('https://unpkg.com/three-globe@2.45.2/example/img/earth-topology.png');
    expect(latestProps.current.pointColor?.(latestProps.current.pointsData?.[0] ?? {})).toBe(tripColor(trips[0].id));
    expect(latestProps.current.pointColor?.(latestProps.current.pointsData?.[1] ?? {})).toBe(tripColor(trips[1].id));
    expect(latestProps.current.arcsData).toHaveLength(4);
    expect(latestProps.current.arcsData?.[0]).toMatchObject({ startLat: 44.8378, startLng: -0.5792, endLat: 35.6762, endLng: 139.6503, animated: false });
    expect(latestProps.current.arcsData?.[1]).toMatchObject({ startLat: 44.8378, startLng: -0.5792, endLat: 35.6762, endLng: 139.6503, animated: true });
    expect(latestProps.current.arcColor?.(latestProps.current.arcsData?.[1] ?? {})).toEqual([GOLD, tripColor(trips[0].id)]);
    expect(latestProps.current.arcColor?.(latestProps.current.arcsData?.[0] ?? {})).toBe('rgba(198, 163, 93, 0.32)');
    expect(latestProps.current.arcColor?.(latestProps.current.arcsData?.[3] ?? {})).toEqual([GOLD, tripColor(trips[1].id)]);
    expect(latestProps.current.arcDashLength?.({ animated: true })).toBe(0.38);
    expect(latestProps.current.arcDashGap?.({ animated: true })).toBe(1.2);
    const animatedArcs = latestProps.current.arcsData?.filter((arc) => (arc as { animated?: boolean }).animated);
    expect(animatedArcs).toHaveLength(2);
    expect(latestProps.current.arcDashInitialGap?.(animatedArcs?.[0] ?? {})).toBe(0);
    expect(latestProps.current.arcDashInitialGap?.(animatedArcs?.[1] ?? {})).toBeCloseTo(0.395);
    expect(latestProps.current.arcDashInitialGap?.({ animated: false })).toBe(0);
    expect(latestProps.current.arcDashAnimateTime?.({ animated: true })).toBe(3600);
    expect(latestProps.current.arcDashAnimateTime?.({ animated: false })).toBe(0);

    act(() => latestProps.current.onPointClick?.(latestProps.current.pointsData?.[0] ?? {}, {}, { lat: 35.6762, lng: 139.6503 }));
    expect(controls.pointOfView).toHaveBeenCalledWith({ lat: 35.6762, lng: 139.6503, altitude: 0.55 }, FOCUS_DURATION_MS);
    expect(onTripSelect).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(FOCUS_DURATION_MS));
    expect(onTripSelect).toHaveBeenCalledWith(trips[0]);
    expect(screen.getByTestId('mock-globe')).toBeVisible();
  });

  it('focuses the trip destination when an arc is clicked without selecting the trip', () => {
    const onTripSelect = vi.fn();
    render(<TravelGlobe trips={trips} onTripSelect={onTripSelect} />);

    act(() => latestProps.current.onArcClick?.(latestProps.current.arcsData?.[1] ?? {}, {}, { lat: 35.6762, lng: 139.6503 }));

    expect(controls.pointOfView).toHaveBeenCalledWith({ lat: 35.6762, lng: 139.6503, altitude: 0.85 }, FOCUS_DURATION_MS);
    expect(onTripSelect).not.toHaveBeenCalled();
  });

  it('focuses a trip requested by the timeline before completing navigation', () => {
    const onFocusComplete = vi.fn();
    const { rerender } = render(<TravelGlobe trips={trips} onTripSelect={vi.fn()} />);

    act(() => rerender(
      <TravelGlobe
        trips={trips}
        onTripSelect={vi.fn()}
        focusTripId="trip-2"
        onFocusComplete={onFocusComplete}
      />,
    ));

    expect(controls.pointOfView).toHaveBeenCalledWith({ lat: 38.7223, lng: -9.1393, altitude: 0.55 }, FOCUS_DURATION_MS);
    expect(onFocusComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(FOCUS_DURATION_MS));
    expect(onFocusComplete).toHaveBeenCalledWith(trips[1]);
  });

  it('cancels a timeline focus when the globe is clicked', () => {
    const onFocusComplete = vi.fn();
    const onFocusCancel = vi.fn();
    const { rerender } = render(<TravelGlobe trips={trips} onTripSelect={vi.fn()} />);

    act(() => rerender(
      <TravelGlobe
        trips={trips}
        onTripSelect={vi.fn()}
        focusTripId="trip-1"
        onFocusComplete={onFocusComplete}
        onFocusCancel={onFocusCancel}
      />,
    ));
    act(() => latestProps.current.onGlobeClick?.({ lat: 12, lng: 34 }, {}));
    act(() => vi.advanceTimersByTime(FOCUS_DURATION_MS));

    expect(onFocusCancel).toHaveBeenCalledOnce();
    expect(onFocusComplete).not.toHaveBeenCalled();
  });

  it('cancels delayed trip selection when the globe is clicked', () => {
    const onTripSelect = vi.fn();
    const onLocationSelect = vi.fn();
    render(<TravelGlobe trips={trips} onTripSelect={onTripSelect} onLocationSelect={onLocationSelect} />);

    act(() => latestProps.current.onPointClick?.(latestProps.current.pointsData?.[0] ?? {}, {}, { lat: 35.6762, lng: 139.6503 }));
    act(() => latestProps.current.onGlobeClick?.({ lat: 12, lng: 34 }, {}));
    act(() => vi.advanceTimersByTime(FOCUS_DURATION_MS));

    expect(onLocationSelect).toHaveBeenCalledWith({ lat: 12, lng: 34 });
    expect(onTripSelect).not.toHaveBeenCalled();
  });

  it('pauses auto-rotation during controls interaction and resumes after three seconds', () => {
    render(<TravelGlobe trips={trips} onTripSelect={vi.fn()} />);
    expect(controls.autoRotate).toBe(true);
    expect(controls.autoRotateSpeed).toBe(AUTO_ROTATE_SPEED);

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
