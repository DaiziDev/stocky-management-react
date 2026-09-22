import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Lazy initializer reads the live value at mount — no setState-in-effect
  // (the effect only subscribes, per the react-hooks set-state-in-effect rule).
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    // Keep the state in sync if the query string changes between renders.
    const sync = () => setMatches(media.matches);
    sync();

    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
}
