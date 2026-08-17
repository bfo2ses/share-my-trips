import { useRef, type ReactNode } from 'react';
import styles from './TripPanel.module.css';

export type SheetSnap = 'peek' | 'half' | 'full';

// Drag thresholds for the mobile sheet grab zone (px).
const SNAP_UP_DRAG_PX = 50;
const SNAP_DOWN_DRAG_PX = 80;
const TAP_SLOP_PX = 8;

function snapUp(snap: SheetSnap): SheetSnap {
  return snap === 'peek' ? 'half' : 'full';
}

function snapDown(snap: SheetSnap, allowPeek: boolean): SheetSnap {
  if (snap === 'full') return 'half';
  return allowPeek ? 'peek' : 'half';
}

// Tap / Enter on the grab handle: cycle peek → half → full → half.
function toggleSnap(snap: SheetSnap, allowPeek: boolean): SheetSnap {
  if (snap === 'full') return 'half';
  if (snap === 'half') return 'full';
  return allowPeek ? 'half' : 'full';
}

interface TripPanelProps {
  /** 0 = timeline, 1 = visit detail. */
  level: 0 | 1;
  timeline: ReactNode;
  visitDetail: ReactNode;
  /** Mobile sheet snap — controlled by the page so map interactions can raise it. */
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Mobile edit mode renders forms in the page flow instead of the sheet. */
  hiddenOnMobile?: boolean;
  className?: string;
  /** When false, the sheet cannot be dragged below its default half height. */
  allowPeek?: boolean;
}

// Single navigation container for the trip page: fixed left drawer on desktop,
// persistent bottom sheet on mobile. The two panes sit side by side in a
// 200%-wide track; the active level is brought into view by translation.
export function TripPanel({
  level,
  timeline,
  visitDetail,
  snap,
  onSnapChange,
  hiddenOnMobile = false,
  className,
  allowPeek = true,
}: TripPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const drag = useRef<{ pointerId: number; startY: number } | null>(null);
  const effectiveSnap = !allowPeek && snap === 'peek' ? 'half' : snap;

  function resetDragStyles() {
    if (panelRef.current) {
      panelRef.current.style.transition = '';
      panelRef.current.style.transform = '';
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Ignore any second finger during an active drag.
    if (drag.current) return;
    drag.current = { pointerId: e.pointerId, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== e.pointerId || !panelRef.current) return;
    // Live-follow downward only (upward snaps on release). At peek the sheet
    // is already at its lowest position: nothing to follow.
    if (effectiveSnap === 'peek') return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    panelRef.current.style.transition = 'none';
    panelRef.current.style.transform = `translateY(${dy}px)`;
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== e.pointerId) return;
    const dy = e.clientY - drag.current.startY;
    drag.current = null;
    resetDragStyles();
    if (Math.abs(dy) < TAP_SLOP_PX) {
      onSnapChange(toggleSnap(effectiveSnap, allowPeek));
    } else if (dy <= -SNAP_UP_DRAG_PX) {
      onSnapChange(snapUp(effectiveSnap));
    } else if (dy >= SNAP_DOWN_DRAG_PX) {
      // Never below the configured minimum: the sheet is persistent, there is no closed state.
      onSnapChange(snapDown(effectiveSnap, allowPeek));
    }
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    // An aborted pointer (system gesture, rotation…) discards the gesture:
    // its coordinates are unreliable and the user didn't commit anything.
    if (drag.current?.pointerId !== e.pointerId) return;
    drag.current = null;
    resetDragStyles();
  }

  function handleGrabKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSnapChange(toggleSnap(effectiveSnap, allowPeek));
    }
  }

  return (
    <aside
      ref={panelRef}
      className={`${styles.panel} ${className ?? ''} ${effectiveSnap === 'peek' ? styles.snapPeek : ''} ${effectiveSnap === 'full' ? styles.snapFull : ''} ${hiddenOnMobile ? styles.mobileHidden : ''}`}
    >
      <div
        className={styles.grabZone}
        role="button"
        tabIndex={0}
        aria-label="Régler la hauteur du panneau"
        aria-expanded={effectiveSnap !== 'peek'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleGrabKeyDown}
      >
        <span className={styles.grabHandle} />
      </div>
      <div className={styles.viewport}>
        <div className={styles.track} style={{ transform: `translateX(${level * -50}%)` }}>
          <section className={styles.pane} inert={level !== 0}>
            {timeline}
          </section>
          <section className={styles.pane} inert={level !== 1}>
            {visitDetail}
          </section>
        </div>
      </div>
    </aside>
  );
}
