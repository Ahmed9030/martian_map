"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getVehicles } from "@/lib/api";
import type { Vehicle } from "@/lib/api";

let cachedVehicles: Vehicle[] | null = null;
let cachedPromise: Promise<Vehicle[]> | null = null;

export interface UseVehiclesResult {
  data: Vehicle[] | null;
  status: "idle" | "loading" | "success" | "error";
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<Vehicle[] | null>;
}

export function useVehicles(): UseVehiclesResult {
  const [state, setState] = useState<{
    data: Vehicle[] | null;
    status: "idle" | "loading" | "success" | "error";
    error: ApiError | null;
  }>({
    data: cachedVehicles,
    status: cachedVehicles ? "success" : "idle",
    error: null,
  });
  const isMountedRef = useRef(true);

  const loadVehicles = useCallback(async (): Promise<Vehicle[] | null> => {
    if (cachedVehicles) {
      if (isMountedRef.current) {
        setState({ data: cachedVehicles, status: "success", error: null });
      }
      return cachedVehicles;
    }

    if (!cachedPromise) {
      cachedPromise = getVehicles();
    }

    setState({ data: null, status: "loading", error: null });

    try {
      const data = await cachedPromise;
      cachedVehicles = data;
      if (isMountedRef.current) {
        setState({ data, status: "success", error: null });
      }
      return data;
    } catch (error) {
      if (!isMountedRef.current) {
        return null;
      }

      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError({
              kind: "api",
              message: error instanceof Error ? error.message : "Vehicle fetch failed.",
              details: error instanceof Error ? error.message : undefined,
            });

      setState({ data: null, status: "error", error: apiError });
      return null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    let cancelled = false;

    const fetchVehicles = async (): Promise<void> => {
      if (cachedVehicles) {
        if (!cancelled && isMountedRef.current) {
          setState({ data: cachedVehicles, status: "success", error: null });
        }
        return;
      }

      if (!cancelled && isMountedRef.current) {
        setState({ data: null, status: "loading", error: null });
      }

      try {
        if (!cachedPromise) {
          cachedPromise = getVehicles();
        }

        const data = await cachedPromise;
        cachedVehicles = data;
        if (!cancelled && isMountedRef.current) {
          setState({ data, status: "success", error: null });
        }
      } catch (error) {
        if (cancelled || !isMountedRef.current) {
          return;
        }

        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError({
                kind: "api",
                message: error instanceof Error ? error.message : "Vehicle fetch failed.",
                details: error instanceof Error ? error.message : undefined,
              });

        setState({ data: null, status: "error", error: apiError });
      }
    };

    void fetchVehicles();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
  }, [loadVehicles]);

  return {
    data: state.data,
    status: state.status,
    isLoading: state.status === "loading",
    error: state.error,
    refetch: loadVehicles,
  };
}
