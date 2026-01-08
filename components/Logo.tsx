import React from 'react';
import DOMPurify from 'dompurify';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
  customSrc?: string | null;
  useThemeColor?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  onClick,
  isClickable = false,
  customSrc,
  useThemeColor = false
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

  return (
    <div 
      className={`${sizeClasses[size]} ${backgroundClasses} flex items-center justify-center ${className} ${baseClasses}`}
      onClick={onClick}
      title={isClickable ? "Ir para a página inicial" : undefined}
    >
      <LogoImage customSrc={customSrc} useThemeColor={useThemeColor} />
    </div>
  );
};

const LogoImage: React.FC<{ customSrc?: string | null; useThemeColor: boolean }> = ({ customSrc, useThemeColor }) => {
  if (customSrc?.trim().startsWith('<svg')) {
    const sanitizedSvg = DOMPurify.sanitize(customSrc, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'], // Allow <use> tags if needed for icons
      ADD_ATTR: ['href', 'xlink:href'] // Allow href attributes
    });

    return (
      <div 
        className={`w-full h-full [&>svg]:w-full [&>svg]:h-full ${useThemeColor ? 'text-[rgb(var(--color-accent))] [&>svg]:fill-current [&>svg_path]:fill-current' : ''}`}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }} 
      />
    );
  }
  
  const src = customSrc || `${import.meta.env.BASE_URL}assets/logo.svg`;

  if (useThemeColor) {
    return (
      <div 
        className="w-full h-full bg-[rgb(var(--color-accent))]"
        style={{
          maskImage: `url(${src})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }

  return (
    <img 
      src={src}
      alt="Personal News Logo" 
      className="w-full h-full object-contain"
    />
  );
};

export default Logo;