// src/hooks/useMediaQuery.ts

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener); // Updated line

    return () => media.removeEventListener("change", listener); // Updated line
  }, [matches, query]);

  return matches;
}
