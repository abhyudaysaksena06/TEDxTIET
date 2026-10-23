// Content ported from TEDxTIET1/TEDxTIET26-27 (src/data/impactData.js)

/** which animated mark stands in for this figure */
export type MarkKind = "wave" | "grid" | "timeline" | "tally";

/**
 * The timeline and the headline figure are both derived from these two dates,
 * so they cannot contradict each other.
 *
 * The ported data said "8 years" while the About section says the event has
 * run since 2015 — against a 2026 edition that is an 11-year span, and the
 * drawn timeline said so plainly. If the 8 referred to EDITIONS held rather
 * than years elapsed (some years skipped), that is a different statistic and
 * needs the actual edition years to draw honestly.
 */
export const FOUNDED = 2015;
export const EDITION = 2026;
export const YEARS_ON_CAMPUS = EDITION - FOUNDED; // 11

export interface ImpactStat {
    /** the figure, split so the numeral can count and the unit cannot */
    value: number;
    suffix: string;
    label: string;
    description: string;
    /** thousands separators on the counted numeral */
    group?: boolean;
    /**
     * The mark means something rather than decorating: plays as a waveform,
     * the community as a filled grid, years as a dated timeline, speakers as a
     * tally of exactly twenty strokes. The version this replaces used emoji
     * inside progress rings, which carried no information at all.
     */
    mark: MarkKind;
}

export const impactData = {
    eyebrow: "Independently organised · Patiala",
    title: "Our Impact",
    lede: `Student-run since ${FOUNDED} — and the talks that went further than the room.`,
    statistics: [
        {
            value: 15,
            suffix: "M+",
            label: "Views on YouTube",
            description: "Across every talk we have published",
            mark: "wave",
        },
        {
            value: 3000,
            suffix: "+",
            label: "Followers",
            description: "Instagram, LinkedIn and YouTube combined",
            group: true,
            mark: "grid",
        },
        {
            value: YEARS_ON_CAMPUS,
            suffix: " yrs",
            label: "On campus",
            description: `Every edition since ${FOUNDED}, student-led throughout`,
            mark: "timeline",
        },
        {
            value: 20,
            suffix: "+",
            label: "Speakers hosted",
            description: "Founders, researchers, artists, alumni",
            mark: "tally",
        },
    ] as ImpactStat[],
};
