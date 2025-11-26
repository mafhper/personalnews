import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;

  onClick?: () => void;
  isClickable?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 

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

  const backgroundClasses = '';

  const LogoImage = () => (
    <img 
      src={`${import.meta.env.BASE_URL}assets/logo.svg`}
      alt="Personal News Logo" 
      className="w-full h-full object-contain"
    />
  );

  return (
    <div 
      className={`${sizeClasses[size]} ${backgroundClasses} flex items-center justify-center ${className} ${baseClasses}`}
      onClick={onClick}
      title={isClickable ? "Ir para a página inicial" : undefined}
    >
      <LogoImage />
    </div>
  );
};

export default Logo;