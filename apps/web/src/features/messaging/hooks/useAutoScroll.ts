'use client';

import { useRef, useEffect, RefObject } from 'react';

/**
 * Auto-scroll hook with user-intent detection.
 * Only scrolls to bottom if user was already near the bottom,
 * preserving scroll position when user is reading older messages.
 */
export function useAutoScroll<T extends HTMLElement>(
    deps: any[],
    options: { threshold?: number; behavior?: ScrollBehavior } = {}
): RefObject<T | null> {
    const containerRef = useRef<T | null>(null);
    const wasAtBottomRef = useRef(true);
    const { threshold = 100, behavior = 'smooth' } = options;

    // Track if user is near bottom BEFORE any update
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleScroll = () => {
            wasAtBottomRef.current =
                el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    // Scroll to bottom only if user was already there
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Small delay to allow DOM updates
        const timeoutId = setTimeout(() => {
            if (wasAtBottomRef.current) {
                el.scrollTo({
                    top: el.scrollHeight,
                    behavior,
                });
            }
        }, 50);

        return () => clearTimeout(timeoutId);
    }, deps);

    return containerRef;
}

/**
 * Force scroll to bottom (e.g., after sending a message)
 */
export function scrollToBottom(ref: RefObject<HTMLElement>, behavior: ScrollBehavior = 'smooth'): void {
    const el = ref.current;
    if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior });
    }
}
