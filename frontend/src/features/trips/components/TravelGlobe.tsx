import { Component, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import styles from './TravelGlobe.module.css';

type TripSummary = TripsQuery['trips'][number];

const BORDEAUX = { lat: 44.8378, lng: -0.5792 };
const GOLD = '#c6a35d';
const GOLD_LIGHT = '#dbbf7c';
const RESUME_DELAY_MS = 3000;

type GlobePoint = {
  id: string;
  title: string;
  country: string;
  lat: number;
  lng: number;
  pending?: boolean;
};

type GlobeArc = {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};

interface TravelGlobeProps {
  trips: TripSummary[];
  onTripSelect: (trip: TripSummary) => void;
  placementMode?: boolean;
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

export function TravelGlobe({ trips, onTripSelect, placementMode = false, pendingCoords, onLocationSelect }: TravelGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const resumeTimer = useRef<number | null>(null);
  const [globeReady, setGlobeReady] = useState(false);

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
    })),
    ...(placementMode && pendingCoords && isValidCoordinate(pendingCoords.lat, pendingCoords.lng)
      ? [{ id: 'pending-location', title: 'Nouvel emplacement', country: '', ...pendingCoords, pending: true }]
      : []),
  ], [pendingCoords, placementMode, validTrips]);

  const arcs = useMemo<GlobeArc[]>(
    () => validTrips.map((trip) => ({
      id: trip.id,
      startLat: BORDEAUX.lat,
      startLng: BORDEAUX.lng,
      endLat: trip.lat,
      endLng: trip.lng,
    })),
    [validTrips],
  );

  const setAutoRotate = useCallback((enabled: boolean) => {
    const controls = globeRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = enabled;
    controls.autoRotateSpeed = 0.35;
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

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  function handlePointClick(point: object) {
	const selectedPoint = point as GlobePoint;
    pauseForInteraction();
    if (!selectedPoint.pending) {
      const trip = trips.find((candidate) => candidate.id === selectedPoint.id);
      if (trip) onTripSelect(trip);
    }
  }

  function handleGlobeClick(coords: { lat: number; lng: number }) {
    pauseForInteraction();
    if (placementMode) onLocationSelect?.(coords);
  }

  return (
    <section className={styles.surface} aria-label="Globe des voyages">
      <GlobeBoundary>
        <Globe
          ref={globeRef}
          width={undefined}
          height={undefined}
          backgroundColor="rgba(0, 0, 0, 0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointLabel={(point) => {
            const typedPoint = point as GlobePoint;
            return typedPoint.pending ? 'Nouvel emplacement' : `${typedPoint.title} · ${typedPoint.country}`;
          }}
          pointColor={(point) => (point as GlobePoint).pending ? GOLD_LIGHT : GOLD}
          pointAltitude={(point) => (point as GlobePoint).pending ? 0.16 : 0.12}
          pointRadius={0.35}
          pointsMerge={false}
          onPointClick={handlePointClick}
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={() => GOLD}
          arcAltitudeAutoScale={0.45}
          arcStroke={0.7}
          onGlobeClick={handleGlobeClick}
          onGlobeReady={handleGlobeReady}
          showAtmosphere
          atmosphereColor={GOLD_LIGHT}
          atmosphereAltitude={0.12}
          enablePointerInteraction
        />
      </GlobeBoundary>
      {!globeReady && <div className={styles.loading} aria-hidden="true" />}
    </section>
  );
}

export { BORDEAUX, GOLD, RESUME_DELAY_MS };
