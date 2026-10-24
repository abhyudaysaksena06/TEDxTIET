/**
 * The archive sequence's progress, 0-1, as a value anything can drive.
 *
 * On a desktop it comes from scrolling the 700vh track behind the pinned
 * hero. On a phone that track pushed every section below the hero six
 * screens down — open the archive and the page went black — so there the
 * same value is driven by swiping across the stage, and the sections stay
 * where they are. Both feed one 0-1, so the title fades and the reel play
 * identically either way.
 */
export interface ProgressStore {
    get(): number;
    set(value: number): void;
    subscribe(listener: () => void): () => void;
    /**
     * How far the film travels across the reel phase, in px. The reel
     * publishes this from its own measured geometry, so a swipe driver can
     * move the film exactly as far as the finger.
     */
    reelTravelPx: number;
}

export function createProgressStore(): ProgressStore {
    let value = 0;
    const listeners = new Set<() => void>();
    return {
        get: () => value,
        set(next) {
            const v = Math.min(1, Math.max(0, next));
            if (v === value) return;
            value = v;
            listeners.forEach((l) => l());
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        reelTravelPx: 0,
    };
}
