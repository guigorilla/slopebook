import { BookingRequest, Instructor, InstructorMatch, LessonRequest, SkiLevel, LEVEL_LABELS, LESSON_SLOTS } from "../types/domain";
import { answerText } from "./profile";
// Mapping normalized customer attributes to existing instructor expertise tags.
const goalTags: Record<string, string[]> = {
  first_turns: ["beginners", "turns"], confidence: ["confidence"], carving: ["carving"],
  steep_terrain_confidence: ["steep", "confidence"], turn_control: ["turns"], technique: ["technique"], exploration: ["adventure", "freeride", "powder"],
};
const terrainTags: Record<string, string[]> = {
  learning_area: ["greens"], green: ["greens"], blue: ["blues"], easy_black: ["blacks"], black: ["blacks"],
  expert: ["steep", "blacks"], groomed: ["groomers"], powder: ["powder"], trees: ["trees"], moguls: ["moguls"],
};
const styleTags: Record<string, string[]> = {
  demonstration: ["demonstrations"], technical_explanation: ["technical", "explanations"], practice: ["practice"],
  playful: ["playful"], patient: ["patient"], structured: ["structured"], direct_feedback: ["technical"], encouragement: ["patient"],
};
const communicationTags: Record<string, string[]> = {
  technical_explanation: ["detailed", "clear"], patient: ["gentle", "calm"],
  direct_feedback: ["direct"], encouragement: ["encouraging"], nervous: ["gentle", "encouraging", "calm"],
};
function fit(values: string[], tags: string[], mapping: Record<string, string[]>): { fraction: number; matched: string[] } {
  const known = [...new Set(values)].filter(v => mapping[v]);
  const matched = known.filter(v => mapping[v].some(tag => tags.includes(tag)));
  return { fraction: known.length ? matched.length / known.length : 0, matched };
}
export function eligibilityProblems(instructor: Instructor, request: BookingRequest): string[] {
  if (request.kind !== "private") return ["Group placement uses future background matching, not customer instructor selection"];
  const weekday = new Date(`${request.requestedDate}T12:00:00`).getDay();
  return [
    !instructor.resorts.includes(request.resort) && "Does not teach at this resort",
    (!instructor.availability.weekdays.includes(weekday) || !instructor.availability.slots.includes(request.slot)) && "Unavailable for this date or lesson slot",
    (request.student.ability.level === "unknown" || !instructor.levels.includes(request.student.ability.level as SkiLevel)) && "Student level is unresolved or outside the instructor's taught levels",
    !instructor.lessonTypes.includes("private") && "Does not offer private lessons",
  ].filter((p): p is string => Boolean(p));
}
// Only private requests enter customer-facing matching. Full-day availability is
// explicit: being available for morning and afternoon does not imply full day.
// 50 eligibility points + 15 goals + 12 style + 10 terrain + 8 age + 5 communication.
export function matchInstructors(request: BookingRequest, pool: Instructor[]): InstructorMatch[] {
  if (request.kind !== "private" || !request.requestedDate || !request.student.name || !request.student.age) return [];
  return pool.filter(i => !eligibilityProblems(i, request).length).map(i => scoreInstructor(i, request))
    .sort((a, b) => b.score - a.score || a.instructor.id.localeCompare(b.instructor.id)).slice(0, 3);
}
function scoreInstructor(instructor: Instructor, request: LessonRequest): InstructorMatch {
  const s = request.student;
  const learning = [...s.learningPreferences.structured, ...request.instructorPreferences.structured];
  const fits = [
    { category: "Goals", possible: 15, ...fit(s.goals.structured, instructor.specialties, goalTags) },
    { category: "Teaching style", possible: 12, ...fit(learning, instructor.teachingStyle, styleTags) },
    { category: "Terrain", possible: 10, ...fit(s.terrain.structured, instructor.terrainExpertise, terrainTags) },
    { category: "Age experience", possible: 8, fraction: s.age >= instructor.ageGroups[0] && s.age <= instructor.ageGroups[1] ? 1 : 0, matched: [] },
    { category: "Communication", possible: 5, ...fit([...learning, ...s.confidence.structured], instructor.communicationStyle, communicationTags) },
  ];
  const breakdown = fits.map(f => ({ category: f.category, possible: f.possible, points: Math.round(f.possible * f.fraction) }));
  const reasons = fits.filter(f => f.fraction > 0).sort((a, b) => b.possible * b.fraction - a.possible * a.fraction).slice(0, 3).map(f => f.category === "Age experience"
    ? `Experienced teaching skiers aged ${instructor.ageGroups[0]}–${instructor.ageGroups[1]}`
    : `${f.category} fit: ${f.matched.map(v => v.replaceAll("_", " ")).join(", ")}${f.fraction < 1 ? " (some preferences matched)" : ""}`);
  const fallbacks = [`Teaches ${LEVEL_LABELS[s.ability.level]} at ${request.resort}`, `Available for ${LESSON_SLOTS[request.slot].label.toLowerCase()} on your date`];
  while (reasons.length < 2) reasons.push(fallbacks[reasons.length]);
  const low = breakdown.find(b => b.category === "Age experience" && b.points === 0)
    || breakdown.find(b => b.points < b.possible / 2);
  const language = answerText(request.instructorPreferences).match(/\b(french|spanish|italian|german|mandarin|norwegian)\b/i)?.[0];
  const mismatch = language && !instructor.languages.some(l => l.toLowerCase() === language.toLowerCase()) ? `Does not list ${language} among spoken languages.`
    : low ? `${low.category} fit is limited or not yet specified. Worth discussing: ${instructor.learnedProfile.lessEffectiveSituations[0]}.` : undefined;
  return { instructor, score: 50 + breakdown.reduce((n, b) => n + b.points, 0), reasons, mismatch, breakdown };
}
