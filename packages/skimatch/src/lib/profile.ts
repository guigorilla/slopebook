import { CustomerAnswer, ProfileAttribute, SkiLevel, SKI_LEVELS, LEVEL_LABELS, Terrain, Goal, LearningPreference, Confidence, LessonSlot, LESSON_SLOTS } from "../types/domain";

export function answerText(answer: CustomerAnswer): string {
  return [answer.selectedOption, answer.commentary].filter(Boolean).join(" — ");
}
export function profileText(attribute: CustomerAnswer): string {
  return answerText(attribute) || "Not shared yet";
}
export function inferLevel(description: string): SkiLevel | "unknown" {
  const text = description.toLowerCase();
  const exact = SKI_LEVELS.find(level => LEVEL_LABELS[level].toLowerCase() === text || level === text);
  if (exact) return exact;
  if (/never skied|first time|first timer|no experience/.test(text)) return "first_timer";
  if (/double black|expert|all terrain|racing/.test(text)) return "expert";
  // Blues plus occasional easy blacks should not inflate someone to Advanced.
  if (/blue|intermediate|parallel/.test(text)) return "intermediate";
  if (/black|powder|mogul|off.piste/.test(text)) return "advanced";
  if (/green|link.*turn|advanced beginner/.test(text)) return "advanced_beginner";
  if (/beginner|snowplow|snowplough|pizza/.test(text)) return "beginner";
  return "unknown";
}
type Rules<T extends string> = [T, RegExp][];
const terrainRules: Rules<Terrain> = [
  ["learning_area", /learning area|nursery|bunny/], ["green", /green/], ["blue", /blue/],
  ["easy_black", /(?:easy|easier|gentle|some) blacks?/], ["black", /black/],
  ["expert", /double black|expert terrain/], ["mixed", /mixed|varies/],
  ["groomed", /groom|piste/], ["powder", /powder/], ["trees", /trees/], ["moguls", /mogul|bumps/],
];
const goalRules: Rules<Goal> = [
  ["first_turns", /first|learn.*ski/], ["confidence", /confiden|nervous|fear/],
  ["carving", /carv|skidd|edge/], ["steep_terrain_confidence", /steep|icy|ice/],
  ["turn_control", /turn|control|stop/], ["technique", /techni|parallel/], ["exploration", /explor|adventure|powder|trees/],
];
const learningRules: Rules<LearningPreference> = [
  ["demonstration", /demonstrat|show|watch|visual/], ["technical_explanation", /explain|explanation|technical|detail/],
  ["practice", /practice|doing|hands.on|repeat/], ["playful", /play|fun|game/],
  ["patient", /patient|slow|gentle|own pace/], ["structured", /structur|\bplan\b|drill/],
  ["direct_feedback", /direct|honest/], ["encouragement", /encourag|support|reassur/],
];
const confidenceRules: Rules<Confidence> = [["nervous", /nervous|anxious|scared|less confident|reassur/], ["comfortable", /comfortable|familiar|about the same/], ["confident", /confident|ready for a challenge/]];
function extract<T extends string>(answer: CustomerAnswer, rules: Rules<T>): ProfileAttribute<T> {
  const text = answerText(answer).toLowerCase();
  // Simple local rules skip negated clauses instead of treating disliked terrain
  // or "not long explanations" as a positive matching preference.
  const clauses = text.split(/\brather than\b|\binstead of\b/)[0].split(/[.;]|\bbut\b/);
  const positive = clauses.filter(c => !/\b(?:not|no|don't|doesn't|dislike|avoid|never)\b/.test(c)).join(" ");
  return { ...answer, structured: rules.filter(([, rule]) => rule.test(positive)).map(([tag]) => tag) };
}
export function parseTerrain(answer: CustomerAnswer): ProfileAttribute<Terrain> {
  const parsed = extract(answer, terrainRules);
  if (parsed.structured.includes("expert")) parsed.structured = parsed.structured.filter(v => v !== "black");
  else if (parsed.structured.includes("easy_black")) parsed.structured = parsed.structured.filter(v => v !== "black");
  return parsed;
}
export const parseGoals = (answer: CustomerAnswer) => extract(answer, goalRules);
export const parseLearning = (answer: CustomerAnswer) => extract(answer, learningRules);
export function parseConfidence(answer: CustomerAnswer): ProfileAttribute<Confidence> {
  const parsed = extract(answer, confidenceRules);
  if (parsed.structured.includes("nervous")) parsed.structured = ["nervous"];
  return parsed;
}
export function parseSlot(answer: CustomerAnswer): LessonSlot | undefined {
  const selected = Object.entries(LESSON_SLOTS).find(([, s]) => s.label === answer.selectedOption)?.[0] as LessonSlot | undefined;
  if (selected) return selected;
  const text = answer.commentary.toLowerCase();
  const slots: LessonSlot[] = [];
  if (/full[ -]?day|all[ -]?day/.test(text)) slots.push("full_day");
  if (/morning|\bam\b/.test(text)) slots.push("morning");
  if (/afternoon|\bpm\b/.test(text)) slots.push("afternoon");
  return slots.length === 1 ? slots[0] : undefined;
}
