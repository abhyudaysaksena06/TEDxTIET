/**
 * Aspect ratio of every gallery photo, in slot order.
 *
 * Generated from public/Gallery/manifest.json — do not edit by hand.
 *
 * The tiles need these before their textures arrive. Reading the shape off
 * each texture in its load callback would resize the tile under the viewer,
 * and the fade-in does not wait for the image, so the pop would show.
 * Clamped to [0.56, 1.85], which spans every photo in the set — the narrowest
 * are 9:16 phone frames — so nothing is stretched to fit its tile.
 */
export const PHOTO_ASPECTS: readonly number[] = [
    0.563, 0.652, 0.770, 1.266, 1.409, 0.888, 1.215, 1.502, 1.781, 1.781,
    1.781, 1.781, 1.781, 1.781, 1.781, 1.781, 1.781, 1.781, 0.750, 1.781,
    1.781, 1.781, 1.781, 0.750, 1.333, 1.502, 1.333, 1.777, 1.333, 1.333,
    1.777, 0.750, 1.499, 1.333, 1.781, 0.563, 1.777, 1.777, 1.777, 1.777,
    1.777, 0.563, 1.777, 0.666, 0.666, 1.500, 0.800, 1.500, 1.779, 1.779,
    1.779, 1.779, 1.779, 1.779, 0.562, 1.779, 1.779, 1.779, 1.779, 1.779,
    1.779, 1.779, 1.779, 1.779, 0.666, 1.500, 1.500, 1.500, 1.500, 1.500,
    1.500, 1.500, 1.500, 1.500, 0.563, 0.750, 0.750, 1.333, 0.563, 0.750,
    0.750, 1.333, 0.563, 0.750, 0.750, 0.563, 0.750, 0.750, 0.563, 0.750,
    0.750, 0.563, 1.333, 0.750, 1.333, 0.750, 1.333, 1.777, 1.500, 1.500,
    1.333, 1.500, 1.333, 1.333, 1.333, 1.332, 0.750, 1.333, 1.332, 1.332,
    1.332, 0.751, 1.332, 1.332
];

export const IMAGE_COUNT = PHOTO_ASPECTS.length;
