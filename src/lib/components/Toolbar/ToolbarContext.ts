import {createContext, useContext} from 'react';

type ToolbarOrientation = 'horizontal' | 'vertical';

const ToolbarContext = createContext<ToolbarOrientation | undefined>(undefined);

export const ToolbarProvider = ToolbarContext.Provider;

/** Orientation of the owning toolbar; ToolbarSeparator mirrors it. */
export function useToolbarOrientation(): ToolbarOrientation {
  const orientation = useContext(ToolbarContext);
  return orientation ?? 'horizontal';
}
