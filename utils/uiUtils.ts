export const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
  setter(true);
};

export const closeModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
  setter(false);
};

export const toggleModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
  setter(prev => !prev);
};