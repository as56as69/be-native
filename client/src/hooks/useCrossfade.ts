import { useEffect, useRef, useState } from "react";

/**
 * Keeps the *previous* screen mounted for a short time while the new one
 * slides/fades in, so story → map → reels transitions feel like turning
 * notebook pages instead of hard swaps.
 */
const EXIT_MS = 420;

export function useCrossfade<T extends string>(screen: T) {
  const [state, setState] = useState<{ current: T; previous: T | null }>({
    current: screen,
    previous: null,
  });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (screen === state.current) return;
    setState({ current: screen, previous: state.current });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setState((s) => (s.previous === null ? s : { ...s, previous: null }));
    }, EXIT_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  return { current: state.current, previous: state.previous, exiting: state.previous !== null };
}