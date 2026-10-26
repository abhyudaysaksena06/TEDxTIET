/**
 * Loads the site's media, all of it at once, from the moment the app boots.
 *
 * It used to run in two stages: the hero during the preloader, everything
 * else only once the home page had mounted. Now every fetch starts together
 * inside the preloader, so the gallery, team and alumni photos are already
 * arriving while it plays. The hero goes first: it is what the curtain lifts
 * onto, so it is fetched at high priority and the curtain waits for it. The
 * rest is low priority, so it fills in around the hero rather than holding
 * it up.
 *
 * Not included: the gallery's full-size maps (~12MB). Those load one at a
 * time when a photo is focused, and fetching all of them would swamp a phone
 * connection for photographs most visitors never open.
 */

import { filmFramesData } from "../components/Reel/filmData";
import { IMAGE_COUNT } from "../components/Gallery/galleryPhotos";
import { BOARD_LEFT, BOARD_RIGHT, COMMITTEE_LEFT, COMMITTEE_RIGHT } from "../data/team";

import { asset } from "./basePath";
const reel = (filmFramesData as { image: string }[]).map((f) => f.image);

/** what the curtain lifts onto: the stage and the reel's portraits */
export const HERO_MEDIA: string[] = [asset("/HOME_BG.webp"), ...reel];

// The alumni portraits are bundled assets with hashed names. A plain import
// resolves to exactly the URL the alumni page's own imports do, so the cache
// serves them there. (A "?url" import resolved to a different address, and
// each portrait downloaded twice.)
const alumni = Object.values(
    import.meta.glob("../gridimages/*.webp", { eager: true, import: "default" })
) as string[];

/** everything else a visit can reach */
export const OTHER_MEDIA: string[] = [
    asset("/tedxtiet-lockup.png"),
    // the speakers standing on the carpet
    ...reel.map((src) => src.replace("/Speakers/", "/Speakers/cut/")),
    ...Array.from({ length: IMAGE_COUNT }, (_, i) => asset(`/Gallery/thumb/img${i + 1}.webp`)),
    ...[...BOARD_LEFT, ...BOARD_RIGHT, ...COMMITTEE_LEFT, ...COMMITTEE_RIGHT].map(
        (m: { image: string }) => m.image
    ),
    ...alumni,
];

function load(src: string, priority: "high" | "low"): Promise<void> {
    return new Promise((resolve) => {
        const img = new Image();
        img.fetchPriority = priority;
        img.decoding = "async";
        // resolve on error too — a failed preload must never hold the page
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
    });
}

let started: Promise<void> | null = null;

/**
 * Starts every fetch, once (StrictMode mounts twice; this does not).
 * `onProgress` gets 0-1 across all of it. Resolves when the hero media has
 * settled, or after `heroCapMs` — a slow connection must not strand anyone
 * on the preloader.
 */
export function preloadAllMedia(onProgress?: (fraction: number) => void, heroCapMs = 6000): Promise<void> {
    if (started) return started;

    const others = OTHER_MEDIA.filter((src) => !HERO_MEDIA.includes(src));
    const total = HERO_MEDIA.length + others.length;
    let done = 0;
    const tick = () => {
        done += 1;
        onProgress?.(done / total);
    };

    const hero = Promise.all(HERO_MEDIA.map((src) => load(src, "high").then(tick))).then(() => undefined);
    others.forEach((src) => load(src, "low").then(tick));

    started = Promise.race([hero, new Promise<void>((resolve) => setTimeout(resolve, heroCapMs))]);
    return started;
}
