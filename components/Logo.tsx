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
    sm: 'w-8 h-8', // Adjusted for new logo aspect ratio
    md: 'w-10 h-10', 
    lg: 'w-16 h-16'
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
      className={`${sizeClasses[size]} ${backgroundClasses} rounded-lg flex items-center justify-center p-1 ${className} ${baseClasses}`}
      onClick={onClick}
      title={isClickable ? "Ir para a página inicial" : undefined}
    >
      <LogoImage />
    </div>
  );
};

export default Logo;