import { useEditMode } from './useEditMode';
import styles from './EditModeToggle.module.css';

export function EditModeToggle() {
  const { editMode, toggleEditMode } = useEditMode();

  return (
    <button
      className={`${styles.toggle} ${editMode ? styles.active : ''}`}
      onClick={toggleEditMode}
      aria-pressed={editMode}
      title={editMode ? 'Mode édition' : 'Mode lecture'}
    >
      <span className={styles.label}>{editMode ? 'Édition' : 'Lecture'}</span>
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </button>
  );
}
