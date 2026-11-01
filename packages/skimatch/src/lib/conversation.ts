import { BookingRequest, GroupPlacementRequest, LessonRequest, CustomerAnswer, Student, SKI_LEVELS, LEVEL_LABELS, LESSON_SLOTS, StudentLessonAssessment, InstructorLessonAssessment, Resort } from "../types/domain";
import { RESORTS } from "../data/instructors";
import { answerText, inferLevel, parseTerrain, parseGoals, parseLearning, parseConfidence, parseSlot } from "./profile";
export { inferLevel } from "./profile";
export interface Question { key: string; prompt: string; suggestions?: string[]; studentField?: boolean; previousAnswer?: CustomerAnswer }
export function newStudent(): Student {
  return { id: "student-1", name: "", age: 0, ageCommentary: "",
    ability: { level: "unknown", source: "unresolved", commentary: "" }, experience: "",
    goals: { structured: [], commentary: "" }, terrain: { structured: [], commentary: "" },
    confidence: { structured: [], commentary: "" }, learningPreferences: { structured: [], commentary: "" }, specialConsiderations: "" };
}
export function newRequest(student: Student = newStudent()): LessonRequest {
  return { id: "request-demo", kind: "private", resort: RESORTS[0], requestedDate: "", slot: "morning", student,
    instructorPreferences: { structured: [], commentary: "" }, additionalInformation: "", answers: {} };
}
export function parseLessonType(answer: CustomerAnswer): "private" | "group" | undefined {
  if (answer.selectedOption === "Private") return "private";
  if (answer.selectedOption === "Group") return "group";
  const text = answer.commentary.toLowerCase();
  if (/private|one.on.one/.test(text) && !/group/.test(text)) return "private";
  if (/group|other skiers|ski school/.test(text) && !/private/.test(text)) return "group";
}
export function parseResort(answer: CustomerAnswer): Resort | undefined {
  const text = (answer.selectedOption || answer.commentary).toLowerCase();
  return RESORTS.find(r => text.includes(r.split(" ")[0].toLowerCase()));
}
export function parseDate(answer: CustomerAnswer): string | undefined {
  const text = (answer.selectedOption || answer.commentary).trim().toLowerCase();
  if (text === "today" || text === "tomorrow") {
    const date = new Date(); if (text === "tomorrow") date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  const match = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return match?.[1];
}
export function bookingQuestions(request: BookingRequest): Question[] {
  const s = request.student; const name = s.name || "the skier";
  const questions: Question[] = [
    { key: "kind", prompt: "What type of lesson are you looking for? Private is one student with an instructor. Group is one student's request to join a ski-school group.", suggestions: ["Private", "Group"] },
    { key: "resort", prompt: request.kind === "group" ? "We'll match you with skiers of similar ability, goals, and learning style. Which mountain would you like to visit?" : "Which mountain would you like to visit?", suggestions: RESORTS },
    { key: "requestedDate", prompt: "What date would you like to ski? You can say today, tomorrow, or give a date as YYYY-MM-DD.", suggestions: ["Today", "Tomorrow"] },
    { key: "slot", prompt: "What part of the day works best? Morning and afternoon lessons are 3 hours; full day is a full-day lesson.", suggestions: Object.values(LESSON_SLOTS).map(s => s.label) },
    { key: "name", studentField: true, prompt: "What's the student's name? This booking is for one skier." },
    { key: "age", studentField: true, prompt: `How old is ${name}? For example, “8 years old” or “I'm 34”.` },
    { key: "ability", studentField: true, prompt: `How would you describe ${name}'s skiing? Tell me however you'd describe it — you don't need to know the ski-school terminology.`, suggestions: [...SKI_LEVELS.map(l => LEVEL_LABELS[l]), "I'm not sure"] },
    { key: "experience", studentField: true, prompt: `What skiing experience does ${name} have? Days on snow, past lessons, or a break from skiing all help.`, suggestions: ["Never skied before", "A few days on snow", "A week each winter", "Returning after a long break"] },
    { key: "terrain", studentField: true, prompt: `What terrain is ${name} comfortable skiing? You can choose a starting point and tell us which runs feel good or tricky.`, suggestions: ["Learning area", "Green runs", "Blue runs", "Black runs", "Double black / expert terrain", "Mixed / varies"] },
    { key: "goals", studentField: true, prompt: `What would make this a great lesson for ${name}?`, suggestions: ["Build confidence", "Improve carving", "Feel confident on steep terrain", "Learn my first turns", "Explore new terrain"] },
    { key: "confidence", studentField: true, prompt: `How confident does ${name} feel on snow?`, suggestions: ["Nervous — reassurance helps", "Comfortable on familiar runs", "Confident and ready for a challenge"] },
    { key: "learningPreferences", studentField: true, prompt: `How does ${name} like to learn? Include how you'd like an instructor to communicate.`, suggestions: ["Show me first", "Explain the technique", "Let me practice", "Keep it playful", "Patient encouragement"] },
    { key: "specialConsiderations", studentField: true, prompt: `Anything we should consider for ${name}? You can mention access needs, fatigue, an old injury, or preferred pace.`, suggestions: ["Nothing to add", "Plenty of breaks", "A slower pace"] },
  ];
  if (request.kind === "private") questions.push({ key: "instructorPreferences", prompt: "What would you love in your instructor? You can mention style, language, or another preference.", suggestions: ["Patient and encouraging", "Technical and direct", "Playful and great with children", "No additional preference"] });
  questions.push({ key: "additionalInformation", prompt: request.kind === "group" ? "Anything else the ski school should know before considering a suitable group?" : "Anything else that would make your mountain day better? Then we'll find your instructor matches.", suggestions: ["Nothing else", "I'd like a relaxed day"] });
  return questions.map(q => {
    const previous = request.answers[q.key];
    return previous ? { ...q, previousAnswer: previous } : q;
  });
}
export function validateAnswer(question: Question, answer: CustomerAnswer): string | undefined {
  const text = answerText(answer);
  if (!text.trim()) return "Tell me a little, or choose a suggestion to continue.";
  if (text.length > 1600) return "Please keep this answer under 1,600 characters.";
  if (question.key === "kind" && !parseLessonType(answer)) return "Do you mean a private instructor lesson or placement in a ski-school group? You can describe either in your own words.";
  if (question.key === "resort" && !parseResort(answer)) return "This demo supports Whistler Blackcomb, Vail, and Park City. Which of those mountains do you mean?";
  if (question.key === "slot" && !parseSlot(answer)) return "Would morning, afternoon, or a full day work? This demo uses fixed lesson slots, so you don't need to choose a start time or duration.";
  if (question.key === "requestedDate") {
    const value = parseDate(answer); const date = new Date(`${value}T12:00:00`); const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!value || Number.isNaN(date.getTime()) || date.getDate() !== Number(value.slice(-2)) || date < today) return "Could you give a valid date today or in the future? Try tomorrow or YYYY-MM-DD.";
  }
  if (question.key === "age") {
    const numbers = text.match(/\d+/g);
    if (!numbers || numbers.length !== 1 || /\d+\.\d+/.test(text) || Number(numbers[0]) < 1 || Number(numbers[0]) > 100) return "What is the skier's age in whole years? For example, 8 years old.";
  }
  if (question.key === "assessedAbility" && inferLevel(answerText(answer)) === "unknown") return "Describe the runs they can ski or use a suggested level so we can record an assessment.";
}
export function applyBookingAnswer(request: BookingRequest, question: Question, answer: CustomerAnswer): BookingRequest {
  const text = answerText(answer);
  const updated = { ...request, answers: { ...request.answers, [question.key]: { ...answer } } };
  if (question.key === "kind") {
    const { id, resort, requestedDate, slot, student, additionalInformation, answers } = updated;
    const shared = { id, resort, requestedDate, slot, student, additionalInformation, answers };
    return parseLessonType(answer) === "group" ? { ...shared, kind: "group", status: "draft" }
      : { ...shared, kind: "private", instructorPreferences: request.kind === "private" ? request.instructorPreferences : { structured: [], commentary: "" } };
  }
  if (question.key === "resort") return { ...updated, resort: parseResort(answer)! };
  if (question.key === "requestedDate") return { ...updated, requestedDate: parseDate(answer)! };
  if (question.key === "slot") return { ...updated, slot: parseSlot(answer)! };
  if (question.key === "instructorPreferences" && updated.kind === "private") return { ...updated, instructorPreferences: parseLearning(answer) };
  if (question.key === "additionalInformation") return { ...updated, additionalInformation: text };
  const student = { ...request.student };
  switch (question.key) {
    case "name": student.name = text; break;
    case "age": student.age = Number(text.match(/\d+/)![0]); student.ageCommentary = answer.commentary; break;
    case "ability": {
      const selected = SKI_LEVELS.find(l => LEVEL_LABELS[l] === answer.selectedOption);
      const level = selected || inferLevel(answer.commentary || answer.selectedOption || "");
      student.ability = { ...answer, level, source: selected ? "customer" : level === "unknown" ? "unresolved" : "inferred" }; break;
    }
    case "experience": student.experience = text; break;
    case "terrain": student.terrain = parseTerrain(answer); break;
    case "goals": student.goals = parseGoals(answer); break;
    case "confidence": student.confidence = parseConfidence(answer); break;
    case "learningPreferences": student.learningPreferences = parseLearning(answer); break;
    case "specialConsiderations": student.specialConsiderations = text; break;
  }
  if (student.ability.level === "unknown" && ["terrain", "experience"].includes(question.key)) {
    const inferred = inferLevel(text);
    if (inferred !== "unknown") student.ability = { ...student.ability, level: inferred, source: "inferred" };
  }
  return { ...updated, student };
}
export function queueGroupPlacement(request: GroupPlacementRequest): GroupPlacementRequest {
  return { ...request, status: "queued" };
}
export const studentFollowup: Question[] = [
  { key: "overallExperience", prompt: "How did the lesson feel overall?", suggestions: ["Excellent", "Good", "Mixed", "Disappointing"] },
  { key: "whatWorked", prompt: "What worked particularly well?", suggestions: ["Patient demonstrations made it click", "Clear technical feedback", "Fun practice at my own pace"] },
  { key: "whatDidNot", prompt: "What didn't work so well?", suggestions: ["Nothing to add", "Too much talking", "The pace felt too fast", "I wanted more practice"] },
  { key: "challenge", prompt: "Was the lesson challenging enough?", suggestions: ["Just right", "Too easy", "Too challenging"] },
  { key: "confidenceAfter", prompt: "How does your confidence feel now?", suggestions: ["More confident", "About the same", "Less confident"] },
  { key: "learned", prompt: "What did you learn or improve?", suggestions: ["More controlled linked turns", "Better balance and edge control", "My first comfortable blue run"] },
  { key: "nextGoals", prompt: "What would you like to work on next?", suggestions: ["Confident turns on steeper blues", "Carving on groomers", "Gentle progression and more practice"] },
  { key: "teachingStyleFit", prompt: "How well did the instructor's teaching style work for you?", suggestions: ["Great fit", "Mostly a fit", "Not a fit"] },
];
export const instructorFollowup: Question[] = [
  { key: "skillsWorkedOn", prompt: "Which skills did you work on together?", suggestions: ["Linked turns and speed control", "Balance, edging and carving", "Stopping and first turns"] },
  { key: "assessedAbility", prompt: "What ability level did you observe at the end of the lesson?", suggestions: SKI_LEVELS.map(l => LEVEL_LABELS[l]) },
  { key: "technicalStrengths", prompt: "What technical strengths stood out?", suggestions: ["Good balance and consistent turns", "Strong edge control", "Responds well to demonstrations"] },
  { key: "technicalWeaknesses", prompt: "Where does the student still need support?", suggestions: ["Maintaining control on steeper terrain", "Consistent parallel turns", "Balance and stopping"] },
  { key: "terrainComfort", prompt: "Which terrain felt comfortable today?", suggestions: ["Gentle greens", "Groomed blues", "Blues and selected blacks"] },
  { key: "confidence", prompt: "How did the student's confidence develop?", suggestions: ["Steady improvement", "Confident throughout", "Still needs reassurance"] },
  { key: "nextSkills", prompt: "Which skills should the next lesson focus on?", suggestions: ["Linked turns and speed control on blues", "Edge control and carving", "Balance and gentle turns"] },
  { key: "suggestedTerrain", prompt: "What terrain or practice would you suggest?", suggestions: ["Wide, quiet groomed blues; repeat familiar runs", "Gentle greens with space to practice", "Groomed blues progressing to selected blacks"] },
  { key: "learningCharacteristics", prompt: "What learning characteristics did you observe?", suggestions: ["Learns through patient demonstrations", "Likes detailed technical explanations", "Responds to playful practice"] },
  { key: "nextLessonRecommendations", prompt: "What would help the next instructor or lesson?", suggestions: ["Patient coaching, morning private lesson, gradual progression", "Technical coaching, afternoon private lesson, focused drills", "Playful coaching, morning group placement", "Full-day private lesson with breaks"] },
];
function required(answers: Record<string, CustomerAnswer>, key: string): string {
  const value = answers[key] && answerText(answers[key]); if (!value?.trim()) throw new Error(`Incomplete check-in: ${key}`); return value;
}
function category(answers: Record<string, CustomerAnswer>, key: string, script: Question[]): string {
  const text = required(answers, key); const q = script.find(q => q.key === key);
  return answers[key].selectedOption || q?.suggestions?.find(s => text.toLowerCase().startsWith(s.toLowerCase())) || text;
}
export function createStudentAssessment(lessonId: string, studentId: string, a: Record<string, CustomerAnswer>): StudentLessonAssessment {
  return { lessonId, studentId, responses: { ...a }, overallExperience: category(a, "overallExperience", studentFollowup),
    whatWorked: required(a, "whatWorked"), whatDidNot: required(a, "whatDidNot"), challenge: category(a, "challenge", studentFollowup),
    confidenceAfter: required(a, "confidenceAfter"), learned: required(a, "learned"), nextGoals: required(a, "nextGoals"), teachingStyleFit: category(a, "teachingStyleFit", studentFollowup) };
}
export function createInstructorAssessment(lessonId: string, studentId: string, a: Record<string, CustomerAnswer>): InstructorLessonAssessment {
  const ability = inferLevel(a.assessedAbility?.selectedOption || required(a, "assessedAbility"));
  if (ability === "unknown") throw new Error("Choose or describe a valid assessed skiing level");
  return { lessonId, studentId, responses: { ...a }, assessedAbility: ability, skillsWorkedOn: required(a, "skillsWorkedOn"),
    technicalStrengths: required(a, "technicalStrengths"), technicalWeaknesses: required(a, "technicalWeaknesses"), terrainComfort: required(a, "terrainComfort"),
    confidence: required(a, "confidence"), nextSkills: required(a, "nextSkills"), suggestedTerrain: required(a, "suggestedTerrain"),
    learningCharacteristics: required(a, "learningCharacteristics"), nextLessonRecommendations: required(a, "nextLessonRecommendations") };
}
