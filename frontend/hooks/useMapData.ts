"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getMap } from "@/lib/api";
import type { MapData } from "@/lib/api";

export interface UseMapDataResult {
  data: MapData | null;
  status: "idle" | "loading" | "success" | "error";
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<MapData | null>;
}

export function useMapData(mapId: number | string | null | undefined): UseMapDataResult {
  const [state, setState] = useState<{
    data: MapData | null;
    status: "idle" | "loading" | "success" | "error";
    error: ApiError | null;
  }>({
    data: null,
    status: "idle",
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const refetch = useCallback(async (): Promise<MapData | null> => {
    if (mapId === null || mapId === undefined || mapId === "") {
      setState({ data: null, status: "idle", error: null });
      return null;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ data: null, status: "loading", error: null });

    try {
      const data = await getMap(mapId, { signal: controller.signal });
      if (!isMountedRef.current || controller.signal.aborted) {
        return data;
      }
      setState({ data, status: "success", error: null });
      return data;
    } catch (error) {
      if (!isMountedRef.current || controller.signal.aborted) {
        return null;
      }

      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError({
              kind: "api",
              message: error instanceof Error ? error.message : "Map request failed.",
              details: error instanceof Error ? error.message : undefined,
            });

      setState({ data: null, status: "error", error: apiError });
      return null;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [mapId]);

  useEffect(() => {
    isMountedRef.current = true;

    let cancelled = false;
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchData = async (): Promise<void> => {
      if (mapId === null || mapId === undefined || mapId === "") {
        if (!cancelled) {
          setState({ data: null, status: "idle", error: null });
        }
        return;
      }

      if (!cancelled) {
        setState({ data: null, status: "loading", error: null });
      }

      try {
        const data = await getMap(mapId, { signal: controller.signal });
        if (!cancelled && isMountedRef.current) {
          setState({ data, status: "success", error: null });
        }
      } catch (error) {
        if (cancelled || !isMountedRef.current || controller.signal.aborted) {
          return;
        }

        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError({
                kind: "api",
                message: error instanceof Error ? error.message : "Map request failed.",
                details: error instanceof Error ? error.message : undefined,
              });

        setState({ data: null, status: "error", error: apiError });
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      controller.abort();
      abortRef.current = null;
    };
  }, [mapId]);

  return {
    data: state.data,
    status: state.status,
    isLoading: state.status === "loading",
    error: state.error,
    refetch,
  };
}
