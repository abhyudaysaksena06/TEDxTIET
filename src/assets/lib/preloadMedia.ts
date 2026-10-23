/**
 * Two-stage media preloading.
 *
 * Stage 1 (hero) starts the moment the preloader mounts, so the background
 * plate and the reel portraits are already in cache by the time the curtain
 * lifts — otherwise they pop in mid-scroll.
 *
 * Stage 2 (everything else) starts the moment the home page mounts, so the
 * gallery photos are already arriving while the user reads the hero. It's
 * held until then rather than run up front so it doesn't compete with the
 * hero for bandwidth.
 */

import { filmFramesData } from "../components/Reel/filmData";
import { IMAGE_COUNT } from "../components/Gallery/galleryPhotos";

/** Shown immediately: hero background + the speaker frames in the reel. */
export const HERO_MEDIA: string[] = [
    "/HOME_BG.webp",
    ...(filmFramesData as { image: string }[]).map((f) => f.image),
];

/**
 * Only needed once the user navigates to /gallery.
 *
 * The tile tier only — around 2MB for all 114, less than the 35 full-size
 * files this used to pull. A focused tile fetches its own full-size map, and
 * preloading those would be ~11MB spent on photographs most visitors never
 * open.
 */
export const DEFERRED_MEDIA: string[] = [
    ...Array.from({ length: IMAGE_COUNT }, (_, i) => `/Gallery/thumb/img${i + 1}.webp`),
];

function loadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
        const img = new Image();
        // resolve on error too — a preload failure must never block the UI
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
    });
}

/** Resolves once every hero asset has settled (or `timeoutMs` has elapsed). */
export function preloadHeroMedia(timeoutMs = 4000): Promise<void> {
    const all = Promise.all(HERO_MEDIA.map(loadImage)).then(() => undefined);
    const cap = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
    // whichever finishes first: slow connections shouldn't sit on the preloader
    return Promise.race([all, cap]);
}

let deferredStarted = false;

/**
 * Fire-and-forget. Called when the home page mounts — i.e. the moment the user
 * is actually on the site — so the other pages' images are already downloading
 * in the background while they read the hero. Guarded so re-mounts (client-side
 * navigation back to home) don't re-queue the whole set.
 */
export function startBackgroundMediaLoad(): void {
    if (deferredStarted) return;
    deferredStarted = true;
    DEFERRED_MEDIA.forEach(loadImage);
}
