import { useState } from 'react';
import { useAddStage, useUpdateStage } from '../hooks/useStageMutations';
import styles from './StageForm.module.css';

interface StageData {
  id: string;
  city: string;
  displayName: string;
  lat: number;
  lng: number;
  description: string;
}

interface StageFormProps {
  open: boolean;
  onClose: () => void;
  tripID: string;
  stage?: StageData | null;
  pendingCoords?: { lat: number; lng: number } | null;
  noBackdrop?: boolean;
}

export function StageForm({ open, onClose, tripID, stage, pendingCoords, noBackdrop }: StageFormProps) {
  return (
    <>
      {open && !noBackdrop && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        {open && (
          <StageFormContent
            tripID={tripID}
            stage={stage}
            pendingCoords={pendingCoords}
            onClose={onClose}
          />
        )}
      </aside>
    </>
  );
}

function StageFormContent({
  tripID,
  stage,
  pendingCoords,
  onClose,
}: {
  tripID: string;
  stage?: StageData | null;
  pendingCoords?: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const isEdit = !!stage;

  const [city, setCity] = useState(stage?.city ?? '');
  const [name, setName] = useState(isEdit && stage.displayName !== stage.city ? stage.displayName : '');
  const [description, setDescription] = useState(stage?.description ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const [, addStage] = useAddStage();
  const [, updateStage] = useUpdateStage();

  // Live coords: pending from map click takes precedence over the existing stage.
  const lat = pendingCoords?.lat ?? stage?.lat ?? null;
  const lng = pendingCoords?.lng ?? stage?.lng ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    if (lat == null || lng == null) {
      setErrors(['Cliquez sur la carte pour placer l\u2019étape avant d\u2019enregistrer.']);
      return;
    }

    const context = { additionalTypenames: ['Stage'] };

    if (isEdit) {
      const result = await updateStage({
        id: stage!.id,
        input: { city, name: name || undefined, lat, lng, description: description || undefined },
      }, context);
      if (result.error) {
        setErrors(['Une erreur est survenue.']);
        return;
      }
      const errs = result.data?.updateStage.errors ?? [];
      if (errs.length > 0) {
        setErrors(errs.map((err) => err.message));
        return;
      }
    } else {
      const result = await addStage({
        input: { tripID, city, name: name || undefined, lat, lng, description: description || undefined },
      }, context);
      if (result.error) {
        setErrors(['Une erreur est survenue.']);
        return;
      }
      const errs = result.data?.addStage.errors ?? [];
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
          {isEdit ? 'Modifier l\'étape' : 'Nouvelle étape'}
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
          Ville *
          <input className={styles.input} type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
        </label>

        <label className={styles.label}>
          Nom personnalisé
          <input
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={city || 'Nom affiché'}
          />
        </label>

        <div className={styles.coordInfo}>
          {lat != null && lng != null ? (
            <p className={styles.coordText}>
              📍 {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          ) : (
            <p className={styles.coordHint}>
              Cliquez sur la carte pour placer l&rsquo;étape
            </p>
          )}
        </div>

        <label className={styles.label}>
          Description
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <button type="submit" className={styles.submit}>
          {isEdit ? 'Enregistrer' : 'Ajouter l\'étape'}
        </button>
      </form>
    </>
  );
}
