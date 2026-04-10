import { useState } from 'react';
import { useCreateTrip, useUpdateTrip } from '../hooks/useTripMutations';
import styles from './TripForm.module.css';

interface TripData {
  id: string;
  title: string;
  country: string;
  description?: string | null;
  coverPhoto?: string | null;
  lat?: number | null;
  lng?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface TripFormProps {
  open: boolean;
  onClose: () => void;
  trip?: TripData | null;
  pendingCoords?: { lat: number; lng: number } | null;
  noBackdrop?: boolean;
}

export function TripForm({ open, onClose, trip, pendingCoords, noBackdrop }: TripFormProps) {
  return (
    <>
      {open && !noBackdrop && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        {open && <TripFormContent trip={trip} pendingCoords={pendingCoords} onClose={onClose} />}
      </aside>
    </>
  );
}

function TripFormContent({ trip, pendingCoords, onClose }: { trip?: TripData | null; pendingCoords?: { lat: number; lng: number } | null; onClose: () => void }) {
  const isEdit = !!trip;

  const [title, setTitle] = useState(trip?.title ?? '');
  const [country, setCountry] = useState(trip?.country ?? '');
  const [description, setDescription] = useState(trip?.description ?? '');
  const [startDate, setStartDate] = useState(trip?.startDate ?? '');
  const [endDate, setEndDate] = useState(trip?.endDate ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const [, createTrip] = useCreateTrip();
  const [, updateTrip] = useUpdateTrip();

  // Use pending coords from map click, or existing trip coords
  const lat = pendingCoords?.lat ?? trip?.lat ?? null;
  const lng = pendingCoords?.lng ?? trip?.lng ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const input = {
      title,
      country,
      description: description || undefined,
      coverPhoto: isEdit ? (trip!.coverPhoto || undefined) : undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    const context = { additionalTypenames: ['Trip'] };

    if (isEdit) {
      const result = await updateTrip({ id: trip!.id, input }, context);
      if (result.error) {
        setErrors(['Une erreur est survenue.']);
        return;
      }
      const errs = result.data?.updateTrip.errors ?? [];
      if (errs.length > 0) {
        setErrors(errs.map((err) => err.message));
        return;
      }
    } else {
      const result = await createTrip({ input }, context);
      if (result.error) {
        setErrors(['Une erreur est survenue.']);
        return;
      }
      const errs = result.data?.createTrip.errors ?? [];
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
          {isEdit ? 'Modifier le voyage' : 'Nouveau voyage'}
        </span>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className={styles.errors}>
            {errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        <label className={styles.label}>
          Titre *
          <input
            className={styles.input}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Pays *
          <input
            className={styles.input}
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Description
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>

        <div className={styles.coordInfo}>
          {lat != null && lng != null ? (
            <p className={styles.coordText}>
              📍 {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          ) : (
            <p className={styles.coordHint}>
              Cliquez sur la carte pour placer le voyage
            </p>
          )}
        </div>

        <div className={styles.dateRow}>
          <label className={styles.label}>
            Date de début
            <input
              className={styles.input}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Date de fin
            <input
              className={styles.input}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" className={styles.submit}>
          {isEdit ? 'Enregistrer' : 'Créer le voyage'}
        </button>
      </form>
    </>
  );
}
