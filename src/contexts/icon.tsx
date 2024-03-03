import {ReactNode, createContext, useContext} from 'react';

type Icons = 'ex' | 'b';
const IconContext = createContext<{[key in Icons]?: ReactNode}>({});

export const IconProvider = IconContext.Provider;

export function useIconContext() {
  return useContext(IconContext);
}
