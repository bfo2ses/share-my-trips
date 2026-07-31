import { useState, useCallback } from 'react';
import { useAddVisit, useUpdateVisit } from '../hooks/useVisitMutations';
import { useVisitMedia } from '../../media/hooks/useMediaQueries';
import { MediaGallery } from '../../media/components/MediaGallery';
import { MediaUploader } from '../../media/components/MediaUploader';
import type { FormAction } from '../../trips/components/TripForm';
import styles from './VisitForm.module.css';

interface VisitData {
  id: string;
  date: string;
  title?: string | null;
  description?: string | null;
  lat: number;
  lng: number;
}

interface VisitFormProps {
  open: boolean;
  onClose: () => void;
  tripID: string;
  stageID: string;
  visit?: VisitData | null;
  pendingCoords?: { lat: number; lng: number } | null;
  noBackdrop?: boolean;
  panel?: boolean;
  actions?: FormAction[];
}

export function VisitForm({ open, onClose, tripID, stageID, visit, pendingCoords, noBackdrop, panel, actions }: VisitFormProps) {
  return (
    <>
      {open && !noBackdrop && !panel && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.drawer} ${open ? styles.open : ''} ${panel ? styles.panel : ''}`}>
        {open && (
          <VisitFormContent
            tripID={tripID}
            stageID={stageID}
            visit={visit}
            pendingCoords={pendingCoords}
            onClose={onClose}
            panel={panel}
            actions={actions}
          />
        )}
      </aside>
    </>
  );
}

function VisitFormContent({
  tripID,
  stageID,
  visit,
  pendingCoords,
  onClose,
  panel,
  actions,
}: {
  tripID: string;
  stageID: string;
  visit?: VisitData | null;
  pendingCoords?: { lat: number; lng: number } | null;
  onClose: () => void;
  panel?: boolean;
  actions?: FormAction[];
}) {
  const isEdit = !!visit;

  const [date, setDate] = useState(visit?.date ?? '');
  const [title, setTitle] = useState(visit?.title ?? '');
  const [description, setDescription] = useState(visit?.description ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const [, addVisit] = useAddVisit();
  const [, updateVisit] = useUpdateVisit();

  // Media (only when editing an existing visit)
  const [{ data: mediaData }, reexecuteMedia] = useVisitMedia(visit?.id ?? '');
  const media = isEdit ? (mediaData?.visitMedia ?? []) : [];
  const refetchMedia = useCallback(() => reexecuteMedia({ requestPolicy: 'network-only' }), [reexecuteMedia]);

  // Live coords: pending from map click takes precedence over the existing visit.
  const lat = pendingCoords?.lat ?? visit?.lat ?? null;
  const lng = pendingCoords?.lng ?? visit?.lng ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    if (lat == null || lng == null) {
      setErrors(['Cliquez sur la carte pour placer la visite avant d’enregistrer.']);
      return;
    }

    const context = { additionalTypenames: ['Visit'] };

    if (isEdit) {
      const result = await updateVisit({
        id: visit!.id,
        input: {
          date: date !== visit!.date ? date : undefined,
          title: title || undefined,
          description: description || undefined,
          lat,
          lng,
        },
      }, context);
      if (result.error) {
        setErrors(['Une erreur est survenue.']);
        return;
      }
      const errs = result.data?.updateVisit.errors ?? [];
      if (errs.length > 0) {
        setErrors(errs.map((err) => err.message));
        return;
      }
    } else {
      const result = await addVisit({
        input: {
          tripID,
          stageID,
          date,
          title: title || undefined,
          description: description || undefined,
          lat,
          lng,
        },
      }, context);
      if (result.error) {
        setErrors(['Une erreur est survenue.']);
        return;
      }
      const errs = result.data?.addVisit.errors ?? [];
      if (errs.length > 0) {
        setErrors(errs.map((err) => err.message));
        return;
      }
    }

    onClose();
  }

  return (
    <>
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          {isEdit ? 'Modifier la visite' : 'Nouvelle visite'}
        </span>
        {!panel && (
          <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
        )}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className={styles.errors}>
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        )}

        <label className={styles.label}>
          Date *
          <input
            className={styles.input}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Titre
          <input className={styles.input} type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div className={styles.coordInfo}>
          {lat != null && lng != null ? (
            <p className={styles.coordText}>
              📍 {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          ) : (
            <p className={styles.coordHint}>
              Cliquez sur la carte pour placer la visite
            </p>
          )}
        </div>

        <label className={styles.label}>
          Description
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <button type="submit" className={styles.submit}>
          {isEdit ? 'Enregistrer' : 'Ajouter la visite'}
        </button>

        {isEdit && (
          <div className={styles.mediaSection}>
            <MediaGallery media={media} isAdmin onDeleted={refetchMedia} />
            <MediaUploader visitID={visit!.id} tripID={tripID} onUploadComplete={refetchMedia} />
          </div>
        )}

        {actions && actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.actionBtn} ${action.danger ? styles.actionDanger : ''}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </form>
    </>
  );
}
