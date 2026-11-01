import { Instructor, InstructorLessonAssessment, Student, StudentLessonAssessment, LessonSlot, LEVEL_LABELS } from "../types/domain";
import { parseGoals, parseConfidence, parseTerrain, parseLearning, profileText } from "./profile";
export interface StudentProgress {
  student: Student; previousAbility: string; progress: string; strengths: string;
  nextSkills: string; practice: string; lessonType: "Private lesson" | "Group placement";
  slot: LessonSlot; instructorCharacteristics: string; caution?: string;
}
export function buildProgress(student: Student, feedback: StudentLessonAssessment, assessment: InstructorLessonAssessment): StudentProgress {
  const needsSupport = /less confident/i.test(feedback.confidenceAfter) || feedback.challenge === "Too challenging";
  const prefersGroup = /group/i.test(assessment.nextLessonRecommendations) && !needsSupport;
  return {
    // Preserve original ability wording when adding the instructor's normalized observation.
    student: { ...student, ability: { ...student.ability, level: assessment.assessedAbility, source: "instructor" },
      goals: parseGoals(feedback.responses.nextGoals), confidence: parseConfidence(feedback.responses.confidenceAfter),
      terrain: parseTerrain(assessment.responses.suggestedTerrain), learningPreferences: parseLearning(assessment.responses.learningCharacteristics) },
    previousAbility: LEVEL_LABELS[student.ability.level], progress: feedback.learned, strengths: assessment.technicalStrengths,
    nextSkills: `${assessment.nextSkills}. Your goal: ${feedback.nextGoals}.`, practice: assessment.suggestedTerrain,
    lessonType: prefersGroup ? "Group placement" : "Private lesson",
    slot: needsSupport ? "morning" : /full.day/i.test(assessment.nextLessonRecommendations) ? "full_day" : /afternoon/i.test(assessment.nextLessonRecommendations) ? "afternoon" : "morning",
    instructorCharacteristics: `${assessment.learningCharacteristics}. ${assessment.nextLessonRecommendations}`,
    caution: feedback.teachingStyleFit === "Not a fit" ? `Choose a different teaching approach. Student feedback: ${feedback.whatDidNot}`
      : feedback.whatDidNot !== "Nothing to add" ? `Next time, address: ${feedback.whatDidNot}` : needsSupport ? "Keep progression gentle and check confidence often." : undefined,
  };
}
const unique = (values: string[]) => [...new Set(values)];
export function updateLearnedProfile(instructor: Instructor, student: Student, feedback: StudentLessonAssessment, assessment: InstructorLessonAssessment): Instructor {
  const positive = feedback.teachingStyleFit === "Great fit" && ["Excellent", "Good"].includes(feedback.overallExperience);
  const concern = feedback.whatDidNot !== "Nothing to add" || feedback.teachingStyleFit === "Not a fit" || feedback.challenge !== "Just right";
  return { ...instructor, learnedProfile: {
    successfulStudentTypes: unique([...instructor.learnedProfile.successfulStudentTypes, ...(positive ? [`New observation: ${LEVEL_LABELS[student.ability.level]} skier, age ${student.age}, seeking ${profileText(student.goals)}`] : [])]),
    recurringStrengths: unique([...instructor.learnedProfile.recurringStrengths, ...(positive ? [`New observation: ${feedback.whatWorked}`] : [])]),
    lessEffectiveSituations: unique([...instructor.learnedProfile.lessEffectiveSituations, ...(concern ? [`New observation: ${feedback.whatDidNot}; challenge: ${feedback.challenge}; style: ${feedback.teachingStyleFit}`] : [])]),
    commonFeedback: unique([...instructor.learnedProfile.commonFeedback, `New feedback: ${feedback.overallExperience}; ${feedback.whatWorked}; ${feedback.teachingStyleFit}`, `Instructor observed: ${assessment.learningCharacteristics}`]),
    outcomeCount: instructor.learnedProfile.outcomeCount + 1,
  } };
}
