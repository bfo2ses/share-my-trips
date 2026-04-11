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
  defaultCoords?: { lat: number; lng: number } | null;
}

export function DayForm({ open, onClose, tripID, stageID, day, defaultCoords }: DayFormProps) {
  return (
    <>
      {open && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        {open && <DayFormContent tripID={tripID} stageID={stageID} day={day} defaultCoords={defaultCoords} onClose={onClose} />}
      </aside>
    </>
  );
}

function DayFormContent({ tripID, stageID, day, defaultCoords, onClose }: { tripID: string; stageID: string; day?: DayData | null; defaultCoords?: { lat: number; lng: number } | null; onClose: () => void }) {
  const isEdit = !!day;

  const [date, setDate] = useState(day?.date ?? '');
  const [title, setTitle] = useState(day?.title ?? '');
  const [description, setDescription] = useState(day?.description ?? '');
  const [lat, setLat] = useState(day?.lat?.toString() ?? defaultCoords?.lat?.toString() ?? '');
  const [lng, setLng] = useState(day?.lng?.toString() ?? defaultCoords?.lng?.toString() ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const [, addDay] = useAddDay();
  const [, updateDay] = useUpdateDay();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setErrors(['Les coordonnées GPS doivent être des nombres valides.']);
      return;
    }

    const context = { additionalTypenames: ['Day'] };

    if (isEdit) {
      const result = await updateDay({
        id: day!.id,
        input: {
          title: title || undefined,
          description: description || undefined,
          lat: parsedLat,
          lng: parsedLng,
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
          lat: parsedLat,
          lng: parsedLng,
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
            disabled={isEdit}
          />
        </label>

        <label className={styles.label}>
          Titre
          <input className={styles.input} type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className={styles.label}>
          Description
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <div className={styles.coordRow}>
          <label className={styles.label}>
            Latitude *
            <input
              className={styles.input}
              type="text"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
              placeholder="64.1466"
            />
          </label>
          <label className={styles.label}>
            Longitude *
            <input
              className={styles.input}
              type="text"
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
              placeholder="-21.9426"
            />
          </label>
        </div>

        <button type="submit" className={styles.submit}>
          {isEdit ? 'Enregistrer' : 'Ajouter le jour'}
        </button>
      </form>
    </>
  );
}
