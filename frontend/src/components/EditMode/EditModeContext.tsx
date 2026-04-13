import { createContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

interface EditModeContextValue {
  editMode: boolean;
  toggleEditMode: () => void;
}

export const EditModeContext = createContext<EditModeContextValue>({
  editMode: false,
  toggleEditMode: () => {},
});

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
