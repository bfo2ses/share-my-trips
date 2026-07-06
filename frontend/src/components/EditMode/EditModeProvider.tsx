import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { EditModeContext } from './editModeContext';

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const toggleEditMode = useCallback(() => setEditMode((v) => !v), []);
  const value = useMemo(() => ({ editMode, toggleEditMode }), [editMode, toggleEditMode]);

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}
