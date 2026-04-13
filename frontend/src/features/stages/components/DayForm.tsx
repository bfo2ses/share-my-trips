import { useState } from 'react';
import { useAddDay, useUpdateDay } from '../hooks/useDayMutations';
import styles from './DayForm.module.css';

interface DayData {
  id: string;
  date: string;
  title?: string | null;
  description?: string | null;
  lat: number;
  lng: number;
}

interface DayFormProps {
  open: boolean;
  onClose: () => void;
  tripID: string;
  stageID: string;
  day?: DayData | null;
  pendingCoords?: { lat: number; lng: number } | null;
  noBackdrop?: boolean;
}

export function DayForm({ open, onClose, tripID, stageID, day, pendingCoords, noBackdrop }: DayFormProps) {
  return (
    <>
      {open && !noBackdrop && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        {open && (
          <DayFormContent
            tripID={tripID}
            stageID={stageID}
            day={day}
            pendingCoords={pendingCoords}
            onClose={onClose}
          />
        )}
      </aside>
    </>
  );
}

function DayFormContent({
  tripID,
  stageID,
  day,
  pendingCoords,
  onClose,
}: {
  tripID: string;
  stageID: string;
  day?: DayData | null;
  pendingCoords?: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const isEdit = !!day;

  const [date, setDate] = useState(day?.date ?? '');
  const [title, setTitle] = useState(day?.title ?? '');
  const [description, setDescription] = useState(day?.description ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const [, addDay] = useAddDay();
  const [, updateDay] = useUpdateDay();

  // Live coords: pending from map click takes precedence over the existing day.
  const lat = pendingCoords?.lat ?? day?.lat ?? null;
  const lng = pendingCoords?.lng ?? day?.lng ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    if (lat == null || lng == null) {
      setErrors(['Cliquez sur la carte pour placer le jour avant d\u2019enregistrer.']);
      return;
    }

    const context = { additionalTypenames: ['Day'] };

    if (isEdit) {
      const result = await updateDay({
        id: day!.id,
        input: {
          date: date !== day!.date ? date : undefined,
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
      const errs = result.data?.updateDay.errors ?? [];
      if (errs.length > 0) {
        setErrors(errs.map((err) => err.message));
        return;
      }
    } else {
      const result = await addDay({
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
      const errs = result.data?.addDay.errors ?? [];
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
          {isEdit ? 'Modifier le jour' : 'Nouveau jour'}
        </span>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
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
              Cliquez sur la carte pour placer le jour
            </p>
          )}
        </div>

        <label className={styles.label}>
          Description
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <button type="submit" className={styles.submit}>
          {isEdit ? 'Enregistrer' : 'Ajouter le jour'}
        </button>
      </form>
    </>
  );
}
