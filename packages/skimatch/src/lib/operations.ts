import type { ActionValidation, OperatingState, ProposedAction, ResolutionPlan, SchoolDay } from "../types/operations";
import type { POSAdapter } from "./pos-adapter";
import { MockPOSAdapter } from "./pos-adapter";
const overlap = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start < b.end && b.start < a.end;
export function requiresApproval(action: ProposedAction) { return !["contact_customer", "contact_instructor", "offer_waitlist_opening"].includes(action.type); }
export function rankWaitlist(day: SchoolDay, instructorId = "pro-1") {
  const pro = day.instructors.find(p => p.id === instructorId)!;
  return day.waitlist.filter(w => w.status === "waiting" && w.date === day.date && w.kind === "private" && w.slot === "afternoon").map(w => {
    const student = day.students.find(s => s.id === w.studentId)!;
    const qualified = pro.levels.includes(student.ability.level as typeof pro.levels[number]) && student.age >= pro.ageGroups[0] && student.age <= pro.ageGroups[1];
    const goalFit = student.goals.structured.some(g => pro.specialties.includes(g));
    return { entry: w, student, score: qualified ? 65 + (goalFit ? 25 : 0) + (w.flexibleInstructor ? 8 : 0) : 0, reasons: ["Requested this date and afternoon", "Appropriate ability and age", goalFit ? "Instructor specializes in her learning goals" : "General learning-goal fit", w.flexibleInstructor ? "Flexible on instructor" : "Instructor preference needs confirmation"] };
  }).filter(w => w.score > 0).sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
}
export function validatePlan(plan: ResolutionPlan, adapter: POSAdapter, date: string): ActionValidation[] {
  const simulation = new MockPOSAdapter(adapter.getSchoolDay(date));
  return plan.actions.map(action => {
    const errors: string[] = [];
    const day = simulation.getSchoolDay(date);
    if (action.type === "reassign_instructor") {
      const lesson = simulation.getReservation(action.lessonId!); const pro = day.instructors.find(p => p.id === action.instructorId);
      if (!lesson || !pro) errors.push("Reservation or instructor missing");
      else {
        const availability = day.schedule.availability.find(a => a.instructorId === pro.id);
        if (!availability?.available || !availability.slots.includes(lesson.start >= 12 ? "afternoon" : "morning")) errors.push("Instructor unavailable");
        const other = day.schedule.assignments.filter(a => a.id !== lesson.id && a.instructorId === pro.id && a.status === "scheduled");
        if (other.some(a => overlap(a, lesson))) errors.push("Instructor schedule conflict");
        if (other.reduce((n, a) => n + a.end - a.start, lesson.end - lesson.start) > pro.maxTeachingHours) errors.push("Teaching-hour limit exceeded");
        if (!pro.lessonTypes.includes(lesson.kind) || lesson.studentIds.some(id => { const s = simulation.getCustomer(id); return !s || s.ability.level === "unknown" || !pro.levels.includes(s.ability.level) || s.age < pro.ageGroups[0] || s.age > pro.ageGroups[1]; })) errors.push("Profile eligibility mismatch");
      }
    } else if (action.type === "move_student") {
      const from = day.groups.find(g => g.id === action.fromGroupId); const to = day.groups.find(g => g.id === action.toGroupId); const student = simulation.getCustomer(action.studentId!);
      if (!from || !to || !student || !from.studentIds.includes(student.id)) errors.push("Placement missing");
      else {
        if (to.studentIds.length >= to.capacity || to.studentIds.includes(student.id)) errors.push("Group capacity exceeded or duplicate placement");
        if (student.ability.level !== to.targetLevel) errors.push("Target group ability mismatch");
        const target = day.schedule.assignments.find(a => a.groupId === to.id)!;
        const source = day.schedule.assignments.find(a => a.groupId === from.id)!;
        if (!target || !source || target.start !== source.start || target.end !== source.end) errors.push("Group times incompatible");
        if (target && day.schedule.assignments.some(a => a.id !== source?.id && a.id !== target.id && a.studentIds.includes(student.id) && overlap(a, target))) errors.push("Student schedule conflict");
      }
    } else if (action.type === "offer_waitlist_opening") {
      const w = day.waitlist.find(w => w.id === action.waitlistId);
      if (!w || w.status !== "waiting" || w.date !== date || w.slot !== "afternoon") errors.push("Waitlist request no longer eligible");
      if (!day.schedule.availability.find(a => a.instructorId === action.instructorId)?.available || day.schedule.assignments.some(a => a.status === "scheduled" && a.instructorId === action.instructorId && overlap(a, { start: 13, end: 16 }))) errors.push("Opening no longer available");
      if (day.waitlist.some(w => w.status === "offered")) errors.push("Opening already offered");
    } else if (action.type === "contact_customer") { if (!simulation.getCustomer(action.studentId!)) errors.push("Customer missing"); }
    else if (action.type === "contact_instructor") { if (!day.instructors.some(p => p.id === action.instructorId)) errors.push("Instructor missing"); }
    else errors.push("Action not supported by prototype validator");
    if (!errors.length) { try { simulation.execute(action); } catch { errors.push("Adapter rejected action"); } }
    return { actionId: action.id, passed: !errors.length, checks: ["Record exists", "Availability / capacity", "Schedule constraints", "Profile eligibility", "Policy checked"], errors };
  });
}
export function executePlan(state: OperatingState, planId: string, adapter: POSAdapter, approved: boolean): OperatingState {
  const next = structuredClone(state); const plan = next.plans.find(p => p.id === planId)!; const issue = next.issues.find(i => i.id === plan.issueId)!;
  if (plan.status === "resolved") return next;
  plan.validations = validatePlan(plan, adapter, next.day.date);
  if (plan.validations.some(v => !v.passed)) { plan.status = issue.status = "failed"; return next; }
  if (plan.actions.some(requiresApproval) && !approved) { plan.status = issue.status = "needs_approval"; return next; }
  const timestamp = new Date().toISOString();
  if (approved) { next.decisions.push({ planId, decision: "approved", timestamp, actor: "demo-manager" }); plan.status = issue.status = "approved"; }
  plan.status = issue.status = "executing";
  for (const action of plan.actions) {
    try {
      adapter.execute(action); const verified = adapter.verify(action);
      next.outcomes.push({ actionId: action.id, status: verified ? "verified" : "failed", detail: action.description, timestamp });
      if (!verified) throw new Error("Verification failed");
    } catch {
      if (!next.outcomes.some(o => o.actionId === action.id && o.status === "failed")) next.outcomes.push({ actionId: action.id, status: "failed", detail: "Execution failed; inspect current POS state before retrying.", timestamp });
      plan.status = issue.status = "failed"; next.day = adapter.getSchoolDay(next.day.date); return next;
    }
  }
  plan.status = issue.status = "resolved"; next.day = adapter.getSchoolDay(next.day.date);
  next.observations.push({ id: `observation-${planId}`, issueId: issue.id, source: "verification", text: plan.expectedOperationalImpact });
  if (issue.id === "sarah" && !next.issues.some(i => i.id === "opening")) {
    const candidate = rankWaitlist(next.day)[0];
    if (candidate) {
      next.issues.push({ id: "opening", type: "waitlist_opportunity", severity: "low", title: "An afternoon private slot just opened.", description: `${candidate.student.name} is the strongest fit for Mike’s afternoon.`, affectedPeople: [candidate.student.id, "pro-1"], affectedLessons: [], status: "plan_ready", planId: "plan-opening" });
      next.plans.push({ id: "plan-opening", issueId: "opening", actions: [{ id: "w1", type: "offer_waitlist_opening", description: `Offer Mike’s afternoon to ${candidate.student.name}`, risk: "low", waitlistId: candidate.entry.id, instructorId: "pro-1" }], explanation: candidate.reasons.join(" · "), expectedOperationalImpact: "1 waitlist offer recorded; acceptance is still pending.", customerImpact: "Requested afternoon with a carving specialist.", instructorImpact: "An available slot offered; no confirmed assignment yet.", confidence: candidate.score, qualityIndicators: ["Date and slot match", "Goal compatibility", "Instructor flexibility"], validations: [], requiresManagerApproval: false, status: "plan_ready" });
    }
  }
  return next;
}
export function managerReply(question: string, state: OperatingState): string {
  const q = question.toLowerCase(); const active = state.issues.filter(i => i.status !== "resolved");
  if (/blue|remy|group/.test(q)) return `${state.plans.find(p => p.issueId === "group")!.explanation} Current scores: ${state.day.groups[0].compatibility}% and ${state.day.groups[1].compatibility}%.`;
  if (/sarah|unavailable/.test(q)) return `Sarah’s plan is ${state.issues.find(i => i.id === "sarah")!.status.replaceAll("_", " ")}. ${state.plans[0].explanation} ${state.plans[0].expectedOperationalImpact}.`;
  if (/waitlist|opening|afternoon.*who|who.*afternoon/.test(q)) { const c = rankWaitlist(state.day)[0]; return state.issues.find(i => i.id === "opening")?.status === "resolved" ? "Jennifer’s offer has been recorded. Acceptance is pending; no reservation or payment has been created." : c ? `${c.student.name}: ${c.score}% simulated compatibility. ${c.reasons.join(". ")}. ${state.issues.some(i => i.id === "opening") ? "You can offer the slot from Waitlist." : "Resolve Sarah’s plan to unlock this offer."}` : "No eligible afternoon candidates remain."; }
  if (/overload|overutil/.test(q)) { const pros = state.day.instructors.filter(p => state.day.schedule.assignments.filter(a => a.instructorId === p.id && a.status === "scheduled").reduce((n, a) => n + a.end - a.start, 0) > p.maxTeachingHours); return pros.length ? `${pros.map(p => p.name).join(", ")} exceeds the six-hour teaching policy. Review the reassignment plan before changing the schedule.` : "All instructors are within their teaching-hour limits."; }
  if (/capacity|unused|gap/.test(q)) { const free = state.day.instructors.filter(p => state.day.schedule.availability.find(a => a.instructorId === p.id)?.available && !state.day.schedule.assignments.some(a => a.instructorId === p.id && a.status === "scheduled" && overlap(a, { start: 13, end: 16 }))); return `${free.length} pros have open afternoon capacity. ${free.slice(0, 4).map(p => p.name).join(", ")} are available. Rank requests by date, slot, ability, goals and instructor flexibility before offering.`; }
  if (/attention|today|priority/.test(q)) return `${active.length} items need attention. ${active.slice(0, 3).map(i => i.title).join(" ")} ${active.filter(i => !state.plans.find(p => p.id === i.planId)!.requiresManagerApproval).length} low-risk plans can run without approval; schedule changes require your decision.`;
  return "I can explain today’s priorities, Sarah’s absence, Blue 3, unused capacity, the afternoon opening or overloaded instructors. My answers use this local school day and simulated profile scoring.";
}
