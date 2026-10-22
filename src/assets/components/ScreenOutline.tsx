// Traces the curved projection-screen border of HOME_BG.webp.
//
// These points are MEASURED FROM THE IMAGE, not eyeballed: the screen's neon
// frame is the only strongly-red thing in that band, so the edges were found by
// scanning each column of the decoded bitmap for red pixels and taking the top
// and bottom runs. Coordinates are percentages of the FULL image (1375x768),
// which is the space the hero stage renders them in.
//
// The earlier hand-dragged values were percentages of the cropped container,
// so they drifted as soon as the outline was mapped onto the image itself.
export const TOP: [number, number][] = [
    [10.8364, 24.4792],
    [18.1091, 25.2604],
    [25.3818, 25.9115],
    [32.6545, 26.4323],
    [39.9273, 26.8229],
    [47.2000, 26.9531],
    [54.4727, 26.9531],
    [61.7455, 26.8229],
    [69.0182, 26.3021],
    [76.2909, 25.7813],
    [83.5636, 25.0000],
    [90.8364, 24.7396],
];

export const BOTTOM: [number, number][] = [
    [10.8364, 64.0625],
    [18.1091, 64.1927],
    [25.3818, 63.1510],
    [32.6545, 62.6302],
    [39.9273, 62.2396],
    [47.2000, 62.3698],
    [54.4727, 62.3698],
    [61.7455, 62.2396],
    [69.0182, 62.6302],
    [76.2909, 63.1510],
    [83.5636, 63.8021],
    [90.8364, 64.4531],
];

// Catmull-Rom -> cubic Bezier, so the curve passes exactly through every point
export function smoothPath(points: [number, number][], close = false) {
    const pts = close ? [points[points.length - 1], ...points, points[0], points[1]] : points;
    const start = close ? 1 : 0;
    const end = close ? pts.length - 2 : pts.length - 1;

    let d = `M ${points[0][0]} ${points[0][1]} `;
    for (let i = start; i < end; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]} `;
    }
    return d;
}

export function buildOutline() {
    const top = smoothPath(TOP);
    const bottomReversed = [...BOTTOM].reverse();
    // right edge connects top's last point to bottom's last point, straight
    const right = `L ${bottomReversed[0][0]} ${bottomReversed[0][1]} `;
    const bottom = smoothPath(bottomReversed).replace(/^M[^C]+/, ""); // drop its own "M", continue from current point
    const left = `L ${TOP[0][0]} ${TOP[0][1]} Z`;
    return top + right + bottom + left;
}

export default function ScreenOutline() {
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <path
                d={buildOutline()}
                fill="none"
                stroke="white"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}
