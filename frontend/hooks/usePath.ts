"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getPath } from "@/lib/api";
import type { PathData, PathParams } from "@/lib/api";

export interface UsePathResult {
  data: PathData | null;
  status: "idle" | "loading" | "success" | "error";
  isLoading: boolean;
  error: ApiError | null;
  run: (params: PathParams) => Promise<PathData | null>;
  reset: () => void;
}

export function usePath(): UsePathResult {
  const [state, setState] = useState<{
    data: PathData | null;
    status: "idle" | "loading" | "success" | "error";
    error: ApiError | null;
  }>({
    data: null,
    status: "idle",
    error: null,
  });
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    requestIdRef.current += 1;
    setState({ data: null, status: "idle", error: null });
  }, []);

  const run = useCallback(
    async (params: PathParams): Promise<PathData | null> => {
      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState({ data: null, status: "loading", error: null });

      try {
        const data = await getPath(params, {
          signal: controller.signal,
        });

        if (requestIdRef.current !== currentRequestId || controller.signal.aborted) {
          return null;
        }

        setState({ data, status: "success", error: null });
        return data;
      } catch (error) {
        if (requestIdRef.current !== currentRequestId || controller.signal.aborted) {
          return null;
        }

        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError({
                kind: "api",
                message: error instanceof Error ? error.message : "Path request failed.",
                details: error instanceof Error ? error.message : undefined,
              });

        setState({
          data: null,
          status: "error",
          error: apiError,
        });
        return null;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    data: state.data,
    status: state.status,
    isLoading: state.status === "loading",
    error: state.error,
    run,
    reset,
  };
}
