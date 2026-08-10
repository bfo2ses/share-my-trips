import { useCallback, useRef, useState } from 'react';
import type { TravelLeg, TravelLegTransport } from '../../../graphql/generated/graphql';
import { MediaGallery } from '../../media/components/MediaGallery';
import { MediaUploader } from '../../media/components/MediaUploader';
import { useTravelLegMedia } from '../../media/hooks/useMediaQueries';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import { transportOptions } from '../transport';
import { useCalculateTravelLegDistance, useCreateTravelLeg, useDeleteTravelLeg, useUpdateTravelLeg } from '../hooks/useTravelLegMutations';
import styles from '../../stages/components/VisitForm.module.css';

export type TravelLegData = Pick<TravelLeg, 'id' | 'tripID' | 'fromStageID' | 'toStageID' | 'transport' | 'description' | 'distanceKm'>;

interface TravelLegFormProps {
  open: boolean;
  tripID: string;
  fromStageID: string;
  toStageID: string;
  travelLeg?: TravelLegData | null;
  onClose: () => void;
  onSaved?: (travelLeg: TravelLegData, created: boolean) => void;
  noBackdrop?: boolean;
  panel?: boolean;
}

export function TravelLegForm({ open, noBackdrop, panel, ...props }: TravelLegFormProps) {
  return (
    <>
      {open && !noBackdrop && !panel && <div className={styles.backdrop} onClick={props.onClose} aria-hidden="true" />}
      <aside className={`${styles.drawer} ${open ? styles.open : ''} ${panel ? styles.panel : ''}`}>
        {open && <TravelLegFormContent key={props.travelLeg?.id ?? `${props.fromStageID}-${props.toStageID}`} panel={panel} {...props} />}
      </aside>
    </>
  );
}

