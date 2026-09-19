import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

interface ServiceWorkerState {
  supported: boolean;
  registering: boolean;
  offlineReady: boolean;
  needsRefresh: boolean;
  error: string | null;
}

export function useServiceWorker(): ServiceWorkerState {
  const [state, setState] = useState<ServiceWorkerState>({
    supported: "serviceWorker" in navigator,
    registering: true,
    offlineReady: false,
    needsRefresh: false,
    error: null,
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setState((s) => ({ ...s, supported: false, registering: false }));
      return;
    }

    let cancelled = false;
    try {
      registerSW({
        immediate: true,
        onOfflineReady() {
          if (!cancelled) setState((s) => ({ ...s, offlineReady: true, registering: false }));
        },
        onNeedRefresh() {
          if (!cancelled) setState((s) => ({ ...s, needsRefresh: true, registering: false }));
        },
        onRegisteredSW() {
          if (!cancelled) setState((s) => ({ ...s, registering: false }));
        },
      });
    } catch (err) {
      if (!cancelled)
        setState((s) => ({
          ...s,
          registering: false,
          error: err instanceof Error ? err.message : String(err),
        }));
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function reloadForUpdate() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((reg) => {
        reg.waiting?.postMessage({ type: "SKIP_WAITING" });
      })
    );
  }
  window.location.reload();
}