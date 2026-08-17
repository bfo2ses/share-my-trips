import { Component, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { tripColor } from '../utils/tripColor';
import styles from './TravelGlobe.module.css';

type TripSummary = TripsQuery['trips'][number];

const BORDEAUX = { lat: 44.8378, lng: -0.5792 };
const GOLD = '#c6a35d';
const GOLD_LIGHT = '#dbbf7c';
const GOLD_SOFT = 'rgba(198, 163, 93, 0.32)';
const GLOBE_IMAGE_URL = 'https://unpkg.com/three-globe@2.45.2/example/img/earth-blue-marble.jpg';
const GLOBE_BUMP_URL = 'https://unpkg.com/three-globe@2.45.2/example/img/earth-topology.png';
const RESUME_DELAY_MS = 3000;
const AUTO_ROTATE_SPEED = 0.25;
const FOCUS_DURATION_MS = 800;
const ARC_FOCUS_ALTITUDE = 0.85;
const TRIP_FOCUS_ALTITUDE = 0.55;
const ARC_DASH_LENGTH = 0.38;
const ARC_DASH_GAP = 1.2;
const ARC_DASH_CYCLE = ARC_DASH_LENGTH + ARC_DASH_GAP;
const ARC_DASH_STAGGER = ARC_DASH_CYCLE / 4;

type GlobePoint = {
  id: string;
  title: string;
  country: string;
  lat: number;
  lng: number;
  color: string;
  pending?: boolean;
};

type GlobeArc = {
  id: string;
  tripId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  animated: boolean;
  color: string;
  dashInitialGap?: number;
};

interface TravelGlobeProps {
  trips: TripSummary[];
  onTripSelect: (trip: TripSummary) => void;
  focusTripId?: string | null;
  onFocusComplete?: (trip: TripSummary) => void;
  onFocusCancel?: () => void;
  pendingCoords?: { lat: number; lng: number } | null;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
}

interface GlobeBoundaryProps {
  children: ReactNode;
}

interface GlobeBoundaryState {
  hasError: boolean;
}

class GlobeBoundary extends Component<GlobeBoundaryProps, GlobeBoundaryState> {
  state: GlobeBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GlobeBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.error} role="alert">
          Le globe n'est pas disponible. La timeline reste accessible.
        </div>
      );
    }
    return this.props.children;
  }
}