function TravelLegFormContent({
  tripID,
  fromStageID,
  toStageID,
  travelLeg,
  onClose,
  onSaved,
  panel,
}: Omit<TravelLegFormProps, 'open' | 'noBackdrop'>) {
  const isEdit = !!travelLeg;
  const [transport, setTransport] = useState<TravelLegTransport>(travelLeg?.transport ?? 'CAR');
  const [description, setDescription] = useState(travelLeg?.description ?? '');
  const [distance, setDistance] = useState(travelLeg?.distanceKm?.toString() ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculationMessage, setCalculationMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const distanceRef = useRef(distance);
  const transportRef = useRef(transport);

  const [, createTravelLeg] = useCreateTravelLeg();
  const [, updateTravelLeg] = useUpdateTravelLeg();
  const [, deleteTravelLeg] = useDeleteTravelLeg();
  const [, calculateDistance] = useCalculateTravelLegDistance();
  const [{ data: mediaData }, reexecuteMedia] = useTravelLegMedia(travelLeg?.id ?? '');
  const media = isEdit ? mediaData?.travelLegMedia ?? [] : [];
  const refetchMedia = useCallback(() => reexecuteMedia({ requestPolicy: 'network-only' }), [reexecuteMedia]);

  function updateDistance(value: string) {
    distanceRef.current = value;
    setDistance(value);
  }

  function updateTransport(value: TravelLegTransport) {
    transportRef.current = value;
    setTransport(value);
  }

  async function handleCalculate() {
    if (calculating || saving) return;
    setCalculating(true);
    setErrors([]);
    setCalculationMessage(null);
    const distanceAtStart = distanceRef.current;
    const transportAtStart = transportRef.current;
    const result = await calculateDistance({ fromStageID, toStageID, transport: transportAtStart });
    setCalculating(false);

    if (result.error) {
      setErrors(['Impossible de calculer la distance. Vous pouvez la saisir manuellement.']);
      return;
    }
    const payload = result.data?.calculateTravelLegDistance;
    if (!payload || payload.errors.length > 0 || payload.distanceKm == null) {
      setErrors(payload?.errors.map((error) => error.message) ?? ['Impossible de calculer la distance. Vous pouvez la saisir manuellement.']);
      return;
    }
    if (transportRef.current !== transportAtStart) {
      setCalculationMessage('Le moyen de transport a changé. Lancez un nouveau calcul si nécessaire.');
    } else if (distanceRef.current === distanceAtStart) {
      updateDistance(String(payload.distanceKm));
      setCalculationMessage('Distance calculée. Vous pouvez encore la modifier.');
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || calculating) return;
    setErrors([]);

    const distanceKm = distance.trim() === '' ? undefined : Number(distance);
    if (distanceKm != null && (!Number.isFinite(distanceKm) || distanceKm < 0)) {
      setErrors(['La distance doit être un nombre positif ou nul.']);
      return;
    }

    setSaving(true);
    const context = { additionalTypenames: ['TravelLeg'] };
    if (isEdit) {
      const result = await updateTravelLeg({
        id: travelLeg.id,
        input: { transport, description: description || undefined, distanceKm },
      }, context);
      setSaving(false);
      if (result.error) {
        setErrors(['Une erreur est survenue.']);
        return;
      }
      const payload = result.data?.updateTravelLeg;
      if (!payload || payload.errors.length > 0 || !payload.travelLeg) {
        setErrors(payload?.errors.map((error) => error.message) ?? ['Une erreur est survenue.']);
        return;
      }
      onSaved?.(payload.travelLeg, false);
      onClose();
      return;
    }

    const result = await createTravelLeg({
        input: { tripID, fromStageID, toStageID, transport, description: description || undefined, distanceKm },
    }, context);
    setSaving(false);

    if (result.error) {
      setErrors(['Une erreur est survenue.']);
      return;
    }
    const payload = result.data?.createTravelLeg;
    if (!payload || payload.errors.length > 0 || !payload.travelLeg) {
      setErrors(payload?.errors.map((error) => error.message) ?? ['Une erreur est survenue.']);
      return;
    }
    onSaved?.(payload.travelLeg, true);
    onClose();
  }

  async function handleDelete() {
    if (!travelLeg || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteTravelLeg({ id: travelLeg.id }, { additionalTypenames: ['TravelLeg'] });
    const payload = result.data?.deleteTravelLeg;
    if (result.error || !payload?.success || payload.errors.length > 0) {
      setDeleting(false);
      setDeleteError(payload?.errors.map((error) => error.message).join(' ') || 'Impossible de supprimer ce trajet. Réessayez.');
      return;
    }
    onClose();
  }

  return (
    <>
      <div className={styles.header}>
        <span className={styles.headerTitle}>{isEdit ? 'Modifier le trajet' : 'Nouveau trajet'}</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label={panel ? 'Annuler le trajet' : 'Fermer'}>✕</button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className={styles.errors} role="alert">
            {errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        )}

        <label className={styles.label}>
          Moyen de transport
          <select className={styles.input} value={transport} onChange={(event) => updateTransport(event.target.value as TravelLegTransport)}>
            {transportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className={styles.label}>
          Description
          <textarea className={styles.textarea} value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
        </label>

        <label className={styles.label}>
          Distance (km)
          <input
            className={styles.input}
            type="number"
            min="0"
            step="0.1"
            value={distance}
            onChange={(event) => updateDistance(event.target.value)}
          />
        </label>
        <button type="button" className={styles.actionBtn} onClick={handleCalculate} disabled={calculating || saving}>
          {calculating ? 'Calcul en cours…' : distance ? 'Recalculer la distance' : 'Calculer la distance'}
        </button>
        {calculationMessage && <p className={styles.coordText} role="status">{calculationMessage}</p>}

        <button type="submit" className={styles.submit} disabled={saving || calculating}>
          {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer le trajet' : 'Créer le trajet'}
        </button>

        {isEdit && (
          <>
            <div className={styles.mediaSection}>
              <MediaGallery media={media} owner={{ type: 'travelLeg', id: travelLeg.id }} isAdmin onDeleted={refetchMedia} />
              <MediaUploader owner={{ type: 'travelLeg', id: travelLeg.id }} tripID={tripID} onUploadComplete={refetchMedia} />
            </div>
            <div className={styles.actions}>
              <button type="button" className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => setConfirmDelete(true)}>
                Supprimer le trajet
              </button>
            </div>
          </>
        )}
      </form>
      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce trajet ?"
        message={deleteError ?? undefined}
        confirmLabel="Supprimer"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleteError(null); }}
      />
    </>
  );
}
