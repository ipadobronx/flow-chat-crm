import { useState, useCallback } from "react";

export interface UseMultiSelectOptions {
  onSelectionComplete?: (selectedIds: string[]) => void;
}

export function useMultiSelect(options: UseMultiSelectOptions = {}) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        // Exiting selection mode - clear selections
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      return newSet;
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const confirmSelection = useCallback(() => {
    const selectedArray = Array.from(selectedIds);
    options.onSelectionComplete?.(selectedArray);
    exitSelectionMode();
  }, [selectedIds, options, exitSelectionMode]);

  return {
    isSelectionMode,
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelectionMode,
    toggleSelection,
    selectAll,
    clearSelections,
    exitSelectionMode,
    confirmSelection,
    isSelected: (id: string) => selectedIds.has(id),
  };
}