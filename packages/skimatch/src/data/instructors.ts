import { Instructor, SKI_LEVELS, Resort } from "../types/domain";
export const RESORTS: Resort[] = ["Whistler Blackcomb", "Vail", "Park City"];
const allSlots = ["morning", "afternoon", "full_day"] as const;
const seeds = [
    { name: "Ellie Morgan", bio: "Small wins, big mountain days. Ellie helps nervous skiers find their feet with patience, playful drills, and a little mountain magic.", color: "sage", years: 12, age: [4, 85], specialties: ["confidence", "beginners", "family", "turns"], terrain: ["greens", "blues", "groomers"], style: ["patient", "playful", "demonstrations"], communication: ["encouraging", "gentle", "clear"], languages: ["English", "French"], less: "High-intensity race coaching", rating: 4.98, lessons: 1240 },
    { name: "Luca Moretti", bio: "A former race coach with an eye for the details. Luca turns technical ideas into crisp, confident skiing, one beautifully linked turn at a time.", color: "clay", years: 16, age: [12, 85], specialties: ["carving", "technique", "speed", "turns"], terrain: ["blues", "blacks", "groomers", "steep"], style: ["technical", "structured", "demonstrations"], communication: ["direct", "detailed", "clear"], languages: ["English", "Italian"], less: "Young children who prefer unstructured play", rating: 4.94, lessons: 1860 },
    { name: "Maya Chen", bio: "Your calm companion for the next step. Maya combines thoughtful explanations and achievable challenges to help skiers trust themselves on new terrain.", color: "blue", years: 9, age: [5, 85], specialties: ["confidence", "technique", "steep", "turns"], terrain: ["greens", "blues", "blacks", "steep"], style: ["patient", "structured", "explanations"], communication: ["encouraging", "detailed", "gentle"], languages: ["English", "Mandarin"], less: "Competitive race preparation", rating: 4.97, lessons: 920 },
    { name: "Finn Walker", bio: "Find the fun in every run. Finn brings a relaxed, adventurous approach to lessons, with a love of powder, trees, and discovering a new line.", color: "sand", years: 11, age: [7, 85], specialties: ["powder", "adventure", "confidence", "freeride"], terrain: ["powder", "trees", "blacks", "blues"], style: ["playful", "exploration", "practice"], communication: ["relaxed", "encouraging", "concise"], languages: ["English", "German"], less: "Highly detailed, drill-heavy instruction", rating: 4.91, lessons: 1135 },
    { name: "Sofia Alvarez", bio: "A family favorite who makes the mountain feel welcoming. Sofia creates individual challenges inside shared lessons, so everyone leaves with something to celebrate.", color: "rose", years: 14, age: [3, 85], specialties: ["family", "beginners", "confidence", "mixed levels"], terrain: ["greens", "blues", "groomers"], style: ["patient", "playful", "demonstrations"], communication: ["gentle", "encouraging", "clear"], languages: ["English", "Spanish"], less: "Expert off-piste objectives", rating: 4.99, lessons: 1620 },
    { name: "Noah Berg", bio: "A mountain guide at heart. Noah helps experienced skiers move beyond the piste with considered technique, terrain reading, and respect for the mountain.", color: "slate", years: 18, age: [16, 85], specialties: ["powder", "freeride", "steep", "technique"], terrain: ["trees", "powder", "blacks", "steep"], style: ["technical", "exploration", "practice"], communication: ["direct", "concise", "calm"], languages: ["English", "Norwegian"], less: "First-time skiers and children's play-based lessons", rating: 4.95, lessons: 2100 },
    { name: "Amara James", bio: "A fresh start is always possible. Amara specializes in return-to-snow confidence, gentle progression, and finding a pace that feels right for you.", color: "sage", years: 8, age: [8, 85], specialties: ["confidence", "returning", "beginners", "turns"], terrain: ["greens", "blues", "groomers"], style: ["patient", "explanations", "practice"], communication: ["gentle", "detailed", "encouraging"], languages: ["English", "French"], less: "Fast-paced expert terrain exploration", rating: 4.96, lessons: 780 },
    { name: "Theo Laurent", bio: "Progress with a plan. Theo uses focused drills and precise feedback to help ambitious skiers build technique that holds up when the terrain gets interesting.", color: "clay", years: 13, age: [10, 85], specialties: ["carving", "technique", "moguls", "speed"], terrain: ["blues", "blacks", "moguls", "steep"], style: ["structured", "technical", "practice"], communication: ["direct", "detailed", "clear"], languages: ["English", "French"], less: "Very young beginners", rating: 4.93, lessons: 1450 },
];
// Broad demo coverage is intentional; specialist profiles narrow level, resort,
// lesson type and schedule eligibility to make hard constraints observable.
export const instructors: Instructor[] = seeds.map((s, i) => ({
    id: `instructor-${i + 1}`, name: s.name, biography: s.bio, color: s.color,
    resorts: i === 5 ? ["Whistler Blackcomb", "Vail"] : i === 7 ? ["Vail", "Park City"] : RESORTS,
    certifications: i === 5 ? ["CSIA Level 4", "Mountain guide"] : [i % 2 ? "PSIA Level III" : "CSIA Level 3", "First aid"],
    yearsTeaching: s.years, ageGroups: s.age as [
        number,
        number
    ],
    levels: i === 5 ? SKI_LEVELS.slice(3) : i === 7 ? SKI_LEVELS.slice(2) : [...SKI_LEVELS],
    specialties: s.specialties, terrainExpertise: s.terrain, teachingStyle: s.style,
    communicationStyle: s.communication,
    lessonTypes: i === 5 ? ["private"] : ["private", "group"],
    languages: s.languages,
    availability: { weekdays: i === 7 ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6], slots: i === 5 ? ["morning"] : i === 7 ? ["morning", "afternoon"] : [...allSlots] },
    rating: s.rating, lessonsTaught: s.lessons,
    learnedProfile: {
        successfulStudentTypes: [s.specialties[0] === "confidence" ? "Skiers building confidence" : `${s.specialties[0]}-focused skiers`, `Students aged ${s.age[0]}+`],
        recurringStrengths: [s.style[0] + " progression", s.communication[0] + " feedback"],
        lessEffectiveSituations: [s.less],
        commonFeedback: [i % 2 ? "Clear feedback I could use on the very next run." : "I felt supported and made progress at my own pace."],
        outcomeCount: Math.round(s.lessons * 0.6),
    },
}));
