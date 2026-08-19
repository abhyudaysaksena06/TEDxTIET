// Content ported from TEDxTIET1/TEDxTIET26-27 (src/data/impactData.js)
export interface ImpactStat {
    icon: string;
    number: string;
    label: string;
    description: string;
    value: number;
    maxProgress: number;
    /** true = show `number` verbatim instead of counting up to `value` */
    isStatic?: boolean;
}

export const impactData = {
    title: "Our Impact",
    subtitle: "Driving Innovation & Growth",
    description:
        "Connecting communities through powerful content and meaningful engagement across multiple platforms.",
    statistics: [
        {
            icon: "🎥",
            number: "15M+",
            label: "YouTube Views",
            description: "Total views across all content",
            value: 15,
            maxProgress: 85,
            isStatic: true,
        },
        {
            icon: "👥",
            number: "3K+",
            label: "Followers",
            description: "Growing community across platforms",
            value: 3000,
            maxProgress: 60,
        },
        {
            icon: "🏆",
            number: "8 years",
            label: "Presence",
            description: "Eight Year Legacy",
            value: 8,
            maxProgress: 100,
            isStatic: true,
        },
        {
            icon: "🎤",
            number: "20+",
            label: "Speakers",
            description: "Inspiring voices sharing ideas",
            value: 20,
            maxProgress: 75,
        },
    ] as ImpactStat[],
};
