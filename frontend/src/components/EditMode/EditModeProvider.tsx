import { useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { EditModeContext } from './editModeContext';
import { MOBILE_QUERY } from '../../lib/viewport';

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const toggleEditMode = useCallback(() => setEditMode((v) => !v), []);
  const value = useMemo(() => ({ editMode, toggleEditMode }), [editMode, toggleEditMode]);

  // The toggle is hidden on mobile (consultation only): if the viewport
  // crosses into mobile while edit mode is on, the state would become
  // uncontrollable — force it off instead.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setEditMode(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}
