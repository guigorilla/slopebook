export const SKI_LEVELS = ["first_timer", "beginner", "advanced_beginner", "intermediate", "advanced", "expert"] as const;
export type SkiLevel = typeof SKI_LEVELS[number];
export const LEVEL_LABELS: Record<SkiLevel | "unknown", string> = {
  first_timer: "First timer", beginner: "Beginner", advanced_beginner: "Advanced beginner",
  intermediate: "Intermediate", advanced: "Advanced", expert: "Expert", unknown: "Not sure yet",
};
export type LessonType = "private" | "group";
export type Resort = "Whistler Blackcomb" | "Vail" | "Park City";
export type LessonSlot = "morning" | "afternoon" | "full_day";
export type LessonDuration = { kind: "hours"; hours: 3 } | { kind: "full_day" };
export const LESSON_SLOTS: Record<LessonSlot, { label: string; duration: LessonDuration }> = {
  morning: { label: "Morning — 3 hours", duration: { kind: "hours", hours: 3 } },
  afternoon: { label: "Afternoon — 3 hours", duration: { kind: "hours", hours: 3 } },
  full_day: { label: "Full day", duration: { kind: "full_day" } },
};
export type Terrain = "learning_area" | "green" | "blue" | "easy_black" | "black" | "expert" | "mixed" | "groomed" | "powder" | "trees" | "moguls";
export type Goal = "first_turns" | "confidence" | "carving" | "steep_terrain_confidence" | "turn_control" | "technique" | "exploration";
export type LearningPreference = "demonstration" | "technical_explanation" | "practice" | "playful" | "patient" | "structured" | "direct_feedback" | "encouragement";
export type Confidence = "nervous" | "comfortable" | "confident";

// Chips are shortcuts. Selection and original free text remain separate.
export interface CustomerAnswer {
  selectedOption?: string;
  commentary: string;
}
export interface ProfileAttribute<T extends string> extends CustomerAnswer {
  structured: T[];
}
export interface Student {
  id: string;
  name: string;
  age: number;
  ageCommentary: string;
  ability: CustomerAnswer & { level: SkiLevel | "unknown"; source: "customer" | "inferred" | "instructor" | "unresolved" };
  experience: string;
  goals: ProfileAttribute<Goal>;
  terrain: ProfileAttribute<Terrain>;
  confidence: ProfileAttribute<Confidence>;
  learningPreferences: ProfileAttribute<LearningPreference>;
  specialConsiderations: string;
}
export interface BookingDetails {
  id: string;
  resort: Resort;
  requestedDate: string;
  slot: LessonSlot;
  student: Student;
  additionalInformation: string;
  // Keeps scheduling/resort wording and every other original booking answer.
  answers: Record<string, CustomerAnswer>;
}
/** A private instructor booking request for exactly one student. */
export interface LessonRequest extends BookingDetails {
  kind: "private";
  instructorPreferences: ProfileAttribute<LearningPreference>;
}
/** One student's request for ski-school placement, not a booked group. */
export interface GroupPlacementRequest extends BookingDetails {
  kind: "group";
  status: "draft" | "queued" | "allocated";
  // Assigned only after enough compatible queued students can be allocated.
  groupLessonId?: string;
  // No instructor, participant count, or other students chosen by the customer.
}
export type BookingRequest = LessonRequest | GroupPlacementRequest;
/** Future ski-school composed group; intentionally not created by this demo. */
export interface GroupLesson {
  id: string;
  resort: Resort;
  requestedDate: string;
  slot: LessonSlot;
  placementRequests: GroupPlacementRequest[];
  instructorAssignment:
    | { status: "pending"; method: "background_agent" }
    | { status: "assigned"; method: "background_agent"; instructorId: string };
  status: "planned" | "scheduled" | "completed";
}
export interface LearnedProfile {
  successfulStudentTypes: string[];
  recurringStrengths: string[];
  lessEffectiveSituations: string[];
  commonFeedback: string[];
  outcomeCount: number;
}
export interface Instructor {
  id: string; name: string; biography: string; color: string;
  resorts: Resort[]; certifications: string[]; yearsTeaching: number;
  ageGroups: [number, number]; levels: SkiLevel[];
  specialties: string[]; terrainExpertise: string[];
  teachingStyle: string[]; communicationStyle: string[];
  lessonTypes: LessonType[]; languages: string[];
  availability: { weekdays: number[]; slots: LessonSlot[] };
  rating: number; lessonsTaught: number; learnedProfile: LearnedProfile;
}
export interface Lesson {
  id: string;
  request: LessonRequest;
  instructorId: string;
  status: "booked" | "completed";
}
export interface StudentLessonAssessment {
  lessonId: string; studentId: string;
  overallExperience: string; whatWorked: string; whatDidNot: string;
  challenge: string; confidenceAfter: string; learned: string;
  nextGoals: string; teachingStyleFit: string;
  responses: Record<string, CustomerAnswer>;
}
export interface InstructorLessonAssessment {
  lessonId: string; studentId: string;
  skillsWorkedOn: string; assessedAbility: SkiLevel;
  technicalStrengths: string; technicalWeaknesses: string;
  terrainComfort: string; confidence: string; nextSkills: string;
  suggestedTerrain: string; learningCharacteristics: string;
  nextLessonRecommendations: string;
  responses: Record<string, CustomerAnswer>;
}
export interface InstructorMatch {
  instructor: Instructor; score: number; reasons: string[]; mismatch?: string;
  breakdown: { category: string; points: number; possible: number }[];
}
