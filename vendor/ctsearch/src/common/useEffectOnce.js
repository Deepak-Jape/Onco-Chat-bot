import { useEffect, useRef } from "react";

export const useEffectOnce = (effect, deps = []) => {
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        effect();
    }, deps);
};
