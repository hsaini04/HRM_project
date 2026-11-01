import { useCallback, useEffect, useState } from 'react';

/**
 * Loads data with loading/error state. Previous data is kept while reloading so screens
 * don't flash back to skeletons after an update.
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, loading: enabled });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    fetcher(controller.signal)
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') setState((current) => ({ ...current, error, loading: false }));
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const setData = useCallback(
    (updater) =>
      setState((current) => ({ ...current, data: typeof updater === 'function' ? updater(current.data) : updater })),
    [],
  );

  return { ...state, reload, setData };
}
