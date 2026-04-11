import { useState, useRef, useEffect } from 'react';
import styles from './ActionMenu.module.css';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  ariaLabel?: string;
  align?: 'left' | 'right';
}

export function ActionMenu({ items, ariaLabel = 'Actions', align = 'right' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      // Scrollbar clicks land on the <html> element; ignore them so the menu
      // doesn't close when the user reaches for the scrollbar.
      if (e.target instanceof HTMLHtmlElement) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={open}
      >
        ⋮
      </button>

      {open && (
        <div className={`${styles.menu} ${align === 'left' ? styles.alignLeft : styles.alignRight}`}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`${styles.item} ${item.danger ? styles.itemDanger : ''}`}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
