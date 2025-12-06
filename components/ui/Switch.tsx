import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, className = '', size = 'md' }) => {
  const sizes = {
    sm: {
      switch: 'h-5 w-9',
      dot: 'h-4 w-4',
      translate: 'translate-x-4'
    },
    md: {
      switch: 'h-6 w-11',
      dot: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'h-8 w-14',
      dot: 'h-7 w-7',
      translate: 'translate-x-6'
    }
  };

  const currentSize = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex ${currentSize.switch} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-offset-2
        ${checked ? 'bg-[rgb(var(--color-accent))]' : 'bg-gray-700'}
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block ${currentSize.dot} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? currentSize.translate : 'translate-x-0'}
        `}
      />
    </button>
  );
};
