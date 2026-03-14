/**
 * PaginationControls.tsx
 *
 * Enhanced pagination controls component with improved event handling,
 * responsive design, and better mobile support. Uses proper state management
 * and fixes synchronization issues.
 *
 * @author Matheus Pereira
 * @version 2.1.0
 */

import React, { useCallback } from "react";
import { LoadingSpinner } from "./ProgressIndicator";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
  className?: string;
  isNavigating?: boolean;
  disabled?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  compact = false,
  className = "",
  isNavigating = false,
  disabled = false,
}) => {
  // Memoized event handlers to prevent unnecessary re-renders
  const handlePrevPage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!disabled && !isNavigating && currentPage > 0) {
        onPageChange(currentPage - 1);
      }
    },
    [disabled, isNavigating, currentPage, onPageChange]
  );

  const handleNextPage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!disabled && !isNavigating && currentPage < totalPages - 1) {
        onPageChange(currentPage + 1);
      }
    },
    [disabled, isNavigating, currentPage, totalPages, onPageChange]
  );

  const handlePageClick = useCallback(
    (page: number) => {
      if (!disabled && !isNavigating && page !== currentPage) {
        onPageChange(page);
      }
    },
    [disabled, isNavigating, currentPage, onPageChange]
  );

  // Don't render if there are no pages or only one page
  // Moved AFTER hooks to comply with Rules of Hooks
  if (totalPages <= 1) {
    return null;
  }

  // Determinar quais números de página mostrar
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = compact ? 3 : 5;

    if (totalPages <= maxVisiblePages) {
      // Se o total de páginas for menor que o máximo visível, mostrar todas
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Sempre mostrar a primeira página
      pageNumbers.push(0);

      // Calcular o intervalo de páginas a mostrar
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages - 2, currentPage + 1);

      // Ajustar se estiver no início
      if (currentPage <= 1) {
        endPage = 3;
      }

      // Ajustar se estiver no fim
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }

      // Adicionar elipses se necessário
      if (startPage > 1) {
        pageNumbers.push(-1); // -1 representa elipses
      }

      // Adicionar páginas do intervalo
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Adicionar elipses se necessário
      if (endPage < totalPages - 2) {
        pageNumbers.push(-2); // -2 representa elipses
      }

      // Sempre mostrar a última página
      pageNumbers.push(totalPages - 1);
    }

    return pageNumbers;
  };

  // Common button styles with enhanced mobile support
  const getButtonStyles = (isDisabled: boolean, isActive = false) => {
    const baseStyles =
      "feed-pagination-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:ring-opacity-50 select-none touch-manipulation";

    if (isDisabled) {
      return `${baseStyles} cursor-not-allowed opacity-50`;
    }

    if (isActive) {
      return `${baseStyles} feed-pagination-button--active shadow-md`;
    }

    return `${baseStyles} active:scale-95`;
  };

  return (
    <div
      className={`flex items-center ${className} ${
        isNavigating ? "opacity-75" : ""
      }`}
    >
      {/* Compact version for header */}
      {compact ? (
        <div className="feed-pagination">
          <button
            onClick={handlePrevPage}
            disabled={disabled || isNavigating || currentPage === 0}
            className={`p-2 ${getButtonStyles(
              currentPage === 0 || disabled || isNavigating
            )}`}
            aria-label="Página anterior"
            title="Página anterior (←)"
          >
            {isNavigating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            )}
          </button>

          <div className="feed-pagination-status flex items-center space-x-0.5 px-1">
            <span className="text-xs font-medium min-w-[1.5ch] text-center">
              {currentPage + 1}
            </span>
            <span className="feed-pagination-meta text-xs">/</span>
            <span className="feed-pagination-meta text-xs min-w-[1.5ch] text-center">
              {totalPages}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={
              disabled || isNavigating || currentPage === totalPages - 1
            }
            className={`p-2 ${getButtonStyles(
              currentPage === totalPages - 1 || disabled || isNavigating
            )}`}
            aria-label="Próxima página"
            title="Próxima página (→)"
          >
            {isNavigating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>
      ) : (
        // Full version for bottom of page
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Navigation controls */}
          <div className="feed-pagination">
            <button
              onClick={handlePrevPage}
              disabled={disabled || isNavigating || currentPage === 0}
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${getButtonStyles(
                currentPage === 0 || disabled || isNavigating
              )}`}
              aria-label="Página anterior"
            >
              {isNavigating && <LoadingSpinner size="sm" />}
              <span className="hidden sm:inline">
                {isNavigating ? "Carregando..." : "Anterior"}
              </span>
              <span className="sm:hidden">{isNavigating ? "..." : "←"}</span>
            </button>

            <div className="feed-pagination-status flex items-center space-x-0.5 px-1 sm:hidden">
              <span className="text-xs font-medium min-w-[1.5ch] text-center">
                {currentPage + 1}
              </span>
              <span className="feed-pagination-meta text-xs">/</span>
              <span className="feed-pagination-meta text-xs min-w-[1.5ch] text-center">
                {totalPages}
              </span>
            </div>

            {/* Page numbers - visible on larger screens */}
            <div className="hidden sm:flex items-center space-x-1">
              {getPageNumbers().map((pageNum, index) => {
                // Render ellipsis
                if (pageNum < 0) {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="feed-pagination-meta px-2 select-none"
                    >
                      ...
                    </span>
                  );
                }

                // Render page button
                const isCurrentPage = currentPage === pageNum;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => handlePageClick(pageNum)}
                    disabled={disabled || isNavigating}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-medium ${getButtonStyles(
                      disabled || isNavigating,
                      isCurrentPage
                    )}`}
                    aria-label={`Ir para página ${pageNum + 1}`}
                    aria-current={isCurrentPage ? "page" : undefined}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={
                disabled || isNavigating || currentPage === totalPages - 1
              }
              className={`px-4 py-2 font-medium text-sm flex items-center space-x-2 ${getButtonStyles(
                currentPage === totalPages - 1 || disabled || isNavigating
              )}`}
              aria-label="Próxima página"
            >
              {isNavigating && <LoadingSpinner size="sm" />}
              <span className="hidden sm:inline">
                {isNavigating ? "Carregando..." : "Próximo"}
              </span>
              <span className="sm:hidden">{isNavigating ? "..." : "→"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
