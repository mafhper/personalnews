import React, { ErrorInfo } from "react";

export interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  resetError?: () => void;
  retry?: () => void;
  hasError: boolean;
}

interface DefaultErrorFallbackProps extends ErrorFallbackProps {
  isRecovering: boolean;
}

/**
 * Default Error Fallback Component
 */
export const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  resetError,
  retry,
  isRecovering,
}) => {
  return (
    <div className="error-boundary-fallback">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>
          We encountered an unexpected error. Don't worry, we're working to fix
          it.
        </p>

        {error && (
          <details className="error-details">
            <summary>Error Details</summary>
            <pre>{error.message}</pre>
          </details>
        )}

        <div className="error-actions">
          <button
            onClick={retry}
            disabled={isRecovering}
            className="retry-button"
          >
            {isRecovering ? "Recovering..." : "Try Again"}
          </button>
          <button onClick={resetError} className="reset-button">
            Reset
          </button>
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        </div>
      </div>

      <style>{`
        .error-boundary-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 2rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .error-content {
          text-align: center;
          max-width: 500px;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-content h2 {
          color: #dc2626;
          margin-bottom: 0.5rem;
        }

        .error-content p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .error-details {
          text-align: left;
          margin-bottom: 1.5rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 1rem;
        }

        .error-details summary {
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .error-details pre {
          font-size: 0.875rem;
          color: #374151;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .error-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .error-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
        }

        .retry-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .retry-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .reset-button {
          background: #6b7280;
          color: white;
        }

        .reset-button:hover {
          background: #4b5563;
        }

        .reload-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .reload-button:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

/**
 * Isolated Error Fallback Component (for smaller components)
 */
export const IsolatedErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  retry,
  isRecovering,
}) => {
  return (
    <div className="isolated-error-fallback">
      <span className="error-icon">⚠️</span>
      <span className="error-message">Error loading component</span>
      <button
        onClick={retry}
        disabled={isRecovering}
        className="retry-button-small"
        title={error?.message}
      >
        {isRecovering ? "..." : "↻"}
      </button>

      <style>{`
        .isolated-error-fallback {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #dc2626;
        }

        .error-icon {
          font-size: 1rem;
        }

        .error-message {
          font-weight: 500;
        }

        .retry-button-small {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: #3b82f6;
          padding: 0.25rem;
          border-radius: 2px;
          transition: background-color 0.2s;
        }

        .retry-button-small:hover:not(:disabled) {
          background: #dbeafe;
        }

        .retry-button-small:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
