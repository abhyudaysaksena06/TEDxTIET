// Traces the curved projection-screen border, smoothed through the exact
// keystone points marked on the venue photo (see conversation for source data).
export const TOP: [number, number][] = [
    [8.166667, 13.180199],
    [17.666666, 14.249391],
    [28.527779, 15.709754],
    [38.916668, 16.579017],
    [46.277779, 16.891952],
    [52.069444, 16.891952],
    [58.930558, 16.370394],
    [65.388891, 16.379087],
    [72.888887, 15.683677],
    [79.305556, 14.840491],
    [85.819448, 13.832146],
    [93.555561, 12.902033],
];

export const BOTTOM: [number, number][] = [
    [8.611111, 71.316499],
    [16.730902, 70.708827],
    [26.985094, 69.629560],
    [37.285474, 68.935746],
    [42.791668, 68.630475],
    [46.569447, 68.491395],
    [52.361111, 68.317543],
    [59.236111, 68.630475],
    [65.888888, 69.117265],
    [75.916672, 69.916983],
    [87.375005, 71.203496],
    [93.277783, 71.733755],
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
