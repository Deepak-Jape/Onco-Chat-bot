import { useEffect, useRef, useState } from "react";

export default function useChartVisibility(scrollRef) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitiallyVisible, setIsInitiallyVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setIsInitiallyVisible(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: scrollRef?.current || null, 
        threshold: 0.2,
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [scrollRef]);

  return { ref, isVisible, isInitiallyVisible };
}
