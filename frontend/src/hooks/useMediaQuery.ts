// src/hooks/useMediaQuery.ts

import { useState, useEffect } from "react";

export function useMediaQuery(query: string, delay: number = 150): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => {
      setTimeout(() => {
        setMatches(media.matches);
      }, delay);
    };

    // Set initial value
    setMatches(media.matches);

    // Add event listener
    media.addEventListener("change", handleChange);

    // Cleanup event listener on unmount
    return () => media.removeEventListener("change", handleChange);
  }, [query, delay]);

  return matches;
}
