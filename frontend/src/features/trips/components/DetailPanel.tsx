import { useState, useCallback } from 'react';
import { useDeleteStage } from '../../stages/hooks/useStageMutations';
import { useDeleteDay } from '../../stages/hooks/useDayMutations';
import { useDayMedia } from '../../media/hooks/useMediaQueries';
import { MediaGallery } from '../../media/components/MediaGallery';
import { MediaUploader } from '../../media/components/MediaUploader';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import type { StagesQuery, DaysQuery } from '../../../graphql/generated/graphql';
import styles from './DetailPanel.module.css';

type Stage = StagesQuery['stages'][number];
type Day = DaysQuery['days'][number];

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface EditCallbacks {
  onEditStage: (stage: Stage) => void;
  onAddDay: (stageId: string) => void;
  onEditDay: (stageId: string, day: Day) => void;
}

type DetailPanelProps = {
  stage: Stage | null;
  stageDays: Day[];
  day: Day | null;
  open: boolean;
  onClose: () => void;
  onDayClick: (day: Day) => void;
  onBackToStage: () => void;
} & ({ canEdit: false } | ({ canEdit: true } & EditCallbacks));

export function DetailPanel(props: DetailPanelProps) {
  const { stage, stageDays, day, open, onClose, onDayClick, onBackToStage } = props;

  return (
    <div className={`${styles.panelWrapper} ${open ? styles.panelOpen : ''}`}>
      <aside className={styles.panel}>
        {day && stage ? (
          props.canEdit ? (
            <DayDetail
              day={day}
              stage={stage}
              onClose={onClose}
              onBack={onBackToStage}
              canEdit
              onEdit={props.onEditDay}
            />
          ) : (
            <DayDetail
              day={day}
              stage={stage}
              onClose={onClose}
              onBack={onBackToStage}
              canEdit={false}
            />
          )
        ) : stage ? (
          props.canEdit ? (
            <StageDetail
              stage={stage}
              days={stageDays}
              onClose={onClose}
              onDayClick={onDayClick}
              canEdit
              onEditStage={props.onEditStage}
              onAddDay={props.onAddDay}
            />
          ) : (
            <StageDetail
              stage={stage}
              days={stageDays}
              onClose={onClose}
              onDayClick={onDayClick}
              canEdit={false}
            />
          )
        ) : null}
      </aside>
    </div>
  );
}

type StageDetailProps = {
  stage: Stage;
  days: Day[];
  onClose: () => void;
  onDayClick: (day: Day) => void;
} & (
  | { canEdit: false }
  | {
      canEdit: true;
      onEditStage: (stage: Stage) => void;
      onAddDay: (stageId: string) => void;
    }
);

function StageDetail(props: StageDetailProps) {
  const { stage, days, onClose, onDayClick } = props;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, deleteStage] = useDeleteStage();

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteStage({ id: stage.id }, { additionalTypenames: ['Stage', 'Day'] });
    if (result.error || !result.data?.deleteStage.success) {
      setDeleting(false);
      setDeleteError('Impossible de supprimer l’étape. Réessayez.');
      return;
    }
    // Parent unmounts this component, no need to reset local state.
    onClose();
  }

  const menuItems: ActionMenuItem[] = props.canEdit
    ? [
        { label: 'Modifier', onClick: () => props.onEditStage(stage) },
        { label: 'Ajouter un jour', onClick: () => props.onAddDay(stage.id) },
        { label: 'Supprimer', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.label}>{stage.city}</p>
          <h3 className={styles.title}>{stage.displayName}</h3>
        </div>
        {menuItems.length > 0 && (
          <ActionMenu items={menuItems} ariaLabel="Actions sur l’étape" />
        )}
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className={styles.body}>
        {stage.description && (
          <p className={styles.description}>{stage.description}</p>
        )}

        {days.length === 0 ? (
          <p className={styles.muted}>
            {props.canEdit
              ? 'Aucun jour pour cette étape. Utilisez le menu ⋮ pour en ajouter un.'
              : 'Aucun jour pour cette étape.'}
          </p>
        ) : (
          <div className={styles.dayList}>
            {days.map((day) => (
              <button
                key={day.id}
                className={styles.dayItem}
                onClick={() => onDayClick(day)}
              >
                <span className={styles.dayDate}>{formatShortDate(day.date)}</span>
                <span className={styles.dayTitle}>{day.title ?? day.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer cette étape ?"
        message={deleteError ?? 'Les jours rattachés à cette étape seront également supprimés.'}
        confirmLabel="Supprimer"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleteError(null); }}
      />
    </>
  );
}

type DayDetailProps = {
  day: Day;
  stage: Stage;
  onClose: () => void;
  onBack: () => void;
} & (
  | { canEdit: false }
  | {
      canEdit: true;
      onEdit: (stageId: string, day: Day) => void;
    }
);

function DayDetail(props: DayDetailProps) {
  const { day, stage, onClose, onBack } = props;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, deleteDay] = useDeleteDay();
  const [{ data: mediaData }, reexecuteMedia] = useDayMedia(day.id);
  const media = mediaData?.dayMedia ?? [];
  const refetchMedia = useCallback(() => reexecuteMedia({ requestPolicy: 'network-only' }), [reexecuteMedia]);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteDay({ id: day.id }, { additionalTypenames: ['Day'] });
    if (result.error || !result.data?.deleteDay.success) {
      setDeleting(false);
      setDeleteError('Impossible de supprimer ce jour. Réessayez.');
      return;
    }
    // Parent unmounts this component, no need to reset local state.
    onBack();
  }

  const menuItems: ActionMenuItem[] = props.canEdit
    ? [
        { label: 'Modifier', onClick: () => props.onEdit(stage.id, day) },
        { label: 'Supprimer', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <button className={styles.back} onClick={onBack}>← Retour à l'étape</button>
          <p className={styles.label}>{formatFullDate(day.date)}</p>
          <h3 className={styles.title}>{day.title ?? day.date}</h3>
        </div>
        {menuItems.length > 0 && (
          <ActionMenu items={menuItems} ariaLabel="Actions sur le jour" />
        )}
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className={styles.body}>
        {day.description ? (
          <p className={styles.description}>{day.description}</p>
        ) : (
          <p className={styles.muted} style={{ fontStyle: 'italic' }}>Aucune description pour ce jour.</p>
        )}

        <MediaGallery media={media} isAdmin={props.canEdit} onDeleted={refetchMedia} />

        {props.canEdit && (
          <MediaUploader dayID={day.id} tripID={day.tripID} onUploadComplete={refetchMedia} />
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce jour ?"
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
