import type { Student, Instructor, GroupLesson, LessonSlot } from "./domain";
export interface POSReference { system: "mock-pos"; entity: "reservation" | "customer" | "employee"; id: string }
export interface SkierProfile extends Student { posReference: POSReference }
export interface InstructorProfile extends Instructor { posReference: POSReference; maxTeachingHours: number }
export interface InstructorAvailability { instructorId: string; date: string; available: boolean; slots: LessonSlot[]; reason?: string }
export interface LessonAssignment { id: string; date: string; label: string; instructorId: string; studentIds: string[]; kind: "private" | "group"; start: number; end: number; groupId?: string; status: "scheduled" | "cancelled"; posReference: POSReference }
export interface OperatingGroup extends GroupLesson { name: string; studentIds: string[]; capacity: number; compatibility: number; targetLevel: "intermediate" | "advanced" }
export interface GroupPlacement { studentId: string; groupId: string; compatibility: number }
export interface WaitlistEntry { id: string; studentId: string; date: string; slot: LessonSlot; kind: "private" | "group"; flexibleInstructor: boolean; status: "waiting" | "offered"; goals: string[] }
export type IssueType = "instructor_unavailable" | "customer_cancellation" | "reschedule_request" | "group_imbalance" | "instructor_mismatch" | "student_mismatch" | "waitlist_opportunity" | "capacity_opportunity" | "schedule_gap" | "instructor_overutilization";
export type IssueStatus = "new" | "plan_ready" | "needs_approval" | "approved" | "executing" | "resolved" | "failed";
export interface OperationalIssue { id: string; type: IssueType; severity: "high" | "medium" | "low"; title: string; description: string; affectedPeople: string[]; affectedLessons: string[]; status: IssueStatus; planId: string }
export type ActionType = "reassign_instructor" | "move_student" | "create_group" | "combine_groups" | "split_group" | "offer_waitlist_opening" | "reschedule_lesson" | "cancel_lesson" | "contact_customer" | "contact_instructor" | "adjust_instructor_schedule";
export interface ProposedAction { id: string; type: ActionType; description: string; risk: "low" | "medium" | "high"; lessonId?: string; instructorId?: string; studentId?: string; fromGroupId?: string; toGroupId?: string; waitlistId?: string; start?: number; end?: number }
export interface ActionValidation { actionId: string; passed: boolean; checks: string[]; errors: string[] }
export interface ResolutionPlan { id: string; issueId: string; actions: ProposedAction[]; explanation: string; expectedOperationalImpact: string; customerImpact: string; instructorImpact: string; confidence: number; qualityIndicators: string[]; validations: ActionValidation[]; requiresManagerApproval: boolean; status: IssueStatus }
export interface ActionOutcome { actionId: string; status: "verified" | "failed"; detail: string; timestamp: string }
export interface OperationalObservation { id: string; issueId: string; text: string; source: "verification" | "student_feedback" | "instructor_feedback" }
export interface ManagerDecision { planId: string; decision: "approved"; timestamp: string; actor: "demo-manager" }
export interface Schedule { date: string; assignments: LessonAssignment[]; availability: InstructorAvailability[] }
export interface SchoolDay { date: string; students: SkierProfile[]; instructors: InstructorProfile[]; schedule: Schedule; groups: OperatingGroup[]; placements: GroupPlacement[]; waitlist: WaitlistEntry[] }
export interface OperatingState { day: SchoolDay; issues: OperationalIssue[]; plans: ResolutionPlan[]; outcomes: ActionOutcome[]; decisions: ManagerDecision[]; observations: OperationalObservation[] }
