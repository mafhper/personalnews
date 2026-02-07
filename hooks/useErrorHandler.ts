import React from "react";
import { errorHandler, ErrorContext } from "../services/errorHandler";

/**
 * Hook for error boundary functionality in functional components
 */
export function useErrorHandler() {
  const handleError = React.useCallback(
    (error: Error, context?: ErrorContext) => {
      errorHandler.handleError(error, {
        component: "useErrorHandler",
        ...context,
      });
    },
    []
  );

  const reportError = React.useCallback(
    (error: Error, context?: ErrorContext) => {
      errorHandler.handleError(
        error,
        {
          component: "useErrorHandler",
          ...context,
        },
        false
      ); // Don't attempt recovery for manually reported errors
    },
    []
  );

  return {
    handleError,
    reportError,
    getErrorReports: errorHandler.getErrorReports.bind(errorHandler),
    clearErrorReports: errorHandler.clearErrorReports.bind(errorHandler),
    getErrorStatistics: errorHandler.getErrorStatistics.bind(errorHandler),
  };
}
