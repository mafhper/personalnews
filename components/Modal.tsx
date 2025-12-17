
import React from 'react';
import { useFocusManagement } from '../hooks/useFocusManagement';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    initialFocus?: string;
    ariaLabelledBy?: string;
    ariaLabel?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, initialFocus, ariaLabelledBy, ariaLabel, size }) => {
    const { containerRef, restoreFocus } = useFocusManagement(isOpen, {
        trapFocus: true,
        restoreFocus: true,
        initialFocus: initialFocus || 'button',
        onEscape: onClose
    });

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        '6xl': 'lg:max-w-6xl',
        '7xl': 'xl:max-w-7xl',
        full: 'max-w-full',
    };

    const modalSizeClass = size ? sizeClasses[size] : 'max-w-sm sm:max-w-2xl lg:max-w-6xl xl:max-w-7xl'; // Default to existing responsive sizes if no size prop

    // Handle modal close with focus restoration
    const handleClose = () => {
        restoreFocus();
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabel}
        >
            <div
                ref={containerRef}
                className={`bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 m-4 w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-in fade-in zoom-in-95 relative ${modalSizeClass}`}
                onClick={(e) => e.stopPropagation()}
                role="document"
            >
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/15 hover:border-white/20 transition-all duration-200 group"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {children}
            </div>
        </div>
    );
};
