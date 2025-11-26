import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBackground?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showBackground = true,
  onClick,
  isClickable = false
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6', // 24px - small size
    md: 'w-7 h-7', // 28px - matches title height (text-xl)
    lg: 'w-16 h-16' // 64px - large size
  };

  const baseClasses = isClickable 
    ? 'cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg' 
    : '';

  const backgroundClasses = isClickable
    ? 'bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700'
    : 'bg-gradient-to-br from-gray-600 to-gray-800';

  const LogoImage = () => (
    <img 
      src={`${import.meta.env.BASE_URL}assets/logo.svg`}
      alt="Personal News Logo" 
      className="w-full h-full object-contain"
    />
  );

  if (!showBackground) {
    if (isClickable) {
      return (
        <div 
          className={`${sizeClasses[size]} ${className} ${baseClasses}`}
          onClick={onClick}
          title="Ir para a página inicial"
        >
          <LogoImage />
        </div>
      );
    }

    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <LogoImage />
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${backgroundClasses} flex items-center justify-center p-1 ${className} ${baseClasses}`}
      onClick={onClick}
      title={isClickable ? "Ir para a página inicial" : undefined}
    >
      <LogoImage />
    </div>
  );
};

export default Logo;