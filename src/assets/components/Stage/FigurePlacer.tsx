import { useCallback, useEffect, useRef, useState } from "react";
import { CARPET, FIGURE_H } from "./CarpetFigure";

/**
 * Placement picker for the carpet figure.
 *
 * Click anywhere on the stage and the speaker stands there. The point you
 * click is where their FEET go, which is the only anchor that matters — a
 * person is positioned by where they meet the floor, not by their middle.
 *
 * Coordinates are percentages of the stage box, not the viewport, because
 * that is the space the figure lives in: the same numbers hold at every
 * screen size, which is why they can be pasted straight into CarpetFigure.
 *
 * Only mounts on ?place=1, so visitors never see it.
 */

const RED = "#eb0028";

export interface Placement {
    x: number;
    y: number;
    h: number;
}

interface Props {
    /** the stage box the figure is positioned within */
    stageRef: React.RefObject<HTMLElement | null>;
    value: Placement;
    onChange: (p: Placement) => void;
}

export default function FigurePlacer({ stageRef, value, onChange }: Props) {
    const [copied, setCopied] = useState(false);
    const valueRef = useRef(value);
    valueRef.current = value;

    /** translate a viewport point into a percentage of the stage box */
    const toStagePct = useCallback(
        (clientX: number, clientY: number) => {
            const el = stageRef.current;
            if (!el) return null;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) return null;
            return {
                x: +(((clientX - r.left) / r.width) * 100).toFixed(2),
                y: +(((clientY - r.top) / r.height) * 100).toFixed(2),
            };
        },
        [stageRef]
    );

    // click to place, drag to adjust
    useEffect(() => {
        const el = stageRef.current;
        if (!el) return;

        let dragging = false;
        const place = (e: PointerEvent) => {
            const p = toStagePct(e.clientX, e.clientY);
            if (p) onChange({ ...valueRef.current, x: p.x, y: p.y });
        };
        const down = (e: PointerEvent) => {
            dragging = true;
            place(e);
        };
        const move = (e: PointerEvent) => {
            if (dragging) place(e);
        };
        const up = () => {
            dragging = false;
        };

        el.addEventListener("pointerdown", down);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        return () => {
            el.removeEventListener("pointerdown", down);
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
    }, [stageRef, toStagePct, onChange]);

    // arrows nudge, [ and ] resize — finer control than a pointer gives
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const step = e.shiftKey ? 1 : 0.1;
            const v = valueRef.current;
            const next = { ...v };
            if (e.key === "ArrowLeft") next.x = +(v.x - step).toFixed(2);
            else if (e.key === "ArrowRight") next.x = +(v.x + step).toFixed(2);
            else if (e.key === "ArrowUp") next.y = +(v.y - step).toFixed(2);
            else if (e.key === "ArrowDown") next.y = +(v.y + step).toFixed(2);
            else if (e.key === "[") next.h = +Math.max(1, v.h - step).toFixed(2);
            else if (e.key === "]") next.h = +(v.h + step).toFixed(2);
            else return;
            e.preventDefault();
            onChange(next);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onChange]);

    const snippet = `export const CARPET = { x: ${value.x}, y: ${value.y} };\nexport const FIGURE_H = ${value.h};`;

    return (
        <>
            {/* crosshair on the chosen spot, drawn in the stage's own space */}
            <div
                className="pointer-events-none absolute z-[60]"
                style={{ left: `${value.x}%`, top: `${value.y}%` }}
            >
                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        width: 14,
                        height: 14,
                        border: `2px solid ${RED}`,
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.8)",
                    }}
                />
                <div
                    className="absolute -translate-x-1/2"
                    style={{ width: 1, height: 26, bottom: 0, backgroundColor: RED, opacity: 0.6 }}
                />
            </div>

            {/* readout */}
            <div
                className="fixed bottom-4 left-4 z-[10000] w-[260px] select-none rounded-sm border p-3 font-mono text-[11px] leading-relaxed"
                style={{
                    borderColor: "#333",
                    backgroundColor: "rgba(0,0,0,0.88)",
                    color: "#e6e6e6",
                }}
            >
                <p className="mb-2 uppercase tracking-[0.2em]" style={{ color: RED }}>
                    Figure placement
                </p>

                <p style={{ color: "#9a9a9a" }}>
                    Click or drag on the stage to stand them somewhere. Arrows nudge
                    (shift = 1%), <kbd>[</kbd>/<kbd>]</kbd> resize.
                </p>

                <pre className="mt-2 whitespace-pre-wrap" style={{ color: "#fff" }}>
{`x  ${value.x.toFixed(2)}%
y  ${value.y.toFixed(2)}%
h  ${value.h.toFixed(2)}%`}
                </pre>

                <div className="mt-2 flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            navigator.clipboard?.writeText(snippet);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1400);
                        }}
                        className="flex-1 border px-2 py-1 uppercase tracking-[0.1em]"
                        style={{ borderColor: "#444", color: copied ? RED : "#e6e6e6" }}
                    >
                        {copied ? "copied" : "copy"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange({ x: CARPET.x, y: CARPET.y, h: FIGURE_H })}
                        className="border px-2 py-1 uppercase tracking-[0.1em]"
                        style={{ borderColor: "#444", color: "#9a9a9a" }}
                    >
                        reset
                    </button>
                </div>
            </div>
        </>
    );
}
