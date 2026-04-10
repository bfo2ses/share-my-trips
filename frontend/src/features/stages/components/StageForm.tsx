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
}

export function StageForm({ open, onClose, tripID, stage }: StageFormProps) {
  return (
    <>
      {open && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        {open && <StageFormContent tripID={tripID} stage={stage} onClose={onClose} />}
      </aside>
    </>
  );
}

function StageFormContent({ tripID, stage, onClose }: { tripID: string; stage?: StageData | null; onClose: () => void }) {
  const isEdit = !!stage;

  const [city, setCity] = useState(stage?.city ?? '');
  const [name, setName] = useState(isEdit && stage.displayName !== stage.city ? stage.displayName : '');
  const [lat, setLat] = useState(stage?.lat?.toString() ?? '');
  const [lng, setLng] = useState(stage?.lng?.toString() ?? '');
  const [description, setDescription] = useState(stage?.description ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const [, addStage] = useAddStage();
  const [, updateStage] = useUpdateStage();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setErrors(['Les coordonnées GPS doivent être des nombres valides.']);
      return;
    }

    const context = { additionalTypenames: ['Stage'] };

    if (isEdit) {
      const result = await updateStage({
        id: stage!.id,
        input: { city, name: name || undefined, lat: parsedLat, lng: parsedLng, description: description || undefined },
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
        input: { tripID, city, name: name || undefined, lat: parsedLat, lng: parsedLng, description: description || undefined },
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
          <input className={styles.input} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={city || 'Nom affiché'} />
        </label>

        <div className={styles.coordRow}>
          <label className={styles.label}>
            Latitude *
            <input className={styles.input} type="text" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} required placeholder="64.1466" />
          </label>
          <label className={styles.label}>
            Longitude *
            <input className={styles.input} type="text" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} required placeholder="-21.9426" />
          </label>
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
