import type { SchoolDay, LessonAssignment, ProposedAction } from "../types/operations";
export interface POSAdapter {
  getSchoolDay(date: string): SchoolDay;
  getReservations(date: string): LessonAssignment[];
  getInstructorRoster(date: string): SchoolDay["instructors"];
  getInstructorAvailability(date: string): SchoolDay["schedule"]["availability"];
  getCustomer(id: string): SchoolDay["students"][number] | undefined;
  getReservation(id: string): LessonAssignment | undefined;
  getWaitlist(date: string): SchoolDay["waitlist"];
  reassignInstructor(id: string, instructorId: string): void;
  moveStudent(studentId: string, fromGroupId: string, toGroupId: string): void;
  rescheduleReservation(id: string, start: number, end: number): void;
  cancelReservation(id: string): void;
  createReservation(reservation: LessonAssignment): void;
  updateReservation(id: string, patch: Partial<LessonAssignment>): void;
  execute(action: ProposedAction): void;
  verify(action: ProposedAction): boolean;
}
// Each manager session owns an isolated local POS. Reads are copies; only adapter methods write.
export class MockPOSAdapter implements POSAdapter {
  private day: SchoolDay;
  private recorded = new Set<string>();
  constructor(seed: SchoolDay) { this.day = structuredClone(seed); }
  getSchoolDay(date: string) { if (date !== this.day.date) throw new Error("School day unavailable"); return structuredClone(this.day); }
  getReservations(date: string) { return this.getSchoolDay(date).schedule.assignments; }
  getInstructorRoster(date: string) { return this.getSchoolDay(date).instructors; }
  getInstructorAvailability(date: string) { return this.getSchoolDay(date).schedule.availability; }
  getCustomer(id: string) { return structuredClone(this.day.students.find(s => s.id === id)); }
  getReservation(id: string) { return structuredClone(this.day.schedule.assignments.find(a => a.id === id)); }
  getWaitlist(date: string) { return this.getSchoolDay(date).waitlist; }
  updateReservation(id: string, patch: Partial<LessonAssignment>) { const a = this.day.schedule.assignments.find(a => a.id === id); if (!a) throw new Error("Reservation missing"); Object.assign(a, patch); }
  reassignInstructor(id: string, instructorId: string) {
    this.updateReservation(id, { instructorId });
    const a = this.getReservation(id)!;
    if (a.groupId) this.day.groups.find(g => g.id === a.groupId)!.instructorAssignment = { status: "assigned", method: "background_agent", instructorId };
  }
  moveStudent(studentId: string, fromGroupId: string, toGroupId: string) {
    const from = this.day.groups.find(g => g.id === fromGroupId)!; const to = this.day.groups.find(g => g.id === toGroupId)!;
    from.studentIds = from.studentIds.filter(id => id !== studentId); to.studentIds.push(studentId);
    from.compatibility = 89; to.compatibility = 91;
    for (const a of this.day.schedule.assignments) { if (a.groupId === from.id) a.studentIds = [...from.studentIds]; if (a.groupId === to.id) a.studentIds = [...to.studentIds]; }
    this.day.placements = this.day.placements.filter(p => p.studentId !== studentId);
    this.day.placements.push({ studentId, groupId: to.id, compatibility: to.compatibility });
  }
  rescheduleReservation(id: string, start: number, end: number) { this.updateReservation(id, { start, end }); }
  cancelReservation(id: string) { this.updateReservation(id, { status: "cancelled" }); }
  createReservation(reservation: LessonAssignment) { if (this.getReservation(reservation.id)) throw new Error("Duplicate reservation"); this.day.schedule.assignments.push(structuredClone(reservation)); }
  execute(a: ProposedAction) {
    switch (a.type) {
      case "reassign_instructor": this.reassignInstructor(a.lessonId!, a.instructorId!); break;
      case "move_student": this.moveStudent(a.studentId!, a.fromGroupId!, a.toGroupId!); break;
      case "offer_waitlist_opening": this.day.waitlist.find(w => w.id === a.waitlistId)!.status = "offered"; break;
      case "reschedule_lesson": this.rescheduleReservation(a.lessonId!, a.start!, a.end!); break;
      case "cancel_lesson": this.cancelReservation(a.lessonId!); break;
      case "contact_customer": case "contact_instructor": break;
      default: throw new Error("Action not implemented by mock adapter");
    }
    this.recorded.add(a.id);
  }
  verify(a: ProposedAction) {
    if (!this.recorded.has(a.id)) return false;
    if (a.type === "reassign_instructor") return this.getReservation(a.lessonId!)?.instructorId === a.instructorId;
    if (a.type === "move_student") return this.day.groups.find(g => g.id === a.toGroupId)?.studentIds.includes(a.studentId!) === true && !this.day.groups.find(g => g.id === a.fromGroupId)?.studentIds.includes(a.studentId!);
    if (a.type === "offer_waitlist_opening") return this.day.waitlist.find(w => w.id === a.waitlistId)?.status === "offered";
    if (a.type === "cancel_lesson") return this.getReservation(a.lessonId!)?.status === "cancelled";
    if (a.type === "reschedule_lesson") return this.getReservation(a.lessonId!)?.start === a.start && this.getReservation(a.lessonId!)?.end === a.end;
    return a.type === "contact_customer" || a.type === "contact_instructor";
  }
}
