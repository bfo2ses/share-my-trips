import { useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { useTripDetail } from '../hooks/useTripDetail';
import { useTripMedia } from '../../media/hooks/useMediaQueries';
import type { MediaTarget } from '../../media/mediaOwner';
import { useMe } from '../../auth/hooks/useMe';
import { useEditMode } from '../../../components/EditMode/useEditMode';
import { usePublishTrip, useUnpublishTrip, useDeleteTrip, useReopenTrip, useCloseTrip } from '../hooks/useTripMutations';
import { useUpdateStage, useDeleteStage } from '../../stages/hooks/useStageMutations';
import { useAddVisit, useUpdateVisit, useDeleteVisit, useReorderVisits } from '../../stages/hooks/useVisitMutations';
import { TripMap, type PlacementMode } from '../components/TripMap';
import { TripForm, type FormAction } from '../components/TripForm';
import { TripPanel, type SheetSnap } from '../components/TripPanel';
import { VisitDetail } from '../components/VisitDetail';
import { StageForm } from '../../stages/components/StageForm';
import { VisitForm, type VisitFormSubmission, type VisitFormSubmissionResult } from '../../stages/components/VisitForm';
import { TravelLegDetail } from '../../travel-legs/components/TravelLegDetail';
import { TravelLegForm, type TravelLegData } from '../../travel-legs/components/TravelLegForm';
import { TravelLegResolutionDialog, type ResolutionLeg, type ResolutionPair, type TravelLegResolution } from '../../travel-legs/components/TravelLegResolutionDialog';
import { transportLabel } from '../../travel-legs/transport';
import { TransportIcon } from '../../travel-legs/components/TransportIcon';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import { tripColor } from '../utils/tripColor';
import { formatDateOnly } from '../../../lib/date';
import type { TripDetailQuery } from '../../../graphql/generated/graphql';
import styles from './TripDetailPage.module.css';

type Stage = TripDetailQuery['stages'][number];
type EditableMapStage = Pick<Stage, 'id' | 'city' | 'displayName' | 'description'>;
type Visit = TripDetailQuery['tripVisits'][number];
type TravelLeg = TripDetailQuery['travelLegs'][number];
type StageDateRangeMap = Record<string, { start: string; end: string }>;
type PanTarget = { lat: number; lng: number; seq: number } | null;
type TravelLegFormState = {
  fromStageID: string;
  toStageID: string;
  travelLeg?: TravelLegData;
};
type ResolutionRequest = {
  legs: ResolutionLeg[];
  pairs: ResolutionPair[];
  execute: (plan: TravelLegResolution[]) => Promise<void>;
};

function formatDate(d: string) {
  return formatDateOnly(d, { day: 'numeric', month: 'short' });
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return '';
  return `${formatDate(start)} — ${formatDateOnly(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [{ data, fetching: detailFetching }, reexecuteDetail] = useTripDetail(id!);
  const { data: meData } = useMe();
  const role = meData?.me?.role;
  const hasEditRole = role === 'ADMIN' || role === 'EDITOR';
  const { editMode } = useEditMode();
  const isAdmin = hasEditRole && editMode;

  const [searchParams, setSearchParams] = useSearchParams();

  const selectedStageId = searchParams.get('stage');
  const selectedVisitId = searchParams.get('visit');
  const selectedTravelLegId = searchParams.get('leg');
  // Manual forms are create-only (opened via map click); editing an existing
  // entity goes through the auto-open forms driven by the URL selection.
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [visitFormOpen, setVisitFormOpen] = useState(false);
  const [visitFormStageId, setVisitFormStageId] = useState<string | null>(null);
  const [travelLegForm, setTravelLegForm] = useState<TravelLegFormState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resolutionRequest, setResolutionRequest] = useState<ResolutionRequest | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [recalculationNotice, setRecalculationNotice] = useState<string | null>(null);
  const [pendingStageCoords, setPendingStageCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingVisitCoords, setPendingVisitCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [panTarget, setPanTarget] = useState<PanTarget>(null);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('half');
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const refetchAll = useCallback(() => reexecuteDetail({ requestPolicy: 'network-only' }), [reexecuteDetail]);
  const showRecalculationWarnings = useCallback((warnings: Array<{ message: string }> | null | undefined) => {
    if (warnings && warnings.length > 0) setRecalculationNotice(warnings.map((warning) => warning.message).join(' '));
  }, []);
  // Per-entity in-flight drag mutation guard. Ref-based so updates don't
  // re-render the map and lose Leaflet's drag state.
  const savingStagesRef = useRef<Set<string>>(new Set());
  const savingVisitsRef = useRef<Set<string>>(new Set());

  const [, publishTrip] = usePublishTrip();
  const [, unpublishTrip] = useUnpublishTrip();
  const [, closeTrip] = useCloseTrip();
  const [, deleteTrip] = useDeleteTrip();
  const [, reopenTrip] = useReopenTrip();
  const [, updateStage] = useUpdateStage();
  const [, deleteStage] = useDeleteStage();
  const [, updateVisit] = useUpdateVisit();
  const [, addVisit] = useAddVisit();
  const [, deleteVisit] = useDeleteVisit();

  const refetchContext = { additionalTypenames: ['Trip', 'Stage', 'Visit'] };

  // Photos de l'album, proposées comme cover dans le formulaire voyage. En
  // pause dès qu'une étape est sélectionnée : le retour au niveau voyage
  // relance un fetch réseau (cache-and-network) et récupère les photos
  // uploadées entre-temps. Filtre par tripID : urql conserve la data
  // précédente pendant pause/refetch.
  const [{ data: tripMediaData }] = useTripMedia(isAdmin && !selectedStageId ? id : null);
  const coverChoices = (tripMediaData?.tripMedia ?? [])
    .filter((m) => m.tripID === id && m.contentType.startsWith('image/'))
    .map((m) => ({ id: m.id, thumbUrl: m.thumbUrl }));

  const trip = data?.trip ?? null;
  const isModifiable = trip ? trip.status !== 'CLOSED' : false;
  const stages = useMemo(() => data?.stages ?? [], [data?.stages]);
  const allVisits = useMemo(() => data?.tripVisits ?? [], [data?.tripVisits]);
  const travelLegs = useMemo(() => data?.travelLegs ?? [], [data?.travelLegs]);

  const selectedVisit = useMemo(
    () => (selectedVisitId ? allVisits.find((v) => v.id === selectedVisitId) ?? null : null),
    [selectedVisitId, allVisits],
  );

  const selectedStage = useMemo(
    () => (selectedStageId ? stages.find((s) => s.id === selectedStageId) ?? null : null),
    [selectedStageId, stages],
  );

  const selectedTravelLeg = useMemo(
    () => (selectedTravelLegId ? travelLegs.find((leg) => leg.id === selectedTravelLegId) ?? null : null),
    [selectedTravelLegId, travelLegs],
  );

  const stageNames = useMemo(() => new Map(stages.map((stage) => [stage.id, stage.displayName])), [stages]);

  const buildResolutionRequest = useCallback((projectedStages: Stage[]) => {
    const projectedIDs = projectedStages.map((stage) => stage.id);
    const pairKeys = new Set(projectedIDs.slice(0, -1).map((fromStageID, index) => `${fromStageID}\u0000${projectedIDs[index + 1]}`));
    const affected = travelLegs.filter((leg) => !pairKeys.has(`${leg.fromStageID}\u0000${leg.toStageID}`));
    const occupied = new Set(travelLegs
      .filter((leg) => !affected.some((candidate) => candidate.id === leg.id))
      .map((leg) => `${leg.fromStageID}\u0000${leg.toStageID}`));
    return {
      legs: affected.map((leg) => ({ id: leg.id, fromStageID: leg.fromStageID, toStageID: leg.toStageID })),
      pairs: projectedIDs.slice(0, -1)
        .map((fromStageID, index) => ({ fromStageID, toStageID: projectedIDs[index + 1] }))
        .filter((pair) => !occupied.has(`${pair.fromStageID}\u0000${pair.toStageID}`)),
    };
  }, [travelLegs]);

  const projectedStagesForVisits = useCallback((projectedVisits: Array<Pick<Visit, 'stageIDs' | 'date'>>) => {
    const earliest = new Map<string, string>();
    for (const item of projectedVisits) {
      const stageID = item.stageIDs[0];
      if (stageID && (!earliest.has(stageID) || item.date < earliest.get(stageID)!)) earliest.set(stageID, item.date);
    }
    return [...stages].sort((left, right) => {
      const leftDate = earliest.get(left.id);
      const rightDate = earliest.get(right.id);
      if (leftDate && rightDate && leftDate !== rightDate) return leftDate.localeCompare(rightDate);
      if (leftDate !== rightDate) return leftDate ? -1 : 1;
      if (left.createdAt !== right.createdAt) return left.createdAt.localeCompare(right.createdAt);
      return left.id.localeCompare(right.id);
    });
  }, [stages]);

  const submitVisitWithResolution = useCallback(async (
    submission: VisitFormSubmission,
    onResolvedSuccess: () => void,
  ): Promise<VisitFormSubmissionResult> => {
    const projectedVisits = submission.kind === 'create'
      ? [...allVisits, { stageIDs: [submission.stageID], date: submission.date }]
      : allVisits.map((item) => item.id === submission.visitID ? { ...item, date: submission.date } : item);
    const resolution = buildResolutionRequest(projectedStagesForVisits(projectedVisits));

    const execute = async (resolutionPlan: TravelLegResolution[]) => {
      if (submission.kind === 'create') {
        const result = await addVisit({
          input: {
            tripID: submission.tripID,
            stageID: submission.stageID,
            date: submission.date,
            title: submission.title,
            description: submission.description,
            lat: submission.lat,
            lng: submission.lng,
            resolutionPlan,
          },
        }, { additionalTypenames: ['Visit', 'Stage', 'TravelLeg'] });
        const errors = result.data?.addVisit.errors ?? [];
        if (result.error || errors.length > 0) return errors.map((error) => error.message).length ? errors.map((error) => error.message) : ['Une erreur est survenue.'];
        showRecalculationWarnings(result.data?.addVisit.recalculationWarnings);
        return [];
      }

      const result = await updateVisit({
        id: submission.visitID!,
        input: {
          date: submission.date,
          title: submission.title,
          description: submission.description,
          lat: submission.lat,
          lng: submission.lng,
          resolutionPlan,
        },
      }, { additionalTypenames: ['Visit', 'Stage', 'TravelLeg'] });
      const errors = result.data?.updateVisit.errors ?? [];
      if (result.error || errors.length > 0) return errors.map((error) => error.message).length ? errors.map((error) => error.message) : ['Une erreur est survenue.'];
      showRecalculationWarnings(result.data?.updateVisit.recalculationWarnings);
      return [];
    };

    if (resolution.legs.length === 0) {
      const errors = await execute([]);
      if (errors.length > 0) return { completed: false, errors };
      refetchAll();
      return { completed: true };
    }

    setResolutionError(null);
    setResolutionRequest({
      ...resolution,
      execute: async (resolutionPlan) => {
        const errors = await execute(resolutionPlan);
        if (errors.length > 0) {
          setResolutionError(errors.join(' '));
          return;
        }
        setResolutionRequest(null);
        refetchAll();
        onResolvedSuccess();
      },
    });
    return { completed: false };
  }, [addVisit, allVisits, buildResolutionRequest, projectedStagesForVisits, refetchAll, showRecalculationWarnings, updateVisit]);

  // Contenu rémanent : la pane détail garde son dernier contenu pendant la
  // translation de retour (adjust-during-render, pattern wasOpen).
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  if (selectedVisit && selectedVisit !== lastVisit) setLastVisit(selectedVisit);
  const displayVisit = selectedVisit ?? lastVisit;

  const visitsByStage = useMemo(() => {
    const map = new Map<string, Visit[]>();
    for (const v of allVisits) {
      for (const stageId of v.stageIDs) {
        const existing = map.get(stageId);
        if (existing) existing.push(v);
        else map.set(stageId, [v]);
      }
    }
    return map;
  }, [allVisits]);

  const stageDateRanges = useMemo<StageDateRangeMap>(() => {
    const ranges: StageDateRangeMap = {};
    for (const [stageId, visits] of visitsByStage) {
      const primary = visits.filter((v) => v.stageIDs[0] === stageId);
      if (primary.length > 0) {
        const sorted = [...primary].sort((a, b) => a.date.localeCompare(b.date));
        ranges[stageId] = { start: sorted[0].date, end: sorted[sorted.length - 1].date };
      }
    }
    return ranges;
  }, [visitsByStage]);

  const mediaTargets = useMemo<MediaTarget[]>(() => {
    const stageNames = new Map(stages.map((stage) => [stage.id, stage.displayName]));
    const visitTargets = allVisits.map((visit) => ({
      owner: { type: 'visit' as const, id: visit.id },
      label: `Visite · ${visit.title ?? visit.date}`,
    }));
    const legTargets = travelLegs.map((leg) => ({
      owner: { type: 'travelLeg' as const, id: leg.id },
      label: `Trajet · ${stageNames.get(leg.fromStageID) ?? '?'} → ${stageNames.get(leg.toStageID) ?? '?'}`,
    }));
    return [...visitTargets, ...legTargets];
  }, [allVisits, stages, travelLegs]);

  const activeStageVisits = useMemo(() => {
    if (!selectedStageId) return [];
    return (visitsByStage.get(selectedStageId) ?? []).filter((v) => v.stageIDs[0] === selectedStageId);
  }, [selectedStageId, visitsByStage]);

  // Closing helpers — centralised so the "mutually exclusive forms" rule is
  // easy to enforce in the openers below.
  const closeStageForm = useCallback(() => {
    setStageFormOpen(false);
    setPendingStageCoords(null);
  }, []);

  const closeVisitForm = useCallback(() => {
    setVisitFormOpen(false);
    setVisitFormStageId(null);
    setPendingVisitCoords(null);
  }, []);

  const closeTravelLegForm = useCallback(() => {
    setTravelLegForm(null);
  }, []);

  // Sélectionner une étape (timeline ou carte) ne change pas de vue : la carte
  // se centre dessus et la timeline défile pour l'amener en haut. Re-cliquer
  // l'étape active la désélectionne (la carte revient à la vue d'ensemble).
  const handleStageClick = useCallback((stageId: string) => {
    if (selectedStageId === stageId && !selectedVisitId) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ stage: stageId }, { replace: true });
    setSheetSnap((s) => (s === 'peek' ? 'half' : s));
    // Pas de scrollIntoView : il ajusterait aussi le scrollLeft des conteneurs
    // overflow:hidden du track.
    const el = document.getElementById(`stage-${stageId}`);
    const scroller = timelineScrollRef.current;
    if (el && scroller) {
      scroller.scrollTo({
        top: el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
        behavior: 'smooth',
      });
    }
  }, [setSearchParams, selectedStageId, selectedVisitId]);

  const handleVisitClickFromTimeline = useCallback((stageId: string, visit: Visit) => {
    setSearchParams({ stage: stageId, visit: visit.id }, { replace: true });
    setSheetSnap((s) => (s === 'peek' ? 'half' : s));
  }, [setSearchParams]);

  const handleTravelLegClick = useCallback((travelLegID: string) => {
    const travelLeg = travelLegs.find((leg) => leg.id === travelLegID);
    if (isAdmin && isModifiable && travelLeg) {
      closeStageForm();
      closeVisitForm();
      setSearchParams({}, { replace: true });
      setTravelLegForm({
        fromStageID: travelLeg.fromStageID,
        toStageID: travelLeg.toStageID,
        travelLeg,
      });
      return;
    }
    setSearchParams({ leg: travelLegID }, { replace: true });
    setSheetSnap((snap) => (snap === 'peek' ? 'half' : snap));
  }, [closeStageForm, closeVisitForm, isAdmin, isModifiable, setSearchParams, travelLegs]);

  const handleTravelLegCreate = useCallback((fromStageID: string, toStageID: string) => {
    closeStageForm();
    closeVisitForm();
    setSearchParams({}, { replace: true });
    setTravelLegForm({ fromStageID, toStageID });
  }, [closeStageForm, closeVisitForm, setSearchParams]);

  const handleTravelLegSaved = useCallback((travelLeg: TravelLegData, created: boolean) => {
    setTravelLegForm(null);
    if (!created) {
      setSearchParams({ leg: travelLeg.id }, { replace: true });
    }
  }, [setSearchParams]);

  const handleDetailClose = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleBackToStage = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('visit');
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const handleBackToTimeline = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const requestStageDelete = useCallback((stageID: string) => {
    const resolution = buildResolutionRequest(stages.filter((stage) => stage.id !== stageID));
    if (resolution.legs.length === 0) {
      void deleteStage({ id: stageID, resolutionPlan: [] }, { additionalTypenames: ['Stage', 'Visit', 'TravelLeg'] }).then((result) => {
        if (!result.error && result.data?.deleteStage.success) handleDetailClose();
      });
      return;
    }
    setResolutionError(null);
    setResolutionRequest({
      ...resolution,
      execute: async (resolutionPlan) => {
        const result = await deleteStage({ id: stageID, resolutionPlan }, { additionalTypenames: ['Stage', 'Visit', 'TravelLeg'] });
        const errors = result.data?.deleteStage.errors ?? [];
        if (result.error || !result.data?.deleteStage.success || errors.length > 0) {
          setResolutionError(errors.map((error) => error.message).join(' ') || 'Le voyage a changé, actualisez puis recommencez.');
          return;
        }
        setResolutionRequest(null);
        handleDetailClose();
        refetchAll();
      },
    });
  }, [buildResolutionRequest, stages, deleteStage, handleDetailClose, refetchAll]);

  const requestVisitDelete = useCallback((visit: Visit) => {
    const remainingVisits = allVisits.filter((item) => item.id !== visit.id);
    const projected = projectedStagesForVisits(remainingVisits);
    const resolution = buildResolutionRequest(projected);
    if (resolution.legs.length === 0) {
      void deleteVisit({ id: visit.id, resolutionPlan: [] }, { additionalTypenames: ['Visit', 'Stage', 'TravelLeg'] }).then((result) => {
        if (!result.error && result.data?.deleteVisit.success) handleBackToStage();
      });
      return;
    }
    setResolutionError(null);
    setResolutionRequest({
      ...resolution,
      execute: async (resolutionPlan) => {
        const result = await deleteVisit({ id: visit.id, resolutionPlan }, { additionalTypenames: ['Visit', 'Stage', 'TravelLeg'] });
        const errors = result.data?.deleteVisit.errors ?? [];
        if (result.error || !result.data?.deleteVisit.success || errors.length > 0) {
          setResolutionError(errors.map((error) => error.message).join(' ') || 'Le voyage a changé, actualisez puis recommencez.');
          return;
        }
        setResolutionRequest(null);
        handleBackToStage();
        refetchAll();
      },
    });
  }, [allVisits, projectedStagesForVisits, buildResolutionRequest, deleteVisit, handleBackToStage, refetchAll]);

  const confirmResolution = useCallback(async (plan: TravelLegResolution[]) => {
    if (!resolutionRequest || resolving) return;
    setResolving(true);
    try {
      await resolutionRequest.execute(plan);
    } finally {
      setResolving(false);
    }
  }, [resolutionRequest, resolving]);

  async function handlePublish() {
    await publishTrip({ id: id! }, refetchContext);
  }

  async function handleUnpublish() {
    await unpublishTrip({ id: id! }, refetchContext);
  }

  async function handleCloseTripAction() {
    const allDates = Object.values(stageDateRanges).flatMap((r) => [r.start, r.end]).sort();
    if (allDates.length === 0) return;
    const firstVisitDate = allDates[0];
    const lastVisitDate = allDates[allDates.length - 1];
    await closeTrip({ id: id!, input: { firstVisitDate, lastVisitDate } }, refetchContext);
  }

  async function handleReopen() {
    await reopenTrip({ id: id! }, refetchContext);
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteTrip({ id: id! }, refetchContext);
    if (result.error || !result.data?.deleteTrip.success) {
      setDeleting(false);
      setDeleteError('Impossible de supprimer le voyage. Réessayez.');
      return;
    }
    navigate('/');
  }

  // Drag handlers — a drag always saves immediately (dropping a marker IS the
  // action; requiring a form submit afterwards read as "drag is broken"). If
  // the dragged entity's auto-edit form is open, its pending coords are also
  // synced so the form displays — and later re-submits — the same position.
  // F8 in-flight guard: ignore subsequent drags on the same entity until the
  // first save resolves, and revert the marker via the provided closure.
  const handleStageDragEnd = useCallback(
    async (stage: EditableMapStage, coords: { lat: number; lng: number }, revert: () => void) => {
      const autoEdit = isAdmin && isModifiable;
      const stageFormShown = autoEdit && selectedStageId === stage.id && !selectedVisitId;
      if (savingStagesRef.current.has(stage.id)) {
        revert();
        return;
      }
      savingStagesRef.current.add(stage.id);
      if (stageFormShown) setPendingStageCoords(coords);
      try {
        const customName = stage.displayName !== stage.city ? stage.displayName : undefined;
        const result = await updateStage(
          {
            id: stage.id,
            input: {
              city: stage.city,
              name: customName,
              lat: coords.lat,
              lng: coords.lng,
              description: stage.description || undefined,
            },
          },
          { additionalTypenames: ['Stage'] },
        );
        if (result.error || (result.data?.updateStage.errors ?? []).length > 0) {
          revert();
          if (stageFormShown) setPendingStageCoords(null);
          refetchAll();
          return;
        }
        showRecalculationWarnings(result.data?.updateStage.recalculationWarnings);
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingStagesRef.current.delete(stage.id);
      }
    },
    [isAdmin, isModifiable, selectedStageId, selectedVisitId, updateStage, refetchAll, showRecalculationWarnings],
  );

  const handleVisitDragEnd = useCallback(
    async (visit: Visit, coords: { lat: number; lng: number }, revert: () => void) => {
      const autoEdit = isAdmin && isModifiable;
      const visitFormShown = autoEdit && selectedVisitId === visit.id;
      if (savingVisitsRef.current.has(visit.id)) {
        revert();
        return;
      }
      savingVisitsRef.current.add(visit.id);
      if (visitFormShown) setPendingVisitCoords(coords);
      try {
        const result = await updateVisit(
          {
            id: visit.id,
            input: {
              title: visit.title || undefined,
              description: visit.description || undefined,
              lat: coords.lat,
              lng: coords.lng,
            },
          },
          { additionalTypenames: ['Visit'] },
        );
        if (result.error || (result.data?.updateVisit.errors ?? []).length > 0) {
          revert();
          if (visitFormShown) setPendingVisitCoords(null);
          refetchAll();
          return;
        }
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingVisitsRef.current.delete(visit.id);
      }
    },
    [isAdmin, isModifiable, selectedVisitId, updateVisit, refetchAll],
  );

  if (detailFetching) {
    return <div className={styles.notFound} style={{ color: 'var(--color-text-muted)' }}>Chargement…</div>;
  }

  if (!trip) {
    return <div className={styles.notFound}>Voyage introuvable.</div>;
  }

  const canEditMarkers = !!isAdmin && isModifiable;
  const color = tripColor(trip.id);
  const canCloseTrip =
    stages.length > 0 && Object.keys(stageDateRanges).length === stages.length;

  // Auto-open edit forms in edit mode based on current selection.
  // Manual opens (create via map click / menu) take priority over auto-open.
  const autoTripForm = isAdmin && isModifiable && !selectedStageId && !selectedTravelLegId && !travelLegForm && !stageFormOpen && !visitFormOpen;
  const autoStageForm = isAdmin && isModifiable && !!selectedStage && !selectedVisitId && !stageFormOpen && !visitFormOpen;
  const autoVisitForm = isAdmin && isModifiable && !!selectedVisit && !!selectedStageId && !visitFormOpen;

  const effectiveVisitStageId = visitFormOpen ? visitFormStageId : (autoVisitForm ? selectedStageId : null);

  // F4: suppress placement mode whenever a real overlay is blocking the map.
  // Auto-open panels are in-grid and don't block.
  const overlayActive = confirmDelete;

  const placementMode: PlacementMode = !canEditMarkers || overlayActive
    ? null
    : stageFormOpen
    ? 'stage'
    : visitFormOpen
    ? 'visit'
    : selectedVisit
    ? null
    : selectedStageId
    ? 'visit'
    : 'stage';

  // Golden "pending" marker for the create forms (auto-edit forms already
  // have the dragged marker visible at the dropped position).
  const pendingMapCoords = stageFormOpen ? pendingStageCoords : visitFormOpen ? pendingVisitCoords : null;

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    // Only manual (create) forms intercept map clicks for coord placement.
    // Auto-open panels don't — the click should open a new create form instead.
    if (stageFormOpen) {
      setPendingStageCoords(coords);
      return;
    }
    if (visitFormOpen) {
      setPendingVisitCoords(coords);
      return;
    }
    if (!canEditMarkers || overlayActive) return;
    if (!selectedStageId) {
      closeVisitForm();
      setPendingStageCoords(coords);
      setStageFormOpen(true);
      return;
    }
    if (!selectedVisit) {
      closeStageForm();
      setVisitFormStageId(selectedStageId);
      setPendingVisitCoords(coords);
      setVisitFormOpen(true);
    }
  };

  // Auto-form is one of the three auto-open forms (panel mode in-grid).
  const anyAutoForm = autoTripForm || autoStageForm || autoVisitForm || !!travelLegForm;

  // Niveau du panneau unique : seule une visite sélectionnée change de vue. En
  // mode édition (auto-form), le panneau reste sur la timeline — c'est le
  // formulaire qui porte le détail sélectionné.
  const panelLevel: 0 | 1 = anyAutoForm ? 0 : selectedVisit || selectedTravelLeg ? 1 : 0;

  // Actions for each form panel
  const tripFormActions: FormAction[] = isAdmin ? [
    ...(trip.status === 'DRAFT' ? [{ label: 'Publier le voyage', onClick: handlePublish }] : []),
    ...(trip.status === 'PUBLISHED' ? [{ label: 'Repasser en brouillon', onClick: handleUnpublish }] : []),
    ...(trip.status === 'PUBLISHED' && canCloseTrip ? [{ label: 'Clôturer le voyage', onClick: handleCloseTripAction }] : []),
    ...(trip.status === 'CLOSED' ? [{ label: 'Réouvrir le voyage', onClick: handleReopen }] : []),
    { label: 'Supprimer le voyage', onClick: () => setConfirmDelete(true), danger: true },
  ] : [];

  const stageFormActions: FormAction[] = isAdmin && selectedStage ? [
    {
      label: 'Supprimer l\'étape',
      danger: true,
      onClick: () => requestStageDelete(selectedStage.id),
    },
  ] : [];

  const visitFormActions: FormAction[] = isAdmin && selectedVisit ? [
    {
      label: 'Supprimer la visite',
      danger: true,
      onClick: () => requestVisitDelete(selectedVisit),
    },
  ] : [];

  const tripMenuItems: ActionMenuItem[] = isAdmin && !anyAutoForm
    ? [
        ...(trip.status === 'PUBLISHED' ? [{ label: 'Repasser en brouillon', onClick: handleUnpublish }] : []),
        ...(trip.status === 'CLOSED' ? [{ label: 'Réouvrir', onClick: handleReopen }] : []),
        { label: 'Supprimer', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

  const canEditDetail = !!isAdmin && isModifiable;

  return (
    <>
    {recalculationNotice && (
      <div role="status" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2000, maxWidth: 360, padding: 12, borderRadius: 8, background: 'var(--color-surface)', boxShadow: '0 4px 16px rgb(0 0 0 / 20%)' }}>
        {recalculationNotice}
      </div>
    )}
    <div className={`${styles.page} ${anyAutoForm ? styles.formPanelOpen : ''}`}>
      {/* ── Panneau unique : timeline ⇄ détail d'étape ⇄ détail de visite ── */}
      <TripPanel
        level={panelLevel}
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        hiddenOnMobile={anyAutoForm || stageFormOpen || visitFormOpen}
        timeline={
          <>
        <div className={styles.tripHeader} style={{ borderColor: color }}>
          <div className={styles.headerTop}>
            <Link to="/" viewTransition className={styles.backLink}>← Tous les voyages</Link>
            {tripMenuItems.length > 0 && (
              <ActionMenu items={tripMenuItems} ariaLabel="Actions sur le voyage" />
            )}
          </div>
          <p className={styles.country}>{trip.country}</p>
          <h1 className={styles.tripTitle}>{trip.title}</h1>
          <p className={styles.tripDates}>{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>

        <div className={styles.content} ref={timelineScrollRef}>
          {detailFetching ? (
            <p style={{ padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Chargement des étapes…</p>
          ) : stages.length === 0 ? (
            <p className={styles.emptyStages}>
              {isAdmin && isModifiable
                ? 'Aucune étape pour l’instant. Cliquez sur la carte ou utilisez le menu ⋮ pour en ajouter une.'
                : 'Aucune étape pour ce voyage.'}
            </p>
          ) : (
            <div className={styles.timeline}>
              {stages.map((stage, index) => (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  nextStage={stages[index + 1]}
                  visits={visitsByStage.get(stage.id) ?? []}
                  dateRange={stageDateRanges[stage.id]}
                  active={selectedStageId === stage.id}
                  canReorder={!!isAdmin && isModifiable}
                  travelLeg={travelLegs.find((leg) => leg.fromStageID === stage.id && leg.toStageID === stages[index + 1]?.id)}
                  canEditTravelLegs={canEditDetail}
                  onStageClick={handleStageClick}
                  onVisitClick={handleVisitClickFromTimeline}
                  onTravelLegClick={handleTravelLegClick}
                  onTravelLegCreate={handleTravelLegCreate}
                />
              ))}
            </div>
          )}
        </div>
          </>
        }
        visitDetail={selectedTravelLeg ? (
          <TravelLegDetail
            travelLeg={selectedTravelLeg}
            canEdit={canEditDetail}
            onClose={handleDetailClose}
            onBack={handleBackToTimeline}
            onEdit={() => setTravelLegForm({
              fromStageID: selectedTravelLeg.fromStageID,
              toStageID: selectedTravelLeg.toStageID,
              travelLeg: selectedTravelLeg,
            })}
            mediaTargets={mediaTargets}
          />
        ) : displayVisit && (
          <VisitDetail
            visit={displayVisit}
            canEdit={canEditDetail}
            onClose={handleDetailClose}
            onBack={handleBackToStage}
            onRequestDelete={requestVisitDelete}
            mediaTargets={mediaTargets}
          />
        )}
      />

      {/* ── Form panel (mode édition) ── */}
      {anyAutoForm && (
        <div className={styles.formPanelWrapper}>
          {autoTripForm && (
            <TripForm
              open
              panel
              onClose={() => {}}
              trip={trip}
              pendingCoords={pendingStageCoords}
              actions={tripFormActions}
              coverChoices={coverChoices}
            />
          )}
          {autoStageForm && selectedStage && (
            <StageForm
              key={selectedStage.id}
              open
              panel
              onClose={handleDetailClose}
              tripID={id!}
              stage={selectedStage}
              pendingCoords={pendingStageCoords}
              actions={stageFormActions}
              onRecalculationWarning={setRecalculationNotice}
            />
          )}
          {autoVisitForm && selectedVisit && effectiveVisitStageId && (
            <VisitForm
              key={`${effectiveVisitStageId}-${selectedVisit.id}`}
              open
              panel
              onClose={handleBackToStage}
              tripID={id!}
              stageID={effectiveVisitStageId}
              visit={selectedVisit}
              pendingCoords={pendingVisitCoords}
              actions={visitFormActions}
              onSubmitWithResolution={(submission) => submitVisitWithResolution(submission, handleBackToStage)}
              mediaTargets={mediaTargets}
            />
          )}
          {travelLegForm && (
            <TravelLegForm
              key={travelLegForm.travelLeg?.id ?? `${travelLegForm.fromStageID}-${travelLegForm.toStageID}`}
              open
              panel
              tripID={id!}
              fromStageID={travelLegForm.fromStageID}
              toStageID={travelLegForm.toStageID}
              travelLeg={travelLegForm.travelLeg}
              onClose={closeTravelLegForm}
              onSaved={handleTravelLegSaved}
              mediaTargets={mediaTargets}
            />
          )}
        </div>
      )}

      {/* ── Carte droite ── */}
      <div className={styles.mapArea}>
        {stages.length > 0 || canEditMarkers ? (
          <TripMap
            stages={stages}
            travelLegs={travelLegs}
            activeStageId={selectedStageId}
            activeStageVisits={activeStageVisits}
            stageDateRanges={stageDateRanges}
            onStageClick={handleStageClick}
            onVisitClick={handleVisitClickFromTimeline}
            onTravelLegClick={handleTravelLegClick}
            onTravelLegCreate={handleTravelLegCreate}
            placementMode={placementMode}
            pendingCoords={pendingMapCoords}
            onMapClick={handleMapClick}
            canEditMarkers={canEditMarkers}
            canEditTravelLegs={canEditDetail}
            onStageDragEnd={canEditMarkers ? handleStageDragEnd : undefined}
            onVisitDragEnd={canEditMarkers ? handleVisitDragEnd : undefined}
            panTarget={panTarget}
            mobileSheetLayout={!anyAutoForm}
          />
        ) : (
          !detailFetching && <div className={styles.emptyMap}>Aucune étape pour ce voyage.</div>
        )}
      </div>

    </div>

    {isAdmin && (
      <>
        {/* Create forms (opened via map click) — rendered as drawers */}
        <StageForm
          open={stageFormOpen}
          onClose={closeStageForm}
          tripID={id!}
          pendingCoords={pendingStageCoords}
          noBackdrop
        />
        {visitFormStageId && (
          <VisitForm
            key={visitFormStageId}
            open={visitFormOpen}
            onClose={closeVisitForm}
            tripID={id!}
            stageID={visitFormStageId}
            pendingCoords={pendingVisitCoords}
            noBackdrop
            onSubmitWithResolution={(submission) => submitVisitWithResolution(submission, closeVisitForm)}
          />
        )}
        <ConfirmModal
          open={confirmDelete}
          title="Supprimer ce voyage ?"
          message={deleteError ?? 'Toutes les étapes et toutes les visites associées seront définitivement perdues.'}
          confirmLabel="Supprimer"
          danger
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => { setConfirmDelete(false); setDeleteError(null); }}
        />
        <TravelLegResolutionDialog
          open={!!resolutionRequest}
          legs={resolutionRequest?.legs ?? []}
          pairs={resolutionRequest?.pairs ?? []}
          stageNames={stageNames}
          busy={resolving}
          error={resolutionError}
          onConfirm={confirmResolution}
          onCancel={() => { if (!resolving) { setResolutionRequest(null); setResolutionError(null); } }}
        />
      </>
    )}
    </>
  );
}

interface StageSectionProps {
  stage: Stage;
  nextStage?: Stage;
  visits: Visit[];
  dateRange?: { start: string; end: string };
  active: boolean;
  canReorder: boolean;
  travelLeg?: TravelLeg;
  canEditTravelLegs: boolean;
  onStageClick: (stageId: string) => void;
  onVisitClick: (stageId: string, visit: Visit) => void;
  onTravelLegClick: (travelLegID: string) => void;
  onTravelLegCreate: (fromStageID: string, toStageID: string) => void;
}

function StageSection({
  stage,
  nextStage,
  visits,
  dateRange,
  active,
  canReorder,
  travelLeg,
  canEditTravelLegs,
  onStageClick,
  onVisitClick,
  onTravelLegClick,
  onTravelLegCreate,
}: StageSectionProps) {
  // Memoized so each group's `visits` array keeps a stable reference across
  // re-renders unrelated to this data (form open/close, other stages' drags,
  // etc.) — SameDateVisitGroup relies on that stability to detect real data
  // changes and not wipe an in-flight optimistic reorder.
  const dateGroups = useMemo(() => {
    // COR-008 : une visite multi-étapes n'est affichée que dans son étape principale (premier stageID)
    const primaryVisits = visits.filter((visit) => visit.stageIDs[0] === stage.id);

    // Visits are already sorted by (date, position) by the backend, so
    // consecutive same-date visits form one contiguous, reorderable group.
    const groups: { date: string; visits: Visit[] }[] = [];
    for (const visit of primaryVisits) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === visit.date) {
        lastGroup.visits.push(visit);
      } else {
        groups.push({ date: visit.date, visits: [visit] });
      }
    }
    return groups;
  }, [visits, stage.id]);

  return (
    <div id={`stage-${stage.id}`} className={styles.timelineGroup}>
      <button
        className={`${styles.stageDivider} ${active ? styles.stageDividerActive : ''}`}
        onClick={() => onStageClick(stage.id)}
      >
        <span className={styles.stageDividerName}>{stage.displayName}</span>
        <span className={styles.stageDividerMeta}>
          {stage.city}
          {dateRange &&
            (dateRange.start === dateRange.end
              ? ` · ${formatDate(dateRange.start)}`
              : ` · ${formatDate(dateRange.start)} — ${formatDate(dateRange.end)}`)}
        </span>
      </button>
      <div className={styles.stageContentRow}>
        <div className={styles.stageVisits}>
          {dateGroups.map((group) => (
            <SameDateVisitGroup
              key={group.date}
              stageId={stage.id}
              date={group.date}
              visits={group.visits}
              canReorder={canReorder}
              onVisitClick={(visit) => onVisitClick(stage.id, visit)}
            />
          ))}
        </div>
        {nextStage && (travelLeg || canEditTravelLegs) && (
          <button
            type="button"
            className={`${styles.travelLegBoundary} ${travelLeg ? '' : styles.travelLegBoundaryCreate}`}
            aria-label={travelLeg
              ? `${transportLabel(travelLeg.transport)} de ${stage.displayName} à ${nextStage.displayName}`
              : `Ajouter un trajet de ${stage.displayName} à ${nextStage.displayName}`}
            onClick={() => {
              if (travelLeg) onTravelLegClick(travelLeg.id);
              else onTravelLegCreate(stage.id, nextStage.id);
            }}
          >
            <span className={styles.travelLegIcon} aria-hidden="true">
              {travelLeg ? <TransportIcon transport={travelLeg.transport} /> : '+'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

interface SameDateVisitGroupProps {
  stageId: string;
  date: string;
  visits: Visit[];
  canReorder: boolean;
  onVisitClick: (visit: Visit) => void;
}

function SameDateVisitGroup({ stageId, date, visits, canReorder, onVisitClick }: SameDateVisitGroupProps) {
  const [localVisits, setLocalVisits] = useState<Visit[] | null>(null);
  const [, reorderVisits] = useReorderVisits();

  const items = localVisits ?? visits;
  // Nothing to reorder against when a day has a single visit — dnd-kit would
  // still let it be picked up and dropped onto another day's group, which
  // silently no-ops (cross-day reorder is out of scope) and reads as
  // "drag-and-drop doesn't work" rather than "nothing to reorder".
  const canDrag = canReorder && items.length > 1;

  // Reset local state once fresh data (post-mutation refetch) arrives.
  const prevVisitsRef = useRef(visits);
  if (visits !== prevVisitsRef.current) { // eslint-disable-line react-hooks/refs
    prevVisitsRef.current = visits; // eslint-disable-line react-hooks/refs
    setLocalVisits(null);
  }

  // Require a small movement before a press counts as a drag, so a plain
  // click still opens the visit detail panel instead of being swallowed.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceIndex = items.findIndex((v) => v.id === active.id);
    const targetIndex = items.findIndex((v) => v.id === over.id);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = arrayMove(items, sourceIndex, targetIndex);

    // Optimistic update.
    setLocalVisits(reordered);

    const result = await reorderVisits(
      { stageID: stageId, date, visitIDs: reordered.map((v) => v.id) },
      { additionalTypenames: ['Visit'] },
    );
    if (result.error || (result.data?.reorderVisits.errors ?? []).length > 0) {
      setLocalVisits(null); // Revert on error.
    }
  }, [items, reorderVisits, stageId, date]);

  if (!canDrag) {
    return (
      <>
        {items.map((visit) => (
          <VisitRow key={visit.id} visit={visit} onClick={() => onVisitClick(visit)} />
        ))}
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((v) => v.id)} strategy={verticalListSortingStrategy}>
        {items.map((visit) => (
          <SortableVisitRow key={visit.id} visit={visit} onClick={() => onVisitClick(visit)} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableVisitRow({ visit, onClick }: { visit: Visit; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: visit.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <VisitRow visit={visit} onClick={onClick} />
    </div>
  );
}

function VisitRow({ visit, onClick }: { visit: Visit; onClick: () => void }) {
  return (
    <button className={styles.visitRow} onClick={onClick}>
      <div className={styles.visitMeta}>
        <span className={styles.visitLabel}>Visite</span>
        <span className={styles.visitDate}>{formatDate(visit.date)}</span>
      </div>
      <div className={styles.visitInfo}>
        <p className={styles.visitTitle}>{visit.title ?? visit.date}</p>
      </div>
    </button>
  );
}
