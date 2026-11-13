'use client';

import { useCallback, useState } from 'react';
import type { Destination } from '@/lib/api';

export type DestinationRole = 'Start' | 'End' | 'Science Target';

export interface Assignments {
  Start: Destination | null;
  End: Destination | null;
  'Science Target': Destination | null;
}

export interface SelectedDestination extends Destination {
  role: DestinationRole;
}

export interface UseMapSelectionReturn {
  destinationMode: DestinationRole;
  setDestinationMode: (role: DestinationRole) => void;
  assignments: Assignments;
  setAssignments: React.Dispatch<React.SetStateAction<Assignments>>;
  selectedDestination: SelectedDestination | null;
  setSelectedDestination: (d: SelectedDestination | null) => void;
  closeDetails: () => void;
}

const INITIAL_ASSIGNMENTS: Assignments = {
  Start: null,
  End: null,
  'Science Target': null,
};

export function useMapSelection(): UseMapSelectionReturn {
  const [destinationMode, setDestinationMode] = useState<DestinationRole>('Start');
  const [assignments, setAssignments] = useState<Assignments>(INITIAL_ASSIGNMENTS);
  const [selectedDestination, setSelectedDestination] =
    useState<SelectedDestination | null>(null);

  /**
   * Close the details panel without clearing the actual Start / End / Science
   * Target assignments — the point stays assigned on the map.
   */
  const closeDetails = useCallback(() => {
    setSelectedDestination(null);
  }, []);

  return {
    destinationMode,
    setDestinationMode,
    assignments,
    setAssignments,
    selectedDestination,
    setSelectedDestination,
    closeDetails,
  };
}

