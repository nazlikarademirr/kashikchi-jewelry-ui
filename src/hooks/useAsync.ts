import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError, isAppError } from '@/types';

export interface AsyncState<T> {
  data: T | null;
  error: AppError | null;
  loading: boolean;
  reload: () => void;
  setData: (d: T | null) => void;
}

export function useAsync<T>(fn: () => Promise<T>, deps: ReadonlyArray<unknown>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(isAppError(e) ? e : new AppError('UNKNOWN')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((x) => x + 1), []);
  return { data, error, loading, reload, setData };
}
