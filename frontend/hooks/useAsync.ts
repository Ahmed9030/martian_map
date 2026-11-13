"use client";

import { useCallback, useState } from "react";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T, E> {
  status: AsyncStatus;
  data: T | null;
  error: E | null;
}

export function useAsync<T, E = Error>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T, E>>({
    status: "idle",
    data: initialData,
    error: null,
  });

  const run = useCallback(async (task: () => Promise<T>): Promise<T> => {
    setState((current) => ({
      ...current,
      status: "loading",
      error: null,
    }));

    try {
      const data = await task();
      setState({ status: "success", data, error: null });
      return data;
    } catch (error) {
      const nextError = error as E;
      setState({ status: "error", data: null, error: nextError });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", data: initialData, error: null });
  }, [initialData]);

  return {
    ...state,
    isLoading: state.status === "loading",
    run,
    reset,
  };
}