function isValidCoordinate(lat: number | null | undefined, lng: number | null | undefined): lat is number {
  return lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function TravelGlobe({
  trips,
  onTripSelect,
  focusTripId,
  onFocusComplete,
  onFocusCancel,
  pendingCoords,
  onLocationSelect,
}: TravelGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const surfaceRef = useRef<HTMLElement | null>(null);
  const inViewport = useRef(true);
  const resumeTimer = useRef<number | null>(null);
  const focusTimer = useRef<number | null>(null);
  const onFocusCompleteRef = useRef(onFocusComplete);
  const onFocusCancelRef = useRef(onFocusCancel);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete;
  }, [onFocusComplete]);

  useEffect(() => {
    onFocusCancelRef.current = onFocusCancel;
  }, [onFocusCancel]);

  const validTrips = useMemo(
    () => trips.filter((trip) => isValidCoordinate(trip.lat, trip.lng)),
    [trips],
  );

  const points = useMemo<GlobePoint[]>(() => [
    ...validTrips.map((trip) => ({
      id: trip.id,
      title: trip.title,
      country: trip.country,
      lat: trip.lat,
      lng: trip.lng,
      color: tripColor(trip.id),
    })),
    ...(pendingCoords && isValidCoordinate(pendingCoords.lat, pendingCoords.lng)
      ? [{ id: 'pending-location', title: 'Nouvel emplacement', country: '', ...pendingCoords, color: GOLD_LIGHT, pending: true }]
      : []),
  ], [pendingCoords, validTrips]);

  const arcs = useMemo<GlobeArc[]>(
    () => validTrips.flatMap((trip, index) => {
      const coordinates = {
        tripId: trip.id,
        startLat: BORDEAUX.lat,
        startLng: BORDEAUX.lng,
        endLat: trip.lat,
        endLng: trip.lng,
        color: tripColor(trip.id),
      };
      return [
        { id: `${trip.id}-base`, ...coordinates, animated: false },
        {
          id: `${trip.id}-animated`,
          ...coordinates,
          animated: true,
          dashInitialGap: (index * ARC_DASH_STAGGER) % ARC_DASH_CYCLE,
        },
      ];
    }),
    [validTrips],
  );

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return undefined;

    const updateDimensions = () => {
      const { width, height } = surface.getBoundingClientRect();
      setDimensions((current) => current.width === width && current.height === height ? current : { width, height });
    };
    updateDimensions();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  const setAutoRotate = useCallback((enabled: boolean) => {
    const controls = globeRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = enabled;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      setAutoRotate(true);
    }, RESUME_DELAY_MS);
  }, [clearResumeTimer, setAutoRotate]);

  const pauseForInteraction = useCallback(() => {
    setAutoRotate(false);
    scheduleResume();
  }, [scheduleResume, setAutoRotate]);

  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
    setAutoRotate(true);
  }, [setAutoRotate]);

  const clearFocusTimer = useCallback(() => {
    if (focusTimer.current !== null) {
      window.clearTimeout(focusTimer.current);
      focusTimer.current = null;
    }
  }, []);

  const focusOnDestination = useCallback((trip: TripSummary, altitude: number, onComplete?: () => void) => {
    clearFocusTimer();
    const globe = globeRef.current;
    if (!globe?.pointOfView) {
      onComplete?.();
      return;
    }

    globe.pointOfView({ lat: trip.lat, lng: trip.lng, altitude }, FOCUS_DURATION_MS);
    if (onComplete) {
      focusTimer.current = window.setTimeout(() => {
        focusTimer.current = null;
        onComplete();
      }, FOCUS_DURATION_MS);
    }
  }, [clearFocusTimer]);

  useEffect(() => {
    if (!globeReady || !focusTripId) return undefined;
    const trip = trips.find((candidate) => candidate.id === focusTripId);
    if (!trip) return undefined;

    if (!isValidCoordinate(trip.lat, trip.lng)) {
      onFocusCompleteRef.current?.(trip);
      return undefined;
    }

    pauseForInteraction();
    focusOnDestination(trip, TRIP_FOCUS_ALTITUDE, () => onFocusCompleteRef.current?.(trip));
    return undefined;
  }, [focusOnDestination, focusTripId, globeReady, pauseForInteraction, trips]);

  const cancelRequestedFocus = useCallback(() => {
    clearFocusTimer();
    if (focusTripId) onFocusCancelRef.current?.();
  }, [clearFocusTimer, focusTripId]);

  useEffect(() => {
    if (!globeReady) return undefined;
    const controls = globeRef.current?.controls?.();
    if (!controls?.addEventListener) return undefined;

    controls.addEventListener('start', pauseForInteraction);
    controls.addEventListener('end', scheduleResume);
    return () => {
      controls.removeEventListener?.('start', pauseForInteraction);
      controls.removeEventListener?.('end', scheduleResume);
    };
  }, [globeReady, pauseForInteraction, scheduleResume]);

  useEffect(() => {
    if (!globeReady) return undefined;
    const surface = surfaceRef.current;
    if (!surface) return undefined;

    const resumeIfVisible = () => {
      if (document.visibilityState !== 'hidden' && inViewport.current) {
        globeRef.current?.resumeAnimation();
        if (resumeTimer.current === null) setAutoRotate(true);
      }
    };
    const pauseIfHidden = () => globeRef.current?.pauseAnimation();

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      inViewport.current = entry.isIntersecting;
      if (entry.isIntersecting) resumeIfVisible();
      else pauseIfHidden();
    }, { threshold: 0.1 });
    observer?.observe(surface);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pauseIfHidden();
      else resumeIfVisible();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [globeReady, setAutoRotate]);

  useEffect(() => () => {
    clearResumeTimer();
    clearFocusTimer();
  }, [clearFocusTimer, clearResumeTimer]);

  function handlePointClick(point: object) {
    const selectedPoint = point as GlobePoint;
    cancelRequestedFocus();
    pauseForInteraction();
    if (!selectedPoint.pending) {
      const trip = trips.find((candidate) => candidate.id === selectedPoint.id);
      if (trip) focusOnDestination(trip, TRIP_FOCUS_ALTITUDE, () => onTripSelect(trip));
    }
  }

  function handleArcClick(arc: object) {
    const selectedArc = arc as GlobeArc;
    const trip = trips.find((candidate) => candidate.id === selectedArc.tripId);
    if (!trip) return;
    cancelRequestedFocus();
    pauseForInteraction();
    focusOnDestination(trip, ARC_FOCUS_ALTITUDE);
  }

  function handleGlobeClick(coords: { lat: number; lng: number }) {
    cancelRequestedFocus();
    pauseForInteraction();
    onLocationSelect?.(coords);
  }

  return (
    <section ref={surfaceRef} className={styles.surface} aria-label="Globe des voyages">
      <GlobeBoundary>
        <Globe
          ref={globeRef}
          width={dimensions.width || undefined}
          height={dimensions.height || undefined}
          backgroundColor="rgba(0, 0, 0, 0)"
          globeImageUrl={GLOBE_IMAGE_URL}
          bumpImageUrl={GLOBE_BUMP_URL}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointLabel={(point) => {
            const typedPoint = point as GlobePoint;
            return typedPoint.pending ? 'Nouvel emplacement' : `${typedPoint.title} · ${typedPoint.country}`;
          }}
          pointColor={(point) => {
            const typedPoint = point as GlobePoint;
            return typedPoint.pending ? GOLD_LIGHT : typedPoint.color;
          }}
          pointAltitude={(point) => (point as GlobePoint).pending ? 0.16 : 0.12}
          pointRadius={0.35}
          pointsMerge={false}
          onPointClick={handlePointClick}
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(arc: object) => {
            const typedArc = arc as GlobeArc;
            return typedArc.animated ? [GOLD, typedArc.color] : GOLD_SOFT;
          }}
          arcAltitudeAutoScale={0.45}
          arcStroke={(arc: object) => (arc as GlobeArc).animated ? 0.7 : 0.35}
          arcDashLength={(arc: object) => (arc as GlobeArc).animated ? 0.38 : 1}
          arcDashGap={(arc: object) => (arc as GlobeArc).animated ? ARC_DASH_GAP : 0}
          arcDashInitialGap={(arc: object) => (arc as GlobeArc).animated ? (arc as GlobeArc).dashInitialGap ?? 0 : 0}
          arcDashAnimateTime={(arc: object) => (arc as GlobeArc).animated ? 3600 : 0}
          onArcClick={handleArcClick}
          onGlobeClick={handleGlobeClick}
          onGlobeReady={handleGlobeReady}
          showAtmosphere
          atmosphereColor={GOLD_LIGHT}
          atmosphereAltitude={0.16}
          enablePointerInteraction
        />
      </GlobeBoundary>
      {!globeReady && <div className={styles.loading} aria-hidden="true" />}
    </section>
  );
}

export { AUTO_ROTATE_SPEED, BORDEAUX, GOLD, FOCUS_DURATION_MS, RESUME_DELAY_MS };
