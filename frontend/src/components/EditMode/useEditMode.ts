import { useContext } from 'react';
import { EditModeContext } from './EditModeContext';

export function useEditMode() {
  return useContext(EditModeContext);
}
