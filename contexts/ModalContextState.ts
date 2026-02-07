import { createContext } from 'react';

export interface ModalContextType {
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
