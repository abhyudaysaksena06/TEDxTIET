// Content ported from TEDxTIET1/TEDxTIET26-27 (src/data/impactData.js)
export interface ImpactStat {
    /** the figure, split so the numeral can animate and the unit cannot */
    value: number;
    suffix: string;
    label: string;
    description: string;
    /** 0-1, how full this stat's rule is drawn — a quiet sense of scale */
    weight: number;
    /** thousands separators on the counted numeral */
    group?: boolean;
}

export const impactData = {
    eyebrow: "Independently organised · Patiala",
    title: "Our Impact",
    lede: "Eight years of putting students on a red circle in front of their own campus — and the talks that went further than the room.",
    statistics: [
        {
            value: 15,
            suffix: "M+",
            label: "Views on YouTube",
            description: "Across every talk we have published",
            weight: 0.85,
        },
        {
            value: 3000,
            suffix: "+",
            label: "Followers",
            description: "A community that keeps turning up",
            weight: 0.6,
            group: true,
        },
        {
            value: 8,
            suffix: " yrs",
            label: "On campus",
            description: "Running since 2015, student-led throughout",
            weight: 1,
        },
        {
            value: 20,
            suffix: "+",
            label: "Speakers hosted",
            description: "Founders, researchers, artists, alumni",
            weight: 0.75,
        },
    ] as ImpactStat[],
};
