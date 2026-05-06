
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
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    tone?: 'default' | 'warning' | 'danger' | 'technical' | 'selection';
    closeOnOverlay?: boolean;
    showCloseButton?: boolean;
    zIndexClass?: string;
    contentClassName?: string;
    bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    initialFocus,
    ariaLabelledBy,
    ariaLabel,
    size,
    title,
    description,
    footer,
    tone = 'default',
    closeOnOverlay = true,
    showCloseButton = true,
    zIndexClass = 'z-50',
    contentClassName = '',
    bodyClassName = '',
}) => {
    const generatedTitleId = React.useId();
    const titleId = ariaLabelledBy || (title ? generatedTitleId : undefined);
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
    const toneClasses = {
        default: 'border-[rgb(var(--color-border))]/30',
        warning: 'border-[rgba(var(--color-warning),0.42)]',
        danger: 'border-[rgba(var(--color-error),0.42)]',
        technical: 'border-[rgba(var(--color-accent),0.28)]',
        selection: 'border-[rgba(var(--color-accent),0.32)]',
    };

    // Handle modal close with focus restoration
    const handleClose = () => {
        restoreFocus();
        onClose();
    };

    // Lock body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center ${zIndexClass} transition-all duration-300`}
            onClick={closeOnOverlay ? handleClose : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-label={ariaLabel}
        >
            <div
                ref={containerRef}
                className={`bg-[rgb(var(--theme-manager-surface,var(--color-surface)))]/95 text-[rgb(var(--theme-manager-text,var(--color-text)))] backdrop-blur-xl border ${toneClasses[tone]} shadow-2xl overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95 relative ${modalSizeClass} ${size === 'full' ? 'h-full w-full m-0 p-0 rounded-none border-none' : 'rounded-2xl m-4 max-h-[90vh]'} ${contentClassName}`}
                onClick={(e) => e.stopPropagation()}
                role="document"
            >
                {showCloseButton && size !== 'full' && (
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-[rgb(var(--color-surface))]/70 border border-[rgb(var(--color-border))]/30 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))]/90 hover:border-[rgb(var(--color-border))]/50 transition-all duration-200 group z-10"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {(title || description) && (
                    <div className="border-b border-[rgba(var(--color-border),0.15)] px-5 py-4 pr-14">
                        {title && (
                            <h2
                                id={titleId}
                                className="text-base font-bold text-[rgb(var(--theme-manager-text,var(--color-text)))]"
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-1 text-sm text-[rgb(var(--theme-manager-text-secondary,var(--color-textSecondary)))]">
                                {description}
                            </p>
                        )}
                    </div>
                )}
                <div className={`custom-scrollbar ${title || description || footer ? 'overflow-y-auto p-5' : 'overflow-y-auto p-4 sm:p-6 lg:p-8'} ${size === 'full' ? 'h-full' : 'max-h-[calc(90vh-8rem)]'} ${bodyClassName}`}>
                    {children}
                </div>
                {footer && (
                    <div className="border-t border-[rgba(var(--color-border),0.15)] px-5 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
