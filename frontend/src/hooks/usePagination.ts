import { useState, useCallback, useMemo } from 'react';

interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialSize?: number;
  onPageChange?: (page: number, size: number) => void;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 0, initialSize = 10, onPageChange } = options;

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    size: initialSize,
    totalElements: 0,
    totalPages: 0,
  });

  const setPage = useCallback(
    (page: number) => {
      setPagination((prev) => {
        const newPage = Math.max(0, Math.min(page, prev.totalPages - 1));
        const updated = { ...prev, page: newPage };
        onPageChange?.(newPage, prev.size);
        return updated;
      });
    },
    [onPageChange]
  );

  const setSize = useCallback(
    (size: number) => {
      setPagination((prev) => {
        const updated = { ...prev, size, page: 0 };
        onPageChange?.(0, size);
        return updated;
      });
    },
    [onPageChange]
  );

  const nextPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.page < prev.totalPages - 1) {
        const newPage = prev.page + 1;
        onPageChange?.(newPage, prev.size);
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, [onPageChange]);

  const prevPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.page > 0) {
        const newPage = prev.page - 1;
        onPageChange?.(newPage, prev.size);
        return { ...prev, page: newPage };
      }
      return prev;
    });
  }, [onPageChange]);

  const updateTotal = useCallback((totalElements: number, totalPages: number) => {
    setPagination((prev) => ({
      ...prev,
      totalElements,
      totalPages,
    }));
  }, []);

  const reset = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  const paginationProps = useMemo(
    () => ({
      page: pagination.page,
      size: pagination.size,
      totalElements: pagination.totalElements,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.page < pagination.totalPages - 1,
      hasPrevPage: pagination.page > 0,
    }),
    [pagination]
  );

  return {
    ...pagination,
    ...paginationProps,
    setPage,
    setSize,
    nextPage,
    prevPage,
    updateTotal,
    reset,
  };
}