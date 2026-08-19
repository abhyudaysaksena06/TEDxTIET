import { TOP, BOTTOM, smoothPath } from "../ScreenOutline";

// piecewise-linear y-lookup along a keystone curve
export function yAt(points: [number, number][], px: number) {
    const clamped = Math.min(points[points.length - 1][0], Math.max(points[0][0], px));
    for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        if (clamped >= x1 && clamped <= x2) {
            const t = x2 === x1 ? 0 : (clamped - x1) / (x2 - x1);
            return y1 + (y2 - y1) * t;
        }
    }
    return points[points.length - 1][1];
}

// a closed band that hugs a curve: the curve itself, then the same curve shifted
// down by `thickness`, traced back in reverse
function bandPath(points: [number, number][], thickness: number) {
    const upper = smoothPath(points);
    const lowerPts: [number, number][] = [...points].reverse().map(([x, y]) => [x, y + thickness]);
    const lower = smoothPath(lowerPts).replace(/^M/, "L");
    return `${upper} ${lower} Z`;
}

export const BAND_H = 3.2; // band thickness, in outline % units
export const HOLES = 42;

/**
 * The film strip's sprocket bands, drawn as SVG so they follow the screen's
 * curved top and bottom edges end to end instead of being straight bars.
 *
 * The band SHAPE is the screen's geometry, so it stays put; the punch-holes are
 * the film's own sprockets, so ReelOnScreen's scroll effect moves them (classes
 * `reel-hole`, data-band "t"/"b", data-idx) at exactly the track's speed and
 * re-seats each one on the curve at its new x.
 */
export default function CurvedPerforations() {
    const leftX = TOP[0][0];
    const rightX = TOP[TOP.length - 1][0];

    const holeXs = Array.from({ length: HOLES }, (_, i) => {
        const t = (i + 0.5) / HOLES;
        return leftX + (rightX - leftX) * t;
    });

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            {/* top band: hangs just below the top curve */}
            <path d={bandPath(TOP, BAND_H)} fill="#E8DCC4" stroke="#C5B392" strokeWidth="0.25" />
            {holeXs.map((x, i) => (
                <rect
                    key={`t-${i}`}
                    className="reel-hole"
                    data-band="t"
                    data-idx={i}
                    x={x - 0.55}
                    y={yAt(TOP, x) + BAND_H / 2 - 0.75}
                    width="1.1"
                    height="1.5"
                    rx="0.25"
                    fill="#1A1815"
                    stroke="#8C7A5E"
                    strokeWidth="0.08"
                />
            ))}

            {/* bottom band: sits just above the bottom curve */}
            <path
                d={bandPath(BOTTOM.map(([x, y]) => [x, y - BAND_H] as [number, number]), BAND_H)}
                fill="#E8DCC4"
                stroke="#C5B392"
                strokeWidth="0.25"
            />
            {holeXs.map((x, i) => (
                <rect
                    key={`b-${i}`}
                    className="reel-hole"
                    data-band="b"
                    data-idx={i}
                    x={x - 0.55}
                    y={yAt(BOTTOM, x) - BAND_H / 2 - 0.75}
                    width="1.1"
                    height="1.5"
                    rx="0.25"
                    fill="#1A1815"
                    stroke="#8C7A5E"
                    strokeWidth="0.08"
                />
            ))}
        </svg>
    );
}
