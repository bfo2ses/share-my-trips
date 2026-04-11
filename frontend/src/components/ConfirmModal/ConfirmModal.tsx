import { useEffect, useId, useRef } from 'react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Latest-ref pattern for handlers consumed by document-level listeners and
  // the backdrop onClick (which has no `disabled` safety net). Button onClicks
  // rely on `disabled={busy}` instead; see the inline comment below.
  // The mirrors are written in an effect (not during render) per the project's
  // react-hooks/refs lint rule.
  const onCancelRef = useRef(onCancel);
  const busyRef = useRef(busy);
  useEffect(() => {
    onCancelRef.current = onCancel;
    busyRef.current = busy;
  });

  // Escape cancels (unless busy). Focus management on open/close.
  // Focus trap: simple Tab/Shift+Tab cycling between Cancel and Confirm.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus({ preventScroll: true });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (busyRef.current) return;
        onCancelRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const cancel = cancelRef.current;
        const confirm = confirmRef.current;
        if (!cancel || !confirm) return;
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === cancel || !active || !cancel.contains(active)) {
            e.preventDefault();
            confirm.focus({ preventScroll: true });
          }
        } else {
          if (active === confirm) {
            e.preventDefault();
            cancel.focus({ preventScroll: true });
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const prev = previouslyFocused.current;
      if (prev && document.contains(prev)) {
        prev.focus?.({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) return null;

  function handleBackdrop() {
    if (busyRef.current) return;
    onCancelRef.current();
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h3 id={titleId} className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          {/* Button paths are gated by `disabled={busy}`; keyboard + backdrop
              paths are gated via busyRef in the handlers above. */}
          <button ref={cancelRef} type="button" className={styles.btn} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`${styles.btn} ${danger ? styles.btnDanger : styles.btnPrimary}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'En cours…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
