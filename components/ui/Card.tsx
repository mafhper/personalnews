import React from "react";

interface CardProps {
  children: React.ReactNode;
  elevation?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "glass" | "outline";
  className?: string;
  onClick?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

const elevationClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
};

const variantClasses = {
  default: "bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]",
  glass: "bg-gray-800/40 backdrop-blur-md border border-white/5 hover:border-white/10",
  outline: "bg-transparent border border-[rgb(var(--color-border))]",
};

export const Card: React.FC<CardProps> = ({
  children,
  elevation = "sm",
  padding = "md",
  variant = "default",
  className = "",
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const baseClasses = "rounded-xl transition-all duration-200";
  const elevationClass = elevationClasses[elevation];
  const paddingClass = paddingClasses[padding];
  const variantClass = variantClasses[variant];
  const hoverClass = onClick
    ? "hover:shadow-md hover:scale-[1.01] cursor-pointer"
    : "";

  const combinedClasses =
    `${baseClasses} ${variantClass} ${elevationClass} ${paddingClass} ${hoverClass} ${className}`.trim();

  return (
    <div
      className={combinedClasses}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
};
