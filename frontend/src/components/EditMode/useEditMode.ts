import { useContext } from 'react';
import { EditModeContext } from './editModeContext';

export function useEditMode() {
  return useContext(EditModeContext);
}
