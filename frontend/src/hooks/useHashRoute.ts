import { useCallback, useEffect, useState } from 'react';
import { buildHash, parseHash } from '../navigation';
import type { AppRoute } from '../navigation';

function initialRoute(): AppRoute {
  if (typeof window === 'undefined') return { section: 'dashboard' };
  return parseHash(window.location.hash || '#/');
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(initialRoute);

  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((next: AppRoute) => {
    const targetHash = buildHash(next);
    if (typeof window === 'undefined') {
      setRoute(next);
      return;
    }
    if (window.location.hash === targetHash) {
      setRoute(parseHash(targetHash));
    } else {
      window.location.hash = targetHash;
    }
  }, []);

  return { route, navigate, setRoute };
}
