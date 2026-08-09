import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TravelLegResolutionAction } from '../../../graphql/generated/graphql';
import styles from '../../../components/ConfirmModal/ConfirmModal.module.css';

export type ResolutionLeg = {
  id: string;
  fromStageID: string;
  toStageID: string;
};

export type ResolutionPair = { fromStageID: string; toStageID: string };

export type TravelLegResolution = {
  travelLegID: string;
  action: TravelLegResolutionAction;
  fromStageID?: string;
  toStageID?: string;
};

interface TravelLegResolutionDialogProps {
  open: boolean;
  legs: ResolutionLeg[];
  pairs: ResolutionPair[];
  stageNames: Map<string, string>;
  busy?: boolean;
  error?: string | null;
  onConfirm: (plan: TravelLegResolution[]) => void;
  onCancel: () => void;
}

type Choice = { action: TravelLegResolutionAction; pairKey: string };

function pairKey(pair: ResolutionPair) {
  return `${pair.fromStageID}\u0000${pair.toStageID}`;
}

export function TravelLegResolutionDialog({
  open,
  legs,
  pairs,
  stageNames,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: TravelLegResolutionDialogProps) {
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [choicesFor, setChoicesFor] = useState('');
  const resolutionKey = open ? legs.map((leg) => leg.id).join('\u0000') : '';
  // A new invalidation is a new decision: reset the transient choices during
  // render, before the dialog is displayed, rather than scheduling a second
  // render from an effect.
  if (resolutionKey && choicesFor !== resolutionKey) {
    const initial: Record<string, Choice> = {};
    for (const leg of legs) initial[leg.id] = { action: 'DELETE', pairKey: '' };
    setChoicesFor(resolutionKey);
    setChoices(initial);
  }

  const pairsByKey = useMemo(() => new Map(pairs.map((pair) => [pairKey(pair), pair])), [pairs]);
  if (!open) return null;

  const complete = legs.every((leg) => {
    const choice = choices[leg.id];
    return choice && (choice.action === 'DELETE' || pairsByKey.has(choice.pairKey));
  });

  function submit() {
    if (!complete) return;
    onConfirm(legs.map((leg) => {
      const choice = choices[leg.id];
      const pair = pairsByKey.get(choice.pairKey);
      return choice.action === 'DELETE'
        ? { travelLegID: leg.id, action: 'DELETE' }
        : { travelLegID: leg.id, action: 'MOVE', fromStageID: pair?.fromStageID, toStageID: pair?.toStageID };
    }));
  }

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={() => !busy && onCancel()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="travel-leg-resolution-title" onClick={(event) => event.stopPropagation()}>
        <h3 id="travel-leg-resolution-title" className={styles.title}>Résoudre les trajets concernés</h3>
        <p className={styles.message}>Cette modification change l’ordre des étapes. Déplacez ou supprimez chaque trajet avant de continuer.</p>
        {legs.map((leg) => {
          const choice = choices[leg.id] ?? { action: 'DELETE' as const, pairKey: '' };
          return (
            <fieldset key={leg.id} disabled={busy} style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
              <legend className={styles.message} style={{ marginBottom: 6 }}>
                {stageNames.get(leg.fromStageID) ?? 'Étape'} → {stageNames.get(leg.toStageID) ?? 'Étape'}
              </legend>
              <label className={styles.message} style={{ display: 'block', marginBottom: 5 }}>
                <input type="radio" name={`resolution-${leg.id}`} checked={choice.action === 'DELETE'} onChange={() => setChoices((current) => ({ ...current, [leg.id]: { ...choice, action: 'DELETE' } }))} /> Supprimer le trajet
              </label>
              <label className={styles.message} style={{ display: 'block' }}>
                <input type="radio" name={`resolution-${leg.id}`} checked={choice.action === 'MOVE'} onChange={() => setChoices((current) => ({ ...current, [leg.id]: { ...choice, action: 'MOVE' } }))} /> Déplacer vers
                <select
                  aria-label="Nouvelle paire d’étapes"
                  value={choice.pairKey}
                  disabled={choice.action !== 'MOVE'}
                  onChange={(event) => setChoices((current) => ({ ...current, [leg.id]: { ...choice, pairKey: event.target.value } }))}
                  style={{ display: 'block', width: '100%', marginTop: 5 }}
                >
                  <option value="">Choisir un trajet</option>
                  {pairs.map((pair) => <option key={pairKey(pair)} value={pairKey(pair)}>{stageNames.get(pair.fromStageID) ?? 'Étape'} → {stageNames.get(pair.toStageID) ?? 'Étape'}</option>)}
                </select>
              </label>
            </fieldset>
          );
        })}
        {error && <p className={styles.message} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.btn} disabled={busy} onClick={onCancel}>Annuler</button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy || !complete} onClick={submit}>{busy ? 'En cours…' : 'Continuer'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
