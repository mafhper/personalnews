/**
 * ProgressIndicator.tsx
 *
 * Progress indicator components for feed loading and other async operations.
 * Provides visual feedback about loading progress and status.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  color?: "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

/**
 * Basic progress bar component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = "",
  showPercentage = false,
  color = "primary",
  size = "md",
  animated = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const colorClasses = {
    primary: "bg-[rgb(var(--color-accent))]",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`bg-gray-700 rounded-full ${sizeClasses[size]} overflow-hidden`}
      >
        <div
          className={`${colorClasses[color]} ${
            sizeClasses[size]
          } rounded-full transition-all duration-300 ${
            animated ? "ease-out" : ""
          }`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Loading progress: ${Math.round(clampedProgress)}%`}
        />
      </div>
      {showPercentage && (
        <div className="text-right text-sm text-gray-400 mt-1">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

interface FeedLoadingProgressProps {
  loadedFeeds: number;
  totalFeeds: number;
  progress: number;
  isBackgroundRefresh?: boolean;
  errors?: Array<{ url: string; error: string; feedTitle?: string }>;
  currentAction?: string;
  onCancel?: () => void;
  onRetryErrors?: () => void;
  className?: string;
  priorityFeedsLoaded?: boolean; // When true, show a more subtle progress indicator
}

/**
 * Specialized progress indicator for feed loading
 * Shows compact subtle version when priority feeds are loaded
 */
export const FeedLoadingProgress: React.FC<FeedLoadingProgressProps> = ({
  loadedFeeds,
  totalFeeds,
  progress,
  isBackgroundRefresh = false,
  errors = [],
  currentAction,
  onCancel,
  onRetryErrors,
  className = "",
  priorityFeedsLoaded = false,
}) => {
  const hasErrors = errors.length > 0;
  const isComplete = loadedFeeds >= totalFeeds;

  // Subtle compact version when priority feeds are loaded but still loading others
  if (priorityFeedsLoaded && !isComplete) {
    return (
      <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-white/10 backdrop-blur-sm shadow-lg">
          {/* Small spinner */}
          <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent border-[rgb(var(--color-accent))]/60" />
          
          {/* Compact text */}
          <span className="text-xs text-gray-400">
            {totalFeeds - loadedFeeds} remaining...
          </span>
          
          {/* Tiny progress bar */}
          <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[rgb(var(--color-accent))]/60 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Cancel button */}
          {onCancel && (
            <button 
              onClick={onCancel} 
              className="text-gray-500 hover:text-white text-xs transition-colors ml-1"
              title="Cancel"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full loading indicator (original design)
  return (
    <div className={`w-full max-w-md ${className}`}>
      {/* Main compact bar */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-900/70 border border-white/5">
        {/* Spinner or status icon */}
        {!isComplete ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-[rgb(var(--color-accent))]" />
        ) : hasErrors ? (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        
        {/* Status text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300 truncate">
            {currentAction || (isBackgroundRefresh ? "Updating..." : "Loading...")}
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono shrink-0">
          <span>{loadedFeeds}/{totalFeeds}</span>
          <span className="text-[rgb(var(--color-accent))]">{Math.round(progress)}%</span>
        </div>
        
        {/* Cancel button */}
        {!isComplete && onCancel && (
          <button onClick={onCancel} className="text-gray-500 hover:text-white text-xs transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Slim progress bar */}
      <div className="h-0.5 w-full bg-gray-800 rounded-full overflow-hidden mt-1">
        <div 
          className={`h-full rounded-full transition-all duration-200 ease-out ${hasErrors ? "bg-yellow-500" : "bg-[rgb(var(--color-accent))]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Error summary (only if errors) */}
      {hasErrors && isComplete && (
        <div className="flex items-center justify-between mt-2 text-xs text-yellow-400/80">
          <span>{errors.length} feed(s) failed</span>
          {onRetryErrors && (
            <button onClick={onRetryErrors} className="underline hover:text-yellow-300">Retry</button>
          )}
        </div>
      )}
    </div>
  );
};

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Circular progress indicator
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  color = "rgb(var(--color-accent))",
  backgroundColor = "rgb(156, 163, 175)", // gray-400
  showPercentage = false,
  className = "",
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Loading progress: ${Math.round(clampedProgress)}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-[rgb(var(--color-text))]">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

/**
 * Simple loading spinner
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "rgb(var(--color-accent))",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]} ${className}`}
      style={{ borderColor: color }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
