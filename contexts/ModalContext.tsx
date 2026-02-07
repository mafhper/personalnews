import React, { useState, ReactNode } from "react";
import { ModalContext } from "./ModalContextState";

export const ModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{ isModalOpen, setModalOpen: setIsModalOpen }}
    >
      {children}
    </ModalContext.Provider>
  );
};
