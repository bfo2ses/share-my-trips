import { createContext } from 'react';

interface EditModeContextValue {
  editMode: boolean;
  toggleEditMode: () => void;
}

export const EditModeContext = createContext<EditModeContextValue>({
  editMode: false,
  toggleEditMode: () => {},
});
