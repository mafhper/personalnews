/**
 * Error Boundary Component
 *
 * React error boundary with recovery mechanisms and user-friendly fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { errorHandler, ErrorContext } from "../services/errorHandler";
import { logger } from "../services/logger";
import { DefaultErrorFallback, IsolatedErrorFallback, ErrorFallbackProps } from "./ErrorFallbacks";

// Props interfaces
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  level?: "page" | "section" | "component";
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRecovering: boolean;
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name = "Unknown", level = "component" } = this.props;

    // Enhanced error context
    const context: ErrorContext = {
      component: name,
      additionalData: {
        level,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount,
        resetFunction: () => this.resetError(),
      },
    };

    // Store error info in state
    this.setState({ errorInfo });

    // Handle error through error handler
    errorHandler.handleError(error, context, true);

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Log error with context
    logger.error(`Error caught by ${name} boundary`, error, context);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Reset error state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      isRecovering: false,
    });
  };

  /**
   * Retry with automatic recovery attempt
   */
  retry = async () => {
    const { error } = this.state;

    if (!error || this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({
      isRecovering: true,
      retryCount: this.state.retryCount + 1,
    });

    try {
      // Attempt recovery through error handler
      const recovered = await errorHandler.handleError(
        error,
        {
          component: this.props.name || "ErrorBoundary",
          additionalData: {
            retryAttempt: this.state.retryCount + 1,
            resetFunction: () => this.resetError(),
          },
        },
        true
      );

      if (recovered) {
        // If recovery successful, reset the error state
        this.resetError();
      } else {
        // If recovery failed, wait before allowing another retry
        this.retryTimeout = setTimeout(() => {
          this.setState({ isRecovering: false });
        }, 2000);
      }
    } catch (recoveryError) {
      logger.error(
        "Error during boundary recovery",
        recoveryError instanceof Error
          ? recoveryError
          : new Error(String(recoveryError))
      );
      this.setState({ isRecovering: false });
    }
  };

  render() {
    const { hasError, error, errorInfo, isRecovering } = this.state;
    const { children, fallback: CustomFallback, isolate = false } = this.props;

    if (hasError) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        resetError: this.resetError,
        retry: this.retry,
        hasError: true,
      };

      // Use custom fallback if provided
      if (CustomFallback) {
        return <CustomFallback {...fallbackProps} />;
      }

      // Use default fallback based on isolation level
      if (isolate) {
        return (
          <IsolatedErrorFallback
            {...fallbackProps}
            isRecovering={isRecovering}
          />
        );
      } else {
        return (
          <DefaultErrorFallback
            {...fallbackProps}
            isRecovering={isRecovering}
          />
        );
      }
    }

    return children;
  }
}

/* eslint-disable react-refresh/only-export-components */
/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

export default ErrorBoundary;
